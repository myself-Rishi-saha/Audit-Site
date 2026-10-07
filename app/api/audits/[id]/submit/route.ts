// import { NextResponse } from "next/server";
// import { readAudits, writeAudits } from "@/lib/audit";

// export async function PUT(
//   request: Request,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   try {
//     const { id } = await params;
//     const body = await request.json();

//     const audits = await readAudits();

//     const index = audits.findIndex((audit) => audit.id === id);

//     if (index === -1) {
//       return NextResponse.json(
//         { error: "Audit not found" },
//         { status: 404 },
//       );
//     }

//     const existingAudit = audits[index];

//     const updatedAudit = {
//       ...existingAudit,
//       ...body,

//       // These should not be changed by the edit form
//       id: existingAudit.id,
//       employeeId: existingAudit.employeeId,
//       employeeName: existingAudit.employeeName,
//       templateId: existingAudit.templateId,

//       answers: body.answers || existingAudit.answers,
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

import { NextResponse } from "next/server";
import { readAudits, writeAudits } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const audits = await readAudits();

    const index = audits.findIndex((audit) => audit.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: "Audit not found" },
        { status: 404 },
      );
    }

    const existingAudit = audits[index];

    const updatedAudit = {
      ...existingAudit,
      status: "COMPLETED",
      submittedAt: new Date().toISOString(),
    };

    audits[index] = updatedAudit;

    await writeAudits(audits);

    return NextResponse.json(updatedAudit);
  } catch (error) {
    console.error("Submit audit error:", error);

    return NextResponse.json(
      { error: "Failed to submit audit." },
      { status: 500 },
    );
  }
}