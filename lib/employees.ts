

// import bcrypt from "bcryptjs";
// import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

// import { getDatabase } from "@/lib/db";

// export type Employee = {
//   id: string;
//   name: string;
//   email: string;
//   username: string;
//   isActive: boolean;
//   role: "auditor";
//   canAccessAudit: boolean;
//   canAccessServiceReport: boolean;
//   canAccessDailyAccentReport: boolean;
//   createdAt: string;
//   updatedAt: string;
// };

// export type CreateEmployeeInput = {
//   name: string;
//   email: string;
//   username: string;
//   password: string;
//   isActive?: boolean;
//   canAccessAudit: boolean;
//   canAccessServiceReport: boolean;
//   canAccessDailyAccentReport: boolean;
// };

// type EmployeeRow = RowDataPacket & {
//   id: string;
//   name: string;
//   email: string;
//   username: string;
//   is_active: number | boolean | string;
//   role: string;
//   can_access_audit: number | boolean | string;
//   can_access_service_report: number | boolean | string;
//   can_access_daily_accent_report: number | boolean | string;
//   created_at: string | Date;
//   updated_at: string | Date;
// };

// function toBoolean(value: number | boolean | string): boolean {
//   return value === true || value === 1 || value === "1";
// }

// function toIsoString(value: string | Date): string {
//   if (value instanceof Date) {
//     return value.toISOString();
//   }

//   // MySQL DATETIME strings do not include a timezone.
//   const normalized =
//     /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(value)
//       ? `${value.replace(" ", "T")}Z`
//       : value;

//   const date = new Date(normalized);

//   if (Number.isNaN(date.getTime())) {
//     throw new Error("Invalid employee timestamp");
//   }

//   return date.toISOString();
// }

// function mapEmployee(row: EmployeeRow): Employee {
//   return {
//     id: String(row.id),
//     name: String(row.name),
//     email: String(row.email),
//     username: String(row.username),
//     isActive: toBoolean(row.is_active),
//     role: "auditor",
//     canAccessAudit: toBoolean(row.can_access_audit),
//     canAccessServiceReport: toBoolean(
//       row.can_access_service_report,
//     ),
//     canAccessDailyAccentReport: toBoolean(
//       row.can_access_daily_accent_report,
//     ),
//     createdAt: toIsoString(row.created_at),
//     updatedAt: toIsoString(row.updated_at),
//   };
// }

// /**
//  * Returns employees and report permissions.
//  * Password hashes are never selected or returned.
//  */
// export async function readEmployees(): Promise<Employee[]> {
//   const db = getDatabase();

//   const [rows] = await db.query<EmployeeRow[]>(`
//     SELECT
//       id,
//       name,
//       email,
//       username,
//       is_active,
//       role,
//       can_access_audit,
//       can_access_service_report,
//       can_access_daily_accent_report,
//       created_at,
//       updated_at
//     FROM employees
//     ORDER BY created_at DESC
//   `);

//   return rows.map(mapEmployee);
// }

// /**
//  * Generate an employee ID using the shared counter table.
//  * The counter row is locked to prevent duplicate IDs during
//  * concurrent employee creation.
//  */

// async function generateEmployeeId(): Promise<string> {
//   const db = getDatabase();
//   const connection = await db.getConnection();

//   try {
//     await connection.beginTransaction();

//     // Create the EMP counter if it doesn't exist.
//     await connection.execute(
//       `INSERT IGNORE INTO report_id_counters
//          (report_type, next_number)
//        VALUES ('EMP', 1)`,
//     );

//     // Lock the EMP counter so concurrent requests cannot
//     // allocate the same employee ID.
//     const [rows] = await connection.execute<
//       (RowDataPacket & { next_number: number })[]
//     >(
//       `SELECT next_number
//        FROM report_id_counters
//        WHERE report_type = 'EMP'
//        FOR UPDATE`,
//     );

//     if (rows.length === 0) {
//       throw new Error("Failed to initialize EMP ID counter");
//     }

//     const nextNumber = Number(rows[0].next_number);

//     await connection.execute(
//       `UPDATE report_id_counters
//        SET next_number = ?
//        WHERE report_type = 'EMP'`,
//       [nextNumber + 1],
//     );

//     await connection.commit();

