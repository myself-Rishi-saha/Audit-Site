import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const file = path.join(process.cwd(), "data/templates.json");
async function read() {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

export async function GET() {
  const templates = await read();
  const template = templates.find((item: any) => item.id === "service-report");
  return template
    ? NextResponse.json(template)
    : NextResponse.json({ error: "Template not found" }, { status: 404 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const templates = await read();
  const next = templates.map((item: any) =>
    item.id === "service-report"
      ? { ...body, id: "service-report", type: "SERVICE_REPORT" }
      : item,
  );
  await fs.writeFile(file, JSON.stringify(next, null, 2));
  return NextResponse.json(
    next.find((item: any) => item.id === "service-report"),
  );
}
