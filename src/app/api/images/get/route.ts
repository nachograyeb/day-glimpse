import { NextRequest, NextResponse } from "next/server";
import { getImageUseCase } from "@/presentation/dependencies";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get("imageId");

    if (!imageId) {
      return NextResponse.json(
        { error: "No image ID provided" },
        { status: 400 }
      );
    }

    const getResponse = await getImageUseCase.execute(imageId);

    return NextResponse.json(getResponse);
  } catch (error) {
    console.error("Error getting image:", error);
    return NextResponse.json(
      { error: "Failed to get image" },
      { status: 500 }
    );
  }
}
