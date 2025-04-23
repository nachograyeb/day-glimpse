import { NextRequest, NextResponse } from 'next/server';
import { uploadImageUseCase } from '@/presentation/dependencies';

export async function POST(request: NextRequest) {
  try {
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
