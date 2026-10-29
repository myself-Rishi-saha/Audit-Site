// import { neon } from "@neondatabase/serverless";

// export type Customer = {
//   id: string;
//   name: string;
//   address: string;
//   gstNo: string | null;
//   contactNumber: string;
//   createdAt: string;
//   updatedAt: string;
// };

// export type CreateCustomerInput = {
//   name: string;
//   address: string;
//   gstNo?: string | null;
//   contactNumber: string;
// };

// export type UpdateCustomerInput = {
//   name: string;
//   address: string;
//   gstNo?: string | null;
//   contactNumber: string;
// };

// function getDatabase() {
//   const url = process.env.DATABASE_URL;

//   if (!url) {
//     throw new Error("DATABASE_URL is not configured");
//   }

//   return neon(url);
// }

// function mapCustomer(row: any): Customer {
//   return {
//     id: String(row.id),
//     name: String(row.name),
//     address: String(row.address),

//     gstNo:
//       row.gst_no === null || row.gst_no === undefined
//         ? null
//         : String(row.gst_no),

//     contactNumber: String(row.contact_number),

//     createdAt:
//       row.created_at?.toISOString?.() ||
//       String(row.created_at),

//     updatedAt:
//       row.updated_at?.toISOString?.() ||
//       String(row.updated_at),
//   };
// }

// export async function readCustomers(): Promise<Customer[]> {
//   const sql = getDatabase();

//   const rows = await sql`
//     SELECT
//       id,
//       name,
//       address,
//       gst_no,
//       contact_number,
//       created_at,
//       updated_at
//     FROM customers
//     ORDER BY created_at DESC
//   `;

//   return rows.map(mapCustomer);
// }

// export async function getCustomerById(
//   id: string,
// ): Promise<Customer | null> {
//   const sql = getDatabase();

//   const rows = await sql`
//     SELECT
//       id,
//       name,
//       address,
//       gst_no,
//       contact_number,
//       created_at,
//       updated_at
//     FROM customers
//     WHERE id = ${id}
//     LIMIT 1
//   `;

//   if (rows.length === 0) {
//     return null;
//   }

//   return mapCustomer(rows[0]);
// }

// export async function generateCustomerId(): Promise<string> {
//   const sql = getDatabase();

//   const rows = await sql`
//     SELECT
//       COALESCE(
//         MAX(
//           CAST(
//             NULLIF(
//               SUBSTRING(id FROM 5),
//               ''
//             ) AS INTEGER
//           )
//         ),
//         0
//       ) + 1 AS next_number
//     FROM customers
//     WHERE id ~ '^CUS-[0-9]+$'
//   `;

//   const nextNumber = Number(
//     rows[0]?.next_number || 1,
//   );

//   return `CUS-${String(nextNumber).padStart(3, "0")}`;
// }

// export async function createCustomer(
//   input: CreateCustomerInput,
// ): Promise<Customer> {
//   const sql = getDatabase();

//   const id = await generateCustomerId();

//   const rows = await sql`
//     INSERT INTO customers (
//       id,
//       name,
//       address,
//       gst_no,
//       contact_number,
//       created_at,
//       updated_at
//     )
//     VALUES (
//       ${id},
//       ${input.name.trim()},
//       ${input.address.trim()},
//       ${input.gstNo?.trim() || null},
//       ${input.contactNumber.trim()},
//       NOW(),
//       NOW()
//     )
//     RETURNING
//       id,
//       name,
//       address,
//       gst_no,
//       contact_number,
//       created_at,
//       updated_at
//   `;

//   return mapCustomer(rows[0]);
// }

// export async function updateCustomer(
//   id: string,
//   input: UpdateCustomerInput,
// ): Promise<Customer | null> {
//   const sql = getDatabase();

//   const rows = await sql`
//     UPDATE customers
//     SET
//       name = ${input.name.trim()},
//       address = ${input.address.trim()},
//       gst_no = ${input.gstNo?.trim() || null},
//       contact_number = ${input.contactNumber.trim()},
//       updated_at = NOW()
//     WHERE id = ${id}
//     RETURNING
//       id,
//       name,
//       address,
//       gst_no,
//       contact_number,
//       created_at,
//       updated_at
//   `;

//   if (rows.length === 0) {
//     return null;
//   }

//   return mapCustomer(rows[0]);
// }

// export async function deleteCustomer(
//   id: string,
// ): Promise<boolean> {
//   const sql = getDatabase();

//   const rows = await sql`
//     DELETE FROM customers
//     WHERE id = ${id}
//     RETURNING id
//   `;

