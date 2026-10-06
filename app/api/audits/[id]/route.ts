// import { NextResponse } from "next/server";
// import { readAudits, writeAudits, scoreAudit } from "@/lib/audit";
// export async function GET(
//   _: Request,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   const { id } = await params;
//   const audit = (await readAudits()).find((a) => a.id === id);
//   return audit
//     ? NextResponse.json(audit)
//     : NextResponse.json({ error: "Not found" }, { status: 404 });
// }
// export async function PUT(
//   req: Request,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   const { id } = await params;
//   const body = await req.json();
//   const audits = await readAudits();
//   const i = audits.findIndex((a) => a.id === id);
//   if (i < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
//   audits[i] = {
//     ...audits[i],
//     ...body,
//     lastUpdatedAt: body.lastUpdatedAt || new Date().toISOString(),
//   };
//   audits[i].score = scoreAudit(audits[i]);
//   await writeAudits(audits);
//   return NextResponse.json(audits[i]);
// }


import { NextResponse } from "next/server";
import { readAudits, writeAudits } from "@/lib/audit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const audits = await readAudits();

    const audit = audits.find((item) => item.id === id);

    if (!audit) {
      return NextResponse.json(
        { error: "Audit not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(audit);
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

    const index = audits.findIndex(
      (audit) => audit.id === id,
    );

    if (index === -1) {
      return NextResponse.json(
        { error: "Audit not found" },
        { status: 404 },
      );
    }

    const existingAudit = audits[index];

    const updatedAudit = {
      ...existingAudit,
      ...body,

      // Keep these fields unchanged
      id: existingAudit.id,
      employeeId: existingAudit.employeeId,
      employeeName: existingAudit.employeeName,
      templateId: existingAudit.templateId,

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




