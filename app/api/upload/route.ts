// import { NextResponse } from "next/server";
// import { v2 as cloudinary } from "cloudinary";

// export const runtime = "nodejs";

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// export async function POST(req: Request) {
//   try {
//     const form = await req.formData();

//     const file = form.get("file");
//     const reportId = String(form.get("reportId") || "evidence");
//     const type = String(form.get("type") || "photo");

//     if (!(file instanceof File)) {
//       return NextResponse.json(
//         { error: "File required" },
//         { status: 400 },
//       );
//     }

//     // Convert browser File → Buffer
//     const bytes = await file.arrayBuffer();
//     const buffer = Buffer.from(bytes);

//     // Upload Buffer to Cloudinary
//     const result = await new Promise<any>((resolve, reject) => {
//       const uploadStream = cloudinary.uploader.upload_stream(
//         {
//           folder: `audit-site/${reportId}`,
//           resource_type: "auto",
//         },
//         (error, result) => {
//           if (error) {
//             reject(error);
//           } else {
//             resolve(result);
//           }
//         },
//       );

//       uploadStream.end(buffer);
//     });

//     return NextResponse.json({
//       reportId,
//       type,
//       url: result.secure_url,
//       fileName: file.name,
//       capturedAt: new Date().toISOString(),
//     });
//   } catch (error) {
//     console.error("Upload error:", error);

//     return NextResponse.json(
//       { error: "Failed to upload file" },
//       { status: 500 },
//     );
//   }
// }

import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });
cloudinary.config();
export async function POST(req: Request) {
  try {
    console.log("Cloudinary config:", {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY
        ? "EXISTS"
        : "MISSING",
      api_secret: process.env.CLOUDINARY_API_SECRET
        ? "EXISTS"
        : "MISSING",
    });

    const form = await req.formData();

    const file = form.get("file");
    const reportId = String(form.get("reportId") || "evidence");
    const type = String(form.get("type") || "photo");

    console.log("File:", file);

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "File required" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log("Uploading to Cloudinary:", {
      fileName: file.name,
      size: buffer.length,
      type: file.type,
    });

    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `audit-site/${reportId}`,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary error:", error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(buffer);
    });

    console.log("Cloudinary success:", result.secure_url);

    return NextResponse.json({
      reportId,
      type,
      url: result.secure_url,
      fileName: file.name,
      capturedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Upload error:", error);

    return NextResponse.json(
      {
        error: "Failed to upload file",
        details:
          error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}