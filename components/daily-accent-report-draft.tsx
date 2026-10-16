
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Loader2,
  Plus,
  Save,
  Trash2,
  Video,
  X,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CameraCapture } from "@/components/camera-capture";

type CameraMode = "photo" | "video";

type EvidenceItem = {
  id: string;
  url: string;
  type: "photo" | "video" | string;
  fileName?: string;
  capturedAt?: string;
  fieldId?: string;
};

type SignatureData = {
  fieldId: string;
  dataUrl: string;
  signedAt?: string;
  name?: string;
};

type TemplateField = {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  description?: string;
  options?: Array<string | { label: string; value: string }>;
  choices?: Array<string | { label: string; value: string }>;
  multiple?: boolean;
};

type TemplateSection = {
  id: string;
  title: string;
  description?: string;
  fields?: TemplateField[];
};

type DailyAccentTemplate = {
  id: string;
  title?: string;
  name?: string;
  type?: string;
  sections?: TemplateSection[];
};

type DailyAccentReport = {
  id: string;
  status: string;
  template?: DailyAccentTemplate | null;
  templateSnapshot?: DailyAccentTemplate | null;
  formData?: Record<string, unknown> | null;
  evidence?: EvidenceItem[] | null;
  signatures?: SignatureData[] | null;
  customerId?: string | null;
  customerName?: string | null;
  customerAddress?: string | null;
};

type CameraCaptureItem = Partial<EvidenceItem> & {
  url: string;
  type?: string;
};

type Props = {
  report: DailyAccentReport;
};

function normalizeEvidence(value: unknown): EvidenceItem[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is EvidenceItem =>
      Boolean(
        item &&
          typeof item === "object" &&
          "url" in item &&
          typeof item.url === "string",
      ),
  );
}

function normalizeSignatures(value: unknown): SignatureData[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is SignatureData =>
      Boolean(
        item &&
          typeof item === "object" &&
          "fieldId" in item &&
          "dataUrl" in item &&
          typeof item.fieldId === "string" &&
          typeof item.dataUrl === "string",
      ),
  );
}

