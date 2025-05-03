//Disabled for now (to avoid unwanted unpinning of images)
// import { NextRequest, NextResponse } from "next/server";
// import { deleteImageUseCase } from "@/presentation/dependencies";

// export async function DELETE(request: NextRequest) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const imageId = searchParams.get("imageId");

//     if (!imageId) {
//       return NextResponse.json(
//         { error: "No image ID provided" },
//         { status: 400 }
//       );
//     }

//     await deleteImageUseCase.execute(imageId);

//     return NextResponse.json(
//       { success: true, message: "Image deleted successfully" },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Error deleting image:", error);
//     return NextResponse.json(
//       { error: "Failed to delete image" },
//       { status: 500 }
//     );
//   }
// }
