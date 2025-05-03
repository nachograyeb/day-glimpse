import { PinataSDK } from "pinata-web3";
import { IImageRepository } from "./interfaces/image.repository.interface";
import { UploadImageResponse } from "./interfaces/image.types";
import * as multiformats from 'multiformats/basics'

export class IPFSImageRepository implements IImageRepository {
  private pinata: PinataSDK;

  constructor() {
    this.pinata = new PinataSDK({
      pinataJwt: process.env.PINATA_JWT!,
      pinataGateway: process.env.PINATA_GATEWAY || "gateway.pinata.cloud"
    });
  }

  async uploadImage(
    file: File,
    data?: Record<string, any>
  ): Promise<UploadImageResponse> {
    try {
      const upload = await this.pinata.upload.file(file);

      const url = `https://${process.env.PINATA_GATEWAY || "gateway.pinata.cloud"}/ipfs/${upload.IpfsHash}?disposition=inline`;

      return {
        id: this.ipfsCidToBytes(upload.IpfsHash),
        url: url
      };
    } catch (error) {
      console.error("Pinata upload error:", error);
      throw new Error("Failed to upload image to IPFS");
    }
  }

  async deleteImage(imageHash: string): Promise<void> {
    try {
      await this.pinata.unpin([imageHash]);
    } catch (error) {
      console.error("Pinata unpin error:", error);
      throw new Error(`Failed to delete image with hash ${imageHash}`);
    }
  }

  async getImage(imageHash: string): Promise<string | null> {
    try {
      const decodedImageHash = this.bytesToIpfsCid(imageHash);
      return `https://${process.env.PINATA_GATEWAY || "gateway.pinata.cloud"}/ipfs/${decodedImageHash}?disposition=inline`;
    } catch (error) {
      console.error("Error generating image URL:", error);
      return null;
    }
  }

  private ipfsCidToBytes(cid: string): string {
    try {
      const parsedCid = multiformats.CID.parse(cid);

      const bytes = parsedCid.bytes;

      return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Failed to convert CID:', error);
      throw new Error('Invalid IPFS CID');
    }
  }

  private bytesToIpfsCid(bytes: string): string {
    try {
      const hexWithoutPrefix = bytes.replace(/^0x/, '');

      const byteArray = new Uint8Array(
        hexWithoutPrefix.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
      );

      const cid = multiformats.CID.decode(byteArray);

      return cid.toString();
    } catch (error) {
      console.error('Failed to convert bytes to CID:', error);
      throw new Error('Invalid bytes');
    }
  }
}
