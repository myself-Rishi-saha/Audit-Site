import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ReportField = {
  id?: string;
  key?: string;
  label?: string;
  title?: string;
  type?: string;
};

type ReportSection = {
  title?: string;
  name?: string;
  fields?: ReportField[];
};

type ReportData = {
  id?: string;
  employeeName?: string;
  employee_name?: string;
  employeeId?: string;
  employee_id?: string;
  customerName?: string;
  customer_name?: string;
  customerAddress?: string;
  customer_address?: string;
  customerId?: string;
  customer_id?: string;
  customerGstNo?: string | null;
  customer_gst_no?: string | null;
  customerContactNumber?: string | null;
  customer_contact_number?: string | null;
  status?: string;

  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  submittedAt?: string;
  submitted_at?: string;

  templateSnapshot?: {
    title?: string;
    name?: string;
    sections?: ReportSection[];
  };

  template_snapshot?: {
    title?: string;
    name?: string;
    sections?: ReportSection[];
  };

  formData?: Record<string, unknown>;
  form_data?: Record<string, unknown>;

  evidence?: unknown;
  signatures?: unknown;
};

type EvidenceLink = {
  label: string;
  url: string;
  fileName?: string;
  capturedAt?: string;
  kind: "image" | "video" | "file";
};

type SignatureEntry = {
  label: string;
  image: string;
  signedAt: string;
};

const PRIMARY: [number, number, number] = [45, 68, 184]; // #2D44B8
const TEAL: [number, number, number] = [0, 102, 130];
const TIME_ZONE = "Asia/Kolkata";

function getValue(...values: (string | undefined)[]): string {
  return values.find((value) => value !== undefined && value !== "") ?? "—";
}

