import { NextRequest, NextResponse } from 'next/server';
import { uploadImageUseCase } from '@/presentation/dependencies';
import { checkRateLimit, getRateLimitKey, RATE_LIMIT } from '@/utils/simple.rate.limit';

export async function POST(request: NextRequest) {
  try {
    const key = getRateLimitKey(request);
    if (!checkRateLimit(key)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;
    const data = formData.get('data');
    const parsedData = data ? JSON.parse(data as string) : null;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file uploaded' },
        { status: 400 }
      );
    }

    if (file.size > RATE_LIMIT.maxFileSize) {
      return NextResponse.json(
        { error: `File size exceeds ${RATE_LIMIT.maxFileSize / 1024 / 1024}MB limit` },
        { status: 413 }
      );
    }

    const uploadResponse = await uploadImageUseCase.execute(file, parsedData);

    return NextResponse.json(uploadResponse);
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