//     return `EMP${String(nextNumber).padStart(3, "0")}`;
//   } catch (error) {
//     await connection.rollback();
//     throw error;
//   } finally {
//     connection.release();
//   }
// }


// /**
//  * Create an employee with selected report permissions.
//  * Only a bcrypt password hash is stored.
//  */
// export async function createEmployee(
//   input: CreateEmployeeInput,
// ): Promise<Employee> {
//   if (
//     !input.canAccessAudit &&
//     !input.canAccessServiceReport &&
//     !input.canAccessDailyAccentReport
//   ) {
//     throw new Error("At least one report permission is required");
//   }

//   const db = getDatabase();

//   const passwordHash = await bcrypt.hash(input.password, 10);
//   const id = await generateEmployeeId();
//   const isActive = input.isActive ?? true;

//   await db.execute(
//     `INSERT INTO employees (
//       id,
//       name,
//       email,
//       username,
//       password_hash,
//       is_active,
//       role,
//       can_access_audit,
//       can_access_service_report,
//       can_access_daily_accent_report,
//       created_at,
//       updated_at
//     )
//     VALUES (?, ?, ?, ?, ?, ?, 'auditor', ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
//     [
//       id,
//       input.name,
//       input.email,
//       input.username,
//       passwordHash,
//       isActive ? 1 : 0,
//       input.canAccessAudit ? 1 : 0,
//       input.canAccessServiceReport ? 1 : 0,
//       input.canAccessDailyAccentReport ? 1 : 0,
//     ],
//   );

//   const [rows] = await db.execute<EmployeeRow[]>(
//     `SELECT
//       id,
//       name,
//       email,
//       username,
//       is_active,
//       role,
//       can_access_audit,
//       can_access_service_report,
//       can_access_daily_accent_report,
//       created_at,
//       updated_at
//     FROM employees
//     WHERE id = ?
//     LIMIT 1`,
//     [id],
//   );

//   if (rows.length === 0) {
//     throw new Error("Employee was created but could not be retrieved");
//   }

//   return mapEmployee(rows[0]);
// }

// /**
//  * Check whether a username or email already exists.
//  */
// export async function findEmployeeByUsernameOrEmail(
//   username: string,
//   email: string,
// ): Promise<{ id: string; username: string; email: string } | null> {
//   const db = getDatabase();

//   const [rows] = await db.execute<
//     (RowDataPacket & {
//       id: string;
//       username: string;
//       email: string;
//     })[]
//   >(
//     `SELECT id, username, email
//      FROM employees
//      WHERE LOWER(username) = LOWER(?)
//         OR LOWER(email) = LOWER(?)
//      LIMIT 1`,
//     [username, email],
//   );

//   return rows[0] ?? null;
// }

import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2/promise";

import { getDatabase } from "@/lib/db";

export type Employee = {
  id: string;
  name: string;
  email: string;
  username: string;
  isActive: boolean;
  role: "auditor";
  canAccessAudit: boolean;
  canAccessServiceReport: boolean;
  canAccessDailyAccentReport: boolean;
  canAccessHandoverCertificate: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateEmployeeInput = {
  name: string;
  email: string;
  username: string;
  password: string;
  isActive?: boolean;
  canAccessAudit: boolean;
  canAccessServiceReport: boolean;
  canAccessDailyAccentReport: boolean;
  canAccessHandoverCertificate: boolean;
};

type EmployeeRow = RowDataPacket & {
  id: string;
  name: string;
  email: string;
  username: string;
  is_active: number | boolean | string;
  role: string;
  can_access_audit: number | boolean | string;
  can_access_service_report: number | boolean | string;
  can_access_daily_accent_report: number | boolean | string;
  can_access_handover_certificate: number | boolean | string;
  created_at: string | Date;
  updated_at: string | Date;
};

function toBoolean(value: number | boolean | string): boolean {
  return value === true || value === 1 || value === "1";
}

function toIsoString(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  // MySQL DATETIME strings do not include a timezone.
  const normalized =
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(value)
      ? `${value.replace(" ", "T")}Z`
      : value;

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid employee timestamp");
  }

  return date.toISOString();
}