function formatDate(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  let date: Date;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value === "number") {
    date = new Date(value);
  } else if (typeof value === "string") {
    const input = value.trim();

    // Preserve date-only values as calendar dates.
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      const [year, month, day] = input.split("-");
      return `${day}/${month}/${year}`;
    }

    // SQL DATETIME without timezone is treated as Kolkata time.
    if (
      /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(input) &&
      !/(Z|[+-]\d{2}:?\d{2})$/i.test(input)
    ) {
      date = new Date(input.replace(" ", "T") + "+05:30");
    } else {
      date = new Date(input);
    }
  } else {
    return String(value);
  }

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return (
    new Intl.DateTimeFormat("en-IN", {
      timeZone: TIME_ZONE,
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date) + " IST"
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (value instanceof Date) {
    return formatDate(value);
  }

  if (Array.isArray(value)) {
    return value.map(formatValue).join(", ");
  }

  if (typeof value === "object") {
    const object = value as Record<string, unknown>;

    if (typeof object.url === "string") {
      return object.fileName
        ? String(object.fileName)
        : "Uploaded evidence (see evidence links)";
    }

    return Object.entries(object)
      .filter(
        ([key]) =>
          !/signature|signed.?at/i.test(key),
      )
      .map(([key, item]) => `${key}: ${formatValue(item)}`)
      .join("\n");
  }

  return String(value);
}

// ========================================
// LOAD COMPANY LOGO
// ========================================

async function loadLogo(): Promise<string | null> {
  try {
    const response = await fetch(
      "/Deep%20Teal%20System%20%26%20Solution%20Logo.png",
    );

    if (!response.ok) return null;

    const blob = await response.blob();

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;

      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Could not load company logo:", error);
    return null;
  }
}

// ========================================
// LOAD QR CODE
// ========================================

async function loadQrCode(): Promise<string | null> {
  try {
    const response = await fetch("/S%26S%20QR.png");

    if (!response.ok) {
      console.error("Could not load QR code:", response.status);
      return null;
    }

    const blob = await response.blob();

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;

      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Failed to load QR code:", error);
    return null;
  }
}

// ========================================
// COLLECT EVIDENCE
// ========================================

function collectEvidence(value: unknown): EvidenceLink[] {
  const found: EvidenceLink[] = [];
  const seen = new Set<string>();

  function visit(item: unknown, key = ""): void {
    if (Array.isArray(item)) {
      item.forEach((child, index) =>
        visit(child, key || `Evidence ${index + 1}`),
      );
      return;
    }

    if (!item || typeof item !== "object") return;

    const obj = item as Record<string, unknown>;

    const rawUrl = obj.url ?? obj.secure_url;
    const url = typeof rawUrl === "string" ? rawUrl.trim() : "";

    if (/^https?:\/\//i.test(url)) {
      const fileName =
        typeof obj.fileName === "string"
          ? obj.fileName
          : typeof obj.filename === "string"
            ? obj.filename
            : typeof obj.original_filename === "string"
              ? obj.original_filename
              : undefined;

      const explicitType = String(
        obj.type ??
          obj.resource_type ??
          obj.mimeType ??
          obj.mime_type ??
          "",
      ).toLowerCase();

      const extension = `${fileName ?? ""} ${url.split("?")[0]}`;

      const kind: EvidenceLink["kind"] =
        explicitType.includes("video") ||
        /\.(mp4|mov|webm|m4v|avi)$/i.test(extension)
          ? "video"
          : explicitType.includes("image") ||
              /\.(jpg|jpeg|png|gif|webp|heic|avif)$/i.test(extension)
            ? "image"
            : "file";

      if (!seen.has(url)) {
        seen.add(url);

        found.push({
          label:
            typeof obj.label === "string"
              ? obj.label
              : typeof obj.fieldLabel === "string"
                ? obj.fieldLabel
                : key || "Evidence",
          url,
          fileName,
          capturedAt:
            typeof obj.capturedAt === "string"
              ? obj.capturedAt
              : typeof obj.captured_at === "string"
                ? obj.captured_at
                : undefined,
          kind,
        });
      }
    }

    for (const [childKey, childValue] of Object.entries(obj)) {
      if (
        [
          "url",
          "secure_url",
          "fileName",
          "filename",
          "original_filename",
          "type",
          "resource_type",
          "mimeType",
          "mime_type",
          "label",
          "fieldLabel",
          "capturedAt",
          "captured_at",
        ].includes(childKey)
      ) {
        continue;
      }

      visit(childValue, childKey);
    }
  }

  visit(value);
  return found;
}

function getFieldEvidence(
  field: ReportField,
  formData: Record<string, unknown>,
  evidenceData: unknown,
): EvidenceLink[] {
  const key = field.id ?? field.key ?? "";

  const fieldValue = formData[key];
  const fromField = collectEvidence(fieldValue);

  if (fromField.length > 0) {
    return fromField;
  }

  if (
    evidenceData &&
    typeof evidenceData === "object" &&
    !Array.isArray(evidenceData)
  ) {
    const grouped = evidenceData as Record<string, unknown>;
    const matchingEvidence = grouped[key];

    const found = collectEvidence(matchingEvidence);

    if (found.length > 0) {
      return found;
    }
  }

  return [];
}

// ========================================
// SIGNATURE EXTRACTION
// ========================================

function getSignatureEntries(value: unknown): SignatureEntry[] {
  const results: SignatureEntry[] = [];
  const seen = new Set<string>();

  function visit(item: unknown, key = "Signature"): void {
    if (!item) return;

    if (Array.isArray(item)) {
      item.forEach((child, index) => {
        visit(child, `${key} ${index + 1}`);
      });
      return;
    }

    if (typeof item === "string") {
      const image = item.trim();

      if (
        image.startsWith("data:image/") ||
        /^https?:\/\//i.test(image)
      ) {
        const identity = `${key}|${image}`;

        if (!seen.has(identity)) {
          seen.add(identity);

          results.push({
            label: key,
            image,
            signedAt: "",
          });
        }
      }

      return;
    }

    if (typeof item !== "object") return;

    const obj = item as Record<string, unknown>;

    const isSignatureObject =
      /signature/i.test(key) ||
      Object.prototype.hasOwnProperty.call(obj, "signedAt") ||
      Object.prototype.hasOwnProperty.call(obj, "signed_at");

    const rawImage =
      obj.signature ??
      obj.dataUrl ??
      obj.dataURL ??
      obj.image ??
      obj.url ??
      obj.secure_url ??
      obj.value;

    const image =
      typeof rawImage === "string" ? rawImage.trim() : "";

    const signedAt =
      typeof obj.signedAt === "string"
        ? obj.signedAt
        : typeof obj.signed_at === "string"
          ? obj.signed_at
          : "";

    const label = String(
      obj.label ??
        obj.fieldLabel ??
        obj.name ??
        key,
    );

    if (isSignatureObject) {
      const identity = `${label}|${image}|${signedAt}`;

      if (!seen.has(identity)) {
        seen.add(identity);

        results.push({
          label,
          image,
          signedAt,
        });
      }
    } else if (
      image &&
      (image.startsWith("data:image/") ||
        /^https?:\/\//i.test(image))
    ) {
      const identity = `${label}|${image}`;

      if (!seen.has(identity)) {
        seen.add(identity);

        results.push({
          label,
          image,
          signedAt,
        });
      }
    }

    // Traverse nested objects without treating signedAt as an image.
    for (const [childKey, childValue] of Object.entries(obj)) {
      if (
        [
          "signature",
          "dataUrl",
          "dataURL",
          "image",
          "url",
          "secure_url",
          "value",
          "label",
          "fieldLabel",
          "name",
          "signedAt",
          "signed_at",
        ].includes(childKey)
      ) {
        continue;
      }

      visit(childValue, childKey);
    }
  }

  visit(value);

  return results;
}

// ========================================
// LOAD SIGNATURE IMAGE
// ========================================

async function loadSignatureImage(
  source: string,
): Promise<string | null> {
  try {
    if (source.startsWith("data:image/")) {
      return source;
    }

    if (!/^https?:\/\//i.test(source)) {
      return null;
    }

    const response = await fetch(source);

    if (!response.ok) return null;

    const blob = await response.blob();

    if (!blob.type.startsWith("image/")) return null;

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;

      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Could not load signature image:", error);
    return null;
  }
}

// ========================================
// FORMAT FIELD RESPONSE
// ========================================

function formatFieldResponse(
  field: ReportField,
  formData: Record<string, unknown>,
  evidenceData: unknown,
): string {
  const key = field.id ?? field.key ?? "";
  const value = formData[key];

  const evidence = getFieldEvidence(field, formData, evidenceData);

  if (evidence.length > 0) {
    const normalValue =
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !("url" in value)
        ? formatValue(value)
        : "—";

    return normalValue;
  }

  return formatValue(value);
}

// ========================================
// FOOTER
// ========================================

function addFooter(pdf: jsPDF): void {
  const pageCount = pdf.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;

  for (let page = 1; page <= pageCount; page++) {
    pdf.setPage(page);

    pdf.setDrawColor(...PRIMARY);
    pdf.line(
      margin,
      pageHeight - 13,
      pageWidth - margin,
      pageHeight - 13,
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(90, 90, 90);

    // Retained from your existing footer.
    pdf.text("www.systemsandsolutions.com", margin, pageHeight - 7);

    pdf.text(
      `Page ${page} of ${pageCount}`,
      pageWidth - margin,
      pageHeight - 7,
      { align: "right" },
    );
  }
}

// ========================================
// MAIN PDF GENERATOR
// ========================================

export async function generateReportPdf(
  report: ReportData,
  reportType: string,
): Promise<void> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;

  const logo = await loadLogo();
  const qrCode = await loadQrCode();

  const template = report.templateSnapshot ?? report.template_snapshot;
  const formData = report.formData ?? report.form_data ?? {};

  // ========================================
  // COMPANY HEADER
  // ========================================

  const headerHeight = 49;
  const qrSize = 25;
  const qrX = pageWidth - margin - qrSize;

  pdf.setFillColor(...PRIMARY);
  pdf.rect(0, 0, pageWidth, headerHeight, "F");

  // Company logo on the left.
  if (logo) {
    pdf.addImage(
      logo,
      "PNG",
      margin,
      7,
      23,
      23,
      undefined,
      "FAST",
    );
  }

  // Company information in the middle.
  const textX = logo ? 43 : margin;

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);

  pdf.text("M/S SYSTEM & SOLUTION", textX, 10);

  // Address.
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.8);

  pdf.text(
    "GROUND FLOOR, 373, APSARA APARTMENT, PURBACHAL KALITALA ROAD,",
    textX,
    16,
  );

  pdf.text(
    "KOLKATA, WEST BENGAL, INDIA - 700078",
    textX,
    20,
  );

  // GSTIN and PAN.
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);

  pdf.text("GSTIN:", textX, 25);

  pdf.setFont("helvetica", "normal");
  pdf.text("19GIAPS5232Q1ZI", textX + 12, 25);

  pdf.setFont("helvetica", "bold");
  pdf.text("PAN:", textX + 58, 25);

  pdf.setFont("helvetica", "normal");
  pdf.text("GIAPS5232Q", textX + 68, 25);

  // Email.
  pdf.setFont("helvetica", "bold");
  pdf.text("Email:", textX, 30);

  pdf.setFont("helvetica", "normal");
  pdf.text("info@systemandsolution.com", textX + 12, 30);

  // Phone.
  pdf.setFont("helvetica", "bold");
  pdf.text("Phone:", textX, 35);

  pdf.setFont("helvetica", "normal");
  pdf.text("+91 33 4520 2194", textX + 12, 35);

  // MSME registration.
  pdf.setFont("helvetica", "bold");
  pdf.text("MSME Reg No:", textX, 40);

  pdf.setFont("helvetica", "normal");
  pdf.text("WB-18-0026029", textX + 25, 40);

  // QR code on the right.
  if (qrCode) {
    pdf.setFillColor(255, 255, 255);

    pdf.roundedRect(
      qrX - 2,
      8,
      qrSize + 4,
      qrSize + 4,
      1,
      1,
      "F",
    );

    pdf.addImage(
      qrCode,
      "PNG",
      qrX,
      10,
      qrSize,
      qrSize,
      undefined,
      "FAST",
    );
  }

  // ========================================
  // REPORT TITLE
  // ========================================

  let y = 57;

  pdf.setTextColor(...PRIMARY);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);

  pdf.text(reportType.toUpperCase(), margin, y);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(90, 90, 90);

  pdf.text(
    `Generated: ${formatDate(new Date())}`,
    pageWidth - margin,
    y,
    { align: "right" },
  );

  y += 8;

  // ========================================
  // REPORT INFORMATION
  // ========================================

  autoTable(pdf, {
    startY: y,
    theme: "grid",
    margin: { left: margin, right: margin },

    head: [["Report information", "Details"]],

    body: [
      ["Report ID", getValue(report.id)],

      [
        "Customer",
        getValue(report.customerName, report.customer_name),
      ],

      [
        "Customer address",
        getValue(report.customerAddress, report.customer_address),
      ],

      [
        "Customer GST No.",
        getValue(
          report.customerGstNo ?? undefined,
          report.customer_gst_no ?? undefined,
        ),
      ],

      [
        "Customer contact number",
        getValue(
          report.customerContactNumber ?? undefined,
          report.customer_contact_number ?? undefined,
        ),
      ],

      [
        "Employee / Engineer",
        getValue(report.employeeName, report.employee_name),
      ],

      [
        "Employee ID",
        getValue(report.employeeId, report.employee_id),
      ],

      ["Status", getValue(report.status)],

      [
        "Created date",
        formatDate(report.createdAt ?? report.created_at),
      ],

      [
        "Submitted date",
        formatDate(report.submittedAt ?? report.submitted_at),
      ],
    ],

    headStyles: {
      fillColor: PRIMARY,
      textColor: [255, 255, 255],
    },

    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      overflow: "linebreak",
      valign: "top",
    },

    columnStyles: {
      0: { cellWidth: 48 },
      1: { cellWidth: "auto" },
    },
  });

  y =
    (
      pdf as jsPDF & {
        lastAutoTable: { finalY: number };
      }
    ).lastAutoTable.finalY + 8;

  // ========================================
  // DYNAMIC TEMPLATE SECTIONS
  // ========================================

  for (const section of template?.sections ?? []) {
    const fields = section.fields ?? [];

    // Hide signature fields from normal report tables.
    const visibleFields = fields.filter((field) => {
      const key = field.id ?? field.key ?? "";
      const label = field.label ?? field.title ?? "";

      return (
        !/signature|signed.?at/i.test(key) &&
        !/signature|signed.?at/i.test(label)
      );
    });

    if (visibleFields.length === 0) continue;

    if (y > pageHeight - 35) {
      pdf.addPage();
      y = 18;
    }

    pdf.setTextColor(...PRIMARY);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10.5);

    pdf.text(
      section.title ?? section.name ?? "Report details",
      margin,
      y,
    );

    y += 3;

    const body: string[][] = [];

    const mediaRows: Array<{
      rowIndex: number;
      links: EvidenceLink[];
    }> = [];

    for (const field of visibleFields) {
      const key = field.id ?? field.key ?? "";

      const label =
        (field.label ?? field.title ?? key) || "Field";

      const links = getFieldEvidence(
        field,
        formData,
        report.evidence,
      );

      const response = formatFieldResponse(
        field,
        formData,
        report.evidence,
      );

      const rowIndex = body.length;

      body.push([label, response]);

      if (links.length > 0) {
        mediaRows.push({ rowIndex, links });
      }
    }

    autoTable(pdf, {
      startY: y,
      theme: "striped",
      margin: { left: margin, right: margin },

      head: [["Field", "Response / Evidence"]],

      body,

      headStyles: {
        fillColor: PRIMARY,
        textColor: [255, 255, 255],
      },

      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
        valign: "top",
      },

      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: "auto" },
      },

      didDrawCell: (data) => {
        if (data.section !== "body" || data.column.index !== 1) {
          return;
        }

        const media = mediaRows.find(
          (item) => item.rowIndex === data.row.index,
        );

        if (!media) return;

        const links = media.links;
        const lineHeight = 4;

        let linkY = data.cell.y + data.cell.height - 3;

        // Draw clickable media links in the corresponding table cell.
        for (let i = links.length - 1; i >= 0; i--) {
          const item = links[i];

          const action =
            item.kind === "video"
              ? "Watch video"
              : item.kind === "image"
                ? "View image"
                : "Open file";

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(8);
          pdf.setTextColor(...TEAL);

          const linkText =
            `${action}: ${item.fileName ?? item.label}`;

          const maxWidth = data.cell.width - 6;
          const lines = pdf.splitTextToSize(
            linkText,
            maxWidth,
          );

          for (let j = lines.length - 1; j >= 0; j--) {
            pdf.text(
              lines[j],
              data.cell.x + 3,
              linkY,
              { maxWidth },
            );

            const textWidth = Math.min(
              pdf.getTextWidth(lines[j]),
              maxWidth,
            );

            pdf.link(
              data.cell.x + 3,
              linkY - 3,
              textWidth,
              lineHeight,
              { url: item.url },
            );

            linkY -= lineHeight;
          }
        }
      },
    });

    y =
      (
        pdf as jsPDF & {
          lastAutoTable: { finalY: number };
        }
      ).lastAutoTable.finalY + 8;
  }

  // ========================================
  // SIGNATURES AND SIGNING TIMESTAMPS
  // ========================================

