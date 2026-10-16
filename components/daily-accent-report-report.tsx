
"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type EvidenceItem = {
  id?: string;
  url: string;
  type: string;
  fileName?: string;
  capturedAt?: string;
  fieldId?: string;
};

type SignatureItem = {
  fieldId?: string;
  signature?: string;
  dataUrl?: string;
  signedAt?: string;
  name?: string;
};

type Field = {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  options?: Array<string | { label: string; value: string }>;
  choices?: Array<string | { label: string; value: string }>;
  multiple?: boolean;
};

type Section = {
  id?: string;
  name?: string;
  title?: string;
  fields: Field[];
};

type DailyAccentTemplate = {
  id: string;
  name?: string;
  title?: string;
  type?: string;
  sections: Section[];
};

type DailyAccentReportData = {
  id: string;
  status?: string;
  customerId?: string;
  customerName?: string;
  customerAddress?: string;
  employeeId?: string;
  employeeName?: string;
  templateId?: string;

  // Snapshot of the exact template used for this report.
  templateSnapshot?: DailyAccentTemplate;
  template?: DailyAccentTemplate;

  formData?: Record<string, unknown>;

  // Current API format: array of evidence objects.
  evidence?: EvidenceItem[] | Record<string, EvidenceItem[]>;

  // Current API format: array of signature objects.
  signatures?: SignatureItem[] | Record<string, SignatureItem>;

  createdAt?: string;
  updatedAt?: string;
  submittedAt?: string;
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (Array.isArray(value)) {
    const values = value
      .filter((item) => item !== null && item !== undefined && String(item).trim())
      .map(String);

    return values.length > 0 ? values.join(", ") : "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function formatDate(value?: string): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function normalizeEvidence(
  evidence?: DailyAccentReportData["evidence"],
): EvidenceItem[] {
  if (!evidence) return [];

  if (Array.isArray(evidence)) {
    return evidence.filter(
      (item): item is EvidenceItem =>
        Boolean(item && typeof item.url === "string"),
    );
  }

  return Object.entries(evidence).flatMap(([fieldId, items]) =>
    Array.isArray(items)
      ? items
          .filter((item) => Boolean(item && typeof item.url === "string"))
          .map((item) => ({
            ...item,
            fieldId: item.fieldId || fieldId,
          }))
      : [],
  );
}

function normalizeSignatures(
  signatures?: DailyAccentReportData["signatures"],
): SignatureItem[] {
  if (!signatures) return [];

  if (Array.isArray(signatures)) {
    return signatures.filter(
      (item): item is SignatureItem =>
        Boolean(item && (item.dataUrl || item.signature)),
    );
  }

  return Object.entries(signatures).flatMap(([fieldId, signature]) => {
    if (!signature) return [];

    return [
      {
        ...signature,
        fieldId: signature.fieldId || fieldId,
      },
    ];
  });
}

function isPhotoOrVideoField(field: Field): boolean {
  const type = field.type.toLowerCase().replaceAll("_", "-");

  return [
    "camera-photo",
    "camera-video",
    "photo",
    "video",
    "image",
  ].includes(type);
}

function isSignatureField(field: Field): boolean {
  const type = field.type.toLowerCase().replaceAll("_", "-");

  return type === "signature" || type === "customer-signature";
}

export function DailyAccentReportReport({
  report,
}: {
  report: DailyAccentReportData;
}) {
  const router = useRouter();

  // Use the saved snapshot; do not fetch the current template.
  const template = report.templateSnapshot ?? report.template ?? null;

  const evidence = normalizeEvidence(report.evidence);
  const signatures = normalizeSignatures(report.signatures);

  if (!template || !Array.isArray(template.sections)) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-8">
        <Button
          variant="ghost"
          className="mb-5"
          onClick={() => router.push("/employee")}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="mx-auto mb-3 size-10 text-muted-foreground" />

            <p className="font-medium">
              Saved report template could not be loaded.
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Report ID: {report.id}
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  function getFieldEvidence(fieldId: string): EvidenceItem[] {
    return evidence.filter((item) => item.fieldId === fieldId);
  }

  function getFieldSignature(fieldId: string): SignatureItem | undefined {
    return signatures.find((item) => item.fieldId === fieldId);
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-5 py-8">
      <Button
        variant="ghost"
        className="self-start"
        onClick={() => router.push("/employee")}
      >
        <ArrowLeft className="mr-2 size-4" />
        Back to Dashboard
      </Button>

      <div>
        <p className="text-sm font-semibold text-primary">
          Report ID: {report.id}
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          {(
            template.title ||
            template.name ||
            "DAILY ACCENT REPORT"
          ).toUpperCase()}
        </h1>

        {report.status && (
          <Badge className="mt-3">{report.status}</Badge>
        )}

        {report.submittedAt && (
          <p className="mt-2 text-sm text-muted-foreground">
            Submitted: {formatDate(report.submittedAt)} IST
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>REPORT INFORMATION</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Report ID
            </p>
            <p className="mt-1 text-sm font-medium">{report.id}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Status
            </p>
            <p className="mt-1 text-sm font-medium">
              {report.status || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Employee
            </p>
            <p className="mt-1 text-sm font-medium">
              {report.employeeName || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Employee ID
            </p>
            <p className="mt-1 text-sm font-medium">
              {report.employeeId || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Customer ID
            </p>
            <p className="mt-1 text-sm font-medium">
              {report.customerId || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Customer Name
            </p>
            <p className="mt-1 text-sm font-medium">
              {report.customerName || "—"}
            </p>
          </div>

          <div className="sm:col-span-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Customer Address
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm">
              {report.customerAddress || "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      {template.sections.map((section, sectionIndex) => (
        <Card key={`${section.id || section.name || "section"}-${sectionIndex}`}>
          <CardHeader>
            <CardTitle>
              {(section.title || section.name || `SECTION ${sectionIndex + 1}`)
                .toUpperCase()}
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-5 sm:grid-cols-2">
            {(section.fields || []).map((field) => {
              const fieldEvidence = getFieldEvidence(field.id);
              const signature = getFieldSignature(field.id);

              if (isPhotoOrVideoField(field)) {
                return (
                  <div key={field.id} className="sm:col-span-2">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {field.label}
                    </p>

                    {fieldEvidence.length > 0 ? (
                      <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        {fieldEvidence.map((item, index) => (
                          <div
                            key={`${item.id || item.url}-${index}`}
                            className="overflow-hidden rounded-xl border bg-muted"
                          >
                            {item.type.toLowerCase().includes("video") ? (
                              <video
                                src={item.url}
                                controls
                                playsInline
                                className="max-h-80 w-full object-contain"
                              />
                            ) : (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={item.url}
                                  alt={item.fileName || `${field.label} ${index + 1}`}
                                  className="max-h-80 w-full object-contain"
                                />
                              </a>
                            )}

                            {item.fileName && (
                              <p className="border-t px-3 py-2 text-xs text-muted-foreground">
                                {item.fileName}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
                        No evidence attached.
                      </p>
                    )}
                  </div>
                );
              }

              if (isSignatureField(field)) {
                const signatureUrl = signature?.dataUrl || signature?.signature;

                return (
                  <div key={field.id} className="sm:col-span-2">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {field.label}
                    </p>

                    {signatureUrl ? (
                      <div className="mt-3 overflow-hidden rounded-xl border bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={signatureUrl}
                          alt={field.label}
                          className="h-40 w-full object-contain"
                        />

                        {signature.signedAt && (
                          <p className="border-t px-3 py-2 text-xs text-muted-foreground">
                            Signed on {formatDate(signature.signedAt)} IST
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
                        No signature attached.
                      </p>
                    )}
                  </div>
                );
              }

              const value = report.formData?.[field.id];

              return (
                <div
                  key={field.id}
                  className={
                    field.type === "textarea" || field.multiple
                      ? "sm:col-span-2"
                      : ""
                  }
                >
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    {field.label}
                  </p>

                  <p className="mt-1 whitespace-pre-wrap break-words text-sm">
                    {formatValue(value)}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {evidence.some((item) => !item.fieldId) && (
        <Card>
          <CardHeader>
            <CardTitle>ADDITIONAL EVIDENCE</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {evidence
                .filter((item) => !item.fieldId)
                .map((item, index) => (
                  <div
                    key={`${item.id || item.url}-${index}`}
                    className="overflow-hidden rounded-xl border bg-muted"
                  >
                    {item.type.toLowerCase().includes("video") ? (
                      <video
                        src={item.url}
                        controls
                        playsInline
                        className="max-h-80 w-full object-contain"
                      />
                    ) : (
                      <a href={item.url} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.url}
                          alt={item.fileName || `Evidence ${index + 1}`}
                          className="max-h-80 w-full object-contain"
                        />
                      </a>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