function normalizeFormData(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function getFieldType(field: TemplateField): string {
  return String(field.type || "text").toLowerCase().replaceAll("_", "-");
}

function getFieldOptions(field: TemplateField): Array<{
  label: string;
  value: string;
}> {
  const options = field.options ?? field.choices ?? [];

  return options.map((option) => {
    if (typeof option === "string") {
      return { label: option, value: option };
    }

    return {
      label: option.label,
      value: option.value,
    };
  });
}

function isPhotoField(field: TemplateField): boolean {
  const type = getFieldType(field);
  return type === "camera-photo" || type === "photo" || type === "image";
}

function isVideoField(field: TemplateField): boolean {
  const type = getFieldType(field);
  return type === "camera-video" || type === "video";
}

function isCameraField(field: TemplateField): boolean {
  return isPhotoField(field) || isVideoField(field);
}

function isSignatureField(field: TemplateField): boolean {
  const type = getFieldType(field);
  return type === "signature" || type === "customer-signature";
}

function isChoiceField(field: TemplateField): boolean {
  const type = getFieldType(field);
  return (
    type === "single-choice" ||
    type === "select" ||
    type === "radio" ||
    type === "multiple-choice" ||
    type === "checkbox"
  );
}

function getInitialTemplate(report: DailyAccentReport): DailyAccentTemplate | null {
  return report.template ?? report.templateSnapshot ?? null;
}

export function DailyAccentReportDraft({ report }: Props) {
  const router = useRouter();

  const [template, setTemplate] = useState<DailyAccentTemplate | null>(
    getInitialTemplate(report),
  );
  const [formData, setFormData] = useState<Record<string, unknown>>(() =>
    normalizeFormData(report.formData),
  );
  const [evidence, setEvidence] = useState<EvidenceItem[]>(() =>
    normalizeEvidence(report.evidence),
  );
  const [signatures, setSignatures] = useState<SignatureData[]>(() =>
    normalizeSignatures(report.signatures),
  );

  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode | null>(null);
  const [cameraFieldId, setCameraFieldId] = useState<string | null>(null);
  const [signatureField, setSignatureField] = useState<TemplateField | null>(
    null,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

  const sections = useMemo(
    () => (Array.isArray(template?.sections) ? template.sections : []),
    [template],
  );

  const fields = useMemo(
    () => sections.flatMap((section) => section.fields ?? []),
    [sections],
  );

  const completedRequiredCount = useMemo(() => {
    const requiredFields = fields.filter((field) => field.required);

    return requiredFields.filter((field) => {
      const type = getFieldType(field);

      if (isCameraField(field)) {
        return evidence.some((item) => item.fieldId === field.id);
      }

      if (isSignatureField(field)) {
        return signatures.some((item) => item.fieldId === field.id);
      }

      const value = formData[field.id];

      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "boolean") return true;

      return value !== undefined && value !== null && String(value).trim() !== "";
    }).length;
  }, [fields, evidence, signatures, formData]);

  const requiredCount = fields.filter((field) => field.required).length;

  const progress =
    requiredCount === 0
      ? 100
      : Math.round((completedRequiredCount / requiredCount) * 100);

  useEffect(() => {
    if (template?.sections?.length) return;

    let cancelled = false;

    async function loadTemplate() {
      setLoadingTemplate(true);

      try {
        const response = await fetch("/api/templates/daily-accent-report", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load the Daily Accent Report template.");
        }

        const result = await response.json();
        const loadedTemplate =
          result?.template ??
          result?.templateSnapshot ??
          result;

        if (!cancelled && loadedTemplate?.sections) {
          setTemplate(loadedTemplate);
        }
      } catch (error) {
        if (!cancelled) {
          setNotice(
            error instanceof Error
              ? error.message
              : "Unable to load the report template.",
          );
        }
      } finally {
        if (!cancelled) setLoadingTemplate(false);
      }
    }

    void loadTemplate();

    return () => {
      cancelled = true;
    };
  }, [template?.sections?.length]);

  function updateField(fieldId: string, value: unknown) {
    setFormData((current) => ({ ...current, [fieldId]: value }));

    setErrors((current) => {
      if (!current[fieldId]) return current;

      const next = { ...current };
      delete next[fieldId];
      return next;
    });
  }

  function openCamera(field: TemplateField) {
    setCameraFieldId(field.id);
    setCameraMode(isVideoField(field) ? "video" : "photo");
  }

  function handleEvidenceUsed(item: CameraCaptureItem) {
    if (!cameraFieldId) return;

    const nextItem: EvidenceItem = {
      id:
        item.id ||
        `${cameraFieldId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url: item.url,
      type: item.type || cameraMode || "photo",
      fileName: item.fileName,
      capturedAt: item.capturedAt || new Date().toISOString(),
      fieldId: cameraFieldId,
    };

    setEvidence((current) => [...current, nextItem]);

    setErrors((current) => {
      const next = { ...current };
      delete next[cameraFieldId];
      return next;
    });

    setCameraMode(null);
    setCameraFieldId(null);
  }

  function removeEvidence(evidenceId: string) {
    setEvidence((current) => current.filter((item) => item.id !== evidenceId));
  }

  function saveSignature(signature: SignatureData) {
    setSignatures((current) => [
      ...current.filter((item) => item.fieldId !== signature.fieldId),
      signature,
    ]);

    setErrors((current) => {
      const next = { ...current };
      delete next[signature.fieldId];
      return next;
    });

    setSignatureField(null);
  }

  function removeSignature(fieldId: string) {
    setSignatures((current) =>
      current.filter((item) => item.fieldId !== fieldId),
    );
  }

  function validateForm(): boolean {
    const nextErrors: Record<string, string> = {};

    for (const field of fields) {
      if (!field.required) continue;

      if (isCameraField(field)) {
        const hasEvidence = evidence.some(
          (item) => item.fieldId === field.id,
        );

        if (!hasEvidence) {
          nextErrors[field.id] = `Please add ${field.label.toLowerCase()}.`;
        }

        continue;
      }

      if (isSignatureField(field)) {
        const hasSignature = signatures.some(
          (item) => item.fieldId === field.id && item.dataUrl,
        );

        if (!hasSignature) {
          nextErrors[field.id] = `Please provide ${field.label.toLowerCase()}.`;
        }

        continue;
      }

      const value = formData[field.id];

      const isEmpty =
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "") ||
        (Array.isArray(value) && value.length === 0);

      if (isEmpty) {
        nextErrors[field.id] = `${field.label} is required.`;
      }
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setNotice("Please complete all required fields before submitting.");
      return false;
    }

    setNotice("");
    return true;
  }

  async function saveDraft() {
    setSaving(true);
    setNotice("");

    try {
      const response = await fetch(
        `/api/daily-accent-report/${encodeURIComponent(report.id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formData,
            evidence,
            signatures,
          }),
        },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Failed to save the draft.");
      }

      setNotice("Draft saved successfully.");
      router.refresh();
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Failed to save the draft.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteDraft() {
    const confirmed = window.confirm(
      "Delete this Daily Accent Report draft? This action cannot be undone.",
    );

    if (!confirmed) return;

    setDeleting(true);
    setNotice("");

    try {
      const response = await fetch(
        `/api/daily-accent-report/${encodeURIComponent(report.id)}`,
        { method: "DELETE" },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete the draft.");
      }

      router.push("/employee");
      router.refresh();
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Failed to delete the draft.",
      );
      setDeleting(false);
    }
  }

  async function submitReport() {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const confirmed = window.confirm(
      "Submit this Daily Accent Report? After submission, you will not be able to edit it.",
    );

    if (!confirmed) return;

    setSubmitting(true);
    setNotice("");

    try {
      // Save the latest form values before changing the report status.
      const saveResponse = await fetch(
        `/api/daily-accent-report/${encodeURIComponent(report.id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formData,
            evidence,
            signatures,
          }),
        },
      );

      const saveResult = await saveResponse.json().catch(() => ({}));

      if (!saveResponse.ok) {
        throw new Error(saveResult.error || "Failed to save the report.");
      }

      const submitResponse = await fetch(
        `/api/daily-accent-report/${encodeURIComponent(report.id)}/submit`,
        { method: "POST" },
      );

      const submitResult = await submitResponse.json().catch(() => ({}));

      if (!submitResponse.ok) {
        throw new Error(submitResult.error || "Failed to submit the report.");
      }

      router.push(
        `/employee/daily-accent-reports/${encodeURIComponent(report.id)}`,
      );
      router.refresh();
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Failed to submit the report.",
      );
      setSubmitting(false);
    }
  }

  function renderField(field: TemplateField) {
    const type = getFieldType(field);
    const value = formData[field.id];
    const fieldError = errors[field.id];
    const fieldEvidence = evidence.filter(
      (item) => item.fieldId === field.id,
    );
    const signature = signatures.find(
      (item) => item.fieldId === field.id,
    );

    const label = (
      <label
        htmlFor={field.id}
        className="mb-2 block text-sm font-medium text-foreground"
      >
        {field.label}
        {field.required && <span className="ml-1 text-red-500">*</span>}
      </label>
    );

    return (
      <div key={field.id} className="space-y-2">
        {label}

        {field.description && (
          <p className="text-sm text-muted-foreground">
            {field.description}
          </p>
        )}

        {isCameraField(field) ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {isPhotoField(field) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openCamera(field)}
                >
                  <Camera className="mr-2 size-4" />
                  Add Photo
                </Button>
              )}

              {isVideoField(field) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openCamera(field)}
                >
                  <Video className="mr-2 size-4" />
                  Record Video
                </Button>
              )}
            </div>

            {fieldEvidence.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {fieldEvidence.map((item) => (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-lg border"
                  >
                    {item.type === "video" ? (
                      <video
                        src={item.url}
                        controls
                        className="aspect-video w-full bg-black object-contain"
                      />
                    ) : (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.url}
                          alt={item.fileName || field.label}
                          className="aspect-video w-full object-cover"
                        />
                      </a>
                    )}

                    <div className="flex items-center justify-between gap-2 p-2">
                      <span className="min-w-0 truncate text-xs text-muted-foreground">
                        {item.fileName || "Evidence"}
                      </span>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove evidence"
                        onClick={() => removeEvidence(item.id)}
                      >
                        <Trash2 className="size-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : isSignatureField(field) ? (
          <div className="space-y-3">
            {signature ? (
              <div className="rounded-lg border p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={signature.dataUrl}
                  alt={`${field.label} signature`}
                  className="h-28 max-w-full object-contain"
                />

                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSignatureField(field)}
                  >
                    Replace Signature
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSignature(field.id)}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setSignatureField(field)}
              >
                <Plus className="mr-2 size-4" />
                Add Signature
              </Button>
            )}
          </div>
        ) : type === "textarea" || type === "multiline" || field.multiple ? (
          <Textarea
            id={field.id}
            value={typeof value === "string" ? value : ""}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            onChange={(event) => updateField(field.id, event.target.value)}
            rows={4}
          />
        ) : isChoiceField(field) ? (
          <div className="space-y-2">
            {getFieldOptions(field).map((option) => {
              const multiple =
                type === "multiple-choice" ||
                type === "checkbox" ||
                field.multiple;

              const selectedValues = Array.isArray(value)
                ? value.map(String)
                : [];

              const selected = multiple
                ? selectedValues.includes(option.value)
                : String(value ?? "") === option.value;

              return (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm"
                >
                  <input
                    type={multiple ? "checkbox" : "radio"}
                    name={field.id}
                    value={option.value}
                    checked={selected}
                    onChange={() => {
                      if (multiple) {
                        const next = selected
                          ? selectedValues.filter(
                              (item) => item !== option.value,
                            )
                          : [...selectedValues, option.value];

                        updateField(field.id, next);
                      } else {
                        updateField(field.id, option.value);
                      }
                    }}
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
        ) : type === "date" || type === "time" || type === "number" ? (
          <Input
            id={field.id}
            type={type}
            value={value === undefined || value === null ? "" : String(value)}
            placeholder={field.placeholder}
            onChange={(event) => updateField(field.id, event.target.value)}
          />
        ) : type === "boolean" || type === "yes-no" ? (
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Yes", value: "Yes" },
              { label: "No", value: "No" },
            ].map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={String(value ?? "") === option.value ? "default" : "outline"}
                onClick={() => updateField(field.id, option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        ) : (
          <Input
            id={field.id}
            type="text"
            value={value === undefined || value === null ? "" : String(value)}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            onChange={(event) => updateField(field.id, event.target.value)}
          />
        )}

        {fieldError && (
          <p className="text-sm text-red-500">{fieldError}</p>
        )}
      </div>
    );
  }

  if (cameraMode && cameraFieldId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">
              {cameraMode === "photo" ? "Capture Photo" : "Record Video"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {fields.find((field) => field.id === cameraFieldId)?.label}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setCameraMode(null);
              setCameraFieldId(null);
            }}
          >
            <X className="mr-2 size-4" />
            Cancel
          </Button>
        </div>

        <CameraCapture
          mode={cameraMode}
          reportId={report.id}
          onCancel={() => {
            setCameraMode(null);
            setCameraFieldId(null);
          }}
          onUse={handleEvidenceUsed}
        />
      </div>
    );
  }

  if (signatureField) {
    return (
      <SignaturePad
        field={signatureField}
        onCancel={() => setSignatureField(null)}
        onSave={saveSignature}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/employee")}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>

        <span className="rounded-full border px-3 py-1 text-sm font-medium">
          {report.id}
        </span>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">
                {template?.title ||
                  template?.name ||
                  "Daily Accent Report Draft"}
              </CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Complete the required fields and evidence before submitting.
              </p>
            </div>

            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              DRAFT
            </span>
          </div>

          {report.customerName && (
            <div className="mt-3 space-y-1 text-sm">
              <p>
                <span className="font-medium">Customer:</span>{" "}
                {report.customerName}
              </p>
              {report.customerAddress && (
                <p>
                  <span className="font-medium">Address:</span>{" "}
                  {report.customerAddress}
                </p>
              )}
            </div>
          )}

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Required fields completed
              </span>
              <span className="font-medium">
                {completedRequiredCount} / {requiredCount}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {notice && (
            <div
              role="status"
              className="rounded-lg border px-4 py-3 text-sm"
            >
              {notice}
            </div>
          )}

          {loadingTemplate ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              Loading report template...
            </div>
          ) : sections.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="font-medium">No template fields are available.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Check that the Daily Accent Report template exists and contains
                sections with fields.
              </p>
            </div>
          ) : (
            sections.map((section, index) => (
              <section
                key={section.id || `section-${index}`}
                className="space-y-5 rounded-xl border p-4 sm:p-6"
              >
                <div>
                  <h2 className="text-lg font-semibold">
                    {section.title || `Section ${index + 1}`}
                  </h2>
                  {section.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  )}
                </div>

                {(section.fields ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    This section has no fields.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {(section.fields ?? []).map(renderField)}
                  </div>
                )}
              </section>
            ))
          )}
        </CardContent>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <div className="mx-auto flex max-w-5xl flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={deleteDraft}
            disabled={saving || deleting || submitting}
          >
            {deleting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 size-4" />
            )}
            Delete Draft
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={saveDraft}
            disabled={saving || deleting || submitting || loadingTemplate}
          >
            {saving ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Save Draft
          </Button>

          <Button
            type="button"
            onClick={submitReport}
            disabled={saving || deleting || submitting || loadingTemplate}
          >
            {submitting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 size-4" />
            )}
            Submit Report
          </Button>
        </div>
      </div>
    </div>
  );
}

function SignaturePad({
  field,
  onCancel,
  onSave,
}: {
  field: TemplateField;
  onCancel: () => void;
  onSave: (signature: SignatureData) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const hasDrawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#111827";
    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.lineJoin = "round";
  }, []);

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function startDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);

    const point = getPoint(event);
    context.beginPath();
    context.moveTo(point.x, point.y);

    drawingRef.current = true;
    hasDrawingRef.current = true;
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    event.preventDefault();

    const point = getPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function stopDrawing() {
    drawingRef.current = false;
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#111827";
    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.lineJoin = "round";

    hasDrawingRef.current = false;
  }

  function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawingRef.current) {
      window.alert("Please draw a signature before saving.");
      return;
    }

    onSave({
      fieldId: field.id,
      dataUrl: canvas.toDataURL("image/png"),
      signedAt: new Date().toISOString(),
    });
  }

  return (
    <Card className="mx-auto w-full max-w-3xl">
      <CardHeader>
        <CardTitle>{field.label}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Draw your signature in the area below.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="overflow-hidden rounded-lg border bg-white">
          <canvas
            ref={canvasRef}
            width={900}
            height={300}
            aria-label={`${field.label} drawing area`}
            className="block h-auto w-full touch-none"
            style={{ aspectRatio: "3 / 1" }}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            onPointerLeave={stopDrawing}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>

          <Button type="button" variant="outline" onClick={clearSignature}>
            Clear
          </Button>

          <Button type="button" onClick={handleSave}>
            Save Signature
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