const signatureEntries = [
  ...getSignatureEntries(report.signatures),

  ...getSignatureEntries(
    Object.fromEntries(
      Object.entries(formData).filter(([key]) =>
        /signature|signed/i.test(key),
      ),
    ),
  ),
].filter((entry) => {
  // Keep only entries with an actual signature image.
  return (
    typeof entry.image === "string" &&
    entry.image.trim().length > 0
  );
});

  // Remove duplicate signature entries.
  const uniqueSignatures = Array.from(
    new Map(
      signatureEntries.map((entry) => [
        `${entry.label}|${entry.image}|${entry.signedAt}`,
        entry,
      ]),
    ).values(),
  );

  const loadedSignatures: Array<{
    label: string;
    image: string | null;
    signedAt: string;
  }> = [];

  // Load available images, but retain entries without images.
  for (const entry of uniqueSignatures) {
    const image = entry.image
      ? await loadSignatureImage(entry.image)
      : null;

    loadedSignatures.push({
      label: entry.label,
      image,
      signedAt: entry.signedAt,
    });
  }

  if (loadedSignatures.length > 0) {
    if (y > pageHeight - 65) {
      pdf.addPage();
      y = 20;
    }

    pdf.setTextColor(...PRIMARY);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10.5);

    pdf.text("Signatures", margin, y);

    y += 7;

    const boxWidth = 80;
    const boxHeight = 25;
    const gap = 10;
    const cardHeight = 42;

    let x = margin;

    for (const entry of loadedSignatures) {
      // Start a new row if the next signature does not fit.
      if (x + boxWidth > pageWidth - margin) {
        x = margin;
        y += cardHeight;

      }

      // Start a new page if necessary.
      if (y + cardHeight > pageHeight - 20) {
        pdf.addPage();
        y = 20;
        x = margin;
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(60, 60, 60);

      const label = entry.label
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

      pdf.text(label, x, y);

      const imageY = y + 3;

      pdf.setDrawColor(190, 200, 205);
      pdf.rect(x, imageY, boxWidth, boxHeight);

      if (entry.image) {
        try {
          const imageFormat = entry.image.startsWith(
            "data:image/png",
          )
            ? "PNG"
            : entry.image.startsWith("data:image/webp")
              ? "WEBP"
              : "JPEG";

          pdf.addImage(
            entry.image,
            imageFormat,
            x + 2,
            imageY + 2,
            boxWidth - 4,
            boxHeight - 4,
            undefined,
            "FAST",
          );
        } catch (error) {
          console.error(
            `Could not add signature "${entry.label}" to PDF:`,
            error,
          );

          pdf.setFont("helvetica", "italic");
          pdf.setFontSize(8);
          pdf.setTextColor(130, 130, 130);

          pdf.text(
            "Signature image unavailable",
            x + 3,
            imageY + boxHeight / 2,
          );
        }
      } else {
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(8);
        pdf.setTextColor(130, 130, 130);

        pdf.text(
          "Signature image unavailable",
          x + 3,
          imageY + boxHeight / 2,
        );
      }

      // Signing timestamp.
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(80, 80, 80);

      const signedTime = entry.signedAt
        ? `Signed on: ${formatDate(entry.signedAt)}`
        : "Signing time unavailable";

      pdf.text(signedTime, x, imageY + boxHeight + 5);

      x += boxWidth + gap;
    }

    y += cardHeight;
  }

  // ========================================
  // FOOTER ON EVERY PAGE
  // ========================================

  addFooter(pdf);

  // ========================================
  // SAVE PDF
  // ========================================

  const safeId = (report.id ?? "report").replace(
    /[^a-zA-Z0-9_-]/g,
    "_",
  );

  pdf.save(`${safeId}.pdf`);
}

// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// type ReportField = {
//   id?: string;
//   key?: string;
//   label?: string;
//   title?: string;
//   type?: string;
// };

// type ReportSection = {
//   title?: string;
//   name?: string;
//   fields?: ReportField[];
// };

// type ReportData = {
//   id?: string;
//   employeeName?: string;
//   employee_name?: string;
//   employeeId?: string;
//   employee_id?: string;
//   customerName?: string;
//   customer_name?: string;
//   customerAddress?: string;
//   customer_address?: string;
//   customerId?: string;
//   customer_id?: string;
//   customerGstNo?: string | null;
//   customer_gst_no?: string | null;
//   customerContactNumber?: string | null;
//   customer_contact_number?: string | null;
//   status?: string;

//   createdAt?: string;
//   created_at?: string;
//   updatedAt?: string;
//   updated_at?: string;
//   submittedAt?: string;
//   submitted_at?: string;

//   templateSnapshot?: {
//     title?: string;
//     name?: string;
//     sections?: ReportSection[];
//   };

//   template_snapshot?: {
//     title?: string;
//     name?: string;
//     sections?: ReportSection[];
//   };

//   formData?: Record<string, unknown>;
//   form_data?: Record<string, unknown>;

//   evidence?: unknown;
//   signatures?: unknown;
// };

// type EvidenceLink = {
//   label: string;
//   url: string;
//   fileName?: string;
//   capturedAt?: string;
//   kind: "image" | "video" | "file";
// };

// type SignatureEntry = {
//   label: string;
//   image: string;
//   signedAt: string;
// };

// const PRIMARY: [number, number, number] = [45, 68, 184]; // #2D44B8
// const TEAL: [number, number, number] = [0, 102, 130];
// const TIME_ZONE = "Asia/Kolkata";

// function getValue(...values: (string | undefined)[]): string {
//   return values.find((value) => value !== undefined && value !== "") ?? "—";
// }

// function formatDate(value: unknown): string {
//   if (value === null || value === undefined || value === "") {
//     return "—";
//   }

//   let date: Date;

//   if (value instanceof Date) {
//     date = value;
//   } else if (typeof value === "number") {
//     date = new Date(value);
//   } else if (typeof value === "string") {
//     const input = value.trim();

//     if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
//       const [year, month, day] = input.split("-");
//       return `${day}/${month}/${year}`;
//     }

//     if (
//       /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(input) &&
//       !/(Z|[+-]\d{2}:?\d{2})$/i.test(input)
//     ) {
//       date = new Date(input.replace(" ", "T") + "+05:30");
//     } else {
//       date = new Date(input);
//     }
//   } else {
//     return String(value);
//   }

