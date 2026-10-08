// import { NextRequest, NextResponse } from "next/server";
// import { cookies } from "next/headers";
// import { jwtVerify } from "jose";

// import {
//   createCustomer,
//   readCustomers,
// } from "@/lib/customers";

// const ADMIN_COOKIE = "auditdesk_admin_session";

// function getAuthSecret() {
//   const secret = process.env.AUTH_SECRET;

//   if (!secret) {
//     throw new Error("AUTH_SECRET is not configured");
//   }

//   return new TextEncoder().encode(secret);
// }

// async function verifyAdmin() {
//   const cookieStore = await cookies();
//   const token = cookieStore.get(ADMIN_COOKIE)?.value;

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

// /**
//  * GET /api/admin/customers
//  *
//  * Returns all customers.
//  */
// export async function GET() {
//   try {
//     const isAdmin = await verifyAdmin();

//     if (!isAdmin) {
//       return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401 },
//       );
//     }

//     const customers = await readCustomers();

//     return NextResponse.json(customers);
//   } catch (error) {
//     console.error("Read customers error:", error);

//     return NextResponse.json(
//       { error: "Failed to load customers." },
//       { status: 500 },
//     );
//   }
// }

// /**
//  * POST /api/admin/customers
//  *
//  * Creates a new customer.
//  */
// export async function POST(request: NextRequest) {
//   try {
//     const isAdmin = await verifyAdmin();

//     if (!isAdmin) {
//       return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401 },
//       );
//     }

//     const body = await request.json();

//     const name =
//       typeof body.name === "string"
//         ? body.name.trim()
//         : "";

//     const address =
//       typeof body.address === "string"
//         ? body.address.trim()
//         : "";

//     const gstNo =
//       typeof body.gstNo === "string"
//         ? body.gstNo.trim()
//         : "";

//     const contactNumber =
//       typeof body.contactNumber === "string"
//         ? body.contactNumber.trim()
//         : "";

//     if (!name) {
//       return NextResponse.json(
//         { error: "Customer name is required." },
//         { status: 400 },
//       );
//     }

//     if (!address) {
//       return NextResponse.json(
//         { error: "Address is required." },
//         { status: 400 },
//       );
//     }

//     if (!contactNumber) {
//       return NextResponse.json(
//         { error: "Contact number is required." },
//         { status: 400 },
//       );
//     }

//     const customer = await createCustomer({
//       name,
//       address,
//       gstNo: gstNo || null,
//       contactNumber,
//     });

//     return NextResponse.json(
//       customer,
//       { status: 201 },
//     );
//   } catch (error: any) {
//     console.error("Create customer error:", error);

//     return NextResponse.json(
//       { error: "Failed to create customer." },
//       { status: 500 },
//     );
//   }
// }
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

import {
  deleteCustomer,
  getCustomerById,
  updateCustomer,
} from "@/lib/customers";

const ADMIN_COOKIE = "auditdesk_admin_session";

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

async function verifyAdmin() {
  const cookieStore = await cookies();

  const token = cookieStore.get(ADMIN_COOKIE)?.value;

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

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const isAdmin = await verifyAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const customer = await getCustomerById(id);

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Get customer error:", error);

    return NextResponse.json(
      { error: "Failed to load customer." },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const isAdmin = await verifyAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const existing = await getCustomerById(id);

    if (!existing) {
      return NextResponse.json(
        { error: "Customer not found." },
        { status: 404 },
      );
    }

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const address =
      typeof body.address === "string"
        ? body.address.trim()
        : "";

    const gstNo =
      typeof body.gstNo === "string"
        ? body.gstNo.trim()
        : "";

    const contactNumber =
      typeof body.contactNumber === "string"
        ? body.contactNumber.trim()
        : "";

    if (!name) {
      return NextResponse.json(
        { error: "Customer name is required." },
        { status: 400 },
      );
    }

    if (!address) {
      return NextResponse.json(
        { error: "Address is required." },
        { status: 400 },
      );
    }

    if (!contactNumber) {
      return NextResponse.json(
        { error: "Contact number is required." },
        { status: 400 },
      );
    }

    const customer = await updateCustomer(
      id,
      {
        name,
        address,
        gstNo: gstNo || null,
        contactNumber,
      },
    );

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Update customer error:", error);

    return NextResponse.json(
      { error: "Failed to update customer." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const isAdmin = await verifyAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const deleted = await deleteCustomer(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Customer not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Customer deleted successfully.",
    });
  } catch (error) {
    console.error("Delete customer error:", error);

    return NextResponse.json(
      { error: "Failed to delete customer." },
      { status: 500 },
    );
  }
}