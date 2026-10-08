import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const secret = process.env.AUTH_SECRET;
const adminUsername = process.env.ADMIN_USERNAME;
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

if (!secret) {
  throw new Error("AUTH_SECRET is not configured");
}
//console.log("Admin credentials:", { adminUsername, adminPasswordHash });
if (!adminUsername || !adminPasswordHash) {
  throw new Error(
    "ADMIN_USERNAME or ADMIN_PASSWORD_HASH is not configured",
  );
}

const secretKey = new TextEncoder().encode(secret);

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    // console.log("Admin login attempt:", { username, password });
    if (!username || !password) {
      return NextResponse.json(
        { error: "Admin username and password are required" },
        { status: 400 },
      );
    }

    if (username !== adminUsername) {
      return NextResponse.json(
        { error: "Invalid admin username or password" },
        { status: 401 },
      );
    }

    const passwordValid = await bcrypt.compare(
      password,
      adminPasswordHash,
    );

    if (!passwordValid) {
      return NextResponse.json(
        { error: "Invalid admin username or password" },
        { status: 401 },
      );
    }

    const token = await new SignJWT({
      id: "ADMIN",
      name: "Administrator",
      role: "admin",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(secretKey);

    const response = NextResponse.json({
      user: {
        id: "ADMIN",
        name: "Administrator",
        role: "admin",
      },
    });

    response.cookies.set("auditdesk_admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json(
      { error: "Something went wrong during admin login" },
      { status: 500 },
    );
  }
}