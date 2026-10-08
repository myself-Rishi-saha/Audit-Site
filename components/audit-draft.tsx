
"use client";

import {
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type TouchEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Check,
  Save,
  Send,
  Trash2,
  Video,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CameraCapture } from "@/components/camera-capture";

type CameraMode = "photo" | "video";

type EvidenceItem = {
  id?: string;
  reportId?: string;
  type: "image" | "video";
  url: string;
  fileName?: string;
  capturedAt?: string;
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

type AuditTemplate = {
  id: string;
  type?: string;
  name?: string;
  title?: string;
  sections: Section[];
};

type AuditData = {
  templateId: string;
  formData: Record<string, unknown>;
  evidence: Record<string, EvidenceItem[]>;
  signatures: Record<string, SignatureData>;
};

function getInitialFormData(audit: any) {
  if (
    audit.formData &&
    typeof audit.formData === "object" &&
    !Array.isArray(audit.formData)
  ) {
    return audit.formData;
  }

  /*
   * Compatibility with older audit records.
   */
  const formData: Record<string, unknown> = {};

  if (audit.customer !== undefined) {
    formData["customer"] = audit.customer;
  }

  if (audit.location !== undefined) {
    formData["location"] = audit.location;
  }

  if (audit.date !== undefined) {
    formData["date"] = audit.date;
  }

  if (
    audit.answers &&
    typeof audit.answers === "object" &&
    !Array.isArray(audit.answers)
  ) {
    Object.assign(formData, audit.answers);
  }

  return formData;
}

export function AuditDraft({
  audit,
}: {
  audit: any;
}) {
  const router = useRouter();

  /*
   * Existing audit MUST use its saved template snapshot.
   */
  const [template, setTemplate] =
    useState<AuditTemplate | null>(
      audit.templateSnapshot ||
        audit.template ||
        null,
    );

  const [data, setData] =
    useState<AuditData>({
      templateId:
        audit.templateId ||
        audit.templateSnapshot?.id ||
        audit.template?.id ||
        "audit",

      formData:
        getInitialFormData(audit),

      evidence:
        audit.evidence &&
        typeof audit.evidence === "object" &&
        !Array.isArray(audit.evidence)
          ? audit.evidence
          : {},

      signatures:
        audit.signatures &&
        typeof audit.signatures === "object" &&
        !Array.isArray(audit.signatures)
          ? audit.signatures
          : {},
    });

  const [saving, setSaving] =
    useState(false);

  const [cameraMode, setCameraMode] =
    useState<CameraMode | null>(null);

  const [cameraFieldId, setCameraFieldId] =
    useState<string | null>(null);

  const [signatureFieldId, setSignatureFieldId] =
    useState<string | null>(null);

  const [errors, setErrors] =
    useState<Record<string, boolean>>({});

  // --------------------------------------------------
  // LOAD TEMPLATE
  // --------------------------------------------------

  useEffect(() => {
    /*
     * Existing drafts must use their snapshot.
     *
     * Do NOT replace it with the latest template.
     */
    if (
      audit.templateSnapshot ||
      audit.template
    ) {
      return;
    }

    fetch("/api/templates")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            "Failed to load audit template.",
          );
        }

        return response.json();
      })
      .then((templates) => {
        const auditTemplate =
          Array.isArray(templates)
            ? templates.find(
                (item: AuditTemplate) =>
                  item.type === "AUDIT",
              )
            : null;

        if (!auditTemplate) {
          throw new Error(
            "Audit template not found.",
          );
        }

        setTemplate(auditTemplate);

        setData((current) => ({
          ...current,
          templateId:
            current.templateId ||
            auditTemplate.id ||
            "audit",
        }));
      })
      .catch((error) => {
        console.error(
          "AUDIT TEMPLATE ERROR:",
          error,
        );
      });
  }, [
    audit.templateSnapshot,
    audit.template,
  ]);

  const sections =
    template?.sections || [];

  // --------------------------------------------------
  // ALL TEMPLATE FIELDS
  // --------------------------------------------------

  const fields = useMemo(() => {
    return sections.flatMap(
      (section) =>
        section.fields.map(
          (field) => ({
            ...field,
            section:
              section.name ||
              section.title ||
              "",
          }),
        ),
    );
  }, [sections]);

  // --------------------------------------------------
  // REQUIRED FIELDS
  // --------------------------------------------------

  const requiredFields = useMemo(
    () =>
      fields.filter(
        (field) =>
          field.required,
      ),
    [fields],
  );

  // --------------------------------------------------
  // FIELD EMPTY CHECK
  // --------------------------------------------------

  function isFieldEmpty(
    field: Field,
  ) {
    // Camera
    if (
      field.type ===
        "camera-photo" ||
      field.type ===
        "camera-video"
    ) {
      return !(
        data.evidence?.[
          field.id
        ]?.length > 0
      );
    }

    // Signature
    if (
      field.type ===
      "signature"
    ) {
      return !data.signatures?.[
        field.id
      ]?.signature;
    }

    // Normal field
    const value =
      data.formData?.[field.id];

    if (Array.isArray(value)) {
      return (
        value.length === 0 ||
        value.every(
          (item) =>
            !String(
              item || "",
            ).trim(),
        )
      );
    }

    return !String(
      value ?? "",
    ).trim();
  }

  // --------------------------------------------------
  // PROGRESS
  // --------------------------------------------------

  const completedRequired =
    requiredFields.filter(
      (field) =>
        !isFieldEmpty(field),
    ).length;

  const progress =
    requiredFields.length
      ? Math.round(
          (completedRequired /
            requiredFields.length) *
            100,
        )
      : 0;

  // --------------------------------------------------
  // SET NORMAL VALUE
  // --------------------------------------------------

  function setValue(
    field: Field,
    value: unknown,
  ) {
    setData((current) => ({
      ...current,

      formData: {
        ...current.formData,
        [field.id]: value,
      },
    }));

    setErrors((current) => {
      if (!current[field.id]) {
        return current;
      }

      const next = {
        ...current,
      };

      delete next[field.id];

      return next;
    });
  }

  // --------------------------------------------------
  // ADD EVIDENCE
  // --------------------------------------------------

  function addEvidence(
    fieldId: string,
    item: EvidenceItem,
  ) {
    setData((current) => ({
      ...current,

      evidence: {
        ...current.evidence,

        [fieldId]: [
          ...(current.evidence?.[
            fieldId
          ] || []),
          item,
        ],
      },
    }));

    setErrors((current) => {
      if (!current[fieldId]) {
        return current;
      }

      const next = {
        ...current,
      };

      delete next[fieldId];

      return next;
    });
  }

  // --------------------------------------------------
  // REMOVE EVIDENCE
  // --------------------------------------------------

  function removeEvidence(
    fieldId: string,
    index: number,
  ) {
    setData((current) => ({
      ...current,

      evidence: {
        ...current.evidence,

        [fieldId]: (
          current.evidence?.[
            fieldId
          ] || []
        ).filter(
          (_, i) =>
            i !== index,
        ),
      },
    }));
  }

  // --------------------------------------------------
  // SAVE SIGNATURE
  // --------------------------------------------------

  function saveSignature(
    fieldId: string,
    signature: string,
  ) {
    setData((current) => ({
      ...current,

      signatures: {
        ...current.signatures,

        [fieldId]: {
          signature,
          signedAt:
            new Date().toISOString(),
        },
      },
    }));

    setErrors((current) => {
      if (!current[fieldId]) {
        return current;
      }

      const next = {
        ...current,
      };

      delete next[fieldId];

      return next;
    });

    setSignatureFieldId(null);
  }

  // --------------------------------------------------
  // REMOVE SIGNATURE
  // --------------------------------------------------

  function removeSignature(
    fieldId: string,
  ) {
    setData((current) => {
      const signatures = {
        ...current.signatures,
      };

      delete signatures[fieldId];

      return {
        ...current,
        signatures,
      };
    });
  }

  // --------------------------------------------------
  // VALIDATE
  // --------------------------------------------------

  function validateRequiredFields() {
    const missing: Field[] = [];

    for (const field of requiredFields) {
      if (isFieldEmpty(field)) {
        missing.push(field);
      }
    }

    if (missing.length === 0) {
      setErrors({});
      return true;
    }

    const newErrors: Record<
      string,
      boolean
    > = {};

    missing.forEach((field) => {
      newErrors[field.id] =
        true;
    });

    setErrors(newErrors);

    const firstMissing =
      document.querySelector(
        `[data-field-id="${missing[0].id}"]`,
      );

    firstMissing?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    return false;
  }

  // --------------------------------------------------
  // DELETE DRAFT
  // --------------------------------------------------

  async function deleteDraft() {
    if (saving) return;

    const confirmed =
      confirm(
        "Delete this audit draft?\n\nThis action cannot be undone.",
      );

    if (!confirmed) return;

    try {
      setSaving(true);

      const response =
        await fetch(
          `/api/audits/${audit.id}`,
          {
            method: "DELETE",
          },
        );

      if (!response.ok) {
        let message =
          "Failed to delete draft.";

        try {
          const result =
            await response.json();

          message =
            result?.error ||
            message;
        } catch {}

        throw new Error(
          message,
        );
      }

      router.push(
        "/employee",
      );

      router.refresh();
    } catch (error) {
      console.error(
        "DELETE AUDIT ERROR:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete draft.",
      );
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // SAVE DRAFT
  // --------------------------------------------------

  async function saveDraft() {
    if (saving) return;

    try {
      setSaving(true);

      const response =
        await fetch(
          `/api/audits/${audit.id}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              templateId:
                data.templateId,

              templateSnapshot:
                template,

              formData:
                data.formData,

              evidence:
                data.evidence,

              signatures:
                data.signatures,

              status: "DRAFT",
            }),
          },
        );

      if (!response.ok) {
        let message =
          "Failed to save draft.";

        try {
          const result =
            await response.json();

          message =
            result?.error ||
            message;
        } catch {}

        throw new Error(
          message,
        );
      }

      alert(
        "Audit draft saved successfully.",
      );
    } catch (error) {
      console.error(
        "SAVE AUDIT ERROR:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save draft.",
      );
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // SUBMIT
  // --------------------------------------------------

  async function submitAudit() {
    if (saving) return;

    const valid =
      validateRequiredFields();

    if (!valid) {
      alert(
        "Please complete all required fields before submitting.",
      );

      return;
    }

    const confirmed =
      confirm(
        "Submit this audit?\n\nAfter submission, you will not be able to edit it.",
      );

    if (!confirmed) return;

    try {
      setSaving(true);

      // Save latest data first
      const saveResponse =
        await fetch(
          `/api/audits/${audit.id}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              templateId:
                data.templateId,

              templateSnapshot:
                template,

              formData:
                data.formData,

              evidence:
                data.evidence,

              signatures:
                data.signatures,

              status: "DRAFT",
            }),
          },
        );

      if (!saveResponse.ok) {
        let message =
          "Failed to save audit.";

        try {
          const result =
            await saveResponse.json();

          message =
            result?.error ||
            message;
        } catch {}

        throw new Error(
          message,
        );
      }

      // Submit
      const submitResponse =
        await fetch(
          `/api/audits/${audit.id}/submit`,
          {
            method: "POST",
          },
        );

      if (!submitResponse.ok) {
        let message =
          "Failed to submit audit.";

        try {
          const result =
            await submitResponse.json();

          message =
            result?.error ||
            message;
        } catch {}

        throw new Error(
          message,
        );
      }

      router.push(
        `/employee/audits/${audit.id}`,
      );

      router.refresh();
    } catch (error) {
      console.error(
        "SUBMIT AUDIT ERROR:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to submit audit.",
      );
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // RENDER FIELD
  // --------------------------------------------------

  function renderField(
    field: Field,
  ) {
    const value =
      data.formData?.[field.id] ??
      "";

    const hasError =
      !!errors[field.id];

    // ------------------------------------------------
    // TEXTAREA
    // ------------------------------------------------

    if (
      field.type ===
      "textarea"
    ) {
      return (
        <Textarea
          value={String(
            value || "",
          )}
          onChange={(e) =>
            setValue(
              field,
              e.target.value,
            )
          }
          placeholder={`Enter ${field.label.toLowerCase()}...`}
          className={`min-h-28 resize-y ${
            hasError
              ? "border-red-500 focus-visible:ring-red-500"
              : ""
          }`}
        />
      );
    }

    // ------------------------------------------------
    // SINGLE CHOICE
    // ------------------------------------------------

    if (
      field.type ===
      "single-choice"
    ) {
      return (
        <div
          className={`rounded-xl ${
            hasError
              ? "border border-red-500 bg-red-50/30 p-2"
              : ""
          }`}
        >
          <div className="flex flex-wrap gap-2">
            {(
              field.options ||
              []
            ).map(
              (option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setValue(
                      field,
                      option,
                    )
                  }
                  className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                    value ===
                    option
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:border-primary/40 hover:bg-muted"
                  }`}
                >
                  {value ===
                    option && (
                    <Check className="mr-1 inline size-4" />
                  )}

                  {option}
                </button>
              ),
            )}
          </div>
        </div>
      );
    }

    // ------------------------------------------------
    // MULTIPLE CHOICE
    // ------------------------------------------------

    if (
      field.type ===
      "multiple-choice"
    ) {
      const selected =
        Array.isArray(value)
          ? value
          : [];

      return (
        <div
          className={`grid gap-2 rounded-xl ${
            hasError
              ? "border border-red-500 bg-red-50/30 p-3"
              : ""
          }`}
        >
          {(
            field.options ||
            []
          ).map(
            (option) => {
              const checked =
                selected.includes(
                  option,
                );

              return (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                    checked
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={
                      checked
                    }
                    onChange={(
                      e,
                    ) => {
                      if (
                        e.target
                          .checked
                      ) {
                        setValue(
                          field,
                          [
                            ...selected,
                            option,
                          ],
                        );
                      } else {
                        setValue(
                          field,
                          selected.filter(
                            (
                              item,
                            ) =>
                              item !==
                              option,
                          ),
                        );
                      }
                    }}
                    className="size-4"
                  />

                  <span className="text-sm">
                    {option}
                  </span>
                </label>
              );
            },
          )}
        </div>
      );
    }

    // ------------------------------------------------
    // CAMERA
    // ------------------------------------------------

    if (
      field.type ===
        "camera-photo" ||
      field.type ===
        "camera-video"
    ) {
      const evidence =
        data.evidence?.[
          field.id
        ] || [];

      return (
        <div
          className={`rounded-xl ${
            hasError
              ? "border border-red-500 bg-red-50/30 p-3"
              : ""
          }`}
        >
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setCameraFieldId(
                  field.id,
                );

                setCameraMode(
                  field.type ===
                    "camera-video"
                    ? "video"
                    : "photo",
                );
              }}
            >
              {field.type ===
              "camera-video" ? (
                <Video
                  data-icon="inline-start"
                  className="size-4"
                />
              ) : (
                <Camera
                  data-icon="inline-start"
                  className="size-4"
                />
              )}

              {field.type ===
              "camera-video"
                ? "Record Video"
                : "Capture Photo"}
            </Button>
          </div>

          {evidence.length >
            0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {evidence.map(
                (
                  item,
                  index,
                ) => (
                  <div
                    key={`${item.url}-${index}`}
                    className="group relative overflow-hidden rounded-xl border bg-muted"
                  >
                    {item.type ===
                    "video" ? (
                      <video
                        src={
                          item.url
                        }
                        controls
                        playsInline
                        className="aspect-video w-full object-cover"
                      />
                    ) : (
                      <img
                        src={
                          item.url
                        }
                        alt={`${field.label} ${
                          index + 1
                        }`}
                        className="aspect-video w-full object-cover"
                      />
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        removeEvidence(
                          field.id,
                          index,
                        )
                      }
                      className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600"
                      aria-label="Remove evidence"
                    >
                      <X className="size-4" />
                    </button>

                    <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white">
                      {item.type ===
                      "video"
                        ? "VIDEO"
                        : "PHOTO"}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}

          <p className="mt-2 text-xs text-muted-foreground">
            Capture supporting
            evidence when
            available.
          </p>
        </div>
      );
    }

    // ------------------------------------------------
    // SIGNATURE
    // ------------------------------------------------

    if (
      field.type ===
      "signature"
    ) {
      const signature =
        data.signatures?.[
          field.id
        ];

      return (
        <div
          className={`space-y-3 rounded-xl ${
            hasError
              ? "border border-red-500 bg-red-50/30 p-3"
              : ""
          }`}
        >
          {signature?.signature ? (
            <>
              <div className="overflow-hidden rounded-xl border bg-white">
                <img
                  src={
                    signature.signature
                  }
                  alt={
                    field.label
                  }
                  className="h-40 w-full object-contain"
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Signed on{" "}
                  {new Date(
                    signature.signedAt,
                  ).toLocaleString(
                    "en-IN",
                    {
                      timeZone:
                        "Asia/Kolkata",
                      dateStyle:
                        "medium",
                      timeStyle:
                        "short",
                    },
                  )}{" "}
                  IST
                </p>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      removeSignature(
                        field.id,
                      )
                    }
                  >
                    Clear
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSignatureFieldId(
                        field.id,
                      )
                    }
                  >
                    Re-sign
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="h-24 w-full border-dashed"
              onClick={() =>
                setSignatureFieldId(
                  field.id,
                )
              }
            >
              Sign on Touch Pad
            </Button>
          )}
        </div>
      );
    }

    // ------------------------------------------------
    // DATE
    // ------------------------------------------------

    if (
      field.type ===
      "date"
    ) {
      return (
        <Input
          type="text"
          value={String(
            value || "",
          )}
          onChange={(e) =>
            setValue(
              field,
              e.target.value,
            )
          }
          placeholder="DD/MM/YYYY"
          className={
            hasError
              ? "border-red-500 focus-visible:ring-red-500"
              : ""
          }
        />
      );
    }

    // ------------------------------------------------
    // TIME
    // ------------------------------------------------

    if (
      field.type ===
      "time"
    ) {
      return (
        <Input
          type="text"
          value={String(
            value || "",
          )}
          onChange={(e) =>
            setValue(
              field,
              e.target.value,
            )
          }
          placeholder="e.g. 11:30 AM"
          className={
            hasError
              ? "border-red-500 focus-visible:ring-red-500"
              : ""
          }
        />
      );
    }

    // ------------------------------------------------
    // NUMBER / NORMAL INPUT
    // ------------------------------------------------

    return (
      <Input
        type={
          field.type ===
          "number"
            ? "number"
            : "text"
        }
        value={String(
          value || "",
        )}
        onChange={(e) =>
          setValue(
            field,
            e.target.value,
          )
        }
        placeholder={`Enter ${field.label.toLowerCase()}...`}
        className={
          hasError
            ? "border-red-500 focus-visible:ring-red-500"
            : ""
        }
      />
    );
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (!template) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="font-semibold">
              Audit template
              could not be
              loaded.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <main className="mobile-safe-bottom mx-auto max-w-6xl px-5 py-8 sm:px-8">
      {/* BACK */}

      <Button
        variant="ghost"
        onClick={() =>
          router.push(
            "/employee",
          )
        }
      >
        <ArrowLeft data-icon="inline-start" />
        Back to Dashboard
      </Button>

      {/* HEADER */}

      <Card className="teal-wash mt-5 overflow-hidden shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-primary">
                Audit Draft ·{" "}
                {String(
                  data.formData?.[
                    "date"
                  ] ||
                    audit.date ||
                    "",
                )}
              </p>

              <h1 className="mt-2 max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl">
                {(
                  template.title ||
                  template.name ||
                  "AUDIT FORM"
                ).toUpperCase()}
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Complete the
                audit and add
                supporting
                evidence.
              </p>

              <p className="mt-2 font-mono text-xs text-muted-foreground">
                {audit.id}
              </p>
            </div>

            <Badge
              variant="secondary"
              className="w-fit"
            >
              DRAFT
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* MAIN */}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-6">
          {sections.map(
            (
              section,
              sectionIndex,
            ) => (
              <section
                key={`${
                  section.id ||
                  section.name
                }-${sectionIndex}`}
              >
                {/* SECTION HEADER */}

                <div className="mb-3 flex items-center justify-between rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Check className="size-5" />
                    </span>

                    <div>
                      <h2 className="font-semibold">
                        {section.name ||
                          section.title}
                      </h2>

                      <p className="text-xs text-muted-foreground">
                        Complete the
                        fields in
                        this section
                      </p>
                    </div>
                  </div>

                  <Badge variant="secondary">
                    {
                      section
                        .fields
                        .length
                    }{" "}
                    {section
                      .fields
                      .length ===
                    1
                      ? "field"
                      : "fields"}
                  </Badge>
                </div>

                {/* SECTION FIELDS */}

                <Card className="shadow-sm">
                  <CardContent className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                    {section.fields.map(
                      (field) => {
                        const fullWidth =
                          field.type ===
                            "textarea" ||
                          field.type ===
                            "single-choice" ||
                          field.type ===
                            "multiple-choice" ||
                          field.type ===
                            "camera-photo" ||
                          field.type ===
                            "camera-video" ||
                          field.type ===
                            "signature" ||
                          field.multiple;

                        return (
                          <div
                            key={
                              field.id
                            }
                            data-field-id={
                              field.id
                            }
                            className={
                              fullWidth
                                ? "sm:col-span-2"
                                : ""
                            }
                          >
                            <label className="block text-sm font-medium">
                              <span className="flex items-center gap-1">
                                {
                                  field.label
                                }

                                {field.required && (
                                  <span className="text-red-500">
                                    *
                                  </span>
                                )}
                              </span>

                              {field.required && (
                                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                                  Required
                                </span>
                              )}
                            </label>

                            <div className="mt-2">
                              {renderField(
                                field,
                              )}
                            </div>

                            {errors[
                              field.id
                            ] && (
                              <p className="mt-1 text-xs font-medium text-red-500">
                                This
                                field
                                is
                                required.
                              </p>
                            )}
                          </div>
                        );
                      },
                    )}
                  </CardContent>
                </Card>
              </section>
            ),
          )}
        </div>

        {/* PROGRESS */}

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">
                Audit Progress
              </CardTitle>

              <p className="text-sm text-muted-foreground">
                {
                  completedRequired
                }{" "}
                of{" "}
                {
                  requiredFields.length
                }{" "}
                required fields
                completed
              </p>
            </CardHeader>

            <CardContent>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-2xl font-bold text-primary">
                {progress}%
              </p>

              <div className="mt-5 border-t pt-4">
                <div className="rounded-lg bg-secondary p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Audit
                  </p>

                  <p className="mt-1 font-mono text-sm font-semibold">
                    {audit.id}
                  </p>
                </div>

                <div className="mt-2 rounded-lg bg-secondary p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    DRAFT
                  </p>
                </div>
              </div>

              {/* DESKTOP ACTIONS */}

              <div className="mt-5 hidden flex-col gap-2 border-t pt-4 lg:flex">
                <Button
                  variant="outline"
                  onClick={
                    saveDraft
                  }
                  disabled={saving}
                >
                  <Save data-icon="inline-start" />

                  {saving
                    ? "Saving..."
                    : "Save Draft"}
                </Button>

                <Button
                  variant="outline"
                  onClick={
                    deleteDraft
                  }
                  disabled={saving}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 data-icon="inline-start" />
                  Delete Draft
                </Button>

                <Button
                  onClick={
                    submitAudit
                  }
                  disabled={saving}
                >
                  <Send data-icon="inline-start" />

                  {saving
                    ? "Processing..."
                    : "Submit Audit"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* MOBILE ACTIONS */}

      <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-card/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={
              saveDraft
            }
            disabled={saving}
          >
            <Save data-icon="inline-start" />

            {saving
              ? "Saving..."
              : "Save"}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={
              deleteDraft
            }
            disabled={saving}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 />
          </Button>

          <Button
            className="flex-1"
            onClick={
              submitAudit
            }
            disabled={saving}
          >
            <Send data-icon="inline-start" />

            {saving
              ? "Processing..."
              : "Submit"}
          </Button>
        </div>
      </div>

      {/* CAMERA */}

      {cameraMode &&
        cameraFieldId && (
          <CameraCapture
            mode={cameraMode}
            reportId={audit.id}
            onUse={(
              item,
            ) => {
              addEvidence(
                cameraFieldId,
                item,
              );

              setCameraMode(
                null,
              );

              setCameraFieldId(
                null,
              );
            }}
            onCancel={() => {
              setCameraMode(
                null,
              );

              setCameraFieldId(
                null,
              );
            }}
          />
        )}

      {/* SIGNATURE */}

      {signatureFieldId && (
        <SignaturePad
          field={
            fields.find(
              (field) =>
                field.id ===
                signatureFieldId,
            )!
          }
          existingSignature={
            data.signatures?.[
              signatureFieldId
            ]?.signature
          }
          onSave={(
            signature,
          ) => {
            saveSignature(
              signatureFieldId,
              signature,
            );
          }}
          onCancel={() =>
            setSignatureFieldId(
              null,
            )
          }
        />
      )}
    </main>
  );
}

// ==================================================
// SIGNATURE PAD
// ==================================================

function SignaturePad({
  field,
  existingSignature,
  onSave,
  onCancel,
}: {
  field: Field;
  existingSignature?: string;
  onSave: (
    signature: string,
  ) => void;
  onCancel: () => void;
}) {
  const [
    canvas,
    setCanvas,
  ] =
    useState<HTMLCanvasElement | null>(
      null,
    );

  const [
    drawing,
    setDrawing,
  ] =
    useState(false);

  useEffect(() => {
    if (!canvas) return;

    const context =
      canvas.getContext("2d");

    if (!context) return;

    context.fillStyle =
      "#ffffff";

    context.fillRect(
      0,
      0,
      canvas.width,
      canvas.height,
    );

    context.lineWidth = 2;
    context.lineCap =
      "round";
    context.lineJoin =
      "round";
    context.strokeStyle =
      "#000000";

    if (existingSignature) {
      const image =
        new Image();

      image.onload = () => {
        context.drawImage(
          image,
          0,
          0,
          canvas.width,
          canvas.height,
        );
      };

      image.src =
        existingSignature;
    }
  }, [
    canvas,
    existingSignature,
  ]);

  function getPosition(
    event:
      | MouseEvent<HTMLCanvasElement>
      | TouchEvent<HTMLCanvasElement>,
  ) {
    if (!canvas) {
      return {
        x: 0,
        y: 0,
      };
    }

    const rect =
      canvas.getBoundingClientRect();

    if (
      "touches" in event
    ) {
      const touch =
        event.touches[0];

      if (!touch) {
        return {
          x: 0,
          y: 0,
        };
      }

      return {
        x:
          ((touch.clientX -
            rect.left) /
            rect.width) *
          canvas.width,

        y:
          ((touch.clientY -
            rect.top) /
            rect.height) *
          canvas.height,
      };
    }

    return {
      x:
        ((event.clientX -
          rect.left) /
          rect.width) *
        canvas.width,

      y:
        ((event.clientY -
          rect.top) /
          rect.height) *
        canvas.height,
    };
  }

  function startDrawing(
    event:
      | MouseEvent<HTMLCanvasElement>
      | TouchEvent<HTMLCanvasElement>,
  ) {
    event.preventDefault();

    if (!canvas) return;

    const context =
      canvas.getContext("2d");

    if (!context) return;

    const position =
      getPosition(event);

    context.beginPath();

    context.moveTo(
      position.x,
      position.y,
    );

    setDrawing(true);
  }

  function draw(
    event:
      | MouseEvent<HTMLCanvasElement>
      | TouchEvent<HTMLCanvasElement>,
  ) {
    event.preventDefault();

    if (
      !drawing ||
      !canvas
    ) {
      return;
    }

    const context =
      canvas.getContext("2d");

    if (!context) return;

    const position =
      getPosition(event);

    context.lineTo(
      position.x,
      position.y,
    );

    context.stroke();
  }

  function stopDrawing() {
    setDrawing(false);
  }

  function clearSignature() {
    if (!canvas) return;

    const context =
      canvas.getContext("2d");

    if (!context) return;

    context.fillStyle =
      "#ffffff";

    context.fillRect(
      0,
      0,
      canvas.width,
      canvas.height,
    );

    context.strokeStyle =
      "#000000";
  }

  function saveSignature() {
    if (!canvas) return;

    const signature =
      canvas.toDataURL(
        "image/png",
      );

    onSave(signature);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-background p-5 shadow-2xl">
        {/* HEADER */}

        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {field.label}
            </h2>

            <p className="text-sm text-muted-foreground">
              Sign using touch,
              mouse, or trackpad.
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={
              onCancel
            }
          >
            <X />
          </Button>
        </div>

        {/* CANVAS */}

        <div className="overflow-hidden rounded-xl border bg-white">
          <canvas
            ref={setCanvas}
            width={1000}
            height={400}
            className="h-64 w-full touch-none cursor-crosshair"
            onMouseDown={
              startDrawing
            }
            onMouseMove={draw}
            onMouseUp={
              stopDrawing
            }
            onMouseLeave={
              stopDrawing
            }
            onTouchStart={
              startDrawing
            }
            onTouchMove={draw}
            onTouchEnd={
              stopDrawing
            }
          />
        </div>

        {/* ACTIONS */}

        <div className="mt-4 flex justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={
              clearSignature
            }
          >
            Clear
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={
                onCancel
              }
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={
                saveSignature
              }
            >
              <Check data-icon="inline-start" />
              Save Signature
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}





// "use client";

// import { useMemo, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   ArrowLeft,
//   Camera,
//   Check,
//   Save,
//   Send,
//   Video,
//   X,
//   Trash2,
// } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { CameraCapture } from "@/components/camera-capture";

// type CameraMode = "photo" | "video";

// type EvidenceItem = {
//   reportId?: string;
//   type: "image" | "video";
//   url: string;
//   fileName?: string;
//   capturedAt?: string;
// };

// type Answer = {
//   value?: string | string[];
//   remarks?: string;
//   evidence?: EvidenceItem[];
// };

// // type FieldType =
// //   | "text"
// //   | "textarea"
// //   | "date"
// //   | "time"
// //   | "single-choice"
// //   | "multiple-choice"
// //   | "camera-photo"
// //   | "camera-video"
// //   | "number";
// type FieldType =
//   | "text"
//   | "textarea"
//   | "date"
//   | "time"
//   | "single-choice"
//   | "multiple-choice"
//   | "camera-photo"
//   | "camera-video"
//   | "number"
//   | "signature";

// type Field = {
//   id: string;
//   label: string;
//   type: FieldType;
//   required?: boolean;
//   options?: string[];
//   multiple?: boolean;
// };

// type Section = {
//   id?: string;
//   name: string;
//   title?: string;
//   fields: Field[];
// };

// type AuditTemplate = {
//   id: string;
//   type?: string;
//   name?: string;
//   title: string;
//   sections: Section[];
// };

// type Audit = {
//   id: string;
//   status: string;
//   customer: string;
//   location: string;
//   date: string;
//   employeeName: string;
//   templateId?: string;
//   template?: AuditTemplate;
//   answers?: Record<string, Answer>;
// };

// export function AuditDraft({ audit }: { audit: Audit }) {
//   const router = useRouter();
//   console.log("AuditDraft audit:", audit);
//   const [answers, setAnswers] = useState<Record<string, Answer>>(
//     audit.answers || {},
//   );

//   const [cameraMode, setCameraMode] = useState<CameraMode | null>(null);
//   const [cameraFieldId, setCameraFieldId] = useState<string | null>(null);

//   const [saving, setSaving] = useState(false);

//   /*
//    * Flatten all fields from all sections.
//    *
//    * This is now the same structure as Service Reports:
//    *
//    * sections[].fields[]
//    */
//   const fields = useMemo(() => {
//     return (
//       audit.template?.sections?.flatMap((section) =>
//         section.fields.map((field) => ({
//           ...field,
//           section: section.name || section.title || "",
//         })),
//       ) || []
//     );
//   }, [audit.template]);

//   /*
//    * Only fields that require an actual answer are counted
//    * in the progress/status calculation.
//    *
//    * Camera fields are evidence fields, not questions.
//    */
//   const answerFields = fields.filter(
//     (field) =>
//       field.type !== "camera-photo" && field.type !== "camera-video",
//   );

//   const answered = answerFields.filter((field) => {
//     const value = answers[field.id]?.value;

//     if (Array.isArray(value)) {
//       return value.length > 0;
//     }

//     return value !== undefined && value !== "";
//   }).length;

//   /*
//    * PASS / FAIL / N/A are only relevant to single-choice
//    * inspection fields.
//    */
//   const pass = answerFields.filter(
//     (field) => answers[field.id]?.value === "PASS",
//   ).length;

//   const fail = answerFields.filter(
//     (field) => answers[field.id]?.value === "FAIL",
//   ).length;

//   const na = answerFields.filter(
//     (field) => answers[field.id]?.value === "N/A",
//   ).length;

//   const progress = answerFields.length
//     ? Math.round((answered / answerFields.length) * 100)
//     : 0;

//   function setAnswer(
//     fieldId: string,
//     key: keyof Answer,
//     value: string | string[] | EvidenceItem[],
//   ) {
//     setAnswers((current) => ({
//       ...current,
//       [fieldId]: {
//         ...current[fieldId],
//         [key]: value,
//       },
//     }));
//   }

//   function removeEvidence(fieldId: string, evidenceIndex: number) {
//     setAnswers((current) => ({
//       ...current,
//       [fieldId]: {
//         ...current[fieldId],
//         evidence: (current[fieldId]?.evidence || []).filter(
//           (_, index) => index !== evidenceIndex,
//         ),
//       },
//     }));
//   }

//   async function deleteDraft() {
//     if (saving) return;

//     const confirmed = confirm(
//       "Delete this draft?\n\nThis action cannot be undone.",
//     );

//     if (!confirmed) return;

//     try {
//       setSaving(true);

//       const response = await fetch(`/api/audits/${audit.id}`, {
//         method: "DELETE",
//       });

//       if (!response.ok) {
//         let message = "Failed to delete draft.";

//         try {
//           const data = await response.json();
//           message = data?.error || message;
//         } catch {}

//         throw new Error(message);
//       }

//       router.push("/employee");
//       router.refresh();
//     } catch (error) {
//       console.error("DELETE DRAFT ERROR:", error);

//       alert(
//         error instanceof Error
//           ? error.message
//           : "Failed to delete draft.",
//       );
//     } finally {
//       setSaving(false);
//     }
//   }

//   async function saveDraft() {
//     if (saving) return;

//     try {
//       setSaving(true);

//       const response = await fetch(`/api/audits/${audit.id}`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           answers,
//           status: "draft",
//         }),
//       });

//       if (!response.ok) {
//         let message = "Failed to save draft.";

//         try {
//           const data = await response.json();
//           message = data?.error || message;
//         } catch {}

//         throw new Error(message);
//       }

//       alert("Draft saved successfully.");
//     } catch (error) {
//       console.error("SAVE DRAFT ERROR:", error);

//       alert(
//         error instanceof Error
//           ? error.message
//           : "Failed to save draft.",
//       );
//     } finally {
//       setSaving(false);
//     }
//   }

//   async function submitAudit() {
//     if (saving) return;

//     /*
//      * Required fields must have a value.
//      *
//      * Camera fields are intentionally excluded here because
//      * they are evidence fields.
//      */
//     const missingRequired = answerFields.filter((field) => {
//       if (!field.required) return false;

//       const value = answers[field.id]?.value;

//       if (Array.isArray(value)) {
//         return value.length === 0;
//       }

//       return value === undefined || value === "";
//     });

//     if (missingRequired.length > 0) {
//       alert(
//         `Please complete all required fields.\n\nMissing: ${missingRequired
//           .map((field) => field.label)
//           .join("\n")}`,
//       );
//       return;
//     }

//     const confirmed = confirm(
//       "Submit this audit?\n\nAfter submission, you will not be able to edit it.",
//     );

//     if (!confirmed) return;

//     try {
//       setSaving(true);

//       // Save latest answers first
//       const saveResponse = await fetch(`/api/audits/${audit.id}`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           answers,
//           status: "draft",
//         }),
//       });

//       if (!saveResponse.ok) {
//         let message = "Failed to save audit.";

//         try {
//           const data = await saveResponse.json();
//           message = data?.error || message;
//         } catch {}

//         throw new Error(message);
//       }

//       // Then submit
//       const submitResponse = await fetch(
//         `/api/audits/${audit.id}/submit`,
//         {
//           method: "POST",
//         },
//       );

//       if (!submitResponse.ok) {
//         let message = "Failed to submit audit.";

//         try {
//           const data = await submitResponse.json();
//           message = data?.error || message;
//         } catch {}

//         throw new Error(message);
//       }

//       router.push(`/employee/audits/${audit.id}`);
//       router.refresh();
//     } catch (error) {
//       console.error("SUBMIT AUDIT ERROR:", error);

//       alert(
//         error instanceof Error
//           ? error.message
//           : "Failed to submit audit.",
//       );
//     } finally {
//       setSaving(false);
//     }
//   }

//   if (!audit.template) {
//     return (
//       <main className="mx-auto max-w-6xl px-5 py-8">
//         <Card>
//           <CardContent className="p-8 text-center">
//             <p className="font-semibold">
//               Audit template could not be loaded.
//             </p>

//             <p className="mt-2 text-sm text-muted-foreground">
//               Template ID: {audit.templateId || "Unknown"}
//             </p>
//           </CardContent>
//         </Card>
//       </main>
//     );
//   }

//   /*
//    * Render an individual field according to its type.
//    */
//   function renderField(
//     field: Field,
//     fieldIndex: number,
//     sectionIndex: number,
//   ) {
//     const answer = answers[field.id] || {};
//     const value = answer.value;

//     /*
//      * Camera photo field
//      */
//     if (field.type === "camera-photo") {
//       return (
//         <Card key={field.id} className="shadow-sm">
//           <CardContent className="p-5 sm:p-6">
//             <div className="flex items-center justify-between gap-4">
//               <div>
//                 <h3 className="font-semibold">
//                   {field.label}

//                   {field.required && (
//                     <span className="ml-1 text-red-500">*</span>
//                   )}
//                 </h3>

//                 <p className="mt-1 text-sm text-muted-foreground">
//                   Capture a photo using the camera.
//                 </p>
//               </div>

//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => {
//                   setCameraFieldId(field.id);
//                   setCameraMode("photo");
//                 }}
//               >
//                 <Camera data-icon="inline-start" />
//                 Capture Photo
//               </Button>
//             </div>

//             {answer.evidence && answer.evidence.length > 0 && (
//               <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
//                 {answer.evidence.map((item, evidenceIndex) => (
//                   <div
//                     key={`${item.url}-${evidenceIndex}`}
//                     className="group relative overflow-hidden rounded-xl border bg-muted"
//                   >
//                     {item.type === "video" ? (
//                       <video
//                         src={item.url}
//                         controls
//                         playsInline
//                         className="aspect-video w-full object-cover"
//                       />
//                     ) : (
//                       <img
//                         src={item.url}
//                         alt={field.label}
//                         className="aspect-video w-full object-cover"
//                       />
//                     )}

//                     <button
//                       type="button"
//                       onClick={() =>
//                         removeEvidence(field.id, evidenceIndex)
//                       }
//                       className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600"
//                       aria-label="Remove evidence"
//                     >
//                       <X className="size-4" />
//                     </button>

//                     <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white">
//                       PHOTO
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       );
//     }

//     /*
//      * Camera video field
//      */
//     if (field.type === "camera-video") {
//       return (
//         <Card key={field.id} className="shadow-sm">
//           <CardContent className="p-5 sm:p-6">
//             <div className="flex items-center justify-between gap-4">
//               <div>
//                 <h3 className="font-semibold">
//                   {field.label}

//                   {field.required && (
//                     <span className="ml-1 text-red-500">*</span>
//                   )}
//                 </h3>

//                 <p className="mt-1 text-sm text-muted-foreground">
//                   Record a video using the camera.
//                 </p>
//               </div>

//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => {
//                   setCameraFieldId(field.id);
//                   setCameraMode("video");
//                 }}
//               >
//                 <Video data-icon="inline-start" />
//                 Record Video
//               </Button>
//             </div>

//             {answer.evidence && answer.evidence.length > 0 && (
//               <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
//                 {answer.evidence.map((item, evidenceIndex) => (
//                   <div
//                     key={`${item.url}-${evidenceIndex}`}
//                     className="group relative overflow-hidden rounded-xl border bg-muted"
//                   >
//                     <video
//                       src={item.url}
//                       controls
//                       playsInline
//                       className="aspect-video w-full object-cover"
//                     />

//                     <button
//                       type="button"
//                       onClick={() =>
//                         removeEvidence(field.id, evidenceIndex)
//                       }
//                       className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600"
//                       aria-label="Remove video"
//                     >
//                       <X className="size-4" />
//                     </button>

//                     <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white">
//                       VIDEO
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       );
//     }

//     /*
//      * Normal field
//      */
//     return (
//       <Card
//         key={field.id}
//         className={`shadow-sm transition ${
//           value === "FAIL"
//             ? "border-l-4 border-l-red-400"
//             : value === "PASS"
//               ? "border-l-4 border-l-emerald-400"
//               : value === "N/A"
//                 ? "border-l-4 border-l-slate-400"
//                 : ""
//         }`}
//       >
//         <CardContent className="p-5 sm:p-6">
//           <div className="flex gap-4">
//             <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold">
//               {String(fieldIndex + 1).padStart(2, "0")}
//             </span>

//             <div className="min-w-0 flex-1">
//               <h3 className="font-bold tracking-tight">
//                 {field.label}

//                 {field.required && (
//                   <span className="ml-1 text-red-500">*</span>
//                 )}
//               </h3>

//               {/* Text */}
//               {field.type === "text" && (
//                 <Input
//                   className="mt-4"
//                   value={typeof value === "string" ? value : ""}
//                   onChange={(e) =>
//                     setAnswer(field.id, "value", e.target.value)
//                   }
//                   placeholder={`Enter ${field.label.toLowerCase()}`}
//                 />
//               )}

//               {/* Textarea */}
//               {field.type === "textarea" && (
//                 <Textarea
//                   className="mt-4 min-h-24 resize-y"
//                   value={typeof value === "string" ? value : ""}
//                   onChange={(e) =>
//                     setAnswer(field.id, "value", e.target.value)
//                   }
//                   placeholder={`Enter ${field.label.toLowerCase()}`}
//                 />
//               )}

//               {/* Date */}
//               {field.type === "date" && (
//                 <Input
//                   type="date"
//                   className="mt-4"
//                   value={typeof value === "string" ? value : ""}
//                   onChange={(e) =>
//                     setAnswer(field.id, "value", e.target.value)
//                   }
//                 />
//               )}

//               {/* Time */}
//               {field.type === "time" && (
//                 <Input
//                   type="time"
//                   className="mt-4"
//                   value={typeof value === "string" ? value : ""}
//                   onChange={(e) =>
//                     setAnswer(field.id, "value", e.target.value)
//                   }
//                 />
//               )}

//               {/* Number */}
//               {field.type === "number" && (
//                 <Input
//                   type="number"
//                   className="mt-4"
//                   value={typeof value === "string" ? value : ""}
//                   onChange={(e) =>
//                     setAnswer(field.id, "value", e.target.value)
//                   }
//                 />
//               )}

//               {/* Single choice */}
//               {field.type === "single-choice" && (
//                 <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
//                   {(field.options || []).map((option) => (
//                     <button
//                       key={option}
//                       type="button"
//                       onClick={() =>
//                         setAnswer(field.id, "value", option)
//                       }
//                       className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
//                         value === option
//                           ? option === "PASS"
//                             ? "border-emerald-300 bg-emerald-50 text-emerald-700"
//                             : option === "FAIL"
//                               ? "border-red-300 bg-red-50 text-red-700"
//                               : option === "N/A"
//                                 ? "border-slate-300 bg-slate-100 text-slate-700"
//                                 : "border-primary bg-primary/10 text-primary"
//                           : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted/50"
//                       }`}
//                     >
//                       {value === option && (
//                         <Check className="mr-1 inline size-4" />
//                       )}

//                       {option}
//                     </button>
//                   ))}
//                 </div>
//               )}

//               {/* Multiple choice */}
//               {field.type === "multiple-choice" && (
//                 <div className="mt-4 grid gap-2">
//                   {(field.options || []).map((option) => {
//                     const selected = Array.isArray(value)
//                       ? value.includes(option)
//                       : false;

//                     return (
//                       <button
//                         key={option}
//                         type="button"
//                         onClick={() => {
//                           const current = Array.isArray(value)
//                             ? value
//                             : [];

//                           const next = selected
//                             ? current.filter((item) => item !== option)
//                             : [...current, option];

//                           setAnswer(field.id, "value", next);
//                         }}
//                         className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition ${
//                           selected
//                             ? "border-primary bg-primary/10 text-primary"
//                             : "border-border hover:border-primary/40 hover:bg-muted/50"
//                         }`}
//                       >
//                         {selected && (
//                           <Check className="mr-2 inline size-4" />
//                         )}

//                         {option}
//                       </button>
//                     );
//                   })}
//                 </div>
//               )}

//               {/* Remarks for normal fields */}
//               <label className="mt-5 block text-sm font-medium">
//                 Remarks
//                 <Textarea
//                   className="mt-2 min-h-24 resize-y"
//                   placeholder="Add your observation or remarks..."
//                   value={answer.remarks || ""}
//                   onChange={(e) =>
//                     setAnswer(field.id, "remarks", e.target.value)
//                   }
//                 />
//               </label>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <main className="mobile-safe-bottom mx-auto max-w-6xl px-5 py-8 sm:px-8">
//       {/* Back */}
//       <Button variant="ghost" onClick={() => router.push("/employee")}>
//         <ArrowLeft data-icon="inline-start" />
//         Back to Audits
//       </Button>

//       {/* Header */}
//       <Card className="teal-wash mt-5 overflow-hidden shadow-sm">
//         <CardContent className="p-6 sm:p-8">
//           <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
//             <div>
//               <p className="text-sm font-semibold text-primary">
//                 Audit Draft · {audit.date}
//               </p>

//               <h1 className="mt-2 max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl">
//                 {audit.template.title}
//               </h1>

//               <p className="mt-2 text-sm text-muted-foreground">
//                 Complete the audit fields and add supporting camera evidence.
//               </p>

//               <p className="mt-2 font-mono text-xs text-muted-foreground">
//                 {audit.id}
//               </p>
//             </div>

//             <Badge variant="secondary" className="w-fit">
//               DRAFT
//             </Badge>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Main content */}
//       <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
//         <div className="flex flex-col gap-6">
//           {/* Audit information */}
//           <Card className="shadow-sm">
//             <CardHeader>
//               <CardTitle className="text-sm uppercase tracking-[0.18em] text-primary">
//                 Audit Information
//               </CardTitle>
//             </CardHeader>

//             <CardContent className="grid gap-4 sm:grid-cols-2">
//               <label className="text-sm font-medium">
//                 Customer Name
//                 <Input
//                   className="mt-2"
//                   value={audit.customer || ""}
//                   readOnly
//                 />
//               </label>

//               <label className="text-sm font-medium">
//                 Location
//                 <Input
//                   className="mt-2"
//                   value={audit.location || ""}
//                   readOnly
//                 />
//               </label>

//               <label className="text-sm font-medium">
//                 Audit Date
//                 <Input
//                   className="mt-2"
//                   value={audit.date || ""}
//                   readOnly
//                 />
//               </label>

//               <label className="text-sm font-medium">
//                 Auditor
//                 <Input
//                   className="mt-2"
//                   value={audit.employeeName || ""}
//                   readOnly
//                 />
//               </label>
//             </CardContent>
//           </Card>

//           {/* Dynamic template sections */}
//           {audit.template.sections.map((section, sectionIndex) => (
//             <section
//               key={section.id || `${section.name}-${sectionIndex}`}
//             >
//               <div className="mb-3 flex items-center justify-between rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
//                 <div className="flex items-center gap-3">
//                   <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
//                     <Check className="size-5" />
//                   </span>

//                   <div>
//                     <h2 className="font-semibold">
//                       {section.name || section.title}
//                     </h2>

//                     <p className="text-xs text-muted-foreground">
//                       Complete the fields in this section
//                     </p>
//                   </div>
//                 </div>

//                 <Badge variant="secondary">
//                   {section.fields.length}{" "}
//                   {section.fields.length === 1 ? "field" : "fields"}
//                 </Badge>
//               </div>

//               <div className="flex flex-col gap-4">
//                 {section.fields.map((field, fieldIndex) =>
//                   renderField(field, fieldIndex, sectionIndex),
//                 )}
//               </div>
//             </section>
//           ))}
//         </div>

//         {/* Progress */}
//         <aside className="lg:sticky lg:top-24 lg:self-start">
//           <Card className="shadow-sm">
//             <CardHeader>
//               <CardTitle className="text-base">
//                 Audit Progress
//               </CardTitle>

//               <p className="text-sm text-muted-foreground">
//                 {answered} of {answerFields.length} fields answered
//               </p>
//             </CardHeader>

//             <CardContent>
//               <div className="h-2 overflow-hidden rounded-full bg-muted">
//                 <div
//                   className="h-full rounded-full bg-primary transition-all"
//                   style={{
//                     width: `${progress}%`,
//                   }}
//                 />
//               </div>

//               <p className="mt-3 text-2xl font-bold text-primary">
//                 {progress}%
//               </p>

//               <div className="mt-5 grid grid-cols-3 gap-2 border-t pt-4">
//                 <div className="rounded-lg bg-emerald-50 p-2 text-center">
//                   <p className="text-lg font-bold text-emerald-700">
//                     {pass}
//                   </p>

//                   <p className="text-[10px] font-semibold uppercase text-emerald-700">
//                     Pass
//                   </p>
//                 </div>

//                 <div className="rounded-lg bg-red-50 p-2 text-center">
//                   <p className="text-lg font-bold text-red-700">
//                     {fail}
//                   </p>

//                   <p className="text-[10px] font-semibold uppercase text-red-700">
//                     Fail
//                   </p>
//                 </div>

//                 <div className="rounded-lg bg-slate-100 p-2 text-center">
//                   <p className="text-lg font-bold text-slate-700">
//                     {na}
//                   </p>

//                   <p className="text-[10px] font-semibold uppercase text-slate-700">
//                     N/A
//                   </p>
//                 </div>
//               </div>

//               {/* Desktop buttons */}
//               <div className="mt-5 hidden flex-col gap-2 border-t pt-4 lg:flex">
//                 <Button
//                   variant="outline"
//                   onClick={saveDraft}
//                   disabled={saving}
//                 >
//                   <Save data-icon="inline-start" />
//                   {saving ? "Saving..." : "Save Draft"}
//                 </Button>

//                 <Button
//                   variant="outline"
//                   onClick={deleteDraft}
//                   disabled={saving}
//                   className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
//                 >
//                   <Trash2 data-icon="inline-start" />
//                   Delete Draft
//                 </Button>

//                 <Button
//                   onClick={submitAudit}
//                   disabled={saving}
//                 >
//                   <Send data-icon="inline-start" />
//                   {saving ? "Processing..." : "Submit Audit"}
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>
//         </aside>
//       </div>

//       {/* Mobile bottom buttons */}
//       <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-card/95 p-3 backdrop-blur lg:hidden">
//         <div className="mx-auto flex max-w-6xl gap-2">
//           <Button
//             variant="outline"
//             className="flex-1"
//             onClick={saveDraft}
//             disabled={saving}
//           >
//             <Save data-icon="inline-start" />
//             {saving ? "Saving..." : "Save Draft"}
//           </Button>

//           <Button
//             className="flex-1"
//             onClick={submitAudit}
//             disabled={saving}
//           >
//             <Send data-icon="inline-start" />
//             {saving ? "Processing..." : "Submit"}
//           </Button>
//         </div>
//       </div>

//       {/* Camera modal */}
//       {cameraMode && cameraFieldId && (
//         <CameraCapture
//           mode={cameraMode}
//           reportId={audit.id}
//           onUse={(item) => {
//             console.log("Uploaded evidence:", item);

//             setAnswers((current) => ({
//               ...current,
//               [cameraFieldId]: {
//                 ...current[cameraFieldId],
//                 evidence: [
//                   ...(current[cameraFieldId]?.evidence || []),
//                   item,
//                 ],
//               },
//             }));

//             setCameraMode(null);
//             setCameraFieldId(null);
//           }}
//           onCancel={() => {
//             setCameraMode(null);
//             setCameraFieldId(null);
//           }}
//         />
//       )}
//     </main>
//   );
// }

