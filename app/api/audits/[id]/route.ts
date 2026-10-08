// import { NextResponse } from "next/server";
// import { readFile } from "fs/promises";
// import path from "path";

// import { readAudits, writeAudits } from "@/lib/audit";

// async function getTemplates() {
//   const filePath = path.join(
//     process.cwd(),
//     "data",
//     "templates.json",
//   );

//   const file = await readFile(filePath, "utf-8");

//   return JSON.parse(file);
// }

// export async function GET(
//   _request: Request,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   try {
//     const { id } = await params;

//     const audits = await readAudits();

//     const audit = audits.find((item) => item.id === id);

//     if (!audit) {
//       return NextResponse.json(
//         { error: "Audit not found" },
//         { status: 404 },
//       );
//     }

//     console.log("AUDIT FOUND:", {
//       id: audit.id,
//       templateId: audit.templateId,
//     });

//     // Read templates.json
//     const templates = await getTemplates();

//     console.log(
//       "AVAILABLE TEMPLATES:",
//       templates.map((template: any) => template.id),
//     );

//     // Find the template used by this audit
//     const template = templates.find(
//       (item: any) =>
//         String(item.id).trim() ===
//         String(audit.templateId).trim(),
//     );

//     console.log("MATCHED TEMPLATE:", template?.id);

//     if (!template) {
//       return NextResponse.json(
//         {
//           error: "Audit template not found",
//           templateId: audit.templateId,
//           availableTemplates: templates.map(
//             (item: any) => item.id,
//           ),
//         },
//         { status: 404 },
//       );
//     }

//     return NextResponse.json({
//       ...audit,
//       status: String(audit.status).toUpperCase(),
//       template,
//     });
//   } catch (error) {
//     console.error("Get audit error:", error);

//     return NextResponse.json(
//       { error: "Failed to get audit." },
//       { status: 500 },
//     );
//   }
// }

// export async function PUT(
//   request: Request,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   try {
//     const { id } = await params;

//     const body = await request.json();

//     const audits = await readAudits();

//     const index = audits.findIndex(
//       (audit) => audit.id === id,
//     );

//     if (index === -1) {
//       return NextResponse.json(
//         { error: "Audit not found" },
//         { status: 404 },
//       );
//     }

//     const existingAudit = audits[index];

//     // Completed audits cannot be edited
//     if (
//       String(existingAudit.status).toUpperCase() ===
//       "COMPLETED"
//     ) {
//       return NextResponse.json(
//         {
//           error: "Completed audits cannot be edited.",
//         },
//         { status: 403 },
//       );
//     }

//     const updatedAudit = {
//       ...existingAudit,
//       ...body,

//       // Keep these fields unchanged
//       id: existingAudit.id,
//       employeeId: existingAudit.employeeId,
//       employeeName: existingAudit.employeeName,
//       templateId: existingAudit.templateId,

//       // Draft updates always remain draft
//       status: "DRAFT",

//       answers: body.answers ?? existingAudit.answers,
//     };

//     audits[index] = updatedAudit;

//     await writeAudits(audits);

//     return NextResponse.json(updatedAudit);
//   } catch (error) {
//     console.error("Update audit error:", error);

//     return NextResponse.json(
//       { error: "Failed to update audit." },
//       { status: 500 },
//     );
//   }
// }
// export async function DELETE(
//   _request: Request,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   try {
//     const { id } = await params;

//     const audits = await readAudits();

//     const index = audits.findIndex(
//       (audit) => audit.id === id,
//     );

//     if (index === -1) {
//       return NextResponse.json(
//         { error: "Audit not found" },
//         { status: 404 },
//       );
//     }

//     const existingAudit = audits[index];

//     // Only draft audits can be deleted
//     if (
//       String(existingAudit.status).toUpperCase() !==
//       "DRAFT"
//     ) {
//       return NextResponse.json(
//         {
//           error: "Only draft audits can be deleted.",
//         },
//         { status: 403 },
//       );
//     }

//     // Remove the draft
//     audits.splice(index, 1);

//     await writeAudits(audits);

//     return NextResponse.json({
//       success: true,
//       message: "Draft deleted successfully.",
//     });
//   } catch (error) {
//     console.error("Delete audit error:", error);

//     return NextResponse.json(
//       { error: "Failed to delete draft." },
//       { status: 500 },
//     );
//   }
// }
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { readAudits, writeAudits } from "@/lib/audit";
async function getTemplates() {
  const filePath = path.join(process.cwd(), "data", "templates.json");
  const file = await readFile(filePath, "utf-8");
  return JSON.parse(file);
}
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const audits = await readAudits();
    const audit = audits.find((item) => item.id === id);
    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }
    console.log("AUDIT FOUND:", { id: audit.id, templateId: audit.templateId });
    const templates = await getTemplates();
    console.log(
      "AVAILABLE TEMPLATES:",
      templates.map((template: any) => template.id),
    );
    const template = templates.find(
      (item: any) => String(item.id).trim() === String(audit.templateId).trim(),
    );
    console.log("MATCHED TEMPLATE:", template?.id);
    if (!template) {
      return NextResponse.json(
        {
          error: "Audit template not found",
          templateId: audit.templateId,
          availableTemplates: templates.map((item: any) => item.id),
        },
        { status: 404 },
      );
    }
    return NextResponse.json({
      ...audit,
      status: String(audit.status).toUpperCase(),
      template,
    });
  } catch (error) {
    console.error("Get audit error:", error);
    return NextResponse.json(
      { error: "Failed to get audit." },
      { status: 500 },
    );
  }
}
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const audits = await readAudits();
    const index = audits.findIndex((audit) => audit.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }
    const existingAudit = audits[index];
    /* * Admin can edit both DRAFT and COMPLETED audits. * * Keep the existing status instead of forcing * everything back to DRAFT. */ const updatedAudit =
      {
        ...existingAudit,
        ...body, // These fields cannot be changed from admin editor id: existingAudit.id, employeeId: existingAudit.employeeId, employeeName: existingAudit.employeeName, templateId: existingAudit.templateId,
        //  // Preserve the existing audit status
        status: existingAudit.status,
        answers: body.answers ?? existingAudit.answers,
      };
    audits[index] = updatedAudit;
    await writeAudits(audits);
    return NextResponse.json(updatedAudit);
  } catch (error) {
    console.error("Update audit error:", error);
    return NextResponse.json(
      { error: "Failed to update audit." },
      { status: 500 },
    );
  }
}
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const audits = await readAudits();
    const index = audits.findIndex((audit) => audit.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }
    const existingAudit = audits[index];
    // // Only draft audits can be deleted
    if (String(existingAudit.status).toUpperCase() !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft audits can be deleted." },
        { status: 403 },
      );
    }
    audits.splice(index, 1);
    await writeAudits(audits);
    return NextResponse.json({
      success: true,
      message: "Draft deleted successfully.",
    });
  } catch (error) {
    console.error("Delete audit error:", error);
    return NextResponse.json(
      { error: "Failed to delete draft." },
      { status: 500 },
    );
  }
}
