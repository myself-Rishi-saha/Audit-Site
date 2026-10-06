import { NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

const file = path.join(process.cwd(), 'data/templates.json')

export async function GET() {
  return NextResponse.json(JSON.parse(await fs.readFile(file, 'utf8')))
}

export async function PUT(request: Request) {
  const body = await request.json()
  await fs.writeFile(file, JSON.stringify(body, null, 2))
  return NextResponse.json(body)
}
