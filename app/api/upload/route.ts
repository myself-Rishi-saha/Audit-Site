// import { NextResponse } from "next/server";
// import { ensureUploadDir, fs, path } from "@/lib/service-report";
// export const runtime = "nodejs";
// export async function POST(req: Request) {
//   const form = await req.formData();
//   const file = form.get("file");
//   const reportId = String(form.get("reportId") || "evidence");
//   const type = String(form.get("type") || "photo");
//   if (!(file instanceof File))
//     return NextResponse.json({ error: "File required" }, { status: 400 });
//   await ensureUploadDir(reportId);
//   const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
//   const fileName = `${Date.now()}-${safe}`;
//   await fs.writeFile(
//     path.join(process.cwd(), "public/uploads", reportId, fileName),
//     Buffer.from(await file.arrayBuffer()),
//   );
//   return NextResponse.json({
//     reportId,
//     type,
//     url: `/uploads/${reportId}/${fileName}`,
//     fileName,
//     capturedAt: new Date().toISOString(),
//   });
// }

import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const file = form.get("file");
    const reportId = String(form.get("reportId") || "evidence");
    const type = String(form.get("type") || "photo");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "File required" },
        { status: 400 },
      );
    }

    // Convert browser File → Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload Buffer to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `audit-site/${reportId}`,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      );

      uploadStream.end(buffer);
    });

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
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}

