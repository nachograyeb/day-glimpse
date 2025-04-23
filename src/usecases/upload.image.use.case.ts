import { IImageRepository } from "@/repositories/interfaces/image.repository.interface";
import { UploadImageResponse } from "@/repositories/interfaces/image.types";

export class UploadImageUseCase {
  constructor(private imageRepository: IImageRepository) { }

  async execute(file: File, data?: Record<string, any>): Promise<UploadImageResponse> {
    try {
      return await this.imageRepository.uploadImage(file, data);
    } catch (error) {
      console.error('Error in UploadImageUseCase:', error);
      throw new Error('Failed to upload image', { cause: error });
    }
  }
}
