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
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { readAudits, writeAudits, Audit } from "@/lib/audit";

// export async function GET() {
//   return NextResponse.json(await readAudits());
// }
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const audits = await readAudits();

  const audit = audits.find((a) => a.id === id);

  console.log("========== ADMIN AUDIT ==========");
  console.log("Requested ID:", id);
  console.log("Found audit:", JSON.stringify(audit, null, 2));
  console.log("=================================");

  if (!audit) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  return NextResponse.json(audit);
}
export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("POST BODY:", JSON.stringify(body, null, 2));

    const session = (await cookies()).get("auditdesk_session")?.value;

    let user = {
      id: "EMP001",
      name: "S. Roy",
    };

    if (session) {
      const secret = process.env.AUTH_SECRET;

      if (!secret) {
        throw new Error("AUTH_SECRET is not configured");
      }

      const secretKey = new TextEncoder().encode(secret);

      const { payload } = await jwtVerify(session, secretKey);

      user = {
        id: String(payload.id || "EMP001"),
        name: String(payload.name || "S. Roy"),
      };
    }

    const audits = await readAudits();

    const audit: Audit = {
      ...body,

      id: `AUD-${String(audits.length + 1).padStart(3, "0")}`,

      employeeId: user.id,
      employeeName: user.name,

      status: "DRAFT",

      templateId: "multiplex-fire-safety",

      answers: body.answers || {},
    };

    console.log("AUDIT BEFORE WRITE:", JSON.stringify(audit, null, 2));

    audits.push(audit);

    await writeAudits(audits);

    console.log("AUDIT SAVED:", audit.id);

    return NextResponse.json(audit, {
      status: 201,
    });
  } catch (error) {
    console.error("Create audit error:", error);

    return NextResponse.json(
      { error: "Failed to create audit." },
      { status: 500 },
    );
  }
}