//   if (Number.isNaN(date.getTime())) {
//     return String(value);
//   }

//   return (
//     new Intl.DateTimeFormat("en-IN", {
//       timeZone: TIME_ZONE,
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//       hour12: true,
//     }).format(date) + " IST"
//   );
// }

// function formatValue(value: unknown): string {
//   if (value === null || value === undefined || value === "") {
//     return "—";
//   }

//   if (value instanceof Date) {
//     return formatDate(value);
//   }

//   if (Array.isArray(value)) {
//     return value.map(formatValue).join(", ");
//   }

//   if (typeof value === "object") {
//     const object = value as Record<string, unknown>;

//     if (typeof object.url === "string") {
//       return object.fileName
//         ? String(object.fileName)
//         : "Uploaded evidence (see evidence links)";
//     }

//     return Object.entries(object)
//       .filter(([key]) => !/signature|signed.?at/i.test(key))
//       .map(([key, item]) => `${key}: ${formatValue(item)}`)
//       .join("\n");
//   }

//   return String(value);
// }

// // ========================================
// // LOAD COMPANY LOGO
// // ========================================

// async function loadLogo(): Promise<string | null> {
//   try {
//     const response = await fetch(
//       "/Deep%20Teal%20System%20%26%20Solution%20Logo.png",
//     );

//     if (!response.ok) return null;

//     const blob = await response.blob();

//     return await new Promise((resolve, reject) => {
//       const reader = new FileReader();

//       reader.onload = () => resolve(String(reader.result));
//       reader.onerror = reject;

//       reader.readAsDataURL(blob);
//     });
//   } catch (error) {
//     console.error("Could not load company logo:", error);
//     return null;
//   }
// }

// // ========================================
// // LOAD QR CODE
// // ========================================

// async function loadQrCode(): Promise<string | null> {
//   try {
//     const response = await fetch("/S%26S%20QR.png");

//     if (!response.ok) {
//       console.error("Could not load QR code:", response.status);
//       return null;
//     }

//     const blob = await response.blob();

//     return await new Promise((resolve, reject) => {
//       const reader = new FileReader();

//       reader.onload = () => resolve(String(reader.result));
//       reader.onerror = reject;

//       reader.readAsDataURL(blob);
//     });
//   } catch (error) {
//     console.error("Failed to load QR code:", error);
//     return null;
//   }
// }

// // ========================================
// // COLLECT EVIDENCE
// // ========================================

// function collectEvidence(value: unknown): EvidenceLink[] {
//   const found: EvidenceLink[] = [];
//   const seen = new Set<string>();

//   function visit(item: unknown, key = ""): void {
//     if (Array.isArray(item)) {
//       item.forEach((child, index) =>
//         visit(child, key || `Evidence ${index + 1}`),
//       );
//       return;
//     }

//     if (!item || typeof item !== "object") return;

//     const obj = item as Record<string, unknown>;

//     const rawUrl = obj.url ?? obj.secure_url;
//     const url = typeof rawUrl === "string" ? rawUrl.trim() : "";

//     if (/^https?:\/\//i.test(url)) {
//       const fileName =
//         typeof obj.fileName === "string"
//           ? obj.fileName
//           : typeof obj.filename === "string"
//             ? obj.filename
//             : typeof obj.original_filename === "string"
//               ? obj.original_filename
//               : undefined;

//       const explicitType = String(
//         obj.type ??
//           obj.resource_type ??
//           obj.mimeType ??
//           obj.mime_type ??
//           "",
//       ).toLowerCase();

//       const extension = `${fileName ?? ""} ${url.split("?")[0]}`;

//       const kind: EvidenceLink["kind"] =
//         explicitType.includes("video") ||
//         /\.(mp4|mov|webm|m4v|avi)$/i.test(extension)
//           ? "video"
//           : explicitType.includes("image") ||
//               /\.(jpg|jpeg|png|gif|webp|heic|avif)$/i.test(extension)
//             ? "image"
//             : "file";

//       if (!seen.has(url)) {
//         seen.add(url);

//         found.push({
//           label:
//             typeof obj.label === "string"
//               ? obj.label
//               : typeof obj.fieldLabel === "string"
//                 ? obj.fieldLabel
//                 : key || "Evidence",
//           url,
//           fileName,
//           capturedAt:
//             typeof obj.capturedAt === "string"
//               ? obj.capturedAt
//               : typeof obj.captured_at === "string"
//                 ? obj.captured_at
//                 : undefined,
//           kind,
//         });
//       }
//     }

//     for (const [childKey, childValue] of Object.entries(obj)) {
//       if (
//         [
//           "url",
//           "secure_url",
//           "fileName",
//           "filename",
//           "original_filename",
//           "type",
//           "resource_type",
//           "mimeType",
//           "mime_type",
//           "label",
//           "fieldLabel",
//           "capturedAt",
//           "captured_at",
//         ].includes(childKey)
//       ) {
//         continue;
//       }

//       visit(childValue, childKey);
//     }
//   }

//   visit(value);
//   return found;
// }

// function getFieldEvidence(
//   field: ReportField,
//   formData: Record<string, unknown>,
//   evidenceData: unknown,
// ): EvidenceLink[] {
//   const key = field.id ?? field.key ?? "";

//   const fieldValue = formData[key];
//   const fromField = collectEvidence(fieldValue);

//   if (fromField.length > 0) {
//     return fromField;
//   }

//   if (
//     evidenceData &&
//     typeof evidenceData === "object" &&
//     !Array.isArray(evidenceData)
//   ) {
//     const grouped = evidenceData as Record<string, unknown>;
//     const matchingEvidence = grouped[key];

//     const found = collectEvidence(matchingEvidence);

//     if (found.length > 0) {
//       return found;
//     }
//   }

//   return [];
// }

// // ========================================
// // SIGNATURE EXTRACTION
// // ========================================

// function getSignatureEntries(value: unknown): SignatureEntry[] {
//   const results: SignatureEntry[] = [];
//   const seen = new Set<string>();

//   function visit(item: unknown, key = "Signature"): void {
//     if (!item) return;

//     if (Array.isArray(item)) {
//       item.forEach((child, index) => {
//         visit(child, `${key} ${index + 1}`);
//       });
//       return;
//     }

//     if (typeof item === "string") {
//       const image = item.trim();

//       if (
//         image.startsWith("data:image/") ||
//         /^https?:\/\//i.test(image)
//       ) {
//         const identity = `${key}|${image}`;

