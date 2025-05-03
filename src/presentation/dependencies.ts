import { CloudinaryImageRepository } from "@/repositories/cloudinary.image.repository";
import { IPFSImageRepository } from "@/repositories/ipfs.image.repository";
import { DeleteImageUseCase } from "@/usecases/delete.image.use.case";
import { GetImageUseCase } from "@/usecases/get.image.use.case";
import { UploadImageUseCase } from "@/usecases/upload.image.use.case";

// const imageRepository = new CloudinaryImageRepository();
const imageRepository = new IPFSImageRepository();

export const uploadImageUseCase = new UploadImageUseCase(
  imageRepository,
);

export const getImageUseCase = new GetImageUseCase(
  imageRepository,
);

export const deleteImageUseCase = new DeleteImageUseCase(
  imageRepository,
);
