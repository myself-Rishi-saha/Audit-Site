// import { NextRequest, NextResponse } from "next/server";
// import { jwtVerify } from "jose";
// import { neon } from "@neondatabase/serverless";
// import bcrypt from "bcryptjs";

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

// function generatePassword() {
//   const chars =
//     "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

//   const special = "!@#$%";

//   let password = "";

//   for (let i = 0; i < 8; i++) {
//     password +=
//       chars[Math.floor(Math.random() * chars.length)];
//   }

//   password +=
//     special[
//       Math.floor(Math.random() * special.length)
//     ];

//   password +=
//     Math.floor(Math.random() * 10);

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

//     const sql = neon(
//       process.env.DATABASE_URL!,
//     );

//     const existing = await sql`
//       SELECT id, name, username
//       FROM employees
//       WHERE id = ${id}
//       LIMIT 1
//     `;

//     if (existing.length === 0) {
//       return NextResponse.json(
//         {
//           error: "Employee not found",
//         },
//         { status: 404 },
//       );
//     }

//     const newPassword = generatePassword();

//     const passwordHash = await bcrypt.hash(
//       newPassword,
//       10,
//     );

//     await sql`
//       UPDATE employees
//       SET
//         password_hash = ${passwordHash},
//         must_change_password = TRUE,
//         updated_at = NOW()
//       WHERE id = ${id}
//     `;

//     return NextResponse.json({
//       message: "Password reset successfully",
//       employee: {
//         id: existing[0].id,
//         name: existing[0].name,
//         username: existing[0].username,
//       },
//       password: newPassword,
//     });
//   } catch (error) {
//     console.error(
//       "Reset employee password error:",
//       error,
//     );

//     return NextResponse.json(
//       {
//         error: "Failed to reset password",
//       },
//       { status: 500 },
//     );
//   }
// }
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

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
    const { payload } = await jwtVerify(
      token,
      getAuthSecret(),
    );

    return payload.role === "admin";
  } catch {
    return false;
  }
}

function generatePassword() {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

  const special = "!@#$%";

  let password = "";

  for (let i = 0; i < 8; i++) {
    password +=
      chars[Math.floor(Math.random() * chars.length)];
  }

  password +=
    special[Math.floor(Math.random() * special.length)];

  password += Math.floor(Math.random() * 10);

  return password;
}

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const isAdmin = await verifyAdmin(request);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      return NextResponse.json(
        { error: "DATABASE_URL is not configured" },
        { status: 500 },
      );
    }

    const sql = neon(databaseUrl);

    const existing = await sql`
      SELECT
        id,
        name,
        username
      FROM employees
      WHERE id = ${id}
      LIMIT 1
    `;

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    // Generate a completely new password.
    const newPassword = generatePassword();

    // Store only the bcrypt hash.
    const passwordHash = await bcrypt.hash(
      newPassword,
      10,
    );

    await sql`
      UPDATE employees
      SET
        password_hash = ${passwordHash},
        updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({
      message: "Password reset successfully",

      employee: {
        id: String(existing[0].id),
        name: String(existing[0].name),
        username: String(existing[0].username),
      },

      // This is shown to the admin once.
      // It is NOT stored in the database.
      password: newPassword,
    });
  } catch (error) {
    console.error(
      "Reset employee password error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to reset employee password",
      },
      {
        status: 500,
      },
    );
  }
}