import { IImageRepository } from "./interfaces/image.repository.interface";
import { v2 as cloudinary } from 'cloudinary';
import { UploadImageResponse } from "./interfaces/image.types";
import crypto from 'crypto';

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
    try {
      if (!data?.profileAddress) {
        throw new Error('No profile address provided');
      }
      if (!file.arrayBuffer) {
        throw new Error('File does not support arrayBuffer method');
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadResponse = await new Promise<CloudinaryUploadResponse>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            public_id: crypto.createHash('SHA256').update(data?.profileAddress).digest('hex'),
            overwrite: true,
          },
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
    } catch (error) {
      console.error('Error in uploadImage:', error);
      throw new Error('Failed to upload image', { cause: error });
    }
  }
  async deleteImage(imageId: string): Promise<void> {
    try {
      const imageHash = crypto.createHash('SHA256').update(imageId).digest('hex');

      await new Promise<void>((resolve, reject) => {
        cloudinary.uploader.destroy(imageHash, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    } catch (error) {
      console.error('Error in deleteImage:', error);
      throw new Error('Failed to delete image', { cause: error });
    }
  }

  async getImage(imageId: string): Promise<string | null> {
    try {
      const imageHash = crypto.createHash('SHA256').update(imageId).digest('hex');

      return new Promise((resolve, reject) => {
        cloudinary.api.resource(imageHash, (error, result) => {
          if (error) {
            // If resource doesn't exist (404) or other Cloudinary API error
            if (error.http_code === 404) {
              resolve(null); // Return null for non-existent images
            } else {
              console.error('Cloudinary API error:', error);
              reject(new Error('Failed to verify image existence'));
            }
            return;
          }

          // If we get here, the image exists, so generate and return the URL
          const url = cloudinary.url(imageHash, {
            secure: true,
            transformation: [
              { width: 300, height: 300, crop: 'fill' },
              { quality: 'auto', fetch_format: 'auto' },
            ],
          });

          resolve(url);
        });
      });

    } catch (error) {
      console.error('Error in getImage:', error);
      throw new Error('Failed to get image', { cause: error });
    }
  }
}
