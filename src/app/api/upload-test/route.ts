import { NextResponse } from "next/server";
import { uploadImage } from "@/app/pinata";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const result = await uploadImage(file);

    return NextResponse.json({
      success: true,
      ipfsHash: result.ipfsHash,
      url: result.url
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
