

import mysql, { type Pool } from "mysql2/promise";

let pool: Pool | undefined;

export function getDatabase(): Pool {
  if (pool) {
    return pool;
  }

  const host = process.env.DB_HOST;
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;

  if (!host || !user || !password || !database) {
    throw new Error(
      "Database configuration missing. Check DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME.",
    );
  }

  pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: "Z",
    dateStrings: true,
  });

  return pool;
}

