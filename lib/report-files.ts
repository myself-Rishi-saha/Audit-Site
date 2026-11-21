
import type { PoolConnection, RowDataPacket } from "mysql2/promise";

const LOCAL_FILE_URL = /^\/api\/files\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

type UploaderRole = "admin" | "auditor";

interface ReportFileRow extends RowDataPacket {
  id: string;
  report_type: string | null;
  report_id: string | null;
  uploaded_by_role: UploaderRole;
  uploaded_by_id: string;
  status: "TEMPORARY" | "ATTACHED";
}

interface AttachEvidenceOptions {
  evidence: unknown;
  reportType: "audit" | "service" | "daily_accent" | "handover";
  reportId: string;
  uploaderRole: UploaderRole;
  uploaderId: string;
  allowNewFiles: boolean;
}

function collectFileIds(value: unknown, ids: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) collectFileIds(item, ids);
    return;
  }

  if (!value || typeof value !== "object") return;

  const item = value as Record<string, unknown>;

  if (typeof item.url === "string") {
    let pathname: string;

    try {
      pathname = new URL(item.url, "http://localhost").pathname;
    } catch {
      throw new Error("Invalid evidence URL.");
    }

    if (pathname.startsWith("/api/files/")) {
      const match = pathname.match(LOCAL_FILE_URL);

      if (!match) {
        throw new Error("Invalid local evidence file URL.");
      }

      ids.add(match[1].toLowerCase());
    }
  }

  for (const child of Object.values(item)) {
    collectFileIds(child, ids);
  }
}

export async function attachEvidenceFiles(
  connection: PoolConnection,
  options: AttachEvidenceOptions,
): Promise<void> {
  const ids = new Set<string>();
  collectFileIds(options.evidence, ids);

  if (ids.size === 0) return;

  const fileIds = [...ids];
  const placeholders = fileIds.map(() => "?").join(", ");

  const [rows] = await connection.execute<ReportFileRow[]>(
    `SELECT
       id,
       report_type,
       report_id,
       uploaded_by_role,
       uploaded_by_id,
       status
     FROM report_files
     WHERE id IN (${placeholders})
     FOR UPDATE`,
    fileIds,
  );

  if (rows.length !== fileIds.length) {
    throw new Error("One or more evidence files do not exist.");
  }

  for (const file of rows) {
    if (file.status === "ATTACHED") {
      if (
        file.report_type !== options.reportType ||
        file.report_id !== options.reportId
      ) {
        throw new Error(
          "An evidence file is already attached to another report.",
        );
      }

      continue;
    }

    if (!options.allowNewFiles) {
      throw new Error(
        "New evidence cannot be added to a completed report.",
      );
    }

    if (
      file.uploaded_by_role !== options.uploaderRole ||
      file.uploaded_by_id !== options.uploaderId
    ) {
      throw new Error(
        "You cannot attach an evidence file uploaded by another user.",
      );
    }

    const [result] = await connection.execute(
      `UPDATE report_files
       SET
         report_type = ?,
         report_id = ?,
         status = 'ATTACHED',
         attached_at = UTC_TIMESTAMP(3),
         expires_at = NULL
       WHERE id = ?
         AND status = 'TEMPORARY'
         AND uploaded_by_role = ?
         AND uploaded_by_id = ?`,
      [
        options.reportType,
        options.reportId,
        file.id,
        options.uploaderRole,
        options.uploaderId,
      ],
    );

    if ((result as { affectedRows: number }).affectedRows !== 1) {
      throw new Error("Unable to attach an evidence file.");
    }
  }
}
