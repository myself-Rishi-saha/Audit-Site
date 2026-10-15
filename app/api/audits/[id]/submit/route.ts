// import { NextResponse } from "next/server";
// import {
//   readAudits,
//   writeAudits,
// } from "@/lib/audit";

// export async function POST(
//   request: Request,
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

//     const existingAudit =
//       audits[index];

//     const updatedAudit = {
//       ...existingAudit,

//       status: "COMPLETED" as const,

//       updatedAt:
//         new Date().toISOString(),
//     };

//     audits[index] = updatedAudit;

//     await writeAudits(audits);

//     return NextResponse.json(
//       updatedAudit,
//     );
//   } catch (error) {
//     console.error(
//       "Submit audit error:",
//       error,
//     );

//     return NextResponse.json(
//       {
//         error:
//           "Failed to submit audit.",
//       },
//       { status: 500 },
//     );
//   }
// }

import { NextResponse } from "next/server";
import {
  readAudits,
  submitAuditInDatabase,
} from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const audits = await readAudits();

    const existingAudit = audits.find(
      (audit) => audit.id === id,
    );

    if (!existingAudit) {
      return NextResponse.json(
        { error: "Audit not found" },
        { status: 404 },
      );
    }

    // Do not overwrite the original submission timestamp.
    if (existingAudit.status === "COMPLETED") {
      return NextResponse.json(existingAudit);
    }

    const timestamps = await submitAuditInDatabase(id);

    if (!timestamps) {
      return NextResponse.json(
        { error: "Audit not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ...existingAudit,
      status: "COMPLETED",
      submittedAt: timestamps.submittedAt,
      updatedAt: timestamps.updatedAt,
    });
  } catch (error) {
    console.error("Submit audit error:", error);

    return NextResponse.json(
      { error: "Failed to submit audit." },
      { status: 500 },
    );
  }
}
