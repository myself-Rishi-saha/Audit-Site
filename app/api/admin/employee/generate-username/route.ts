import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { neon } from "@neondatabase/serverless";

const ADMIN_COOKIE = "auditdesk_admin_session";

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

async function verifyAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;

  if (!token) {
    return false;
  }

  try {
    const { payload } = await jwtVerify(token, getAuthSecret());

    return payload.role === "admin";
  } catch {
    return false;
  }
}

function createUsernameBase(name: string) {
  const words = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "auditor";
  }

  if (words.length === 1) {
    return words[0];
  }

  return `${words[0]}${words[words.length - 1]}`;
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json(
        { error: "Employee name is required" },
        { status: 400 },
      );
    }

    const sql = neon(process.env.DATABASE_URL!);

    const base = createUsernameBase(name);

    const rows = await sql`
      SELECT username
      FROM employees
      WHERE username LIKE ${base + "%"}
      ORDER BY username
    `;

    const existing = new Set(
      rows.map((row: any) => String(row.username).toLowerCase()),
    );

    let username = base;

    if (existing.has(username.toLowerCase())) {
      let number = 2;

      while (existing.has(`${base}${number}`.toLowerCase())) {
        number++;
      }

      username = `${base}${number}`;
    }

    return NextResponse.json({
      username,
    });
  } catch (error) {
    console.error("Generate username error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate username",
      },
      { status: 500 },
    );
  }
}
