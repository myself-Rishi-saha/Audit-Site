// import { NextResponse } from "next/server";
// import fs from "node:fs/promises";
// import path from "node:path";

// // const file = path.join(process.cwd(), "data/templates/audits.json");
// const file = path.join(process.cwd(), "data/templates.json");

// export async function GET() {
//   try {
//     const data = await fs.readFile(file, "utf8");
//     return NextResponse.json(JSON.parse(data));
//   } catch (error) {
//     console.error("Failed to read audit template:", error);

//     return NextResponse.json(
//       { error: "Failed to load audit template" },
//       { status: 500 },
//     );
//   }
// }

// export async function PUT(req: Request) {
//   try {
//     const body = await req.json();

//     await fs.writeFile(
//       file,
//       JSON.stringify(body, null, 2),
//       "utf8",
//     );

//     return NextResponse.json(body);
//   } catch (error) {
//     console.error("Failed to save audit template:", error);

//     return NextResponse.json(
//       { error: "Failed to save audit template" },
//       { status: 500 },
//     );
//   }
// }


import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// const filePath = path.join(
//   process.cwd(),
//   "data",
//   "template.json"
// );
const filePath = path.join(process.cwd(), "data/templates.json");

export async function GET() {
  try {
    console.log("Reading audit template from:", filePath);

    if (!fs.existsSync(filePath)) {
      console.error("template.json not found at:", filePath);

      return NextResponse.json(
        {
          error: "template.json not found",
          path: filePath,
        },
        { status: 404 }
      );
    }

    const file = fs.readFileSync(filePath, "utf-8");

    const templates = JSON.parse(file);

    console.log(
      "Templates loaded:",
      Array.isArray(templates)
        ? templates.map((t: any) => t.id)
        : typeof templates
    );

    if (!Array.isArray(templates)) {
      return NextResponse.json(
        {
          error: "template.json must contain an array",
        },
        { status: 500 }
      );
    }

    // Find the audit template.
    const auditTemplate = templates.find(
      (template: any) =>
        template.id === "multiplex-fire-safety"
    );

    if (!auditTemplate) {
      console.error(
        "Audit template not found. Available templates:",
        templates.map((t: any) => t.id)
      );

      return NextResponse.json(
        {
          error: "Audit template not found",
          availableTemplates: templates.map(
            (t: any) => t.id
          ),
        },
        { status: 404 }
      );
    }

    console.log(
      "Returning audit template:",
      auditTemplate.id
    );

    return NextResponse.json(auditTemplate);
  } catch (error) {
    console.error(
      "FAILED TO LOAD AUDIT TEMPLATE:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load audit template",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const updatedAuditTemplate = await request.json();

    console.log(
      "Updating audit template:",
      updatedAuditTemplate.id
    );

    if (!updatedAuditTemplate.id) {
      return NextResponse.json(
        {
          error: "Template ID is required",
        },
        { status: 400 }
      );
    }

    const file = fs.readFileSync(filePath, "utf-8");

    const templates = JSON.parse(file);

    if (!Array.isArray(templates)) {
      return NextResponse.json(
        {
          error: "template.json must contain an array",
        },
        { status: 500 }
      );
    }

    const index = templates.findIndex(
      (template: any) =>
        template.id === updatedAuditTemplate.id
    );

    if (index === -1) {
      return NextResponse.json(
        {
          error: "Audit template not found",
        },
        { status: 404 }
      );
    }

    // Replace only the audit template.
    templates[index] = updatedAuditTemplate;

    fs.writeFileSync(
      filePath,
      JSON.stringify(templates, null, 2),
      "utf-8"
    );

    console.log("Audit template saved successfully.");

    return NextResponse.json(updatedAuditTemplate);
  } catch (error) {
    console.error(
      "FAILED TO SAVE AUDIT TEMPLATE:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to save audit template",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