//         if (!seen.has(identity)) {
//           seen.add(identity);

//           results.push({
//             label: key,
//             image,
//             signedAt: "",
//           });
//         }
//       }

//       return;
//     }

//     if (typeof item !== "object") return;

//     const obj = item as Record<string, unknown>;

//     const isSignatureObject =
//       /signature/i.test(key) ||
//       Object.prototype.hasOwnProperty.call(obj, "signedAt") ||
//       Object.prototype.hasOwnProperty.call(obj, "signed_at");

//     const rawImage =
//       obj.signature ??
//       obj.dataUrl ??
//       obj.dataURL ??
//       obj.image ??
//       obj.url ??
//       obj.secure_url ??
//       obj.value;

//     const image =
//       typeof rawImage === "string" ? rawImage.trim() : "";

//     const signedAt =
//       typeof obj.signedAt === "string"
//         ? obj.signedAt
//         : typeof obj.signed_at === "string"
//           ? obj.signed_at
//           : "";

//     const label = String(
//       obj.label ??
//         obj.fieldLabel ??
//         obj.name ??
//         key,
//     );

//     if (isSignatureObject) {
//       const identity = `${label}|${image}|${signedAt}`;

//       if (!seen.has(identity)) {
//         seen.add(identity);

//         results.push({
//           label,
//           image,
//           signedAt,
//         });
//       }
//     } else if (
//       image &&
//       (image.startsWith("data:image/") ||
//         /^https?:\/\//i.test(image))
//     ) {
//       const identity = `${label}|${image}`;

//       if (!seen.has(identity)) {
//         seen.add(identity);

//         results.push({
//           label,
//           image,
//           signedAt,
//         });
//       }
//     }

//     for (const [childKey, childValue] of Object.entries(obj)) {
//       if (
//         [
//           "signature",
//           "dataUrl",
//           "dataURL",
//           "image",
//           "url",
//           "secure_url",
//           "value",
//           "label",
//           "fieldLabel",
//           "name",
//           "signedAt",
//           "signed_at",
//         ].includes(childKey)
//       ) {
//         continue;
//       }

//       visit(childValue, childKey);
//     }
//   }

//   visit(value);

//   return results;
// }

// // ========================================
// // LOAD SIGNATURE IMAGE
// // ========================================

// async function loadSignatureImage(
//   source: string,
// ): Promise<string | null> {
//   try {
//     if (source.startsWith("data:image/")) {
//       return source;
//     }

//     if (!/^https?:\/\//i.test(source)) {
//       return null;
//     }

//     const response = await fetch(source);

//     if (!response.ok) return null;

//     const blob = await response.blob();

//     if (!blob.type.startsWith("image/")) return null;

//     return await new Promise((resolve, reject) => {
//       const reader = new FileReader();

//       reader.onload = () => resolve(String(reader.result));
//       reader.onerror = reject;

//       reader.readAsDataURL(blob);
//     });
//   } catch (error) {
//     console.error("Could not load signature image:", error);
//     return null;
//   }
// }

// // ========================================
// // FORMAT FIELD RESPONSE
// // ========================================

// function formatFieldResponse(
//   field: ReportField,
//   formData: Record<string, unknown>,
//   evidenceData: unknown,
// ): string {
//   const key = field.id ?? field.key ?? "";
//   const value = formData[key];

//   const evidence = getFieldEvidence(field, formData, evidenceData);

//   if (evidence.length > 0) {
//     const normalValue =
//       value &&
//       typeof value === "object" &&
//       !Array.isArray(value) &&
//       !("url" in value)
//         ? formatValue(value)
//         : "—";

//     return normalValue;
//   }

//   return formatValue(value);
// }

// // ========================================
// // FOOTER
// // ========================================

// function addFooter(pdf: jsPDF): void {
//   const pageCount = pdf.getNumberOfPages();
//   const pageWidth = pdf.internal.pageSize.getWidth();
//   const pageHeight = pdf.internal.pageSize.getHeight();
//   const margin = 15;

//   for (let page = 1; page <= pageCount; page++) {
//     pdf.setPage(page);

//     pdf.setDrawColor(...PRIMARY);
//     pdf.setLineWidth(0.25);

//     pdf.line(
//       margin,
//       pageHeight - 13,
//       pageWidth - margin,
//       pageHeight - 13,
//     );

//     pdf.setFont("helvetica", "normal");
//     pdf.setFontSize(8);
//     pdf.setTextColor(90, 90, 90);

//     pdf.text(
//       "www.systemsandsolutions.com",
//       margin,
//       pageHeight - 7,
//     );

//     pdf.text(
//       `Page ${page} of ${pageCount}`,
//       pageWidth - margin,
//       pageHeight - 7,
//       { align: "right" },
//     );
//   }
// }

// // ========================================
// // MAIN PDF GENERATOR
// // ========================================

// export async function generateReportPdf(
//   report: ReportData,
//   reportType: string,
// ): Promise<void> {
//   const pdf = new jsPDF({
//     orientation: "portrait",
//     unit: "mm",
//     format: "a4",
//   });

//   const pageWidth = pdf.internal.pageSize.getWidth();
//   const pageHeight = pdf.internal.pageSize.getHeight();
//   const margin = 15;

//   const logo = await loadLogo();
//   const qrCode = await loadQrCode();

//   const template = report.templateSnapshot ?? report.template_snapshot;
//   const formData = report.formData ?? report.form_data ?? {};

//   // ========================================
//   // COMPANY HEADER - CLEAN CORPORATE DESIGN
//   // ========================================

//   const headerHeight = 53;
//   const qrSize = 23;
//   const qrX = pageWidth - margin - qrSize;
//   const qrY = 11;

//   // Main header background
//   pdf.setFillColor(...PRIMARY);
//   pdf.rect(0, 0, pageWidth, headerHeight, "F");

//   // Company logo on the left
//   if (logo) {
//     pdf.addImage(
//       logo,
//       "PNG",
//       margin,
//       9,
//       25,
//       25,
//       undefined,
//       "FAST",
//     );
//   }

//   // Company information
//   const textX = logo ? 45 : margin;
//   const detailsWidth = qrX - textX - 7;

//   // Company name
//   pdf.setTextColor(255, 255, 255);
//   pdf.setFont("helvetica", "bold");
//   pdf.setFontSize(14);

//   pdf.text("M/S SYSTEM & SOLUTION", textX, 12);

//   // Company address
//   pdf.setFont("helvetica", "normal");
//   pdf.setFontSize(7);

