// import { NextResponse } from 'next/server'
// import fs from 'node:fs/promises'
// import path from 'node:path'

// const file = path.join(process.cwd(), 'data/templates.json')

// export async function GET() {
//   return NextResponse.json(JSON.parse(await fs.readFile(file, 'utf8')))
// }

// export async function PUT(request: Request) {
//   const body = await request.json()
//   await fs.writeFile(file, JSON.stringify(body, null, 2))
//   return NextResponse.json(body)
// }

import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      return NextResponse.json(
        { error: "DATABASE_URL is not configured" },
        { status: 500 }
      );
    }

    const sql = neon(databaseUrl);

    const templates = await sql`
      SELECT id, type, name, title, sections, updated_at
      FROM form_templates
      ORDER BY id
    `;

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Failed to fetch templates:", error);

    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// Keep the existing JSON-file save behavior for now.
// We will update this safely after checking the template editor.
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const file = path.join(process.cwd(), "data", "templates.json");
    await fs.writeFile(file, JSON.stringify(body, null, 2));

    return NextResponse.json(body);
  } catch (error) {
    console.error("Failed to save templates:", error);

    return NextResponse.json(
      { error: "Failed to save templates" },
      { status: 500 }
    );
  }
}
