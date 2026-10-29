"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Field = {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  multiple?: boolean;
};

type Section = {
  id: string;
  name: string;
  title?: string;
  fields: Field[];
};

type Template = {
  id: string;
  type?: string;
  name?: string;
  title?: string;
  sections: Section[];
};

type EvidenceItem = {
  id?: string;
  reportId?: string;
  type: string;
  url: string;
  fileName?: string;
  capturedAt?: string;
};

type SignatureData = {
  signature: string;
  signedAt: string;
};

type DailyAccentReport = {
  id: string;
  employeeId?: string;
  employeeName?: string;
  customerName?: string;
  customerAddress?: string | null;
  templateId: string;
  templateSnapshot: Template;
  formData: Record<string, unknown>;
  evidence: Record<string, EvidenceItem[]>;
  signatures: Record<string, SignatureData>;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export function AdminDailyAccentEditor({
  report,
}: {
  report: DailyAccentReport;
}) {
  const router = useRouter();

  const [value, setValue] = useState<DailyAccentReport>(() => ({
    ...report,
    templateId: report?.templateId || "daily-accent-report",
    templateSnapshot: report?.templateSnapshot || {
      id: report?.templateId || "daily-accent-report",
      title: "Daily Accent Report",
      sections: [],
    },
    formData:
      report?.formData &&
      typeof report.formData === "object" &&
      !Array.isArray(report.formData)
        ? report.formData
        : {},
    evidence:
      report?.evidence &&
      typeof report.evidence === "object" &&
      !Array.isArray(report.evidence)
        ? report.evidence
        : {},
    signatures:
      report?.signatures &&
      typeof report.signatures === "object" &&
      !Array.isArray(report.signatures)
        ? report.signatures
        : {},
  }));

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Use the exact template snapshot saved with this report.
  const template = value.templateSnapshot;

  function setFieldValue(fieldId: string, fieldValue: unknown) {
    setValue((current) => ({
      ...current,
      formData: {
        ...current.formData,
        [fieldId]: fieldValue,
      },
    }));
  }

  function getFieldValue(fieldId: string): unknown {
    return value.formData?.[fieldId] ?? "";
  }

  const allEvidence = Object.values(value.evidence || {}).flat();

  function renderField(field: Field) {
    const fieldValue = getFieldValue(field.id);

    const commonLabel = (
      <label className="block text-sm font-medium">
        {field.label}
        {field.required && (
          <span className="ml-1 text-destructive">*</span>
        )}
      </label>
    );

    if (
      field.type === "text" ||
      field.type === "number" ||
      field.type === "date" ||
      field.type === "time"
    ) {
      return (
        <div key={field.id}>
          {commonLabel}
          <Input
            type={field.type}
            className="mt-2"
            disabled={!editing}
            value={String(fieldValue ?? "")}
            onChange={(event) =>
              setFieldValue(field.id, event.target.value)
            }
          />
        </div>
      );
    }

    if (field.type === "textarea") {
      const isMultiple = field.multiple === true;
      const textareaValue = Array.isArray(fieldValue)
        ? fieldValue.map(String).join("\n")
        : String(fieldValue ?? "");

      return (
        <div key={field.id}>
          {commonLabel}
          <Textarea
            className="mt-2 min-h-24"
            disabled={!editing}
            value={textareaValue}
            onChange={(event) => {
              const nextValue = event.target.value;

              setFieldValue(
                field.id,
                isMultiple
                  ? nextValue
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean)
                  : nextValue,
              );
            }}
          />
          {isMultiple && (
            <p className="mt-1 text-xs text-muted-foreground">
              Enter each item on a new line.
            </p>
          )}
        </div>
      );
    }

    if (
      field.type === "single-choice" ||
      field.type === "multiple-choice"
    ) {
      const isMultiple = field.type === "multiple-choice";
      const selectedValues = Array.isArray(fieldValue)
        ? fieldValue.map(String)
        : [];

      return (
        <div key={field.id}>
          {commonLabel}
          <div className="mt-2 flex flex-wrap gap-2">
            {(field.options || []).map((option) => {
              const selected = isMultiple
                ? selectedValues.includes(option)
                : fieldValue === option;

              return (
                <button
                  key={option}
                  type="button"
                  disabled={!editing}
                  onClick={() => {
                    if (!isMultiple) {
                      setFieldValue(field.id, option);
                    } else if (selected) {
                      setFieldValue(
                        field.id,
                        selectedValues.filter(
                          (item) => item !== option,
                        ),
                      );
                    } else {
                      setFieldValue(field.id, [
                        ...selectedValues,
                        option,
                      ]);
                    }
                  }}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  } ${!editing ? "cursor-default opacity-80" : ""}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (
      field.type === "camera-photo" ||
      field.type === "camera-video"
    ) {
      const fieldEvidence = value.evidence?.[field.id] || [];
      const isVideo = field.type === "camera-video";

      return (
        <div
          key={field.id}
          className="rounded-xl border bg-muted/20 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{field.label}</p>
              {field.required && (
                <span className="text-xs text-destructive">
                  Required
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {fieldEvidence.length}{" "}
              {fieldEvidence.length === 1 ? "file" : "files"}
            </span>
          </div>

          {fieldEvidence.length > 0 ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {fieldEvidence.map((item, index) => (
                <div
                  key={`${item.url}-${index}`}
                  className="overflow-hidden rounded-lg border bg-background"
                >
                  {isVideo || item.type === "video" ? (
                    <video
                      src={item.url}
                      controls
                      playsInline
                      className="aspect-video w-full object-cover"
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={`${field.label} ${index + 1}`}
                      className="aspect-video w-full object-cover"
                    />
                  )}
                  <div className="p-2">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Open {isVideo ? "video" : "image"}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No evidence attached.
            </p>
          )}
        </div>
      );
    }

    if (field.type === "signature") {
      const signature = value.signatures?.[field.id];

      return (
        <div
          key={field.id}
          className="rounded-xl border bg-muted/20 p-4"
        >
          <p className="text-sm font-medium">{field.label}</p>

          {signature?.signature ? (
            <div className="mt-3 overflow-hidden rounded-lg border bg-white">
              <img
                src={signature.signature}
                alt={`${field.label} signature`}
                className="max-h-40 w-full object-contain"
              />
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              No signature attached.
            </p>
          )}

          {signature?.signedAt && (
            <p className="mt-2 text-xs text-muted-foreground">
              Signed:{" "}
              {new Date(signature.signedAt).toLocaleString("en-GB", {
                timeZone: "Asia/Kolkata",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })}
            </p>
          )}
        </div>
      );
    }

    // Fallback for additional template field types.
    return (
      <div key={field.id}>
        {commonLabel}
        <Input
          className="mt-2"
          disabled={!editing}
          value={String(fieldValue ?? "")}
          onChange={(event) =>
            setFieldValue(field.id, event.target.value)
          }
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Field type: {field.type}
        </p>
      </div>
    );
  }

  async function save() {
    setSaving(true);

    try {
      const response = await fetch(
        `/api/daily-accent-report/${encodeURIComponent(value.id)}`,
        {
          method: "PUT",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            ...value,
            lastUpdatedBy: "ADMIN001",
            lastUpdatedAt: new Date().toISOString(),
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Failed to save Daily Accent Report:",
          errorText,
        );
        alert("Failed to save Daily Accent Report.");
        return;
      }

      const updated = await response.json();

      setValue((current) => ({
        ...current,
        ...updated,
        templateSnapshot:
          updated.templateSnapshot || current.templateSnapshot,
        formData: updated.formData || current.formData || {},
        evidence: updated.evidence || current.evidence || {},
        signatures: updated.signatures || current.signatures || {},
      }));

      setEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Daily Accent Report save error:", error);
      alert("Failed to save Daily Accent Report.");
    } finally {
      setSaving(false);
    }
  }

  if (!template || !Array.isArray(template.sections)) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-8">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="font-medium">
            Saved report template could not be loaded.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Report ID: {value.id}
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">
            Admin review
          </p>
          <h1 className="mt-1 text-3xl font-semibold">
            {template.title || template.name || "Daily Accent Report"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Report ID: {value.id}
          </p>
          {value.employeeName && (
            <p className="mt-1 text-sm text-muted-foreground">
              Employee: {value.employeeName}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            Generate PDF
          </Button>
          <Button
            onClick={() => (editing ? save() : setEditing(true))}
            disabled={saving}
          >
            {saving
              ? "Saving…"
              : editing
                ? "Save Changes"
                : "Edit Report"}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
          <label className="text-sm font-medium">
            Customer
            <Input
              className="mt-2"
              disabled={!editing}
              value={value.customerName || ""}
              // onChange={(event) =>
              //   setValue((current) => ({
              //     ...current,
              //     customerName: event.target.value,
              //   }))
              // }
            />
          </label>

          <label className="text-sm font-medium">
            Location
            <Input
              className="mt-2"
              disabled={!editing}
              value={value.customerAddress || ""}
              // onChange={(event) =>
              //   setValue((current) => ({
              //     ...current,
              //     customerAddress: event.target.value,
              //   }))
              // }
            />
          </label>

          <div className="text-sm">
            <span className="text-muted-foreground">Report date</span>
            <p className="mt-2 font-semibold">
              {value.createdAt
                ? new Date(value.createdAt).toLocaleDateString(
                    "en-GB",
                    { timeZone: "Asia/Kolkata" },
                  )
                : "—"}
            </p>
          </div>

          <div className="text-sm">
            <span className="text-muted-foreground">Report ID</span>
            <p className="mt-2 font-semibold">{value.id}</p>
          </div>

          <div className="text-sm">
            <span className="text-muted-foreground">Employee</span>
            <p className="mt-2 font-semibold">
              {value.employeeName || "—"}
            </p>
          </div>

          <div className="text-sm">
            <span className="text-muted-foreground">Status</span>
            <p className="mt-2">
              <Badge>
                {String(value.status || "DRAFT").toUpperCase()}
              </Badge>
            </p>
          </div>
        </CardContent>
      </Card>

      {template.sections.map((section) => (
        <Card key={section.id} className="mb-6 mt-6">
          <CardHeader>
            <CardTitle>{section.name || section.title}</CardTitle>
          </CardHeader>
          <CardContent
            className={
              section.fields?.some((field) =>
                [
                  "camera-photo",
                  "camera-video",
                  "signature",
                ].includes(field.type),
              )
                ? "space-y-5"
                : "grid gap-5 sm:grid-cols-2"
            }
          >
            {section.fields?.map((field) => renderField(field))}
          </CardContent>
        </Card>
      ))}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Evidence Gallery</CardTitle>
        </CardHeader>
        <CardContent>
          {allEvidence.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {allEvidence.map((item, index) => (
                <div
                  key={`${item.url}-${index}`}
                  className="overflow-hidden rounded-xl border bg-muted"
                >
                  {item.type === "video" ? (
                    <video
                      src={item.url}
                      controls
                      playsInline
                      className="aspect-video w-full object-cover"
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={`Evidence ${index + 1}`}
                      className="aspect-video w-full object-cover"
                    />
                  )}
                  <div className="flex items-center justify-between gap-2 p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium capitalize">
                        {item.type === "video" ? "Video" : "Photo"}
                      </p>
                      {item.fileName && (
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {item.fileName}
                        </p>
                      )}
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Open
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No evidence attached.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
