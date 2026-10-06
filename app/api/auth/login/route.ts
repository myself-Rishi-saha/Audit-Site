// import { NextResponse } from "next/server";
// import fs from "node:fs/promises";
// import path from "node:path";
// export async function POST(req: Request) {
//   const { id, password } = await req.json();
//   const users = JSON.parse(
//     await fs.readFile(path.join(process.cwd(), "data/users.json"), "utf8"),
//   );
//   const user = users.find((u: any) => u.id === id && u.password === password);
//   if (!user)
//     return NextResponse.json(
//       { error: "Invalid employee ID or password" },
//       { status: 401 },
//     );
//   const res = NextResponse.json({
//     user: { id: user.id, name: user.name, role: user.role },
//   });
//   res.cookies.set(
//     "auditdesk_session",
//     JSON.stringify({ id: user.id, name: user.name, role: user.role }),
//     {
//       httpOnly: true,
//       sameSite: "lax",
//       secure: process.env.NODE_ENV === "production",
//       path: "/",
//     },
//   );
//   return res;
// }

import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const secret = process.env.AUTH_SECRET;

if (!secret) {
  throw new Error("AUTH_SECRET is not configured");
}

const secretKey = new TextEncoder().encode(secret);

export async function POST(req: Request) {
  try {
    const { id, password } = await req.json();
    if (!id || !password) {
      return NextResponse.json(
        { error: "Employee ID and password are required" },
        { status: 400 },
      );
    }

    // This file stays on the server.
    // DO NOT put users.json inside /public.
    const filePath = path.join(process.cwd(), "data", "users.json");

    const users = JSON.parse(await fs.readFile(filePath, "utf8"));

    const user = users.find((u: { id: string }) => u.id === id);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid employee ID or password" },
        { status: 401 },
      );
    }

    // Compare entered password with stored bcrypt hash
    // const passwordValid = await bcrypt.compare(password, user.passwordHash);
    const passwordValid = password === user.passwordHash; // For demo purposes, using plain text comparison. In production, use bcrypt.

    if (!passwordValid) {
      return NextResponse.json(
        { error: "Invalid employee ID or password" },
        { status: 401 },
      );
    }

    // Create a signed session token
    const token = await new SignJWT({
      id: user.id,
      name: user.name,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(secretKey);

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });

    response.cookies.set("auditdesk_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { error: "Something went wrong during login" },
      { status: 500 },
    );
  }
}
