// import { NextResponse } from "next/server";
// import fs from "node:fs/promises";
// import path from "node:path";

// const file = path.join(process.cwd(), "data/templates.json");
// async function read() {
//   return JSON.parse(await fs.readFile(file, "utf8"));
// }

// export async function GET() {
//   const templates = await read();
//   const template = templates.find((item: any) => item.id === "service-report");
//   return template
//     ? NextResponse.json(template)
//     : NextResponse.json({ error: "Template not found" }, { status: 404 });
// }

// export async function PUT(request: Request) {
//   const body = await request.json();
//   const templates = await read();
//   const next = templates.map((item: any) =>
//     item.id === "service-report"
//       ? { ...body, id: "service-report", type: "SERVICE_REPORT" }
//       : item,
//   );
//   await fs.writeFile(file, JSON.stringify(next, null, 2));
//   return NextResponse.json(
//     next.find((item: any) => item.id === "service-report"),
//   );
// }

import { NextResponse } from "next/server";
import {
  getTemplate,
  updateTemplate,
  type FormTemplate,
} from "@/lib/template";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const TEMPLATE_ID = "service-report";

async function isAdminAuthenticated() {
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

    return String(payload.role) === "admin";
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const template = await getTemplate(TEMPLATE_ID);

    if (!template) {
      return NextResponse.json(
        { error: "Service report template not found in database" },
        { status: 404 },
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("FAILED TO LOAD SERVICE REPORT TEMPLATE:", error);

    return NextResponse.json(
      {
        error: "Failed to load service report template",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
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

    const body = await request.json();

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

    if (
      body.id !== TEMPLATE_ID ||
      typeof body.name !== "string" ||
      !body.name.trim() ||
      !Array.isArray(body.sections)
    ) {
      return NextResponse.json(
        {
          error: "Invalid service report template. Check its ID, name, and sections.",
        },
        { status: 400 },
      );
    }

    const template: FormTemplate = {
      ...body,
      id: TEMPLATE_ID,
      type: "SERVICE_REPORT",
    };

    const updatedTemplate = await updateTemplate(template);

    if (!updatedTemplate) {
      return NextResponse.json(
        {
          error:
            "Service report template not found in database. Import it before updating.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error("FAILED TO SAVE SERVICE REPORT TEMPLATE:", error);

    return NextResponse.json(
      {
        error: "Failed to save service report template",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 },
    );
  }
}
