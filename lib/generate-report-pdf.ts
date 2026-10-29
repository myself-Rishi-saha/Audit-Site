
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// type ReportData = {
//   id?: string;
//   employeeName?: string;
//   employee_name?: string;
//   customerName?: string;
//   customer_name?: string;
//   customerAddress?: string;
//   customer_address?: string;
//   status?: string;
//   createdAt?: string;
//   submittedAt?: string;
//   created_at?: string;
//   submitted_at?: string;
//   templateSnapshot?: {
//     title?: string;
//     name?: string;
//     sections?: Array<{
//       title?: string;
//       name?: string;
//       fields?: Array<{
//         id?: string;
//         key?: string;
//         label?: string;
//         title?: string;
//         type?: string;
//       }>;
//     }>;
//   };
//   formData?: Record<string, unknown>;
//   form_data?: Record<string, unknown>;
// };

// const NAVY: [number, number, number] = [0, 53, 74];

// function formatValue(value: unknown): string {
//   if (value === null || value === undefined || value === "") {
//     return "—";
//   }

//   if (Array.isArray(value)) {
//     return value.map(formatValue).join(", ");
//   }

//   if (typeof value === "object") {
//     return Object.entries(value as Record<string, unknown>)
//       .map(([key, item]) => `${key}: ${formatValue(item)}`)
//       .join("\n");
//   }

//   return String(value);
// }

// async function loadLogo(): Promise<string | null> {
//   try {
//     const response = await fetch("/Deep Teal System & Solution Logo.png");
//     if (!response.ok) return null;

//     const blob = await response.blob();

//     return await new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onload = () => resolve(String(reader.result));
//       reader.onerror = reject;
//       reader.readAsDataURL(blob);
//     });
//   } catch {
//     return null;
//   }
// }

// export async function generateReportPdf(
//   report: ReportData,
//   reportType: string,
// ) {
//   const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

//   const pageWidth = pdf.internal.pageSize.getWidth();
//   const margin = 15;
//   const logo = await loadLogo();

//   // Company header
//   pdf.setFillColor(...NAVY);
//   pdf.rect(0, 0, pageWidth, 37, "F");

//   if (logo) {
//     pdf.addImage(logo, "PNG", margin, 5, 25, 25, undefined, "FAST");
//   }

//   pdf.setTextColor(255, 255, 255);
//   pdf.setFont("helvetica", "bold");
//   pdf.setFontSize(17);
//   pdf.text("SYSTEM & SOLUTIONS", logo ? 45 : margin, 13);

//   pdf.setFont("helvetica", "normal");
//   pdf.setFontSize(8);
//   pdf.text("Ahmedabad, Gujarat - 380 006", logo ? 45 : margin, 20);
//   pdf.text("+91 94273 10670 | +91 9898 188 345", logo ? 45 : margin, 25);
//   pdf.text("info@systemsandsolutions.in", logo ? 45 : margin, 30);

//   // Report title
//   let y = 47;
//   pdf.setTextColor(...NAVY);
//   pdf.setFont("helvetica", "bold");
//   pdf.setFontSize(15);
//   pdf.text(reportType.toUpperCase(), margin, y);

//   y += 9;

//   const template = report.templateSnapshot;
//   const formData = report.formData ?? report.form_data ?? {};

//   // Report metadata
//   autoTable(pdf, {
//     startY: y,
//     theme: "grid",
//     margin: { left: margin, right: margin },
//     head: [["Report information", "Details"]],
//     body: [
//       ["Report ID", report.id ?? "—"],
//       ["Customer", report.customerName ?? report.customer_name ?? "—"],
//       ["Customer address", report.customerAddress ?? report.customer_address ?? "—"],
//       ["Employee / Engineer", report.employeeName ?? report.employee_name ?? "—"],
//       ["Status", report.status ?? "—"],
//       [
//         "Submitted date",
//         formatValue(report.submittedAt ?? report.submitted_at ??
//           report.createdAt ?? report.created_at),
//       ],
//     ],
//     headStyles: { fillColor: NAVY },
//     styles: { fontSize: 9, cellPadding: 3, overflow: "linebreak" },
//   });

//   y = (pdf as jsPDF & { lastAutoTable: { finalY: number } })
//     .lastAutoTable.finalY + 8;

//   // Dynamic sections and fields from the saved template
//   for (const section of template?.sections ?? []) {
//     const rows = (section.fields ?? []).map((field) => {
//       const key = field.id ?? field.key ?? "";
//       return [
//         field.label ?? field.title ?? key,
//         formatValue(formData[key]),
//       ];
//     });

//     if (rows.length === 0) continue;

//     // Keep each section heading with its table.
//     if (y > 245) {
//       pdf.addPage();
//       y = 18;
//     }

//     pdf.setTextColor(...NAVY);
//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(11);
//     pdf.text(section.title ?? section.name ?? "Report details", margin, y);