//   return rows.length > 0;
// }
import type {
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

import { getDatabase } from "@/lib/db";

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

interface CustomerRow extends RowDataPacket {
  id: string;
  name: string;
  address: string;
  gst_no: string | null;
  contact_number: string;
  created_at: string | Date;
  updated_at: string | Date;
}

interface CounterRow extends RowDataPacket {
  next_number: number | string;
}

function toIsoString(value: string | Date): string {
  const date =
    value instanceof Date
      ? value
      : new Date(
          /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(value)
            ? `${value.replace(" ", "T")}Z`
            : value,
        );

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toISOString();
}

function mapCustomer(row: CustomerRow): Customer {
  return {
    id: String(row.id),
    name: String(row.name),
    address: String(row.address),
    gstNo: row.gst_no == null ? null : String(row.gst_no),
    contactNumber: String(row.contact_number),
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

export async function readCustomers(): Promise<Customer[]> {
  const db = getDatabase();

  const [rows] = await db.execute<CustomerRow[]>(
    `SELECT
       id,
       name,
       address,
       gst_no,
       contact_number,
       created_at,
       updated_at
     FROM customers
     ORDER BY created_at DESC`,
  );

  return rows.map(mapCustomer);
}

export async function getCustomerById(
  id: string,
): Promise<Customer | null> {
  const db = getDatabase();

  const [rows] = await db.execute<CustomerRow[]>(
    `SELECT
       id,
       name,
       address,
       gst_no,
       contact_number,
       created_at,
       updated_at
     FROM customers
     WHERE id = ?
     LIMIT 1`,
    [id],
  );

  return rows.length > 0 ? mapCustomer(rows[0]) : null;
}

/**
 * Generates the next CUS-### ID using the existing counter table.
 * Uses a transaction and row lock to avoid duplicate IDs during
 * concurrent customer creation.
 */
export async function generateCustomerId(): Promise<string> {
  const db = getDatabase();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Initialize the customer counter if it doesn't exist.
    await connection.execute(
      `INSERT IGNORE INTO report_id_counters
         (report_type, next_number)
       VALUES ('CUS', 1)`,
    );

    const [rows] = await connection.execute<CounterRow[]>(
      `SELECT next_number
       FROM report_id_counters
       WHERE report_type = 'CUS'
       FOR UPDATE`,
    );

    if (rows.length === 0) {
      throw new Error("Failed to initialize CUS ID counter");
    }

    const nextNumber = Number(rows[0].next_number);

    if (!Number.isSafeInteger(nextNumber) || nextNumber < 1) {
      throw new Error("Invalid CUS ID counter value");
    }

    await connection.execute(
      `UPDATE report_id_counters
       SET next_number = ?
       WHERE report_type = 'CUS'`,
      [nextNumber + 1],
    );

    await connection.commit();

    return `CUS-${String(nextNumber).padStart(3, "0")}`;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function createCustomer(
  input: CreateCustomerInput,
): Promise<Customer> {
  const db = getDatabase();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Allocate the ID and insert the customer in the same transaction.
    await connection.execute(
      `INSERT IGNORE INTO report_id_counters
         (report_type, next_number)
       VALUES ('CUS', 1)`,
    );

    const [counterRows] = await connection.execute<CounterRow[]>(
      `SELECT next_number
       FROM report_id_counters
       WHERE report_type = 'CUS'
       FOR UPDATE`,
    );

    if (counterRows.length === 0) {
      throw new Error("Failed to initialize CUS ID counter");
    }

    const nextNumber = Number(counterRows[0].next_number);

    if (!Number.isSafeInteger(nextNumber) || nextNumber < 1) {
      throw new Error("Invalid CUS ID counter value");
    }

    const id = `CUS-${String(nextNumber).padStart(3, "0")}`;

    await connection.execute(
      `UPDATE report_id_counters
       SET next_number = ?
       WHERE report_type = 'CUS'`,
      [nextNumber + 1],
    );

    const [insertResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO customers (
         id,
         name,
         address,
         gst_no,
         contact_number,
         created_at,
         updated_at
       )
       VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))`,
      [
        id,
        input.name.trim(),
        input.address.trim(),
        input.gstNo?.trim() || null,
        input.contactNumber.trim(),
      ],
    );

    if (insertResult.affectedRows !== 1) {
      throw new Error("Failed to create customer");
    }

    const [rows] = await connection.execute<CustomerRow[]>(
      `SELECT
         id,
         name,
         address,
         gst_no,
         contact_number,
         created_at,
         updated_at
       FROM customers
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    if (rows.length === 0) {
      throw new Error("Customer was created but could not be retrieved");
    }

    await connection.commit();

    return mapCustomer(rows[0]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateCustomer(
  id: string,
  input: UpdateCustomerInput,
): Promise<Customer | null> {
  const db = getDatabase();

  const [result] = await db.execute<ResultSetHeader>(
    `UPDATE customers
     SET
       name = ?,
       address = ?,
       gst_no = ?,
       contact_number = ?,
       updated_at = UTC_TIMESTAMP(3)
     WHERE id = ?`,
    [
      input.name.trim(),
      input.address.trim(),
      input.gstNo?.trim() || null,
      input.contactNumber.trim(),
      id,
    ],
  );

  // A zero affectedRows count may mean the values were unchanged.
  // Query by ID to distinguish that from a missing customer.
  const customer = await getCustomerById(id);

  if (!customer) {
    return null;
  }

  return customer;
}

export async function deleteCustomer(
  id: string,
): Promise<boolean> {
  const db = getDatabase();

  const [result] = await db.execute<ResultSetHeader>(
    `DELETE FROM customers WHERE id = ?`,
    [id],
  );

  return result.affectedRows > 0;
}