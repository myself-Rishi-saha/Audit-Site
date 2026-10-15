// import { NextResponse } from "next/server";
// import fs from "fs";
// import path from "path";

// // const filePath = path.join(
// //   process.cwd(),
// //   "data",
// //   "template.json"
// // );
// const filePath = path.join(process.cwd(), "data/templates.json");

// export async function GET() {
//   try {
//     console.log("Reading audit template from:", filePath);

//     if (!fs.existsSync(filePath)) {
//       console.error("template.json not found at:", filePath);

//       return NextResponse.json(
//         {
//           error: "template.json not found",
//           path: filePath,
//         },
//         { status: 404 }
//       );
//     }

//     const file = fs.readFileSync(filePath, "utf-8");

//     const templates = JSON.parse(file);

//     console.log(
//       "Templates loaded:",
//       Array.isArray(templates)
//         ? templates.map((t: any) => t.id)
//         : typeof templates
//     );

//     if (!Array.isArray(templates)) {
//       return NextResponse.json(
//         {
//           error: "template.json must contain an array",
//         },
//         { status: 500 }
//       );
//     }

//     // Find the audit template.
//     const auditTemplate = templates.find(
//       (template: any) =>
//         template.id === "multiplex-fire-safety"
//     );

//     if (!auditTemplate) {
//       console.error(
//         "Audit template not found. Available templates:",
//         templates.map((t: any) => t.id)
//       );

//       return NextResponse.json(
//         {
//           error: "Audit template not found",
//           availableTemplates: templates.map(
//             (t: any) => t.id
//           ),
//         },
//         { status: 404 }
//       );
//     }

//     console.log(
//       "Returning audit template:",
//       auditTemplate.id
//     );

//     return NextResponse.json(auditTemplate);
//   } catch (error) {
//     console.error(
//       "FAILED TO LOAD AUDIT TEMPLATE:",
//       error
//     );

//     return NextResponse.json(
//       {
//         error: "Failed to load audit template",
//         details:
//           error instanceof Error
//             ? error.message
//             : String(error),
//       },
//       { status: 500 }
//     );
//   }
// }

// export async function PUT(request: Request) {
//   try {
//     const updatedAuditTemplate = await request.json();

//     console.log(
//       "Updating audit template:",
//       updatedAuditTemplate.id
//     );

//     if (!updatedAuditTemplate.id) {
//       return NextResponse.json(
//         {
//           error: "Template ID is required",
//         },
//         { status: 400 }
//       );
//     }

//     const file = fs.readFileSync(filePath, "utf-8");

//     const templates = JSON.parse(file);

//     if (!Array.isArray(templates)) {
//       return NextResponse.json(
//         {
//           error: "template.json must contain an array",
//         },
//         { status: 500 }
//       );
//     }

//     const index = templates.findIndex(
//       (template: any) =>
//         template.id === updatedAuditTemplate.id
//     );

//     if (index === -1) {
//       return NextResponse.json(
//         {
//           error: "Audit template not found",
//         },
//         { status: 404 }
//       );
//     }

//     // Replace only the audit template.
//     templates[index] = updatedAuditTemplate;

//     fs.writeFileSync(
//       filePath,
//       JSON.stringify(templates, null, 2),
//       "utf-8"
//     );

//     console.log("Audit template saved successfully.");

//     return NextResponse.json(updatedAuditTemplate);
//   } catch (error) {
//     console.error(
//       "FAILED TO SAVE AUDIT TEMPLATE:",
//       error
//     );

//     return NextResponse.json(
//       {
//         error: "Failed to save audit template",
//         details:
//           error instanceof Error
//             ? error.message
//             : String(error),
//       },
//       { status: 500 }
//     );
//   }
// }


import { NextResponse } from "next/server";
import {
  getTemplate,
  updateTemplate,
  type FormTemplate,
} from "@/lib/template";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const TEMPLATE_ID = "audit-report";

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
        { error: "Audit template not found in database" },
        { status: 404 },
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("FAILED TO LOAD AUDIT TEMPLATE:", error);

    return NextResponse.json(
      {
        error: "Failed to load audit template",
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
    // Only authenticated administrators can edit templates.
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

    if (body.id !== TEMPLATE_ID) {
      return NextResponse.json(
        { error: "Invalid audit template ID" },
        { status: 400 },
      );
    }

    if (
      typeof body.type !== "string" ||
      typeof body.name !== "string" ||
      !body.name.trim() ||
      !Array.isArray(body.sections)
    ) {
      return NextResponse.json(
        {
          error: "Template must contain type, name, and sections",
        },
        { status: 400 },
      );
    }

    const updatedTemplate = await updateTemplate(
      body as FormTemplate,
    );

    if (!updatedTemplate) {
      return NextResponse.json(
        {
          error:
            "Audit template not found in database. Import it before updating.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error("FAILED TO SAVE AUDIT TEMPLATE:", error);

    return NextResponse.json(
      {
        error: "Failed to save audit template",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 },
    );
  }
}
