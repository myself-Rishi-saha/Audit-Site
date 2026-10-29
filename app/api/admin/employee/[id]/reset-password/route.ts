
// import { NextRequest, NextResponse } from "next/server";
// import { jwtVerify } from "jose";
// import { neon } from "@neondatabase/serverless";
// import bcrypt from "bcryptjs";
// import { randomInt } from "node:crypto";


// const ADMIN_COOKIE = "auditdesk_admin_session";

// function getAuthSecret() {
//   const secret = process.env.AUTH_SECRET;

//   if (!secret) {
//     throw new Error("AUTH_SECRET is not configured");
//   }

//   return new TextEncoder().encode(secret);
// }

// async function verifyAdmin(request: NextRequest) {
//   const token = request.cookies.get(ADMIN_COOKIE)?.value;

//   if (!token) {
//     return false;
//   }

//   try {
//     const { payload } = await jwtVerify(
//       token,
//       getAuthSecret(),
//     );

//     return payload.role === "admin";
//   } catch {
//     return false;
//   }
// }

// // function generatePassword() {
// //   const chars =
// //     "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

// //   const special = "!@#$%";

// //   let password = "";

// //   for (let i = 0; i < 8; i++) {
// //     password +=
// //       chars[Math.floor(Math.random() * chars.length)];
// //   }

// //   password +=
// //     special[Math.floor(Math.random() * special.length)];

// //   password += Math.floor(Math.random() * 10);

// //   return password;
// // }

// function generatePassword() {
//   const chars =
//     "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
//   const special = "!@#$%";

//   let password = "";

//   for (let i = 0; i < 8; i++) {
//     password += chars[randomInt(chars.length)];
//   }

//   password += special[randomInt(special.length)];
//   password += randomInt(10);

//   return password;
// }
// export async function POST(
//   request: NextRequest,
//   {
//     params,
//   }: {
//     params: Promise<{ id: string }>;
//   },
// ) {
//   try {
//     const isAdmin = await verifyAdmin(request);

//     if (!isAdmin) {
//       return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401 },
//       );
//     }

//     const { id } = await params;

//     const databaseUrl = process.env.DATABASE_URL;

//     if (!databaseUrl) {
//       return NextResponse.json(
//         { error: "DATABASE_URL is not configured" },
//         { status: 500 },
//       );
//     }

//     const sql = neon(databaseUrl);

//     const existing = await sql`
//       SELECT
//         id,
//         name,
//         username
//       FROM employees
//       WHERE id = ${id}
//       LIMIT 1
//     `;

//     if (existing.length === 0) {
//       return NextResponse.json(
//         { error: "Employee not found" },
//         { status: 404 },
//       );
//     }

//     // Generate a completely new password.
//     const newPassword = generatePassword();

//     // Store only the bcrypt hash.
//     const passwordHash = await bcrypt.hash(
//       newPassword,
//       10,
//     );

//     await sql`
//       UPDATE employees
//       SET
//         password_hash = ${passwordHash},
//         updated_at = NOW()
//       WHERE id = ${id}
//     `;

//     return NextResponse.json({
//       message: "Password reset successfully",
//       employee: {
//         id: String(existing[0].id),
//         name: String(existing[0].name),
//         username: String(existing[0].username),
//       },
//       // This is shown to the admin once.
//       // It is NOT stored in the database.
//       password: newPassword,
//     });
//   } catch (error) {
//     console.error(
//       "Reset employee password error:",
//       error,
//     );

//     return NextResponse.json(
//       {
//         error: "Failed to reset employee password",
//       },
//       {
//         status: 500,
//       },
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { getDatabase } from "@/lib/db";

const ADMIN_COOKIE = "auditdesk_admin_session";

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;

  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

function generatePassword(): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const special = "!@#$%";

  let password = "";

  for (let i = 0; i < 8; i++) {
    password += chars[randomInt(chars.length)];
  }

  password += special[randomInt(special.length)];
  password += randomInt(10);

  return password;
}

interface EmployeeRow extends RowDataPacket {
  id: string;
  name: string;
  username: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    if (!id?.trim()) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 },
      );
    }

    const db = getDatabase();

    const [existingRows] = await db.execute<EmployeeRow[]>(
      `SELECT id, name, username
       FROM employees
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    const employee = existingRows[0];

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    // Generate a new password and store only its bcrypt hash.
    const newPassword = generatePassword();
    const passwordHash = await bcrypt.hash(newPassword, 10);

    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE employees
       SET password_hash = ?,
           updated_at = UTC_TIMESTAMP(3)
       WHERE id = ?`,
      [passwordHash, id],
    );

    if (result.affectedRows !== 1) {
      return NextResponse.json(
        { error: "Password reset failed" },
        { status: 500 },
      );
    }

    // Return the plain-text password to the admin once.
    // Never store the plain-text password in the database.
    return NextResponse.json({
      message: "Password reset successfully",
      employee: {
        id: String(employee.id),
        name: String(employee.name),
        username: String(employee.username),
      },
      password: newPassword,
    });
  } catch (error) {
    console.error("Reset employee password error:", error);

    return NextResponse.json(
      { error: "Failed to reset employee password" },
      { status: 500 },
    );
  }
}