//   pdf.text(
//     "GROUND FLOOR, 373, APSARA APARTMENT, PURBACHAL KALITALA ROAD,",
//     textX,
//     18,
//     { maxWidth: detailsWidth },
//   );

//   pdf.text(
//     "KOLKATA, WEST BENGAL, INDIA - 700078",
//     textX,
//     22,
//   );

//   // Contact details
//   pdf.setFontSize(7.2);

//   pdf.setFont("helvetica", "bold");
//   pdf.text("EMAIL", textX, 29);

//   pdf.setFont("helvetica", "normal");
//   pdf.text("info@systemandsolution.com", textX + 13, 29);

//   pdf.setFont("helvetica", "bold");
//   pdf.text("PHONE", textX + 76, 29);

//   pdf.setFont("helvetica", "normal");
//   pdf.text("+91 33 4520 2194", textX + 89, 29);

//   // Divider
//   pdf.setDrawColor(190, 205, 255);
//   pdf.setLineWidth(0.25);
//   pdf.line(textX, 33, qrX - 5, 33);

//   // Registration details
//   pdf.setFontSize(6.8);

//   pdf.setFont("helvetica", "bold");
//   pdf.text("GSTIN", textX, 39);

//   pdf.setFont("helvetica", "normal");
//   pdf.text("19GIAPS5232Q1ZI", textX + 12, 39);

//   pdf.setFont("helvetica", "bold");
//   pdf.text("PAN", textX + 62, 39);

//   pdf.setFont("helvetica", "normal");
//   pdf.text("GIAPS5232Q", textX + 72, 39);

//   pdf.setFont("helvetica", "bold");
//   pdf.text("MSME REG NO.", textX, 45);

//   pdf.setFont("helvetica", "normal");
//   pdf.text("WB-18-0026029", textX + 25, 45);

//   // QR code in a white rounded container
//   if (qrCode) {
//     pdf.setFillColor(255, 255, 255);

//     pdf.roundedRect(
//       qrX - 2,
//       qrY - 2,
//       qrSize + 4,
//       qrSize + 4,
//       1.5,
//       1.5,
//       "F",
//     );

//     pdf.addImage(
//       qrCode,
//       "PNG",
//       qrX,
//       qrY,
//       qrSize,
//       qrSize,
//       undefined,
//       "FAST",
//     );
//   }

//   // Bottom accent line
//   pdf.setFillColor(255, 255, 255);
//   pdf.rect(0, headerHeight - 1, pageWidth, 1, "F");

//   // ========================================
//   // REPORT TITLE
//   // ========================================

//   let y = 62;

//   pdf.setTextColor(...PRIMARY);
//   pdf.setFont("helvetica", "bold");
//   pdf.setFontSize(14);

//   pdf.text(reportType.toUpperCase(), margin, y);

//   pdf.setFont("helvetica", "normal");
//   pdf.setFontSize(8);
//   pdf.setTextColor(90, 90, 90);

//   pdf.text(
//     `Generated: ${formatDate(new Date())}`,
//     pageWidth - margin,
//     y,
//     { align: "right" },
//   );

//   y += 8;

//   // ========================================
//   // REPORT INFORMATION
//   // ========================================

//   autoTable(pdf, {
//     startY: y,
//     theme: "grid",
//     margin: { left: margin, right: margin },

//     head: [["Report information", "Details"]],

//     body: [
//       ["Report ID", getValue(report.id)],

//       [
//         "Customer",
//         getValue(report.customerName, report.customer_name),
//       ],

//       [
//         "Customer address",
//         getValue(report.customerAddress, report.customer_address),
//       ],

//       [
//         "Customer GST No.",
//         getValue(
//           report.customerGstNo ?? undefined,
//           report.customer_gst_no ?? undefined,
//         ),
//       ],

//       [
//         "Customer contact number",
//         getValue(
//           report.customerContactNumber ?? undefined,
//           report.customer_contact_number ?? undefined,
//         ),
//       ],

//       [
//         "Employee / Engineer",
//         getValue(report.employeeName, report.employee_name),
//       ],

//       [
//         "Employee ID",
//         getValue(report.employeeId, report.employee_id),
//       ],

//       ["Status", getValue(report.status)],

//       [
//         "Created date",
//         formatDate(report.createdAt ?? report.created_at),
//       ],

//       [
//         "Submitted date",
//         formatDate(report.submittedAt ?? report.submitted_at),
//       ],
//     ],

//     headStyles: {
//       fillColor: PRIMARY,
//       textColor: [255, 255, 255],
//     },

//     styles: {
//       fontSize: 8.5,
//       cellPadding: 3,
//       overflow: "linebreak",
//       valign: "top",
//     },

//     columnStyles: {
//       0: { cellWidth: 48 },
//       1: { cellWidth: "auto" },
//     },
//   });

//   y =
//     (
//       pdf as jsPDF & {
//         lastAutoTable: { finalY: number };
//       }
//     ).lastAutoTable.finalY + 8;

//   // ========================================
//   // DYNAMIC TEMPLATE SECTIONS
//   // ========================================

//   for (const section of template?.sections ?? []) {
//     const fields = section.fields ?? [];

//     // Hide signature fields from normal report tables.
//     const visibleFields = fields.filter((field) => {
//       const key = field.id ?? field.key ?? "";
//       const label = field.label ?? field.title ?? "";

//       return (
//         !/signature|signed.?at/i.test(key) &&
//         !/signature|signed.?at/i.test(label)
//       );
//     });

//     if (visibleFields.length === 0) continue;

//     if (y > pageHeight - 35) {
//       pdf.addPage();
//       y = 18;
//     }

//     pdf.setTextColor(...PRIMARY);
//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(10.5);

//     pdf.text(
//       section.title ?? section.name ?? "Report details",
//       margin,
//       y,
//     );

//     y += 3;

//     const body: string[][] = [];

//     const mediaRows: Array<{
//       rowIndex: number;
//       links: EvidenceLink[];
//     }> = [];

//     for (const field of visibleFields) {
//       const key = field.id ?? field.key ?? "";

//       const label =
//         (field.label ?? field.title ?? key) || "Field";

//       const links = getFieldEvidence(
//         field,
//         formData,
//         report.evidence,
//       );

//       const response = formatFieldResponse(
//         field,
//         formData,
//         report.evidence,
//       );

//       const rowIndex = body.length;

//       body.push([label, response]);

