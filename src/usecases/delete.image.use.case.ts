import { IImageRepository } from "@/repositories/interfaces/image.repository.interface";

export class DeleteImageUseCase {
  constructor(private imageRepository: IImageRepository) { }

  async execute(imageId: string): Promise<void> {
    try {
      await this.imageRepository.deleteImage(imageId);
    } catch (error) {
      console.error('Error in DeleteImageUseCase:', error);
      throw new Error('Failed to delete image', { cause: error });
    }
  }
}
