import { CloudinaryImageRepository } from '../../../../repositories/cloudinary.image.repository';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file uploaded' },
        { status: 400 }
      );
    }

    const imageRepository = new CloudinaryImageRepository();
    const uploadResponse = await imageRepository.uploadImage(file);

    return NextResponse.json(uploadResponse);
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
