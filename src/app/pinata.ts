import { PinataSDK } from "pinata-web3";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY || "gateway.pinata.cloud"
});

export async function uploadImage(file: File): Promise<{
  ipfsHash: string;
  url: string;
}> {
  try {
    const upload = await pinata.upload.file(file);

    return {
      ipfsHash: upload.IpfsHash,
      url: `https://${process.env.PINATA_GATEWAY || "gateway.pinata.cloud"}/ipfs/${upload.IpfsHash}`
    };
  } catch (error) {
    console.error("Pinata upload error:", error);
    throw new Error("Failed to upload to Pinata");
  }
}
