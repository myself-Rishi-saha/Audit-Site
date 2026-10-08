import { neon } from "@neondatabase/serverless";

export type Customer = {
  id: string;
  name: string;
  address: string;
  gstNo: string | null;
  contactNumber: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateCustomerInput = {
  name: string;
  address: string;
  gstNo?: string | null;
  contactNumber: string;
};

export type UpdateCustomerInput = {
  name: string;
  address: string;
  gstNo?: string | null;
  contactNumber: string;
};

function getDatabase() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }

  return neon(url);
}

function mapCustomer(row: any): Customer {
  return {
    id: String(row.id),
    name: String(row.name),
    address: String(row.address),

    gstNo:
      row.gst_no === null || row.gst_no === undefined
        ? null
        : String(row.gst_no),

    contactNumber: String(row.contact_number),

    createdAt:
      row.created_at?.toISOString?.() ||
      String(row.created_at),

    updatedAt:
      row.updated_at?.toISOString?.() ||
      String(row.updated_at),
  };
}

export async function readCustomers(): Promise<Customer[]> {
  const sql = getDatabase();

  const rows = await sql`
    SELECT
      id,
      name,
      address,
      gst_no,
      contact_number,
      created_at,
      updated_at
    FROM customers
    ORDER BY created_at DESC
  `;

  return rows.map(mapCustomer);
}

export async function getCustomerById(
  id: string,
): Promise<Customer | null> {
  const sql = getDatabase();

  const rows = await sql`
    SELECT
      id,
      name,
      address,
      gst_no,
      contact_number,
      created_at,
      updated_at
    FROM customers
    WHERE id = ${id}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return null;
  }

  return mapCustomer(rows[0]);
}

export async function generateCustomerId(): Promise<string> {
  const sql = getDatabase();

  const rows = await sql`
    SELECT
      COALESCE(
        MAX(
          CAST(
            NULLIF(
              SUBSTRING(id FROM 5),
              ''
            ) AS INTEGER
          )
        ),
        0
      ) + 1 AS next_number
    FROM customers
    WHERE id ~ '^CUS-[0-9]+$'
  `;

  const nextNumber = Number(
    rows[0]?.next_number || 1,
  );

  return `CUS-${String(nextNumber).padStart(3, "0")}`;
}

export async function createCustomer(
  input: CreateCustomerInput,
): Promise<Customer> {
  const sql = getDatabase();

  const id = await generateCustomerId();

  const rows = await sql`
    INSERT INTO customers (
      id,
      name,
      address,
      gst_no,
      contact_number,
      created_at,
      updated_at
    )
    VALUES (
      ${id},
      ${input.name.trim()},
      ${input.address.trim()},
      ${input.gstNo?.trim() || null},
      ${input.contactNumber.trim()},
      NOW(),
      NOW()
    )
    RETURNING
      id,
      name,
      address,
      gst_no,
      contact_number,
      created_at,
      updated_at
  `;

  return mapCustomer(rows[0]);
}

export async function updateCustomer(
  id: string,
  input: UpdateCustomerInput,
): Promise<Customer | null> {
  const sql = getDatabase();

  const rows = await sql`
    UPDATE customers
    SET
      name = ${input.name.trim()},
      address = ${input.address.trim()},
      gst_no = ${input.gstNo?.trim() || null},
      contact_number = ${input.contactNumber.trim()},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING
      id,
      name,
      address,
      gst_no,
      contact_number,
      created_at,
      updated_at
  `;

  if (rows.length === 0) {
    return null;
  }

  return mapCustomer(rows[0]);
}

export async function deleteCustomer(
  id: string,
): Promise<boolean> {
  const sql = getDatabase();

  const rows = await sql`
    DELETE FROM customers
    WHERE id = ${id}
    RETURNING id
  `;

  return rows.length > 0;
}