//     autoTable(pdf, {
//       startY: y + 3,
//       theme: "striped",
//       margin: { left: margin, right: margin },
//       head: [["Field", "Response"]],
//       body: rows,
//       headStyles: { fillColor: NAVY },
//       styles: {
//         fontSize: 8.5,
//         cellPadding: 3,
//         overflow: "linebreak",
//         valign: "top",
//       },
//       columnStyles: {
//         0: { cellWidth: 55 },
//         1: { cellWidth: "auto" },
//       },
//     });

//     y = (pdf as jsPDF & { lastAutoTable: { finalY: number } })
//       .lastAutoTable.finalY + 8;
//   }

//   // Footer on every page
//   const pageCount = pdf.getNumberOfPages();

//   for (let page = 1; page <= pageCount; page++) {
//     pdf.setPage(page);
//     const height = pdf.internal.pageSize.getHeight();

//     pdf.setDrawColor(...NAVY);
//     pdf.line(margin, height - 13, pageWidth - margin, height - 13);

//     pdf.setFont("helvetica", "normal");
//     pdf.setFontSize(8);
//     pdf.setTextColor(90, 90, 90);
//     pdf.text(
//       "www.systemsandsolutions.in",
//       margin,
//       height - 7,
//     );
//     pdf.text(
//       `Page ${page} of ${pageCount}`,
//       pageWidth - margin,
//       height - 7,
//       { align: "right" },
//     );
//   }

//   const safeId = (report.id ?? "report").replace(/[^a-zA-Z0-9_-]/g, "_");
//   pdf.save(`${safeId}.pdf`);
// }

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
  customerGst?: string;
  customer_gst?: string;
  customerContact?: string;
  customer_contact?: string;
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

const NAVY: [number, number, number] = [0, 53, 74];
const TEAL: [number, number, number] = [0, 102, 130];
const TIME_ZONE = "Asia/Kolkata";

function getValue(
  ...values: (string | undefined)[]
): string {
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

    // SQL DATETIME strings usually represent a wall-clock time
    // without an explicit timezone. Treat them as Kolkata time.
    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(input) &&
        !/(Z|[+-]\d{2}:?\d{2})$/i.test(input)) {
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

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date) + " IST";
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
      .map(([key, item]) => `${key}: ${formatValue(item)}`)
      .join("\n");
  }

  return String(value);
}

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
  } catch {
    return null;
  }
}

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

  // Search evidence associated with this field first.
  const fieldValue = formData[key];
  const fromField = collectEvidence(fieldValue);

  if (fromField.length > 0) {
    return fromField;
  }

  // Also support evidence stored separately, grouped by field key.
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

function formatFieldResponse(
  field: ReportField,
  formData: Record<string, unknown>,
  evidenceData: unknown,
): string {
  const key = field.id ?? field.key ?? "";
  const value = formData[key];

  // Uploaded media is represented by its clickable link below.
  const evidence = getFieldEvidence(field, formData, evidenceData);

  if (evidence.length > 0) {
    const normalValue =
      value && typeof value === "object" &&
      !Array.isArray(value) &&
      !("url" in value)
        ? formatValue(value)
        : "—";

    return normalValue;
  }

  return formatValue(value);
}

