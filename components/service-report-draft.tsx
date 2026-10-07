// "use client";

// import { useRouter } from "next/navigation";
// import { ArrowLeft } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";

// export function ServiceReportDraft({
//   report,
// }: {
//   report: any;
// }) {
//   const router = useRouter();

//   const evidence = Object.values(
//     report.evidence || {},
//   ).flat() as any[];

//   const customerEvidence = evidence.filter(
//     (e: any) => e.type === "customer",
//   );

//   const otherEvidence = evidence.filter(
//     (e: any) => e.type !== "customer",
//   );

//   return (
//     <main className="mx-auto flex max-w-4xl flex-col gap-6 px-5 py-8">
//       {/* BACK */}

//       <Button
//         variant="ghost"
//         className="self-start"
//         onClick={() => router.push("/employee")}
//       >
//         <ArrowLeft data-icon="inline-start" />
//         Back to Dashboard
//       </Button>

//       {/* HEADER */}

//       <div>
//         <p className="text-sm font-semibold text-primary">
//           {report.id}
//         </p>

//         <h1 className="mt-2 text-3xl font-bold">
//           EQUIPMENT SERVICE & MAINTENANCE REPORT
//         </h1>

//         <Badge className="mt-3">
//           {report.status}
//         </Badge>
//       </div>

//       {/* JOB INFORMATION */}

//       <Card>
//         <CardHeader>
//           <CardTitle>JOB INFORMATION</CardTitle>
//         </CardHeader>

//         <CardContent className="grid gap-4 sm:grid-cols-2">
//           {[
//             ["Customer", report.customer],
//             ["Address", report.address],
//             ["Engineer", report.engineer],
//             ["Date", report.date],
//             ["Time", report.time],
//             ["Equipment", report.equipment],
//             ["Serial Number", report.serial],
//           ].map(([key, value]) => (
//             <div key={key}>
//               <p className="text-xs font-semibold uppercase text-muted-foreground">
//                 {key}
//               </p>

//               <p className="mt-1">
//                 {value || "—"}
//               </p>
//             </div>
//           ))}
//         </CardContent>
//       </Card>

//       {/* SERVICE TYPE */}

//       <Card>
//         <CardHeader>
//           <CardTitle>SERVICE TYPE</CardTitle>
//         </CardHeader>

//         <CardContent>
//           {report.serviceType || "—"}
//         </CardContent>
//       </Card>

//       {/* INSTALLED SYSTEM */}

//       <Card>
//         <CardHeader>
//           <CardTitle>INSTALLED SYSTEM CHECKED</CardTitle>
//         </CardHeader>

//         <CardContent>
//           {report.systems?.length > 0
//             ? report.systems.join(", ")
//             : "—"}
//         </CardContent>
//       </Card>

//       {/* FAULT + ACTIONS */}

//       <Card>
//         <CardHeader>
//           <CardTitle>
//             FAULT DIAGNOSIS & ACTION LOG
//           </CardTitle>
//         </CardHeader>

//         <CardContent className="flex flex-col gap-4">
//           <div>
//             <p className="text-sm font-semibold">
//               Reported Fault
//             </p>

//             <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
//               {report.reportedFault || "—"}
//             </p>
//           </div>

//           {report.actions?.map(
//             (action: string, index: number) => (
//               <div key={index}>
//                 <p className="text-sm font-semibold">
//                   Action {index + 1}
//                 </p>

//                 <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
//                   {action || "—"}
//                 </p>
//               </div>
//             ),
//           )}
//         </CardContent>
//       </Card>

//       {/* CUSTOMER EVIDENCE */}

//       <Card>
//         <CardHeader>
//           <CardTitle>CUSTOMER EVIDENCE</CardTitle>
//         </CardHeader>

//         <CardContent className="flex flex-col gap-4">
//           {report.customerRemarks && (
//             <div>
//               <p className="text-sm font-semibold">
//                 Customer Remarks
//               </p>

//               <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
//                 {report.customerRemarks}
//               </p>
//             </div>
//           )}

