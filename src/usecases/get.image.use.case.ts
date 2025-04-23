import { IImageRepository } from "@/repositories/interfaces/image.repository.interface";

export class GetImageUseCase {
  constructor(private imageRepository: IImageRepository) { }

  async execute(imageId: string): Promise<string | null> {
    try {
      return await this.imageRepository.getImage(imageId);
    } catch (error) {
      console.error('Error in GetImageUseCase:', error);
      throw new Error('Failed to get image', { cause: error });
    }
  }
}
