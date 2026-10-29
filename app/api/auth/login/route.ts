
// import { NextResponse } from "next/server";
// import { neon } from "@neondatabase/serverless";
// import bcrypt from "bcryptjs";
// import { SignJWT } from "jose";

// const EMPLOYEE_COOKIE = "auditdesk_session";

// function getDatabase() {
//   const url = process.env.DATABASE_URL;

//   if (!url) {
//     throw new Error("DATABASE_URL is not configured");
//   }

//   return neon(url);
// }

// export async function POST(req: Request) {
//   try {
//     const { username, password } = await req.json();

//     if (
//       typeof username !== "string" ||
//       typeof password !== "string" ||
//       !username.trim() ||
//       !password
//     ) {
//       return NextResponse.json(
//         { error: "Username and password are required" },
//         { status: 400 },
//       );
//     }

//     const secret = process.env.AUTH_SECRET;

//     if (!secret) {
//       console.error("AUTH_SECRET is not configured");

//       return NextResponse.json(
//         { error: "Server configuration error" },
//         { status: 500 },
//       );
//     }

//     const secretKey = new TextEncoder().encode(secret);
//     const sql = getDatabase();

//     const rows = await sql`
//       SELECT
//         id,
//         name,
//         username,
//         password_hash,
//         is_active,
//         role,
//         can_access_audit,
//         can_access_service_report,
//         can_access_daily_accent_report
//       FROM employees
//       WHERE LOWER(username) = LOWER(${username.trim()})
//       LIMIT 1
//     `;

//     if (rows.length === 0) {
//       return NextResponse.json(
//         { error: "Invalid username or password" },
//         { status: 401 },
//       );
//     }

//     const user = rows[0];

//     // Only active auditor accounts can use employee login.
//     if (user.role !== "auditor") {
//       return NextResponse.json(
//         { error: "This account cannot use employee login." },
//         { status: 403 },
//       );
//     }

//     if (user.is_active !== true) {
//       return NextResponse.json(
//         {
//           error:
//             "Your account is inactive. Please contact the administrator.",
//         },
//         { status: 403 },
//       );
//     }

//     const passwordValid = await bcrypt.compare(
//       password,
//       String(user.password_hash),
//     );

//     if (!passwordValid) {
//       return NextResponse.json(
//         { error: "Invalid username or password" },
//         { status: 401 },
//       );
//     }

//     const canAccessAudit =
//       user.can_access_audit === true;

//     const canAccessServiceReport =
//       user.can_access_service_report === true;

//     const canAccessDailyAccentReport =
//       user.can_access_daily_accent_report === true;

//     // Reject accounts that have no assigned employee features.
//     if (!canAccessAudit && !canAccessServiceReport && !canAccessDailyAccentReport) {
//       return NextResponse.json(
//         {
//           error:
//             "Your account has no assigned permissions. Please contact the administrator.",
//         },
//         { status: 403 },
//       );
//     }

//     const token = await new SignJWT({
//       id: String(user.id),
//       name: String(user.name),
//       username: String(user.username),
//       role: "auditor",
//     })
//       .setProtectedHeader({ alg: "HS256" })
//       .setIssuedAt()
//       .setExpirationTime("8h")
//       .sign(secretKey);

//     const response = NextResponse.json({
//       user: {
//         id: String(user.id),
//         name: String(user.name),
//         username: String(user.username),
//         role: "auditor",
//         canAccessAudit,
//         canAccessServiceReport,
//         canAccessDailyAccentReport,
//       },
//     });

//     response.cookies.set(EMPLOYEE_COOKIE, token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "lax",
//       path: "/",
//       maxAge: 60 * 60 * 8,
//     });

//     return response;
//   } catch (error) {
//     console.error("Employee login error:", error);

//     return NextResponse.json(
//       { error: "Something went wrong during login" },
//       { status: 500 },
//     );
//   }
// }


import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

import { getDatabase } from "@/lib/db";

const EMPLOYEE_COOKIE = "auditdesk_session";

interface EmployeeLoginRow extends RowDataPacket {
  id: string;
  name: string;
  username: string;
  password_hash: string;
  is_active: boolean | number;
  role: string;
  can_access_audit: boolean | number;
  can_access_service_report: boolean | number;
  can_access_daily_accent_report: boolean | number;
}

function toBoolean(value: boolean | number | string | null): boolean {
  return value === true || value === 1 || value === "1";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body ?? {};

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !password
    ) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 },
      );
    }

    const secret = process.env.AUTH_SECRET;

    if (!secret) {
      console.error("AUTH_SECRET is not configured");

      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const db = getDatabase();

    const [rows] = await db.execute<EmployeeLoginRow[]>(
      `SELECT
         id,
         name,
         username,
         password_hash,
         is_active,
         role,
         can_access_audit,
         can_access_service_report,
         can_access_daily_accent_report
       FROM employees
       WHERE LOWER(username) = LOWER(?)
       LIMIT 1`,
      [username.trim()],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    const user = rows[0];

    // Only auditor accounts can use employee login.
    if (user.role !== "auditor") {
      return NextResponse.json(
        { error: "This account cannot use employee login." },
        { status: 403 },
      );
    }

    if (!toBoolean(user.is_active)) {
      return NextResponse.json(
        {
          error:
            "Your account is inactive. Please contact the administrator.",
        },
        { status: 403 },
      );
    }

    const passwordValid = await bcrypt.compare(
      password,
      String(user.password_hash),
    );

    if (!passwordValid) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    const canAccessAudit = toBoolean(user.can_access_audit);
    const canAccessServiceReport = toBoolean(
      user.can_access_service_report,
    );
    const canAccessDailyAccentReport = toBoolean(
      user.can_access_daily_accent_report,
    );

    if (
      !canAccessAudit &&
      !canAccessServiceReport &&
      !canAccessDailyAccentReport
    ) {
      return NextResponse.json(
        {
          error:
            "Your account has no assigned permissions. Please contact the administrator.",
        },
        { status: 403 },
      );
    }

    const secretKey = new TextEncoder().encode(secret);

    const token = await new SignJWT({
      id: String(user.id),
      name: String(user.name),
      username: String(user.username),
      role: "auditor",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(secretKey);

    const response = NextResponse.json({
      user: {
        id: String(user.id),
        name: String(user.name),
        username: String(user.username),
        role: "auditor",
        canAccessAudit,
        canAccessServiceReport,
        canAccessDailyAccentReport,
      },
    });

    response.cookies.set(EMPLOYEE_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error("Employee login error:", error);

    return NextResponse.json(
      { error: "Something went wrong during login" },
      { status: 500 },
    );
  }
}
