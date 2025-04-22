import { IImageRepository } from "./interfaces/image.repository.interface";
import { v2 as cloudinary } from 'cloudinary';
import { UploadImageResponse } from "./interfaces/image.types";

type CloudinaryUploadResponse = {
  secure_url: string;
  public_id: string;
};

export class CloudinaryImageRepository implements IImageRepository {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  async uploadImage(file: File, data?: Record<string, any>): Promise<UploadImageResponse> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResponse = await new Promise<CloudinaryUploadResponse>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        (error, result) => {
          if (error) reject(error);
          else resolve(result as CloudinaryUploadResponse);
        }
      ).end(buffer);
    });

    return {
      id: uploadResponse.public_id,
      url: uploadResponse.secure_url,
    }
  }
  async deleteImage(imageHash: string): Promise<void> {
  }
  async getImage(imageHash: string): Promise<string> {
    return 'dumy_string';
  }
}