function mapEmployee(row: EmployeeRow): Employee {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    username: String(row.username),
    isActive: toBoolean(row.is_active),
    role: "auditor",
    canAccessAudit: toBoolean(row.can_access_audit),
    canAccessServiceReport: toBoolean(
      row.can_access_service_report,
    ),
    canAccessDailyAccentReport: toBoolean(
      row.can_access_daily_accent_report,
    ),
    canAccessHandoverCertificate: toBoolean(
      row.can_access_handover_certificate,
    ),
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

/**
 * Returns employees and report permissions.
 * Password hashes are never selected or returned.
 */
export async function readEmployees(): Promise<Employee[]> {
  const db = getDatabase();

  const [rows] = await db.query<EmployeeRow[]>(`
    SELECT
      id,
      name,
      email,
      username,
      is_active,
      role,
      can_access_audit,
      can_access_service_report,
      can_access_daily_accent_report,
      can_access_handover_certificate,
      created_at,
      updated_at
    FROM employees
    ORDER BY created_at DESC
  `);

  return rows.map(mapEmployee);
}

/**
 * Generate an employee ID using the shared counter table.
 * The counter row is locked to prevent duplicate IDs during
 * concurrent employee creation.
 */
async function generateEmployeeId(): Promise<string> {
  const db = getDatabase();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute(
      `INSERT IGNORE INTO report_id_counters
         (report_type, next_number)
       VALUES ('EMP', 1)`,
    );

    const [rows] = await connection.execute<
      (RowDataPacket & { next_number: number })[]
    >(
      `SELECT next_number
       FROM report_id_counters
       WHERE report_type = 'EMP'
       FOR UPDATE`,
    );

    if (rows.length === 0) {
      throw new Error("Failed to initialize EMP ID counter");
    }

    const nextNumber = Number(rows[0].next_number);

    await connection.execute(
      `UPDATE report_id_counters
       SET next_number = ?
       WHERE report_type = 'EMP'`,
      [nextNumber + 1],
    );

    await connection.commit();

    return `EMP${String(nextNumber).padStart(3, "0")}`;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Create an employee with selected report permissions.
 * Only a bcrypt password hash is stored.
 */
export async function createEmployee(
  input: CreateEmployeeInput,
): Promise<Employee> {
  if (
    !input.canAccessAudit &&
    !input.canAccessServiceReport &&
    !input.canAccessDailyAccentReport &&
    !input.canAccessHandoverCertificate
  ) {
    throw new Error("At least one report permission is required");
  }

  const db = getDatabase();

  const passwordHash = await bcrypt.hash(input.password, 10);
  const id = await generateEmployeeId();
  const isActive = input.isActive ?? true;

  await db.execute(
    `INSERT INTO employees (
      id,
      name,
      email,
      username,
      password_hash,
      is_active,
      role,
      can_access_audit,
      can_access_service_report,
      can_access_daily_accent_report,
      can_access_handover_certificate,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, 'auditor', ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
    [
      id,
      input.name,
      input.email,
      input.username,
      passwordHash,
      isActive ? 1 : 0,
      input.canAccessAudit ? 1 : 0,
      input.canAccessServiceReport ? 1 : 0,
      input.canAccessDailyAccentReport ? 1 : 0,
      input.canAccessHandoverCertificate ? 1 : 0,
    ],
  );

  const [rows] = await db.execute<EmployeeRow[]>(
    `SELECT
      id,
      name,
      email,
      username,
      is_active,
      role,
      can_access_audit,
      can_access_service_report,
      can_access_daily_accent_report,
      can_access_handover_certificate,
      created_at,
      updated_at
    FROM employees
    WHERE id = ?
    LIMIT 1`,
    [id],
  );

  if (rows.length === 0) {
    throw new Error("Employee was created but could not be retrieved");
  }

  return mapEmployee(rows[0]);
}

/**
 * Check whether a username or email already exists.
 */
export async function findEmployeeByUsernameOrEmail(
  username: string,
  email: string,
): Promise<{ id: string; username: string; email: string } | null> {
  const db = getDatabase();

  const [rows] = await db.execute<
    (RowDataPacket & {
      id: string;
      username: string;
      email: string;
    })[]
  >(
    `SELECT id, username, email
     FROM employees
     WHERE LOWER(username) = LOWER(?)
        OR LOWER(email) = LOWER(?)
     LIMIT 1`,
    [username, email],
  );

  return rows[0] ?? null;
}
