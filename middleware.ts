

// import { NextRequest, NextResponse } from "next/server";
// import { jwtVerify } from "jose";

// const AUTH_COOKIE = "auditdesk_admin_session";

// function getAuthSecret() {
//   const secret = process.env.AUTH_SECRET;

//   if (!secret) {
//     throw new Error("AUTH_SECRET is not configured");
//   }

//   return new TextEncoder().encode(secret);
// }

// export async function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;

//   // Only protect admin routes
//   if (!pathname.startsWith("/admin")) {
//     return NextResponse.next();
//   }

//   // Admin login page is public
//   if (pathname === "/admin/login") {
//     return NextResponse.next();
//   }

//   const token = request.cookies.get(AUTH_COOKIE)?.value;

//   // No admin session
//   if (!token) {
//     return NextResponse.redirect(
//       new URL("/admin/login", request.url),
//     );
//   }

//   try {
//     const { payload } = await jwtVerify(
//       token,
//       getAuthSecret(),
//     );

//     // Make sure the session belongs to an admin
//     if (payload.role !== "admin") {
//       const response = NextResponse.redirect(
//         new URL("/admin/login", request.url),
//       );

//       response.cookies.delete(AUTH_COOKIE);

//       return response;
//     }

//     return NextResponse.next();
//   } catch (error) {
//     console.error("Invalid admin session:", error);

//     const response = NextResponse.redirect(
//       new URL("/admin/login", request.url),
//     );

//     response.cookies.delete(AUTH_COOKIE);

//     return response;
//   }
// }

// export const config = {
//   matcher: ["/admin/:path*"],
// };

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const ADMIN_COOKIE = "auditdesk_admin_session";
const EMPLOYEE_COOKIE = "auditdesk_session";

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // -------------------------
  // ADMIN ROUTES
  // -------------------------
  if (pathname.startsWith("/admin")) {
    // Admin login is public
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    const token = request.cookies.get(ADMIN_COOKIE)?.value;

    // No admin cookie
    if (!token) {
      return NextResponse.redirect(
        new URL("/admin/login", request.url),
      );
    }

    try {
      const { payload } = await jwtVerify(
        token,
        getAuthSecret(),
      );
      console.log("Employee session payload:", payload);
      // Must be an admin session
      if (
        payload.id !== "ADMIN" ||
        payload.role !== "admin"
      ) {
        throw new Error("Invalid admin session");
      }

      return NextResponse.next();
    } catch (error) {
      console.error("Invalid admin session:", error);

      const response = NextResponse.redirect(
        new URL("/admin/login", request.url),
      );

      response.cookies.delete(ADMIN_COOKIE);

      return response;
    }
  }

  // -------------------------
  // EMPLOYEE ROUTES
  // -------------------------
  if (pathname.startsWith("/employee")) {
    const token = request.cookies.get(EMPLOYEE_COOKIE)?.value;

    // No employee cookie
    if (!token) {
      return NextResponse.redirect(
        new URL("/login", request.url),
      );
    }

    try {
      const { payload } = await jwtVerify(
        token,
        getAuthSecret(),
      );

      // Must be an employee session
      console.log("Employee session payload:", payload);
      if (payload.role !== "auditor") {
        throw new Error("Invalid employee session");
      }

      return NextResponse.next();
    } catch (error) {
      console.error("Invalid employee session:", error);

      const response = NextResponse.redirect(
        new URL("/login", request.url),
      );

      response.cookies.delete(EMPLOYEE_COOKIE);

      return response;
    }
  }

  // Everything else is public
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/employee/:path*",
  ],
};