//           {customerEvidence.length > 0 ? (
//             <div className="grid gap-4 sm:grid-cols-2">
//               {customerEvidence.map(
//                 (e: any, index: number) => (
//                   <div
//                     key={`${e.url}-${index}`}
//                     className="overflow-hidden rounded-xl border bg-muted"
//                   >
//                     {e.type === "video" ? (
//                       <video
//                         src={e.url}
//                         controls
//                         playsInline
//                         className="max-h-72 w-full object-cover"
//                       />
//                     ) : (
//                       <img
//                         src={e.url}
//                         alt={`Customer evidence ${
//                           index + 1
//                         }`}
//                         className="max-h-72 w-full object-cover"
//                       />
//                     )}
//                   </div>
//                 ),
//               )}
//             </div>
//           ) : (
//             <p className="text-sm text-muted-foreground">
//               No customer evidence attached.
//             </p>
//           )}
//         </CardContent>
//       </Card>

//       {/* GENERAL EVIDENCE */}

//       <Card>
//         <CardHeader>
//           <CardTitle>EVIDENCE</CardTitle>
//         </CardHeader>

//         <CardContent>
//           {otherEvidence.length > 0 ? (
//             <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
//               {otherEvidence.map(
//                 (e: any, index: number) => (
//                   <a
//                     key={`${e.url}-${index}`}
//                     href={e.url}
//                     target="_blank"
//                     rel="noreferrer"
//                     className="group overflow-hidden rounded-xl border bg-background p-2 transition hover:shadow-md"
//                   >
//                     <div className="overflow-hidden rounded-lg">
//                       {e.type === "video" ? (
//                         <video
//                           src={e.url}
//                           controls
//                           playsInline
//                           className="aspect-square w-full object-cover"
//                         />
//                       ) : (
//                         <img
//                           src={e.url}
//                           alt={`Evidence ${
//                             index + 1
//                           }`}
//                           className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
//                         />
//                       )}
//                     </div>

//                     <span className="mt-2 block text-sm capitalize text-muted-foreground">
//                       {e.type === "video"
//                         ? "Video"
//                         : "Photo"}
//                     </span>
//                   </a>
//                 ),
//               )}
//             </div>
//           ) : (
//             <p className="text-sm text-muted-foreground">
//               No evidence attached.
//             </p>
//           )}
//         </CardContent>
//       </Card>
//     </main>
//   );
// }
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Check,
  Plus,
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
  reportId?: string;
  type: "image" | "video";
  url: string;
  fileName?: string;
  capturedAt?: string;
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

type ServiceTemplate = {
  id: string;
  name?: string;
  title?: string;
  type?: string;
  sections: Section[];
};

type ServiceData = {
  customer: string;
  address: string;
  engineer: string;
  date: string;
  time: string;
  equipment: string;
  serial: string;
  serviceType: string;
  systems: string[];
  reportedFault: string;
  actions: string[];
  customerName: string;
  customerRemarks: string;
  evidence: Record<string, EvidenceItem[]>;
};

const keyMap: Record<string, keyof ServiceData> = {
  "customer-name": "customer",
  "customer-address": "address",
  "engineer-name": "engineer",
  "service-call-date": "date",
  "service-call-time": "time",
  equipment: "equipment",
  "serial-number": "serial",
  "service-type": "serviceType",
  "installed-systems": "systems",
  "reported-fault": "reportedFault",
  actions: "actions",
  "customer-name-evidence": "customerName",
  "customer-remarks": "customerRemarks",
};