function addFooter(pdf: jsPDF): void {
  const pageCount = pdf.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;

  for (let page = 1; page <= pageCount; page++) {
    pdf.setPage(page);

    pdf.setDrawColor(...NAVY);
    pdf.line(margin, pageHeight - 13, pageWidth - margin, pageHeight - 13);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(90, 90, 90);

    pdf.text("www.systemsandsolutions.in", margin, pageHeight - 7);

    pdf.text(
      `Page ${page} of ${pageCount}`,
      pageWidth - margin,
      pageHeight - 7,
      { align: "right" },
    );
  }
}

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

  const template =
    report.templateSnapshot ?? report.template_snapshot;

  const formData = report.formData ?? report.form_data ?? {};

  // Company header
  pdf.setFillColor(...NAVY);
  pdf.rect(0, 0, pageWidth, 37, "F");

  if (logo) {
    pdf.addImage(logo, "PNG", margin, 5, 25, 25, undefined, "FAST");
  }

  const textX = logo ? 45 : margin;

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(17);
  pdf.text("SYSTEM & SOLUTIONS", textX, 12);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.text(
    "509, Ashwamegh Elegance, Nr. Parimal Garden,",
    textX,
    18,
  );
  pdf.text(
    "Kalyan Jewellers Lane, Bhudarpura Road, Ambawadi,",
    textX,
    22,
  );
  pdf.text("Ahmedabad - 380 006", textX, 26);
  pdf.text(
    "+91 94273 10670 | +91 9898 188 345",
    textX,
    30,
  );
  pdf.text("info@systemsandsolutions.in", textX, 34);

  // Report title and generation timestamp
  let y = 46;

  pdf.setTextColor(...NAVY);
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

  // Report information
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
        "Customer GST",
        getValue(report.customerGst, report.customer_gst),
      ],
      [
        "Customer contact",
        getValue(report.customerContact, report.customer_contact),
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
      fillColor: NAVY,
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

  y = (
    pdf as jsPDF & { lastAutoTable: { finalY: number } }
  ).lastAutoTable.finalY + 8;

  // Dynamic sections and fields from the saved template
  // Dynamic sections and fields, with media links beside their fields.
for (const section of template?.sections ?? []) {
  const fields = section.fields ?? [];

  if (fields.length === 0) continue;

  if (y > pageHeight - 35) {
    pdf.addPage();
    y = 18;
  }

  pdf.setTextColor(...NAVY);
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

  for (const field of fields) {
    const key = field.id ?? field.key ?? "";
    const label = (field.label ?? field.title ?? key) || "Field";

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
      fillColor: NAVY,
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

      // Draw clickable media links inside the corresponding table cell.
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

        const linkText = `${action}: ${item.fileName ?? item.label}`;

        // Keep the link within the response column.
        const maxWidth = data.cell.width - 6;
        const lines = pdf.splitTextToSize(linkText, maxWidth);

        // This is a fallback if a long filename wraps.
        for (let j = lines.length - 1; j >= 0; j--) {
          pdf.text(lines[j], data.cell.x + 3, linkY, {
            maxWidth,
          });

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

  y = (
    pdf as jsPDF & { lastAutoTable: { finalY: number } }
  ).lastAutoTable.finalY + 8;
}
//   for (const section of template?.sections ?? []) {
//     const rows = (section.fields ?? []).map((field) => {
//       const key = field.id ?? field.key ?? "";
//       const value = formData[key];

//       return [
//         (field.label ?? field.title ?? key) || "Field",
//         formatValue(value),
//       ];
//     });

//     if (rows.length === 0) continue;

//     if (y > pageHeight - 35) {
//       pdf.addPage();
//       y = 18;
//     }

//     pdf.setTextColor(...NAVY);
//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(10.5);

//     pdf.text(
//       section.title ?? section.name ?? "Report details",
//       margin,
//       y,
//     );

//     autoTable(pdf, {
//       startY: y + 3,
//       theme: "striped",
//       margin: { left: margin, right: margin },
//       head: [["Field", "Response"]],
//       body: rows,
//       headStyles: {
//         fillColor: NAVY,
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
//     });

//     y = (
//       pdf as jsPDF & { lastAutoTable: { finalY: number } }
//     ).lastAutoTable.finalY + 8;
//   }

  // Clickable evidence links
//   const evidence = collectEvidence([
//     report.evidence,
//     formData,
//   ]);

//   if (evidence.length > 0) {
//     if (y > pageHeight - 35) {
//       pdf.addPage();
//       y = 18;
//     }

//     pdf.setTextColor(...NAVY);
//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(12);
//     pdf.text("UPLOADED EVIDENCE", margin, y);

//     y += 8;

//     for (const item of evidence) {
//       const label = `${item.label}: ${item.fileName ?? "Uploaded file"}`;

//       const labelLines = pdf.splitTextToSize(
//         label,
//         pageWidth - margin * 2,
//       );

//       const dateLine = item.capturedAt
//         ? `Captured: ${formatDate(item.capturedAt)}`
//         : "";

//       const neededHeight =
//         labelLines.length * 4 + (dateLine ? 9 : 5) + 8;

//       if (y + neededHeight > pageHeight - 19) {
//         pdf.addPage();
//         y = 18;
//       }

//       pdf.setFont("helvetica", "normal");
//       pdf.setFontSize(8.5);
//       pdf.setTextColor(45, 45, 45);

//       pdf.text(labelLines, margin, y);
//       y += labelLines.length * 4;

//       if (dateLine) {
//         pdf.setFontSize(7.5);
//         pdf.setTextColor(90, 90, 90);
//         pdf.text(dateLine, margin, y);
//         y += 4;
//       }

//       const action =
//         item.kind === "video"
//           ? "Watch video"
//           : item.kind === "image"
//             ? "View image"
//             : "Open file";

//       pdf.setFont("helvetica", "bold");
//       pdf.setFontSize(8.5);
//       pdf.setTextColor(...TEAL);
//       pdf.text(action, margin, y);

//       // PDF hyperlink annotation
//       pdf.link(
//         margin,
//         y - 3.5,
//         pdf.getTextWidth(action),
//         5,
//         { url: item.url },
//       );

//       y += 9;
//     }
//   } else {
//     if (y > pageHeight - 25) {
//       pdf.addPage();
//       y = 18;
//     }

//     pdf.setFont("helvetica", "italic");
//     pdf.setFontSize(8.5);
//     pdf.setTextColor(100, 100, 100);
//     pdf.text("No uploaded evidence links found.", margin, y);
//   }

  // Footer on every page
  addFooter(pdf);

  const safeId = (report.id ?? "report").replace(
    /[^a-zA-Z0-9_-]/g,
    "_",
  );

  pdf.save(`${safeId}.pdf`);
}
