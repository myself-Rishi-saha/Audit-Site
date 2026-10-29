// import { NextResponse } from "next/server";
// import { cookies } from "next/headers";
// import { jwtVerify } from "jose";
// import { neon } from "@neondatabase/serverless";

// const EMPLOYEE_COOKIE = "auditdesk_session";
// const ADMIN_COOKIE = "auditdesk_admin_session";

// const sql = neon(process.env.DATABASE_URL!);

// export async function GET() {
//   try {
//     const cookieStore = await cookies();

//     const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
//     const employeeToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;

//     const secret = process.env.AUTH_SECRET;

//     if (!secret) {
//       throw new Error("AUTH_SECRET is not configured");
//     }

//     const secretKey = new TextEncoder().encode(secret);

//     // -----------------------------------
//     // ADMIN SESSION
//     // -----------------------------------
//     if (adminToken) {
//       try {
//         const { payload } = await jwtVerify(adminToken, secretKey);

//         if (!payload.id || !payload.name || payload.role !== "admin") {
//           return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//         }

//         return NextResponse.json({
//           id: String(payload.id),
//           name: String(payload.name),
//           username: String(payload.username || ""),
//           role: "admin",
//         });
//       } catch {
//         return NextResponse.json(
//           { error: "Invalid or expired admin session." },
//           { status: 401 },
//         );
//       }
//     }

//     // -----------------------------------
//     // EMPLOYEE SESSION
//     // -----------------------------------
//     if (employeeToken) {
//       try {
//         const { payload } = await jwtVerify(employeeToken, secretKey);

//         if (!payload.id || payload.role !== "auditor") {
//           return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//         }

//         // Fetch current employee details and permissions.
//         const rows = await sql`
//           SELECT
//             id,
//             name,
//             username,
//             role,
//             is_active,
//             can_access_audit,
//             can_access_service_report,
//             can_access_daily_accent_report
//           FROM employees
//           WHERE id = ${String(payload.id)}
//           LIMIT 1
//         `;

//         const employee = rows[0];

//         if (
//           !employee ||
//           employee.is_active !== true ||
//           employee.role !== "auditor"
//         ) {
//           return NextResponse.json(
//             { error: "Employee account is inactive or unauthorized." },
//             { status: 401 },
//           );
//         }

//         return NextResponse.json({
//           id: String(employee.id),
//           name: String(employee.name),
//           username: String(employee.username),
//           role: "auditor",
//           canAccessAudit: employee.can_access_audit === true,
//           canAccessServiceReport: employee.can_access_service_report === true,
//           canAccessDailyAccentReport:
//             employee.can_access_daily_accent_report === true,
//         });
//       } catch (error) {
//         console.error("Get employee session error:", error);

//         return NextResponse.json(
//           { error: "Invalid or expired employee session." },
//           { status: 401 },
//         );
//       }
//     }

//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   } catch (error) {
//     console.error("Get current user error:", error);

//     return NextResponse.json(
//       { error: "Unable to verify session." },
//       { status: 500 },
//     );
//   }
// }

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import type { RowDataPacket } from "mysql2/promise";

import { getDatabase } from "@/lib/db";

const EMPLOYEE_COOKIE = "auditdesk_session";
const ADMIN_COOKIE = "auditdesk_admin_session";

interface EmployeeSessionRow extends RowDataPacket {
  id: string;
  name: string;
  username: string;
  role: string;
  is_active: boolean | number | string;
  can_access_audit: boolean | number | string;
  can_access_service_report: boolean | number | string;
  can_access_daily_accent_report: boolean | number | string;
}

function toBoolean(value: boolean | number | string | null): boolean {
  return value === true || value === 1 || value === "1";
}

export async function GET() {
  try {
    const cookieStore = await cookies();

    const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
    const employeeToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;

    const secret = process.env.AUTH_SECRET;

    if (!secret) {
      throw new Error("AUTH_SECRET is not configured");
    }

    const secretKey = new TextEncoder().encode(secret);

    // ADMIN SESSION
    if (adminToken) {
      try {
        const { payload } = await jwtVerify(adminToken, secretKey);

        if (!payload.id || !payload.name || payload.role !== "admin") {
          return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 },
          );
        }

        return NextResponse.json({
          id: String(payload.id),
          name: String(payload.name),
          username: String(payload.username || ""),
          role: "admin",
        });
      } catch {
        return NextResponse.json(
          { error: "Invalid or expired admin session." },
          { status: 401 },
        );
      }
    }

    // EMPLOYEE SESSION
    if (employeeToken) {
      try {
        const { payload } = await jwtVerify(employeeToken, secretKey);

        if (!payload.id || payload.role !== "auditor") {
          return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 },
          );
        }

        const db = getDatabase();

        const [rows] = await db.execute<EmployeeSessionRow[]>(
          `SELECT
             id,
             name,
             username,
             role,
             is_active,
             can_access_audit,
             can_access_service_report,
             can_access_daily_accent_report
           FROM employees
           WHERE id = ?
           LIMIT 1`,
          [String(payload.id)],
        );

        const employee = rows[0];

        if (
          !employee ||
          !toBoolean(employee.is_active) ||
          employee.role !== "auditor"
        ) {
          return NextResponse.json(
            { error: "Employee account is inactive or unauthorized." },
            { status: 401 },
          );
        }

        return NextResponse.json({
          id: String(employee.id),
          name: String(employee.name),
          username: String(employee.username),
          role: "auditor",
          canAccessAudit: toBoolean(employee.can_access_audit),
          canAccessServiceReport: toBoolean(
            employee.can_access_service_report,
          ),
          canAccessDailyAccentReport: toBoolean(
            employee.can_access_daily_accent_report,
          ),
        });
      } catch (error) {
        console.error("Get employee session error:", error);

        return NextResponse.json(
          { error: "Unable to verify employee session." },
          { status: 401 },
        );
      }
    }

    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  } catch (error) {
    console.error("Get current user error:", error);

    return NextResponse.json(
      { error: "Unable to verify session." },
      { status: 500 },
    );
  }
}
