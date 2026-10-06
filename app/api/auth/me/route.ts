import { cookies } from "next/headers";
import { NextResponse } from "next/server";
export async function GET() {
  const value = (await cookies()).get("auditdesk_session")?.value;
  return NextResponse.json({ user: value ? JSON.parse(value) : null });
}