//       if (links.length > 0) {
//         mediaRows.push({ rowIndex, links });
//       }
//     }

//     autoTable(pdf, {
//       startY: y,
//       theme: "striped",
//       margin: { left: margin, right: margin },

//       head: [["Field", "Response / Evidence"]],

//       body,

//       headStyles: {
//         fillColor: PRIMARY,
//         textColor: [255, 255, 255],
//       },

//       styles: {
//         fontSize: 8,
//         cellPadding: 3,
//         overflow: "linebreak",
//         valign: "top",
//       },

//       columnStyles: {
//         0: { cellWidth: 55 },
//         1: { cellWidth: "auto" },
//       },

//       didDrawCell: (data) => {
//         if (data.section !== "body" || data.column.index !== 1) {
//           return;
//         }

//         const media = mediaRows.find(
//           (item) => item.rowIndex === data.row.index,
//         );

//         if (!media) return;

//         const links = media.links;
//         const lineHeight = 4;

//         let linkY = data.cell.y + data.cell.height - 3;

//         for (let i = links.length - 1; i >= 0; i--) {
//           const item = links[i];

//           const action =
//             item.kind === "video"
//               ? "Watch video"
//               : item.kind === "image"
//                 ? "View image"
//                 : "Open file";

//           pdf.setFont("helvetica", "bold");
//           pdf.setFontSize(8);
//           pdf.setTextColor(...TEAL);

//           const linkText =
//             `${action}: ${item.fileName ?? item.label}`;

//           const maxWidth = data.cell.width - 6;
//           const lines = pdf.splitTextToSize(
//             linkText,
//             maxWidth,
//           );

//           for (let j = lines.length - 1; j >= 0; j--) {
//             pdf.text(
//               lines[j],
//               data.cell.x + 3,
//               linkY,
//               { maxWidth },
//             );

//             const textWidth = Math.min(
//               pdf.getTextWidth(lines[j]),
//               maxWidth,
//             );

//             pdf.link(
//               data.cell.x + 3,
//               linkY - 3,
//               textWidth,
//               lineHeight,
//               { url: item.url },
//             );

//             linkY -= lineHeight;
//           }
//         }
//       },
//     });

//     y =
//       (
//         pdf as jsPDF & {
//           lastAutoTable: { finalY: number };
//         }
//       ).lastAutoTable.finalY + 8;
//   }

//   // ========================================
//   // SIGNATURES AND SIGNING TIMESTAMPS
//   // ========================================

//   const signatureEntries = [
//     ...getSignatureEntries(report.signatures),

//     ...getSignatureEntries(
//       Object.fromEntries(
//         Object.entries(formData).filter(([key]) =>
//           /signature|signed/i.test(key),
//         ),
//       ),
//     ),
//   ].filter((entry) => {
//     // Do not display empty signature entries.
//     return (
//       typeof entry.image === "string" &&
//       entry.image.trim().length > 0
//     );
//   });

//   // Remove duplicate signature entries.
//   const uniqueSignatures = Array.from(
//     new Map(
//       signatureEntries.map((entry) => [
//         `${entry.label}|${entry.image}|${entry.signedAt}`,
//         entry,
//       ]),
//     ).values(),
//   );

//   const loadedSignatures: Array<{
//     label: string;
//     image: string | null;
//     signedAt: string;
//   }> = [];

//   for (const entry of uniqueSignatures) {
//     const image = await loadSignatureImage(entry.image);

//     // Skip unavailable or invalid signature images.
//     if (!image) continue;

//     loadedSignatures.push({
//       label: entry.label,
//       image,
//       signedAt: entry.signedAt,
//     });
//   }

//   if (loadedSignatures.length > 0) {
//     if (y > pageHeight - 65) {
//       pdf.addPage();
//       y = 20;
//     }

//     pdf.setTextColor(...PRIMARY);
//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(10.5);

//     pdf.text("Signatures", margin, y);

//     y += 7;

//     const boxWidth = 80;
//     const boxHeight = 25;
//     const gap = 10;
//     const cardHeight = 42;

//     let x = margin;

//     for (const entry of loadedSignatures) {
//       if (x + boxWidth > pageWidth - margin) {
//         x = margin;
//         y += cardHeight;
//       }

//       if (y + cardHeight > pageHeight - 20) {
//         pdf.addPage();
//         y = 20;
//         x = margin;
//       }

//       pdf.setFont("helvetica", "bold");
//       pdf.setFontSize(8);
//       pdf.setTextColor(60, 60, 60);

//       const label = entry.label
//         .replace(/[-_]/g, " ")
//         .replace(/\b\w/g, (char) => char.toUpperCase());

//       pdf.text(label, x, y);

//       const imageY = y + 3;

//       pdf.setDrawColor(190, 200, 205);
//       pdf.rect(x, imageY, boxWidth, boxHeight);

//       try {
//         const imageFormat = entry.image.startsWith(
//           "data:image/png",
//         )
//           ? "PNG"
//           : entry.image.startsWith("data:image/webp")
//             ? "WEBP"
//             : "JPEG";

//         pdf.addImage(
//           entry.image,
//           imageFormat,
//           x + 2,
//           imageY + 2,
//           boxWidth - 4,
//           boxHeight - 4,
//           undefined,
//           "FAST",
//         );
//       } catch (error) {
//         console.error(
//           `Could not add signature "${entry.label}" to PDF:`,
//           error,
//         );

//         pdf.setFont("helvetica", "italic");
//         pdf.setFontSize(8);
//         pdf.setTextColor(130, 130, 130);

//         pdf.text(
//           "Signature image unavailable",
//           x + 3,
//           imageY + boxHeight / 2,
//         );
//       }

//       pdf.setFont("helvetica", "normal");
//       pdf.setFontSize(7.5);
//       pdf.setTextColor(80, 80, 80);

//       const signedTime = entry.signedAt
//         ? `Signed on: ${formatDate(entry.signedAt)}`
//         : "Signing time unavailable";

//       pdf.text(signedTime, x, imageY + boxHeight + 5);

//       x += boxWidth + gap;
//     }

//     y += cardHeight;
//   }

//   // ========================================
//   // FOOTER ON EVERY PAGE
//   // ========================================

//   addFooter(pdf);

//   // ========================================
//   // SAVE PDF
//   // ========================================

//   const safeId = (report.id ?? "report").replace(
//     /[^a-zA-Z0-9_-]/g,
//     "_",
//   );

//   pdf.save(`${safeId}.pdf`);
// }
