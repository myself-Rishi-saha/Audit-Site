
"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Evidence = {
  url: string;
  type: string;
  fileName?: string;
};

type SignatureData = {
  signature: string;
  signedAt: string;
};

type Field = {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  multiple?: boolean;
};

type Section = {
  id?: string;
  name: string;
  title?: string;
  fields: Field[];
};

type HandoverCertificateTemplate = {
  id: string;
  name?: string;
  title?: string;
  type?: string;
  sections: Section[];
};

type HandoverCertificate = {
  id: string;
  status?: string;

  customerId?: string;
  customerName?: string;
  customerAddress?: string;
  customerGstNo?: string | null;
  customerContactNumber?: string | null;

  templateId?: string;

  /*
   * Exact template snapshot saved when
   * this Handover Certificate was created.
   */
  templateSnapshot?: HandoverCertificateTemplate;

  formData?: Record<string, unknown>;

  evidence?: Record<string, Evidence[]>;

  signatures?: Record<string, SignatureData>;
};

// --------------------------------------------------
// GET FIELD VALUE
// --------------------------------------------------

function getValue(
  certificate: HandoverCertificate,
  fieldId: string,
): unknown {
  if (
    certificate.formData &&
    Object.prototype.hasOwnProperty.call(
      certificate.formData,
      fieldId,
    )
  ) {
    return certificate.formData[fieldId];
  }

  return "";
}

// --------------------------------------------------
// FORMAT FIELD VALUE
// --------------------------------------------------

function formatValue(value: unknown): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "—";
    }

    const formatted = value
      .filter((item) => String(item ?? "").trim())
      .map((item) => String(item));

    return formatted.length > 0 ? formatted.join(", ") : "—";
  }

  return String(value);
}

// --------------------------------------------------
// HANDOVER CERTIFICATE REPORT
// --------------------------------------------------

export function HandoverCertificateReport({
  report,
}: {
  report: HandoverCertificate;
}) {
  const router = useRouter();

  /*
   * IMPORTANT:
   *
   * Do not fetch the current template here.
   *
   * Always use the exact template snapshot
   * saved with this Handover Certificate.
   */
  const template = report.templateSnapshot || null;

  // --------------------------------------------------
  // SAFETY FALLBACK
  // --------------------------------------------------

  if (!template || !template.sections) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="font-medium">
              Saved Handover Certificate template could not be loaded.
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Certificate ID: {report.id}
            </p>

            <Button
              className="mt-4"
              variant="outline"
              onClick={() => router.push("/employee")}
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-5 py-8">
      {/* BACK BUTTON */}

      <Button
        variant="ghost"
        className="self-start"
        onClick={() => router.push("/employee")}
      >
        <ArrowLeft data-icon="inline-start" />
        Back to Dashboard
      </Button>

      {/* HEADER */}

      <div>
        <p className="text-sm font-semibold text-primary">
          Certificate Number: {report.id}
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          {(
            template.title ||
            template.name ||
            "HANDOVER CERTIFICATE"
          ).toUpperCase()}
        </h1>

        {report.status && (
          <Badge className="mt-3">
            {report.status}
          </Badge>
        )}
      </div>

      {/* CUSTOMER INFORMATION */}

      <Card>
        <CardHeader>
          <CardTitle>CUSTOMER INFORMATION</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-5 sm:grid-cols-2">
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

          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Customer GST No.
            </p>

            <p className="mt-1 text-sm font-medium">
              {report.customerGstNo || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Customer Contact Number
            </p>

            <p className="mt-1 text-sm font-medium">
              {report.customerContactNumber || "—"}
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

      {/* TEMPLATE SECTIONS */}

      {template.sections.map((section, sectionIndex) => (
        <Card
          key={`${section.id || section.name}-${sectionIndex}`}
        >
          <CardHeader>
            <CardTitle>
              {(section.name || section.title || "").toUpperCase()}
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-5 sm:grid-cols-2">
            {section.fields.map((field) => {
              const value = getValue(report, field.id);

              // ------------------------------------------
              // PHOTO / VIDEO EVIDENCE
              // ------------------------------------------

              if (
                field.type === "camera-photo" ||
                field.type === "camera-video"
              ) {
                const items =
                  report.evidence?.[field.id] || [];

                return (
                  <div
                    key={field.id}
                    className="sm:col-span-2"
                  >
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {field.label}
                    </p>

                    {items.length > 0 ? (
                      <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        {items.map((item, index) => (
                          <div
                            key={`${item.url}-${index}`}
                            className="overflow-hidden rounded-xl border bg-muted"
                          >
                            {item.type === "video" ? (
                              <video
                                src={item.url}
                                controls
                                playsInline
                                className="max-h-80 w-full object-cover"
                              />
                            ) : (
                              <img
                                src={item.url}
                                alt={`${field.label} ${index + 1}`}
                                className="max-h-80 w-full object-cover"
                              />
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

              // ------------------------------------------
              // SIGNATURE
              // ------------------------------------------

              if (field.type === "signature") {
                const signature =
                  report.signatures?.[field.id];

                return (
                  <div
                    key={field.id}
                    className="sm:col-span-2"
                  >
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {field.label}
                    </p>

                    {signature?.signature ? (
                      <div className="mt-3 overflow-hidden rounded-xl border bg-white">
                        <img
                          src={signature.signature}
                          alt={field.label}
                          className="h-40 w-full object-contain"
                        />

                        {signature.signedAt && (
                          <p className="border-t px-3 py-2 text-xs text-muted-foreground">
                            Signed on{" "}
                            {new Date(
                              signature.signedAt,
                            ).toLocaleString("en-IN", {
                              timeZone: "Asia/Kolkata",
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}{" "}
                            IST
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
                        No signature.
                      </p>
                    )}
                  </div>
                );
              }

              // ------------------------------------------
              // NORMAL / MULTIPLE FIELDS
              // ------------------------------------------

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

                  {Array.isArray(value) ? (
                    value.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {value.map((item, index) => (
                          <div
                            key={index}
                            className="rounded-lg border bg-muted/30 p-3"
                          >
                            <p className="whitespace-pre-wrap text-sm">
                              {String(item || "—")}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
                        —
                      </p>
                    )
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap text-sm">
                      {formatValue(value)}
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </main>
  );
}
