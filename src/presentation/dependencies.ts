import { CloudinaryImageRepository } from "@/repositories/cloudinary.image.repository";
import { UploadImageUseCase } from "@/usecases/upload.image.use.case";

const imageRepository = new CloudinaryImageRepository();

export const uploadImageUseCase = new UploadImageUseCase(
  imageRepository,
);
