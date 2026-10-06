// import { NextResponse } from "next/server";
// import { cookies } from "next/headers";
// import { readAudits, writeAudits, scoreAudit, Audit } from "@/lib/audit";
// export async function GET() {
//   return NextResponse.json(await readAudits());
// }
// export async function POST(req: Request) {
//   const body = await req.json();
//   const session = (await cookies()).get("auditdesk_session")?.value;
//   const user = session ? JSON.parse(session) : { id: "EMP001", name: "S. Roy" };
//   const audits = await readAudits();
//   const audit: Audit = {
//     ...body,
//     id: `AUD-${String(audits.length + 1).padStart(3, "0")}`,
//     employeeId: user.id,
//     employeeName: user.name,
//     status: "DRAFT",
//     templateId: "multiplex-fire-safety",
//     answers: body.answers || {},
//   };
//   audits.push(audit);
//   await writeAudits(audits);
//   return NextResponse.json(audit);
// }
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import {
  readAudits,
  writeAudits,
  Audit,
} from "@/lib/audit";

export async function GET() {
  return NextResponse.json(await readAudits());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const cookieStore = await cookies();
    const session = cookieStore.get("auditdesk_session")?.value;

    let user = {
      id: "EMP001",
      name: "S. Roy",
    };

    // Read user from JWT
    if (session) {
      try {
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
      } catch (error) {
        console.error("Invalid session:", error);

        return NextResponse.json(
          { error: "Invalid or expired session." },
          { status: 401 }
        );
      }
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

    audits.push(audit);

    await writeAudits(audits);

    return NextResponse.json(audit, { status: 201 });
  } catch (error) {
    console.error("Create audit error:", error);

    return NextResponse.json(
      { error: "Failed to create audit." },
      { status: 500 }
    );
  }
}