import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const EMPLOYEE_COOKIE = "auditdesk_session";
const ADMIN_COOKIE = "auditdesk_admin_session";

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

    // -----------------------------------
    // ADMIN SESSION
    // -----------------------------------
    if (adminToken) {
      try {
        const { payload } = await jwtVerify(
          adminToken,
          secretKey,
        );

        if (
          !payload.id ||
          !payload.name ||
          payload.role !== "admin"
        ) {
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

    // -----------------------------------
    // EMPLOYEE SESSION
    // -----------------------------------
    if (employeeToken) {
      try {
        const { payload } = await jwtVerify(
          employeeToken,
          secretKey,
        );

        if (
          !payload.id ||
          !payload.name ||
          payload.role !== "auditor"
        ) {
          return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 },
          );
        }

        return NextResponse.json({
          id: String(payload.id),
          name: String(payload.name),
          username: String(payload.username || ""),
          role: "auditor",
        });
      } catch {
        return NextResponse.json(
          { error: "Invalid or expired employee session." },
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
      { error: "Invalid or expired session." },
      { status: 401 },
    );
  }
}
// app/api/auth/me/route.ts

// import { NextResponse } from "next/server";
// import { cookies } from "next/headers";
// import { jwtVerify } from "jose";

// export async function GET() {
//   try {
//     const token = (await cookies())
//       .get("auditdesk_session")
//       ?.value;

//     if (!token) {
//       return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401 },
//       );
//     }

//     const secret = process.env.AUTH_SECRET;

//     if (!secret) {
//       throw new Error("AUTH_SECRET is not configured");
//     }

//     const { payload } = await jwtVerify(
//       token,
//       new TextEncoder().encode(secret),
//     );

//     if (
//       !payload.id ||
//       !payload.name ||
//       payload.role !== "auditor"
//     ) {
//       return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401 },
//       );
//     }

//     return NextResponse.json({
//       id: String(payload.id),
//       name: String(payload.name),
//       username: String(payload.username || ""),
//       role: "auditor",
//     });
//   } catch (error) {
//     console.error("Get current user error:", error);

//     return NextResponse.json(
//       { error: "Invalid or expired session." },
//       { status: 401 },
//     );
//   }
// }