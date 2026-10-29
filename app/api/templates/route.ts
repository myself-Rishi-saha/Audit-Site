

// import { NextResponse } from "next/server";
// import { neon } from "@neondatabase/serverless";
// import fs from "node:fs/promises";
// import path from "node:path";

// export const runtime = "nodejs";

// export async function GET() {
//   try {
//     const databaseUrl = process.env.DATABASE_URL;

//     if (!databaseUrl) {
//       return NextResponse.json(
//         { error: "DATABASE_URL is not configured" },
//         { status: 500 }
//       );
//     }

//     const sql = neon(databaseUrl);

//     const templates = await sql`
//       SELECT id, type, name, title, sections, updated_at
//       FROM form_templates
//       ORDER BY id
//     `;

//     return NextResponse.json(templates);
//   } catch (error) {
//     console.error("Failed to fetch templates:", error);

//     return NextResponse.json(
//       { error: "Failed to fetch templates" },
//       { status: 500 }
//     );
//   }
// }

// // Keep the existing JSON-file save behavior for now.
// // We will update this safely after checking the template editor.
// export async function PUT(request: Request) {
//   try {
//     const body = await request.json();

//     const file = path.join(process.cwd(), "data", "templates.json");
//     await fs.writeFile(file, JSON.stringify(body, null, 2));

//     return NextResponse.json(body);
//   } catch (error) {
//     console.error("Failed to save templates:", error);

//     return NextResponse.json(
//       { error: "Failed to save templates" },
//       { status: 500 }
//     );
//   }
// }
import { NextResponse } from "next/server";
import {
  getTemplates,
  saveTemplate,
  type FormTemplate,
} from "@/lib/template";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const token = (await cookies())
      .get("auditdesk_admin_session")
      ?.value;

    const secret = process.env.AUTH_SECRET;

    if (!token || !secret) {
      return false;
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );

    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const templates = await getTemplates();

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Failed to fetch templates:", error);

    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 },
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Invalid template payload" },
        { status: 400 },
      );
    }

    const template = body as Partial<FormTemplate>;

    if (
      typeof template.id !== "string" ||
      !template.id.trim() ||
      typeof template.type !== "string" ||
      !template.type.trim() ||
      typeof template.name !== "string" ||
      !template.name.trim() ||
      !Array.isArray(template.sections)
    ) {
      return NextResponse.json(
        {
          error: "Template must contain id, type, name, and sections",
        },
        { status: 400 },
      );
    }

    const savedTemplate = await saveTemplate(
      template as FormTemplate,
    );

    return NextResponse.json(savedTemplate);
  } catch (error) {
    console.error("Failed to save templates:", error);

    return NextResponse.json(
      { error: "Failed to save template" },
      { status: 500 },
    );
  }
}