export function ServiceReportDraft({
  report,
}: {
  report: any;
}) {
  const router = useRouter();

  const [template, setTemplate] = useState<ServiceTemplate | null>(
    report.template || null,
  );

  const [data, setData] = useState<ServiceData>({
    customer: report.customer || "",
    address: report.address || "",
    engineer: report.engineer || "",
    date: report.date || "",
    time: report.time || "",
    equipment: report.equipment || "",
    serial: report.serial || "",
    serviceType: report.serviceType || "",
    systems: Array.isArray(report.systems) ? report.systems : [],
    reportedFault: report.reportedFault || "",
    actions:
      Array.isArray(report.actions) && report.actions.length > 0
        ? report.actions
        : [""],
    customerName: report.customerName || "",
    customerRemarks: report.customerRemarks || "",
    evidence:
      report.evidence &&
      typeof report.evidence === "object" &&
      !Array.isArray(report.evidence)
        ? report.evidence
        : {},
  });

  const [saving, setSaving] = useState(false);

  const [cameraMode, setCameraMode] = useState<CameraMode | null>(null);
  const [cameraFieldId, setCameraFieldId] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  /*
   * Load the service template dynamically.
   * If the page already provided report.template,
   * we don't need to fetch it again.
   */
  useEffect(() => {
    if (report.template) return;

    fetch("/api/templates/service-report")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load service report template.");
        }

        return response.json();
      })
      .then((result) => {
        setTemplate(result);
      })
      .catch((error) => {
        console.error("SERVICE TEMPLATE ERROR:", error);
      });
  }, [report.template]);

  const sections = template?.sections || [];

  /*
   * All fields from the template.
   */
  const fields = useMemo(() => {
    return sections.flatMap((section) =>
      section.fields.map((field) => ({
        ...field,
        section: section.name || section.title || "",
      })),
    );
  }, [sections]);

  /*
   * Required fields are calculated from templates.json.
   * Nothing is hardcoded here.
   */
  const requiredFields = useMemo(() => {
    return fields.filter((field) => field.required);
  }, [fields]);

  /*
   * Check whether a field is empty.
   */
  function isFieldEmpty(field: Field) {
    if (field.type === "camera-photo" || field.type === "camera-video") {
      return !(data.evidence?.[field.id]?.length > 0);
    }

    const key = keyMap[field.id];

    if (!key) {
      return true;
    }

    const value = data[key];

    if (Array.isArray(value)) {
      return (
        value.length === 0 ||
        value.every((item) => !String(item || "").trim())
      );
    }

    return !String(value ?? "").trim();
  }

  /*
   * Progress based on required fields.
   */
  const completedRequired = requiredFields.filter(
    (field) => !isFieldEmpty(field),
  ).length;

  const progress = requiredFields.length
    ? Math.round((completedRequired / requiredFields.length) * 100)
    : 0;

  /*
   * Update normal field value.
   */
  function setValue(field: Field, value: any) {
    const key = keyMap[field.id];

    if (!key) return;

    setData((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => {
      if (!current[field.id]) return current;

      const next = { ...current };
      delete next[field.id];
      return next;
    });
  }

  /*
   * Add camera evidence.
   */
  function addEvidence(fieldId: string, item: EvidenceItem) {
    setData((current) => ({
      ...current,
      evidence: {
        ...current.evidence,
        [fieldId]: [
          ...(current.evidence?.[fieldId] || []),
          item,
        ],
      },
    }));

    setErrors((current) => {
      if (!current[fieldId]) return current;

      const next = { ...current };
      delete next[fieldId];
      return next;
    });
  }

  /*
   * Remove one evidence item.
   */
  function removeEvidence(fieldId: string, index: number) {
    setData((current) => ({
      ...current,
      evidence: {
        ...current.evidence,
        [fieldId]: (
          current.evidence?.[fieldId] || []
        ).filter((_, i) => i !== index),
      },
    }));
  }

  /*
   * Validate only on Submit.
   *
   * Save Draft does NOT validate required fields.
   */
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

    const newErrors: Record<string, boolean> = {};

    missing.forEach((field) => {
      newErrors[field.id] = true;
    });

    setErrors(newErrors);

    /*
     * Scroll to the first missing field.
     */
    const firstMissing = document.querySelector(
      `[data-field-id="${missing[0].id}"]`,
    );

    firstMissing?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    return false;
  }

  /*
   * Save current report data.
   */
  async function saveDraft() {
    if (saving) return;

    try {
      setSaving(true);

      const response = await fetch(
        `/api/service-reports/${report.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...data,
            status: "DRAFT",
          }),
        },
      );

      if (!response.ok) {
        let message = "Failed to save draft.";

        try {
          const result = await response.json();
          message = result?.error || message;
        } catch {}

        throw new Error(message);
      }

      alert("Service report draft saved successfully.");
    } catch (error) {
      console.error("SAVE SERVICE REPORT ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save draft.",
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * Submit report.
   *
   * First save the latest form data,
   * then call the submit API.
   */
  async function submitReport() {
    if (saving) return;

    const valid = validateRequiredFields();

    if (!valid) {
      alert(
        "Please complete all required fields before submitting.",
      );
      return;
    }

    const confirmed = confirm(
      "Submit this service report?\n\nAfter submission, you will not be able to edit it.",
    );

    if (!confirmed) return;

    try {
      setSaving(true);

      /*
       * Save latest data first.
       */
      const saveResponse = await fetch(
        `/api/service-reports/${report.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...data,
            status: "DRAFT",
          }),
        },
      );

      if (!saveResponse.ok) {
        let message = "Failed to save service report.";

        try {
          const result = await saveResponse.json();
          message = result?.error || message;
        } catch {}

        throw new Error(message);
      }

      /*
       * Then submit.
       */
      const submitResponse = await fetch(
        `/api/service-reports/${report.id}/submit`,
        {
          method: "POST",
        },
      );

      if (!submitResponse.ok) {
        let message = "Failed to submit service report.";

        try {
          const result = await submitResponse.json();
          message = result?.error || message;
        } catch {}

        throw new Error(message);
      }

      router.push(`/employee/service-reports/${report.id}`);
      router.refresh();
    } catch (error) {
      console.error("SUBMIT SERVICE REPORT ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to submit service report.",
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * Render field.
   */
  function renderField(field: Field) {
    const key = keyMap[field.id];
    const value = key ? data[key] : "";
    const hasError = errors[field.id];

    /*
     * Multiple action textarea.
     */
    if (field.multiple) {
      const actions = Array.isArray(value) ? value : [""];

      return (
        <div className="space-y-3">
          {actions.map((action, index) => (
            <div
              key={index}
              className="flex items-start gap-2"
            >
              <Textarea
                value={String(action || "")}
                onChange={(e) => {
                  const updated = [...actions];

                  updated[index] = e.target.value;

                  setValue(field, updated);
                }}
                placeholder={`Action ${index + 1}`}
                className="min-h-24 resize-y"
              />

              {actions.length > 1 && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setValue(
                      field,
                      actions.filter(
                        (_, i) => i !== index,
                      ),
                    );
                  }}
                >
                  <Trash2 />
                </Button>
              )}
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setValue(field, [...actions, ""])
            }
          >
            <Plus data-icon="inline-start" />
            Add Action
          </Button>
        </div>
      );
    }

    /*
     * Textarea.
     */
    if (field.type === "textarea") {
      return (
        <Textarea
          value={String(value || "")}
          onChange={(e) =>
            setValue(field, e.target.value)
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

    /*
     * Single choice.
     */
    if (field.type === "single-choice") {
      return (
        <div
          className={`rounded-xl ${
            hasError
              ? "border border-red-500 bg-red-50/30 p-2"
              : ""
          }`}
        >
          <div className="flex flex-wrap gap-2">
            {(field.options || []).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() =>
                  setValue(field, option)
                }
                className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                  value === option
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-primary/40 hover:bg-muted"
                }`}
              >
                {value === option && (
                  <Check className="mr-1 inline size-4" />
                )}

                {option}
              </button>
            ))}
          </div>
        </div>
      );
    }

    /*
     * Multiple choice.
     */
    if (field.type === "multiple-choice") {
      const selected = Array.isArray(value)
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
          {(field.options || []).map((option) => {
            const checked = selected.includes(option);

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
                  checked={checked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setValue(field, [
                        ...selected,
                        option,
                      ]);
                    } else {
                      setValue(
                        field,
                        selected.filter(
                          (item) => item !== option,
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
          })}
        </div>
      );
    }

    /*
     * Camera photo / video.
     */
    if (
      field.type === "camera-photo" ||
      field.type === "camera-video"
    ) {
      const evidence =
        data.evidence?.[field.id] || [];

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
                setCameraFieldId(field.id);
                setCameraMode(
                  field.type === "camera-video"
                    ? "video"
                    : "photo",
                );
              }}
            >
              {field.type === "camera-video" ? (
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

              {field.type === "camera-video"
                ? "Record Video"
                : "Capture Photo"}
            </Button>
          </div>

          {evidence.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {evidence.map((item, index) => (
                <div
                  key={`${item.url}-${index}`}
                  className="group relative overflow-hidden rounded-xl border bg-muted"
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
                      alt={`${field.label} ${index + 1}`}
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
                    {item.type === "video"
                      ? "VIDEO"
                      : "PHOTO"}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="mt-2 text-xs text-muted-foreground">
            Capture supporting evidence when available.
          </p>
        </div>
      );
    }

    /*
     * Date.
     *
     * Keep existing DD/MM/YYYY values as text so
     * old drafts don't appear blank in a date input.
     */
    if (field.type === "date") {
      return (
        <Input
          type="text"
          value={String(value || "")}
          onChange={(e) =>
            setValue(field, e.target.value)
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

    /*
     * Time.
     */
    if (field.type === "time") {
      return (
        <Input
          type="text"
          value={String(value || "")}
          onChange={(e) =>
            setValue(field, e.target.value)
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

    /*
     * Normal input.
     */
    return (
      <Input
        type={field.type === "number" ? "number" : "text"}
        value={String(value || "")}
        onChange={(e) =>
          setValue(field, e.target.value)
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

  if (!template) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="font-semibold">
              Service report template could not be loaded.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mobile-safe-bottom mx-auto max-w-6xl px-5 py-8 sm:px-8">
      {/* Back */}
      <Button
        variant="ghost"
        onClick={() => router.push("/employee")}
      >
        <ArrowLeft data-icon="inline-start" />
        Back to Dashboard
      </Button>

      {/* Header */}
      <Card className="teal-wash mt-5 overflow-hidden shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-primary">
                Service Report Draft · {data.date || report.date}
              </p>

              <h1 className="mt-2 max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl">
                {(
                  template.title ||
                  template.name ||
                  "SERVICE REPORT"
                ).toUpperCase()}
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Complete the service report and add supporting
                evidence.
              </p>

              <p className="mt-2 font-mono text-xs text-muted-foreground">
                {report.id}
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

      {/* Main content */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-6">
          {/* Dynamic template sections */}
          {sections.map((section, sectionIndex) => (
            <section
              key={`${section.id || section.name}-${sectionIndex}`}
            >
              {/* Section heading */}
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
                      Complete the fields in this section
                    </p>
                  </div>
                </div>

                <Badge variant="secondary">
                  {section.fields.length}{" "}
                  {section.fields.length === 1
                    ? "field"
                    : "fields"}
                </Badge>
              </div>

              {/* Section fields */}
              <Card className="shadow-sm">
                <CardContent className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                  {section.fields.map((field) => {
                    const fullWidth =
                      field.type === "textarea" ||
                      field.type === "single-choice" ||
                      field.type === "multiple-choice" ||
                      field.type === "camera-photo" ||
                      field.type === "camera-video" ||
                      field.multiple;

                    return (
                      <div
                        key={field.id}
                        data-field-id={field.id}
                        className={
                          fullWidth
                            ? "sm:col-span-2"
                            : ""
                        }
                      >
                        <label className="block text-sm font-medium">
                          <span className="flex items-center gap-1">
                            {field.label}

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
                          {renderField(field)}
                        </div>

                        {errors[field.id] && (
                          <p className="mt-1 text-xs font-medium text-red-500">
                            This field is required.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </section>
          ))}
        </div>

        {/* Progress */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">
                Service Report Progress
              </CardTitle>

              <p className="text-sm text-muted-foreground">
                {completedRequired} of{" "}
                {requiredFields.length} required fields
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
                    Report
                  </p>

                  <p className="mt-1 font-mono text-sm font-semibold">
                    {report.id}
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

              {/* Desktop buttons */}
              <div className="mt-5 hidden flex-col gap-2 border-t pt-4 lg:flex">
                <Button
                  variant="outline"
                  onClick={saveDraft}
                  disabled={saving}
                >
                  <Save data-icon="inline-start" />
                  {saving
                    ? "Saving..."
                    : "Save Draft"}
                </Button>

                <Button
                  onClick={submitReport}
                  disabled={saving}
                >
                  <Send data-icon="inline-start" />
                  {saving
                    ? "Processing..."
                    : "Submit Report"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Mobile bottom buttons */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-card/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={saveDraft}
            disabled={saving}
          >
            <Save data-icon="inline-start" />
            {saving ? "Saving..." : "Save Draft"}
          </Button>

          <Button
            className="flex-1"
            onClick={submitReport}
            disabled={saving}
          >
            <Send data-icon="inline-start" />
            {saving ? "Processing..." : "Submit"}
          </Button>
        </div>
      </div>

      {/* Camera */}
      {cameraMode && cameraFieldId && (
        <CameraCapture
          mode={cameraMode}
          reportId={report.id}
          onUse={(item) => {
            addEvidence(cameraFieldId, item);

            setCameraMode(null);
            setCameraFieldId(null);
          }}
          onCancel={() => {
            setCameraMode(null);
            setCameraFieldId(null);
          }}
        />
      )}
    </main>
  );
}