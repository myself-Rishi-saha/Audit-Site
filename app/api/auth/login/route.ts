// import { NextResponse } from "next/server";
// import fs from "node:fs/promises";
// import path from "node:path";
// import bcrypt from "bcryptjs";
// import { SignJWT } from "jose";

// const secret = process.env.AUTH_SECRET;

// if (!secret) {
//   throw new Error("AUTH_SECRET is not configured");
// }

// const secretKey = new TextEncoder().encode(secret);

// export async function POST(req: Request) {
//   try {
//     const { id, password } = await req.json();
//     if (!id || !password) {
//       return NextResponse.json(
//         { error: "Employee ID and password are required" },
//         { status: 400 },
//       );
//     }

//     // This file stays on the server.
//     // DO NOT put users.json inside /public.
//     const filePath = path.join(process.cwd(), "data", "users.json");

//     const users = JSON.parse(await fs.readFile(filePath, "utf8"));

//     const user = users.find((u: { id: string }) => u.id === id);

//     if (!user) {
//       return NextResponse.json(
//         { error: "Invalid employee ID or password" },
//         { status: 401 },
//       );
//     }

//     // Compare entered password with stored bcrypt hash
//     // const passwordValid = await bcrypt.compare(password, user.passwordHash);
//     const passwordValid = password === user.passwordHash; // For demo purposes, using plain text comparison. In production, use bcrypt.

//     if (!passwordValid) {
//       return NextResponse.json(
//         { error: "Invalid employee ID or password" },
//         { status: 401 },
//       );
//     }

//     // Create a signed session token
//     const token = await new SignJWT({
//       id: user.id,
//       name: user.name,
//       role: user.role,
//     })
//       .setProtectedHeader({ alg: "HS256" })
//       .setIssuedAt()
//       .setExpirationTime("8h")
//       .sign(secretKey);

//     const response = NextResponse.json({
//       user: {
//         id: user.id,
//         name: user.name,
//         role: user.role,
//       },
//     });

//     response.cookies.set("auditdesk_session", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "lax",
//       path: "/",
//       maxAge: 60 * 60 * 8,
//     });

//     return response;
//   } catch (error) {
//     console.error("Login error:", error);

//     return NextResponse.json(
//       { error: "Something went wrong during login" },
//       { status: 500 },
//     );
//   }
// }
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const secret = process.env.AUTH_SECRET;

if (!secret) {
  throw new Error("AUTH_SECRET is not configured");
}

const secretKey = new TextEncoder().encode(secret);

function getDatabase() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }

  return neon(url);
}

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        {
          error: "Username and password are required",
        },
        {
          status: 400,
        },
      );
    }

    const sql = getDatabase();

    const rows = await sql`
      SELECT
        id,
        name,
        username,
        password_hash,
        is_active,
        role
      FROM employees
      WHERE LOWER(username) = LOWER(${String(username).trim()})
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        {
          error: "Invalid username or password",
        },
        {
          status: 401,
        },
      );
    }

    const user = rows[0];

    // Do not allow inactive employees to log in.
    if (!user.is_active) {
      return NextResponse.json(
        {
          error:
            "Your account is inactive. Please contact the administrator.",
        },
        {
          status: 403,
        },
      );
    }

    // Compare entered password with the bcrypt hash.
    const passwordValid = await bcrypt.compare(
      password,
      String(user.password_hash),
    );

    if (!passwordValid) {
      return NextResponse.json(
        {
          error: "Invalid username or password",
        },
        {
          status: 401,
        },
      );
    }

    // Create employee session.
    const token = await new SignJWT({
      id: String(user.id),
      name: String(user.name),
      username: String(user.username),
      role: String(user.role),
    })
      .setProtectedHeader({
        alg: "HS256",
      })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(secretKey);

    const response = NextResponse.json({
      user: {
        id: String(user.id),
        name: String(user.name),
        username: String(user.username),
        role: String(user.role),
      },
    });

    response.cookies.set(
      "auditdesk_session",
      token,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8,
      },
    );

    return response;
  } catch (error) {
    console.error("Employee login error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong during login",
      },
      {
        status: 500,
      },
    );
  }
}