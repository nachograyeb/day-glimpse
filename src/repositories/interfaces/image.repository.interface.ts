import { UploadImageResponse } from "./image.types";

export interface IImageRepository {
  uploadImage(
    file: File,
    data?: Record<string, any>,
  ): Promise<UploadImageResponse>;
  deleteImage(imageHash: string): Promise<void>;
  getImage(imageHash: string): Promise<string | null>;
}
