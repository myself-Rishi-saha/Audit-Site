import { NextResponse } from "next/server";
import { readAudits, writeAudits, scoreAudit } from "@/lib/audit";
export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const audits = await readAudits();
  const i = audits.findIndex((a) => a.id === id);
  if (i < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const audit = audits[i];
  if (Object.values(audit.answers).some((a) => !a.status))
    return NextResponse.json(
      { error: "Complete every required question first." },
      { status: 400 },
    );
  audit.status = "COMPLETED";
  audit.score = scoreAudit(audit);
  await writeAudits(audits);
  return NextResponse.json(audit);
}
