
// "use client";

// import { useEffect, useMemo, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   ArrowLeft,
//   Camera,
//   CheckCircle2,
//   Loader2,
//   Plus,
//   Save,
//   Trash2,
//   Video,
//   X,
// } from "lucide-react";

// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { CameraCapture } from "@/components/camera-capture";

// type CameraMode = "photo" | "video";

// type EvidenceItem = {
//   id: string;
//   url: string;
//   type: "photo" | "video" | string;
//   fileName?: string;
//   capturedAt?: string;
//   fieldId?: string;
// };

// type SignatureData = {
//   fieldId: string;
//   dataUrl: string;
//   signedAt?: string;
//   name?: string;
// };

// type TemplateField = {
//   id: string;
//   label: string;
//   type: string;
//   required?: boolean;
//   placeholder?: string;
//   description?: string;
//   options?: Array<string | { label: string; value: string }>;
//   choices?: Array<string | { label: string; value: string }>;
//   multiple?: boolean;
// };

// type TemplateSection = {
//   id: string;
//   title: string;
//   description?: string;
//   fields?: TemplateField[];
// };

// type DailyAccentTemplate = {
//   id: string;
//   title?: string;
//   name?: string;
//   type?: string;
//   sections?: TemplateSection[];
// };

// type DailyAccentReport = {
//   id: string;
//   status: string;
//   template?: DailyAccentTemplate | null;
//   templateSnapshot?: DailyAccentTemplate | null;
//   formData?: Record<string, unknown> | null;
//   evidence?: EvidenceItem[] | null;
//   signatures?: SignatureData[] | null;
//   customerId?: string | null;
//   customerName?: string | null;
//   customerAddress?: string | null;
// };

// type CameraCaptureItem = Partial<EvidenceItem> & {
//   url: string;
//   type?: string;
// };

// type Props = {
//   report: DailyAccentReport;
// };

// function normalizeEvidence(value: unknown): EvidenceItem[] {
//   if (!Array.isArray(value)) return [];

//   return value.filter(
//     (item): item is EvidenceItem =>
//       Boolean(
//         item &&
//           typeof item === "object" &&
//           "url" in item &&
//           typeof item.url === "string",
//       ),
//   );
// }

// function normalizeSignatures(value: unknown): SignatureData[] {
//   if (!Array.isArray(value)) return [];

//   return value.filter(
//     (item): item is SignatureData =>
//       Boolean(
//         item &&
//           typeof item === "object" &&
//           "fieldId" in item &&
//           "dataUrl" in item &&
//           typeof item.fieldId === "string" &&
//           typeof item.dataUrl === "string",
//       ),
//   );
// }

// function normalizeFormData(value: unknown): Record<string, unknown> {
//   if (!value || typeof value !== "object" || Array.isArray(value)) {
//     return {};
//   }

//   return value as Record<string, unknown>;
// }

// function getFieldType(field: TemplateField): string {
//   return String(field.type || "text").toLowerCase().replaceAll("_", "-");
// }

// function getFieldOptions(field: TemplateField): Array<{
//   label: string;
//   value: string;
// }> {
//   const options = field.options ?? field.choices ?? [];

//   return options.map((option) => {
//     if (typeof option === "string") {
//       return { label: option, value: option };
//     }

//     return {
//       label: option.label,
//       value: option.value,
//     };
//   });
// }

// function isPhotoField(field: TemplateField): boolean {
//   const type = getFieldType(field);
//   return type === "camera-photo" || type === "photo" || type === "image";
// }

// function isVideoField(field: TemplateField): boolean {
//   const type = getFieldType(field);
//   return type === "camera-video" || type === "video";
// }

// function isCameraField(field: TemplateField): boolean {
//   return isPhotoField(field) || isVideoField(field);
// }

// function isSignatureField(field: TemplateField): boolean {
//   const type = getFieldType(field);
//   return type === "signature" || type === "customer-signature";
// }

// function isChoiceField(field: TemplateField): boolean {
//   const type = getFieldType(field);
//   return (
//     type === "single-choice" ||
//     type === "select" ||
//     type === "radio" ||
//     type === "multiple-choice" ||
//     type === "checkbox"
//   );
// }

// function getInitialTemplate(report: DailyAccentReport): DailyAccentTemplate | null {
//   return report.template ?? report.templateSnapshot ?? null;
// }

// export function DailyAccentReportDraft({ report }: Props) {
//   const router = useRouter();

//   const [template, setTemplate] = useState<DailyAccentTemplate | null>(
//     getInitialTemplate(report),
//   );
//   const [formData, setFormData] = useState<Record<string, unknown>>(() =>
//     normalizeFormData(report.formData),
//   );
//   const [evidence, setEvidence] = useState<EvidenceItem[]>(() =>
//     normalizeEvidence(report.evidence),
//   );
//   const [signatures, setSignatures] = useState<SignatureData[]>(() =>
//     normalizeSignatures(report.signatures),
//   );

//   const [loadingTemplate, setLoadingTemplate] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [cameraMode, setCameraMode] = useState<CameraMode | null>(null);
//   const [cameraFieldId, setCameraFieldId] = useState<string | null>(null);
//   const [signatureField, setSignatureField] = useState<TemplateField | null>(
//     null,
//   );
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [notice, setNotice] = useState("");

//   const sections = useMemo(
//     () => (Array.isArray(template?.sections) ? template.sections : []),
//     [template],
//   );

//   const fields = useMemo(
//     () => sections.flatMap((section) => section.fields ?? []),
//     [sections],
//   );

//   const completedRequiredCount = useMemo(() => {
//     const requiredFields = fields.filter((field) => field.required);

//     return requiredFields.filter((field) => {
//       const type = getFieldType(field);

//       if (isCameraField(field)) {
//         return evidence.some((item) => item.fieldId === field.id);
//       }

//       if (isSignatureField(field)) {
//         return signatures.some((item) => item.fieldId === field.id);
//       }

//       const value = formData[field.id];

//       if (Array.isArray(value)) return value.length > 0;
//       if (typeof value === "boolean") return true;

//       return value !== undefined && value !== null && String(value).trim() !== "";
//     }).length;
//   }, [fields, evidence, signatures, formData]);

//   const requiredCount = fields.filter((field) => field.required).length;

//   const progress =
//     requiredCount === 0
//       ? 100
//       : Math.round((completedRequiredCount / requiredCount) * 100);

//   useEffect(() => {
//     if (template?.sections?.length) return;

//     let cancelled = false;

//     async function loadTemplate() {
//       setLoadingTemplate(true);

//       try {
//         const response = await fetch("/api/templates/daily-accent-report", {
//           cache: "no-store",
//         });

//         if (!response.ok) {
//           throw new Error("Unable to load the Daily Action Report template.");
//         }

//         const result = await response.json();
//         const loadedTemplate =
//           result?.template ??
//           result?.templateSnapshot ??
//           result;

//         if (!cancelled && loadedTemplate?.sections) {
//           setTemplate(loadedTemplate);
//         }
//       } catch (error) {
//         if (!cancelled) {
//           setNotice(
//             error instanceof Error
//               ? error.message
//               : "Unable to load the report template.",
//           );
//         }
//       } finally {
//         if (!cancelled) setLoadingTemplate(false);
//       }
//     }

//     void loadTemplate();

//     return () => {
//       cancelled = true;
//     };
//   }, [template?.sections?.length]);

//   function updateField(fieldId: string, value: unknown) {
//     setFormData((current) => ({ ...current, [fieldId]: value }));

//     setErrors((current) => {
//       if (!current[fieldId]) return current;

//       const next = { ...current };
//       delete next[fieldId];
//       return next;
//     });
//   }

//   function openCamera(field: TemplateField) {
//     setCameraFieldId(field.id);
//     setCameraMode(isVideoField(field) ? "video" : "photo");
//   }

//   function handleEvidenceUsed(item: CameraCaptureItem) {
//     if (!cameraFieldId) return;

//     const nextItem: EvidenceItem = {
//       id:
//         item.id ||
//         `${cameraFieldId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
//       url: item.url,
//       type: item.type || cameraMode || "photo",
//       fileName: item.fileName,
//       capturedAt: item.capturedAt || new Date().toISOString(),
//       fieldId: cameraFieldId,
//     };

//     setEvidence((current) => [...current, nextItem]);

//     setErrors((current) => {
//       const next = { ...current };
//       delete next[cameraFieldId];
//       return next;
//     });

//     setCameraMode(null);
//     setCameraFieldId(null);
//   }

//   function removeEvidence(evidenceId: string) {
//     setEvidence((current) => current.filter((item) => item.id !== evidenceId));
//   }

//   function saveSignature(signature: SignatureData) {
//     setSignatures((current) => [
//       ...current.filter((item) => item.fieldId !== signature.fieldId),
//       signature,
//     ]);

//     setErrors((current) => {
//       const next = { ...current };
//       delete next[signature.fieldId];
//       return next;
//     });

//     setSignatureField(null);
//   }

//   function removeSignature(fieldId: string) {
//     setSignatures((current) =>
//       current.filter((item) => item.fieldId !== fieldId),
//     );
//   }

//   function validateForm(): boolean {
//     const nextErrors: Record<string, string> = {};

//     for (const field of fields) {
//       if (!field.required) continue;

//       if (isCameraField(field)) {
//         const hasEvidence = evidence.some(
//           (item) => item.fieldId === field.id,
//         );

//         if (!hasEvidence) {
//           nextErrors[field.id] = `Please add ${field.label.toLowerCase()}.`;
//         }

//         continue;
//       }

//       if (isSignatureField(field)) {
//         const hasSignature = signatures.some(
//           (item) => item.fieldId === field.id && item.dataUrl,
//         );

//         if (!hasSignature) {
//           nextErrors[field.id] = `Please provide ${field.label.toLowerCase()}.`;
//         }

//         continue;
//       }

//       const value = formData[field.id];

//       const isEmpty =
//         value === undefined ||
//         value === null ||
//         (typeof value === "string" && value.trim() === "") ||
//         (Array.isArray(value) && value.length === 0);

//       if (isEmpty) {
//         nextErrors[field.id] = `${field.label} is required.`;
//       }
//     }

//     setErrors(nextErrors);

//     if (Object.keys(nextErrors).length > 0) {
//       setNotice("Please complete all required fields before submitting.");
//       return false;
//     }

//     setNotice("");
//     return true;
//   }

//   async function saveDraft() {
//     setSaving(true);
//     setNotice("");

//     try {
//       const response = await fetch(
//         `/api/daily-accent-report/${encodeURIComponent(report.id)}`,
//         {
//           method: "PUT",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             formData,
//             evidence,
//             signatures,
//           }),
//         },
//       );

//       const result = await response.json().catch(() => ({}));

//       if (!response.ok) {
//         throw new Error(result.error || "Failed to save the draft.");
//       }

//       setNotice("Draft saved successfully.");
//       router.refresh();
//     } catch (error) {
//       setNotice(
//         error instanceof Error ? error.message : "Failed to save the draft.",
//       );
//     } finally {
//       setSaving(false);
//     }
//   }

//   async function deleteDraft() {
//     const confirmed = window.confirm(
//       "Delete this Daily Action Report draft? This action cannot be undone.",
//     );

//     if (!confirmed) return;

//     setDeleting(true);
//     setNotice("");

//     try {
//       const response = await fetch(
//         `/api/daily-accent-report/${encodeURIComponent(report.id)}`,
//         { method: "DELETE" },
//       );

//       const result = await response.json().catch(() => ({}));

//       if (!response.ok) {
//         throw new Error(result.error || "Failed to delete the draft.");
//       }

//       router.push("/employee");
//       router.refresh();
//     } catch (error) {
//       setNotice(
//         error instanceof Error ? error.message : "Failed to delete the draft.",
//       );
//       setDeleting(false);
//     }
//   }

//   async function submitReport() {
//     if (!validateForm()) {
//       window.scrollTo({ top: 0, behavior: "smooth" });
//       return;
//     }

//     const confirmed = window.confirm(
//       "Submit this Daily Action Report? After submission, you will not be able to edit it.",
//     );

//     if (!confirmed) return;

//     setSubmitting(true);
//     setNotice("");

//     try {
//       // Save the latest form values before changing the report status.
//       const saveResponse = await fetch(
//         `/api/daily-accent-report/${encodeURIComponent(report.id)}`,
//         {
//           method: "PUT",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             formData,
//             evidence,
//             signatures,
//           }),
//         },
//       );

//       const saveResult = await saveResponse.json().catch(() => ({}));

//       if (!saveResponse.ok) {
//         throw new Error(saveResult.error || "Failed to save the report.");
//       }

//       const submitResponse = await fetch(
//         `/api/daily-accent-report/${encodeURIComponent(report.id)}/submit`,
//         { method: "POST" },
//       );

//       const submitResult = await submitResponse.json().catch(() => ({}));

//       if (!submitResponse.ok) {
//         throw new Error(submitResult.error || "Failed to submit the report.");
//       }

//       router.push(
//         `/employee/daily-accent-reports/${encodeURIComponent(report.id)}`,
//       );
//       router.refresh();
//     } catch (error) {
//       setNotice(
//         error instanceof Error ? error.message : "Failed to submit the report.",
//       );
//       setSubmitting(false);
//     }
//   }

//   function renderField(field: TemplateField) {
//     const type = getFieldType(field);
//     const value = formData[field.id];
//     const fieldError = errors[field.id];
//     const fieldEvidence = evidence.filter(
//       (item) => item.fieldId === field.id,
//     );
//     const signature = signatures.find(
//       (item) => item.fieldId === field.id,
//     );

//     const label = (
//       <label
//         htmlFor={field.id}
//         className="mb-2 block text-sm font-medium text-foreground"
//       >
//         {field.label}
//         {field.required && <span className="ml-1 text-red-500">*</span>}
//       </label>
//     );

//     return (
//       <div key={field.id} className="space-y-2">
//         {label}

//         {field.description && (
//           <p className="text-sm text-muted-foreground">
//             {field.description}
//           </p>
//         )}

//         {isCameraField(field) ? (
//           <div className="space-y-3">
//             <div className="flex flex-wrap gap-2">
//               {isPhotoField(field) && (
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={() => openCamera(field)}
//                 >
//                   <Camera className="mr-2 size-4" />
//                   Add Photo
//                 </Button>
//               )}

//               {isVideoField(field) && (
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={() => openCamera(field)}
//                 >
//                   <Video className="mr-2 size-4" />
//                   Record Video
//                 </Button>
//               )}
//             </div>

//             {fieldEvidence.length > 0 && (
//               <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
//                 {fieldEvidence.map((item) => (
//                   <div
//                     key={item.id}
//                     className="overflow-hidden rounded-lg border"
//                   >
//                     {item.type === "video" ? (
//                       <video
//                         src={item.url}
//                         controls
//                         className="aspect-video w-full bg-black object-contain"
//                       />
//                     ) : (
//                       <a
//                         href={item.url}
//                         target="_blank"
//                         rel="noreferrer"
//                         className="block"
//                       >
//                         {/* eslint-disable-next-line @next/next/no-img-element */}
//                         <img
//                           src={item.url}
//                           alt={item.fileName || field.label}
//                           className="aspect-video w-full object-cover"
//                         />
//                       </a>
//                     )}

//                     <div className="flex items-center justify-between gap-2 p-2">
//                       <span className="min-w-0 truncate text-xs text-muted-foreground">
//                         {item.fileName || "Evidence"}
//                       </span>

//                       <Button
//                         type="button"
//                         variant="ghost"
//                         size="icon"
//                         aria-label="Remove evidence"
//                         onClick={() => removeEvidence(item.id)}
//                       >
//                         <Trash2 className="size-4 text-red-500" />
//                       </Button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         ) : isSignatureField(field) ? (
//           <div className="space-y-3">
//             {signature ? (
//               <div className="rounded-lg border p-3">
//                 {/* eslint-disable-next-line @next/next/no-img-element */}
//                 <img
//                   src={signature.dataUrl}
//                   alt={`${field.label} signature`}
//                   className="h-28 max-w-full object-contain"
//                 />

//                 <div className="mt-2 flex flex-wrap gap-2">
//                   <Button
//                     type="button"
//                     variant="outline"
//                     size="sm"
//                     onClick={() => setSignatureField(field)}
//                   >
//                     Replace Signature
//                   </Button>

//                   <Button
//                     type="button"
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => removeSignature(field.id)}
//                   >
//                     <Trash2 className="mr-2 size-4" />
//                     Remove
//                   </Button>
//                 </div>
//               </div>
//             ) : (
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => setSignatureField(field)}
//               >
//                 <Plus className="mr-2 size-4" />
//                 Add Signature
//               </Button>
//             )}
//           </div>
//         ) : type === "textarea" || type === "multiline" || field.multiple ? (
//           <Textarea
//             id={field.id}
//             value={typeof value === "string" ? value : ""}
//             placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
//             onChange={(event) => updateField(field.id, event.target.value)}
//             rows={4}
//           />
//         ) : isChoiceField(field) ? (
//           <div className="space-y-2">
//             {getFieldOptions(field).map((option) => {
//               const multiple =
//                 type === "multiple-choice" ||
//                 type === "checkbox" ||
//                 field.multiple;

//               const selectedValues = Array.isArray(value)
//                 ? value.map(String)
//                 : [];

//               const selected = multiple
//                 ? selectedValues.includes(option.value)
//                 : String(value ?? "") === option.value;

//               return (
//                 <label
//                   key={option.value}
//                   className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm"
//                 >
//                   <input
//                     type={multiple ? "checkbox" : "radio"}
//                     name={field.id}
//                     value={option.value}
//                     checked={selected}
//                     onChange={() => {
//                       if (multiple) {
//                         const next = selected
//                           ? selectedValues.filter(
//                               (item) => item !== option.value,
//                             )
//                           : [...selectedValues, option.value];

//                         updateField(field.id, next);
//                       } else {
//                         updateField(field.id, option.value);
//                       }
//                     }}
//                   />
//                   <span>{option.label}</span>
//                 </label>
//               );
//             })}
//           </div>
//         ) : type === "date" || type === "time" || type === "number" ? (
//           <Input
//             id={field.id}
//             type={type}
//             value={value === undefined || value === null ? "" : String(value)}
//             placeholder={field.placeholder}
//             onChange={(event) => updateField(field.id, event.target.value)}
//           />
//         ) : type === "boolean" || type === "yes-no" ? (
//           <div className="flex flex-wrap gap-2">
//             {[
//               { label: "Yes", value: "Yes" },
//               { label: "No", value: "No" },
//             ].map((option) => (
//               <Button
//                 key={option.value}
//                 type="button"
//                 variant={String(value ?? "") === option.value ? "default" : "outline"}
//                 onClick={() => updateField(field.id, option.value)}
//               >
//                 {option.label}
//               </Button>
//             ))}
//           </div>
//         ) : (
//           <Input
//             id={field.id}
//             type="text"
//             value={value === undefined || value === null ? "" : String(value)}
//             placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
//             onChange={(event) => updateField(field.id, event.target.value)}
//           />
//         )}

//         {fieldError && (
//           <p className="text-sm text-red-500">{fieldError}</p>
//         )}
//       </div>
//     );
//   }

//   if (cameraMode && cameraFieldId) {
//     return (
//       <div className="space-y-4">
//         <div className="flex items-center justify-between gap-3">
//           <div>
//             <h2 className="text-lg font-semibold">
//               {cameraMode === "photo" ? "Capture Photo" : "Record Video"}
//             </h2>
//             <p className="text-sm text-muted-foreground">
//               {fields.find((field) => field.id === cameraFieldId)?.label}
//             </p>
//           </div>

//           <Button
//             type="button"
//             variant="outline"
//             onClick={() => {
//               setCameraMode(null);
//               setCameraFieldId(null);
//             }}
//           >
//             <X className="mr-2 size-4" />
//             Cancel
//           </Button>
//         </div>

//         <CameraCapture
//           mode={cameraMode}
//           reportId={report.id}
//           onCancel={() => {
//             setCameraMode(null);
//             setCameraFieldId(null);
//           }}
//           onUse={handleEvidenceUsed}
//         />
//       </div>
//     );
//   }

//   if (signatureField) {
//     return (
//       <SignaturePad
//         field={signatureField}
//         onCancel={() => setSignatureField(null)}
//         onSave={saveSignature}
//       />
//     );
//   }

//   return (
//     <div className="mx-auto w-full max-w-5xl space-y-6 pb-24">
//       <div className="flex flex-wrap items-center justify-between gap-3">
//         <Button
//           type="button"
//           variant="ghost"
//           onClick={() => router.push("/employee")}
//         >
//           <ArrowLeft className="mr-2 size-4" />
//           Back
//         </Button>

//         <span className="rounded-full border px-3 py-1 text-sm font-medium">
//           {report.id}
//         </span>
//       </div>

//       <Card>
//         <CardHeader>
//           <div className="flex flex-wrap items-start justify-between gap-4">
//             <div>
//               <CardTitle className="text-2xl">
//                 {template?.title ||
//                   template?.name ||
//                   "Daily Action Report Draft"}
//               </CardTitle>
//               <p className="mt-2 text-sm text-muted-foreground">
//                 Complete the required fields and evidence before submitting.
//               </p>
//             </div>

//             <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
//               DRAFT
//             </span>
//           </div>

//           {report.customerName && (
//             <div className="mt-3 space-y-1 text-sm">
//               <p>
//                 <span className="font-medium">Customer:</span>{" "}
//                 {report.customerName}
//               </p>
//               {report.customerAddress && (
//                 <p>
//                   <span className="font-medium">Address:</span>{" "}
//                   {report.customerAddress}
//                 </p>
//               )}
//             </div>
//           )}

//           <div className="mt-4 space-y-2">
//             <div className="flex items-center justify-between text-sm">
//               <span className="text-muted-foreground">
//                 Required fields completed
//               </span>
//               <span className="font-medium">
//                 {completedRequiredCount} / {requiredCount}
//               </span>
//             </div>

//             <div className="h-2 overflow-hidden rounded-full bg-muted">
//               <div
//                 className="h-full rounded-full bg-primary transition-all"
//                 style={{ width: `${progress}%` }}
//               />
//             </div>
//           </div>
//         </CardHeader>

//         <CardContent className="space-y-6">
//           {notice && (
//             <div
//               role="status"
//               className="rounded-lg border px-4 py-3 text-sm"
//             >
//               {notice}
//             </div>
//           )}

//           {loadingTemplate ? (
//             <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
//               <Loader2 className="size-5 animate-spin" />
//               Loading report template...
//             </div>
//           ) : sections.length === 0 ? (
//             <div className="rounded-lg border border-dashed p-8 text-center">
//               <p className="font-medium">No template fields are available.</p>
//               <p className="mt-1 text-sm text-muted-foreground">
//                 Check that the Daily Action Report template exists and contains
//                 sections with fields.
//               </p>
//             </div>
//           ) : (
//             sections.map((section, index) => (
//               <section
//                 key={section.id || `section-${index}`}
//                 className="space-y-5 rounded-xl border p-4 sm:p-6"
//               >
//                 <div>
//                   <h2 className="text-lg font-semibold">
//                     {section.title || `Section ${index + 1}`}
//                   </h2>
//                   {section.description && (
//                     <p className="mt-1 text-sm text-muted-foreground">
//                       {section.description}
//                     </p>
//                   )}
//                 </div>

//                 {(section.fields ?? []).length === 0 ? (
//                   <p className="text-sm text-muted-foreground">
//                     This section has no fields.
//                   </p>
//                 ) : (
//                   <div className="space-y-6">
//                     {(section.fields ?? []).map(renderField)}
//                   </div>
//                 )}
//               </section>
//             ))
//           )}
//         </CardContent>
//       </Card>

//       <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
//         <div className="mx-auto flex max-w-5xl flex-wrap justify-end gap-2">
//           <Button
//             type="button"
//             variant="outline"
//             onClick={deleteDraft}
//             disabled={saving || deleting || submitting}
//           >
//             {deleting ? (
//               <Loader2 className="mr-2 size-4 animate-spin" />
//             ) : (
//               <Trash2 className="mr-2 size-4" />
//             )}
//             Delete Draft
//           </Button>

//           <Button
//             type="button"
//             variant="outline"
//             onClick={saveDraft}
//             disabled={saving || deleting || submitting || loadingTemplate}
//           >
//             {saving ? (
//               <Loader2 className="mr-2 size-4 animate-spin" />
//             ) : (
//               <Save className="mr-2 size-4" />
//             )}
//             Save Draft
//           </Button>

//           <Button
//             type="button"
//             onClick={submitReport}
//             disabled={saving || deleting || submitting || loadingTemplate}
//           >
//             {submitting ? (
//               <Loader2 className="mr-2 size-4 animate-spin" />
//             ) : (
//               <CheckCircle2 className="mr-2 size-4" />
//             )}
//             Submit Report
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }

// function SignaturePad({
//   field,
//   onCancel,
//   onSave,
// }: {
//   field: TemplateField;
//   onCancel: () => void;
//   onSave: (signature: SignatureData) => void;
// }) {
//   const canvasRef = useRef<HTMLCanvasElement | null>(null);
//   const drawingRef = useRef(false);
//   const hasDrawingRef = useRef(false);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const context = canvas.getContext("2d");
//     if (!context) return;

//     context.clearRect(0, 0, canvas.width, canvas.height);
//     context.fillStyle = "#ffffff";
//     context.fillRect(0, 0, canvas.width, canvas.height);
//     context.strokeStyle = "#111827";
//     context.lineWidth = 2.5;
//     context.lineCap = "round";
//     context.lineJoin = "round";
//   }, []);

//   function getPoint(event: React.PointerEvent<HTMLCanvasElement>) {
//     const canvas = canvasRef.current;
//     if (!canvas) return { x: 0, y: 0 };

//     const rect = canvas.getBoundingClientRect();

//     return {
//       x: ((event.clientX - rect.left) / rect.width) * canvas.width,
//       y: ((event.clientY - rect.top) / rect.height) * canvas.height,
//     };
//   }

//   function startDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
//     const canvas = canvasRef.current;
//     const context = canvas?.getContext("2d");
//     if (!canvas || !context) return;

//     event.preventDefault();
//     canvas.setPointerCapture(event.pointerId);

//     const point = getPoint(event);
//     context.beginPath();
//     context.moveTo(point.x, point.y);

//     drawingRef.current = true;
//     hasDrawingRef.current = true;
//   }

//   function draw(event: React.PointerEvent<HTMLCanvasElement>) {
//     if (!drawingRef.current) return;

//     const canvas = canvasRef.current;
//     const context = canvas?.getContext("2d");
//     if (!canvas || !context) return;

//     event.preventDefault();

//     const point = getPoint(event);
//     context.lineTo(point.x, point.y);
//     context.stroke();
//   }

//   function stopDrawing() {
//     drawingRef.current = false;
//   }

//   function clearSignature() {
//     const canvas = canvasRef.current;
//     const context = canvas?.getContext("2d");
//     if (!canvas || !context) return;

//     context.clearRect(0, 0, canvas.width, canvas.height);
//     context.fillStyle = "#ffffff";
//     context.fillRect(0, 0, canvas.width, canvas.height);
//     context.strokeStyle = "#111827";
//     context.lineWidth = 2.5;
//     context.lineCap = "round";
//     context.lineJoin = "round";

//     hasDrawingRef.current = false;
//   }

//   function handleSave() {
//     const canvas = canvasRef.current;
//     if (!canvas || !hasDrawingRef.current) {
//       window.alert("Please draw a signature before saving.");
//       return;
//     }

//     onSave({
//       fieldId: field.id,
//       dataUrl: canvas.toDataURL("image/png"),
//       signedAt: new Date().toISOString(),
//     });
//   }

//   return (
//     <Card className="mx-auto w-full max-w-3xl">
//       <CardHeader>
//         <CardTitle>{field.label}</CardTitle>
//         <p className="text-sm text-muted-foreground">
//           Draw your signature in the area below.
//         </p>
//       </CardHeader>

//       <CardContent className="space-y-4">
//         <div className="overflow-hidden rounded-lg border bg-white">
//           <canvas
//             ref={canvasRef}
//             width={900}
//             height={300}
//             aria-label={`${field.label} drawing area`}
//             className="block h-auto w-full touch-none"
//             style={{ aspectRatio: "3 / 1" }}
//             onPointerDown={startDrawing}
//             onPointerMove={draw}
//             onPointerUp={stopDrawing}
//             onPointerCancel={stopDrawing}
//             onPointerLeave={stopDrawing}
//           />
//         </div>

//         <div className="flex flex-wrap justify-end gap-2">
//           <Button type="button" variant="outline" onClick={onCancel}>
//             Cancel
//           </Button>

//           <Button type="button" variant="outline" onClick={clearSignature}>
//             Clear
//           </Button>

//           <Button type="button" onClick={handleSave}>
//             Save Signature
//           </Button>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  Loader2,
  Plus,
  Save,
  Send,
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

// ==================================================
// TYPES
// ==================================================

type CameraMode = "photo" | "video";

type EvidenceItem = {
  id: string;
  url: string;
  type: "photo" | "video" | string;
  fileName?: string;
  capturedAt?: string;
};

type EvidenceByField = Record<string, EvidenceItem[]>;

type SignatureValue = {
  signature: string;
  signedAt?: string;
};

type SignaturesByField = Record<string, SignatureValue>;

type LegacyEvidenceItem = EvidenceItem & {
  fieldId?: string;
};

type LegacySignatureData = {
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
  id?: string;
  name?: string;
  title?: string;
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
  evidence?: EvidenceByField | LegacyEvidenceItem[] | null;
  signatures?: SignaturesByField | LegacySignatureData[] | null;
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

// ==================================================
// NORMALIZERS
// ==================================================

function normalizeFormData(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function normalizeEvidence(value: unknown): EvidenceByField {
  const result: EvidenceByField = {};

  // Convert the previous flat-array structure.
  if (Array.isArray(value)) {
    for (const item of value as LegacyEvidenceItem[]) {
      if (
        !item ||
        typeof item.fieldId !== "string" ||
        typeof item.url !== "string"
      ) {
        continue;
      }

      const fieldId = item.fieldId;

      result[fieldId] ??= [];

      result[fieldId].push({
        id: item.id || `${fieldId}-${result[fieldId].length}`,
        url: item.url,
        type: item.type || "photo",
        fileName: item.fileName,
        capturedAt: item.capturedAt,
      });
    }

    return result;
  }

  if (!value || typeof value !== "object") {
    return result;
  }

  // Preserve the new field-keyed structure.
  for (const [fieldId, items] of Object.entries(value)) {
    if (!Array.isArray(items)) continue;

    result[fieldId] = items.filter(
      (item): item is EvidenceItem =>
        Boolean(
          item &&
            typeof item === "object" &&
            "url" in item &&
            typeof item.url === "string",
        ),
    );
  }

  return result;
}

function normalizeSignatures(value: unknown): SignaturesByField {
  const result: SignaturesByField = {};

  // Convert the previous flat-array structure.
  if (Array.isArray(value)) {
    for (const item of value as LegacySignatureData[]) {
      if (
        item &&
        typeof item.fieldId === "string" &&
        typeof item.dataUrl === "string"
      ) {
        result[item.fieldId] = {
          signature: item.dataUrl,
          signedAt: item.signedAt,
        };
      }
    }

    return result;
  }

  if (!value || typeof value !== "object") {
    return result;
  }

  // Preserve the new field-keyed structure.
  for (const [fieldId, signature] of Object.entries(value)) {
    if (
      signature &&
      typeof signature === "object" &&
      "signature" in signature &&
      typeof signature.signature === "string"
    ) {
      result[fieldId] = {
        signature: signature.signature,
        signedAt:
          "signedAt" in signature &&
          typeof signature.signedAt === "string"
            ? signature.signedAt
            : undefined,
      };
    }
  }

  return result;
}

// ==================================================
// FIELD HELPERS
// ==================================================

function getFieldType(field: TemplateField): string {
  return String(field.type || "text")
    .toLowerCase()
    .replaceAll("_", "-");
}

function getFieldOptions(
  field: TemplateField,
): Array<{ label: string; value: string }> {
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

  return (
    type === "camera-photo" ||
    type === "photo" ||
    type === "image"
  );
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

  return (
    type === "signature" ||
    type === "customer-signature"
  );
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

function isFieldEmpty(
  field: TemplateField,
  formData: Record<string, unknown>,
  evidence: EvidenceByField,
  signatures: SignaturesByField,
): boolean {
  if (isCameraField(field)) {
    return !(evidence[field.id] || []).length;
  }

  if (isSignatureField(field)) {
    return !signatures[field.id]?.signature;
  }

  const value = formData[field.id];

  if (Array.isArray(value)) {
    return (
      value.length === 0 ||
      value.every((item) => !String(item ?? "").trim())
    );
  }

  if (typeof value === "boolean") {
    return false;
  }

  return !String(value ?? "").trim();
}

function getInitialTemplate(
  report: DailyAccentReport,
): DailyAccentTemplate | null {
  return report.template ?? report.templateSnapshot ?? null;
}

// ==================================================
// MAIN COMPONENT
// ==================================================

export function DailyAccentReportDraft({ report }: Props) {
  const router = useRouter();

  const [template, setTemplate] = useState<DailyAccentTemplate | null>(
    getInitialTemplate(report),
  );

  const [formData, setFormData] = useState<Record<string, unknown>>(() =>
    normalizeFormData(report.formData),
  );

  const [evidence, setEvidence] = useState<EvidenceByField>(() =>
    normalizeEvidence(report.evidence),
  );

  const [signatures, setSignatures] = useState<SignaturesByField>(() =>
    normalizeSignatures(report.signatures),
  );

  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [cameraMode, setCameraMode] = useState<CameraMode | null>(null);
  const [cameraFieldId, setCameraFieldId] = useState<string | null>(null);

  const [signatureField, setSignatureField] =
    useState<TemplateField | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

  const reportApiUrl = useMemo(
    () =>
      `/api/daily-accent-report/${encodeURIComponent(report.id)}`,
    [report.id],
  );

  const sections = useMemo(
    () =>
      Array.isArray(template?.sections)
        ? template.sections
        : [],
    [template],
  );

  const fields = useMemo(
    () => sections.flatMap((section) => section.fields ?? []),
    [sections],
  );

  const requiredFields = useMemo(
    () => fields.filter((field) => field.required),
    [fields],
  );

  const completedRequiredCount = useMemo(
    () =>
      requiredFields.filter(
        (field) =>
          !isFieldEmpty(field, formData, evidence, signatures),
      ).length,
    [requiredFields, formData, evidence, signatures],
  );

  const progress =
    requiredFields.length > 0
      ? Math.round(
          (completedRequiredCount / requiredFields.length) * 100,
        )
      : 100;

  // ==================================================
  // LOAD TEMPLATE
  // ==================================================

  useEffect(() => {
    if (template?.sections?.length) return;

    let cancelled = false;

    async function loadTemplate() {
      setLoadingTemplate(true);

      try {
        const response = await fetch(
          "/api/templates/daily-accent-report",
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load the Daily Action Report template.",
          );
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
        if (!cancelled) {
          setLoadingTemplate(false);
        }
      }
    }

    void loadTemplate();

    return () => {
      cancelled = true;
    };
  }, [template?.sections?.length]);

  // ==================================================
  // UPDATE NORMAL FIELD
  // ==================================================

  function updateField(fieldId: string, value: unknown) {
    setFormData((current) => ({
      ...current,
      [fieldId]: value,
    }));

    setErrors((current) => {
      if (!current[fieldId]) return current;

      const next = { ...current };
      delete next[fieldId];

      return next;
    });
  }

  // ==================================================
  // CAMERA
  // ==================================================

  function openCamera(field: TemplateField) {
    setCameraFieldId(field.id);
    setCameraMode(isVideoField(field) ? "video" : "photo");
  }

  function handleEvidenceUsed(item: CameraCaptureItem) {
    if (!cameraFieldId) return;

    const fieldId = cameraFieldId;

    const nextItem: EvidenceItem = {
      id:
        item.id ||
        `${fieldId}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
      url: item.url,
      type: item.type || cameraMode || "photo",
      fileName: item.fileName,
      capturedAt: item.capturedAt || new Date().toISOString(),
    };

    setEvidence((current) => ({
      ...current,
      [fieldId]: [
        ...(current[fieldId] || []),
        nextItem,
      ],
    }));

    setErrors((current) => {
      const next = { ...current };
      delete next[fieldId];

      return next;
    });

    setCameraMode(null);
    setCameraFieldId(null);
  }

  function removeEvidence(fieldId: string, evidenceId: string) {
    setEvidence((current) => ({
      ...current,
      [fieldId]: (current[fieldId] || []).filter(
        (item) => item.id !== evidenceId,
      ),
    }));
  }

  function closeCamera() {
    setCameraMode(null);
    setCameraFieldId(null);
  }

  // ==================================================
  // SIGNATURE
  // ==================================================

  function saveSignature(
    fieldId: string,
    signature: string,
  ) {
    setSignatures((current) => ({
      ...current,
      [fieldId]: {
        signature,
        signedAt: new Date().toISOString(),
      },
    }));

    setErrors((current) => {
      const next = { ...current };
      delete next[fieldId];

      return next;
    });

    setSignatureField(null);
  }

  function removeSignature(fieldId: string) {
    setSignatures((current) => {
      const next = { ...current };
      delete next[fieldId];

      return next;
    });
  }

  // ==================================================
  // VALIDATION
  // ==================================================

  function validateForm(): boolean {
    const nextErrors: Record<string, string> = {};

    for (const field of requiredFields) {
      if (
        isFieldEmpty(field, formData, evidence, signatures)
      ) {
        if (isCameraField(field)) {
          nextErrors[field.id] =
            `Please add ${field.label.toLowerCase()}.`;
        } else if (isSignatureField(field)) {
          nextErrors[field.id] =
            `Please provide ${field.label.toLowerCase()}.`;
        } else {
          nextErrors[field.id] =
            `${field.label} is required.`;
        }
      }
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setNotice(
        "Please complete all required fields before submitting.",
      );

      const firstMissing = document.querySelector(
        `[data-field-id="${Object.keys(nextErrors)[0]}"]`,
      );

      firstMissing?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      return false;
    }

    setNotice("");
    return true;
  }

  // ==================================================
  // API RESPONSE HELPER
  // ==================================================

  async function getResponseError(
    response: Response,
    fallback: string,
  ): Promise<string> {
    try {
      const result = await response.json();

      return result?.error || fallback;
    } catch {
      return fallback;
    }
  }

  // ==================================================
  // SAVE DRAFT
  // ==================================================

  async function saveDraft() {
    if (saving || deleting || submitting) return;

    setSaving(true);
    setNotice("");

    try {
      const response = await fetch(reportApiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formData,
          evidence,
          signatures,
        }),
      });

      if (!response.ok) {
        throw new Error(
          await getResponseError(
            response,
            "Failed to save the draft.",
          ),
        );
      }

      setNotice("Draft saved successfully.");
      router.refresh();
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Failed to save the draft.",
      );
    } finally {
      setSaving(false);
    }
  }

  // ==================================================
  // DELETE DRAFT
  // ==================================================

  async function deleteDraft() {
    if (saving || deleting || submitting) return;

    const confirmed = window.confirm(
      "Delete this Daily Action Report draft?\n\nThis action cannot be undone.",
    );

    if (!confirmed) return;

    setDeleting(true);
    setNotice("");

    try {
      const response = await fetch(reportApiUrl, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(
          await getResponseError(
            response,
            "Failed to delete the draft.",
          ),
        );
      }

      router.push("/employee");
      router.refresh();
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Failed to delete the draft.",
      );

      setDeleting(false);
    }
  }

  // ==================================================
  // SUBMIT REPORT
  // ==================================================

  async function submitReport() {
    if (saving || deleting || submitting) return;

    if (!validateForm()) return;

    const confirmed = window.confirm(
      "Submit this Daily Action Report?\n\nAfter submission, you will not be able to edit it.",
    );

    if (!confirmed) return;

    setSubmitting(true);
    setNotice("");

    try {
      // Save the latest form data before submission.
      const saveResponse = await fetch(reportApiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formData,
          evidence,
          signatures,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error(
          await getResponseError(
            saveResponse,
            "Failed to save the report.",
          ),
        );
      }

      // Submit the report.
      const submitResponse = await fetch(
        `${reportApiUrl}/submit`,
        { method: "POST" },
      );

      if (!submitResponse.ok) {
        throw new Error(
          await getResponseError(
            submitResponse,
            "Failed to submit the report.",
          ),
        );
      }

      router.push(
        `/employee/daily-accent-reports/${encodeURIComponent(report.id)}`,
      );

      router.refresh();
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Failed to submit the report.",
      );

      setSubmitting(false);
    }
  }

  // ==================================================
  // RENDER FIELD
  // ==================================================

  function renderField(field: TemplateField) {
    const type = getFieldType(field);
    const value = formData[field.id] ?? "";
    const fieldError = errors[field.id];

    const fieldEvidence = evidence[field.id] || [];
    const signature = signatures[field.id];

    const errorClass = fieldError
      ? "border-red-500 focus-visible:ring-red-500"
      : "";

    // ------------------------------------------------
    // CAMERA PHOTO / VIDEO
    // ------------------------------------------------

    if (isCameraField(field)) {
      return (
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {fieldEvidence.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-xl border bg-card"
                >
                  {item.type === "video" ? (
                    <video
                      src={item.url}
                      controls
                      playsInline
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
                        className="aspect-video w-full object-contain bg-muted"
                      />
                    </a>
                  )}

                  <div className="flex items-center justify-between gap-2 p-3">
                    <span className="min-w-0 truncate text-xs text-muted-foreground">
                      {item.fileName || "Evidence"}
                    </span>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove evidence"
                      onClick={() =>
                        removeEvidence(field.id, item.id)
                      }
                    >
                      <Trash2 className="size-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // ------------------------------------------------
    // SIGNATURE
    // ------------------------------------------------

    if (isSignatureField(field)) {
      return (
        <div className="space-y-3">
          {signature?.signature ? (
            <div className="rounded-xl border bg-card p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signature.signature}
                alt={`${field.label} signature`}
                className="h-28 max-w-full object-contain"
              />

              {signature.signedAt && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Signed:{" "}
                  {new Date(signature.signedAt).toLocaleString()}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSignatureField(field)}
                >
                  Re-sign
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
              className="h-20 w-full border-dashed"
              onClick={() => setSignatureField(field)}
            >
              Add Signature
            </Button>
          )}
        </div>
      );
    }

    // ------------------------------------------------
    // MULTIPLE TEXT FIELDS
    // ------------------------------------------------

    if (field.multiple) {
      const values = Array.isArray(value)
        ? value.map(String)
        : [""];

      return (
        <div className="space-y-3">
          {values.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-2"
            >
              <Textarea
                value={item}
                onChange={(event) => {
                  const updated = [...values];
                  updated[index] = event.target.value;

                  updateField(field.id, updated);
                }}
                placeholder={`${field.label} ${index + 1}`}
                className={`min-h-24 resize-y ${errorClass}`}
              />

              {values.length > 1 && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Remove item"
                  onClick={() =>
                    updateField(
                      field.id,
                      values.filter((_, i) => i !== index),
                    )
                  }
                >
                  <Trash2 className="size-4 text-red-500" />
                </Button>
              )}
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              updateField(field.id, [...values, ""])
            }
          >
            <Plus className="mr-2 size-4" />
            Add Item
          </Button>
        </div>
      );
    }

    // ------------------------------------------------
    // TEXTAREA
    // ------------------------------------------------

    if (
      type === "textarea" ||
      type === "multiline"
    ) {
      return (
        <Textarea
          value={typeof value === "string" ? value : ""}
          onChange={(event) =>
            updateField(field.id, event.target.value)
          }
          placeholder={
            field.placeholder ||
            `Enter ${field.label.toLowerCase()}...`
          }
          rows={4}
          className={`min-h-24 resize-y ${errorClass}`}
        />
      );
    }

    // ------------------------------------------------
    // CHOICE FIELDS
    // ------------------------------------------------

    if (isChoiceField(field)) {
      const multiple =
        type === "multiple-choice" ||
        type === "checkbox" ||
        field.multiple;

      const selectedValues = Array.isArray(value)
        ? value.map(String)
        : [];

      return (
        <div className="space-y-2">
          {getFieldOptions(field).map((option) => {
            const selected = multiple
              ? selectedValues.includes(option.value)
              : String(value ?? "") === option.value;

            return (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition ${
                  selected
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
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
                  className="size-4 accent-primary"
                />

                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      );
    }

    // ------------------------------------------------
    // BOOLEAN / YES-NO
    // ------------------------------------------------

    if (
      type === "boolean" ||
      type === "yes-no"
    ) {
      return (
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Yes", value: "Yes" },
            { label: "No", value: "No" },
          ].map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={
                String(value ?? "") === option.value
                  ? "default"
                  : "outline"
              }
              onClick={() =>
                updateField(field.id, option.value)
              }
            >
              {option.label}
            </Button>
          ))}
        </div>
      );
    }

    // ------------------------------------------------
    // DATE / TIME / NUMBER / NORMAL INPUT
    // ------------------------------------------------

    const inputType =
      type === "date" ||
      type === "time" ||
      type === "number"
        ? type
        : "text";

    return (
      <Input
        id={field.id}
        type={inputType}
        value={
          value === undefined || value === null
            ? ""
            : String(value)
        }
        placeholder={
          field.placeholder ||
          `Enter ${field.label.toLowerCase()}...`
        }
        onChange={(event) =>
          updateField(field.id, event.target.value)
        }
        className={errorClass}
      />
    );
  }

  // ==================================================
  // CAMERA SCREEN
  // ==================================================

  if (cameraMode && cameraFieldId) {
    return (
      <main className="mx-auto max-w-6xl space-y-4 px-5 py-8 sm:px-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">
              {cameraMode === "photo"
                ? "Capture Photo"
                : "Record Video"}
            </h2>

            <p className="text-sm text-muted-foreground">
              {
                fields.find(
                  (field) => field.id === cameraFieldId,
                )?.label
              }
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={closeCamera}
          >
            <X className="mr-2 size-4" />
            Cancel
          </Button>
        </div>

        <CameraCapture
          mode={cameraMode}
          reportId={report.id}
          onCancel={closeCamera}
          onUse={handleEvidenceUsed}
        />
      </main>
    );
  }

  // ==================================================
  // SIGNATURE SCREEN
  // ==================================================

  if (signatureField) {
    return (
      <SignaturePad
        field={signatureField}
        existingSignature={
          signatures[signatureField.id]?.signature
        }
        onCancel={() => setSignatureField(null)}
        onSave={(signature) =>
          saveSignature(signatureField.id, signature)
        }
      />
    );
  }

  // ==================================================
  // LOADING
  // ==================================================

  if (loadingTemplate && !template) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-8">
        <Card>
          <CardContent className="flex items-center justify-center gap-3 p-10">
            <Loader2 className="size-5 animate-spin" />
            <span>Loading Daily Action Report...</span>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!template) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-8">
        <Card>
          <CardContent className="space-y-4 p-8 text-center">
            <p className="font-semibold">
              Daily Action Report template could not be loaded.
            </p>

            {notice && (
              <p className="text-sm text-red-500">{notice}</p>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/employee")}
            >
              <ArrowLeft className="mr-2 size-4" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  // ==================================================
  // MAIN UI
  // ==================================================

  const busy = saving || deleting || submitting;

  return (
    <main className="mobile-safe-bottom mx-auto max-w-6xl px-5 py-8 pb-28 sm:px-8 lg:pb-8">
      {/* BACK BUTTON */}

      <Button
        type="button"
        variant="ghost"
        onClick={() => router.push("/employee")}
      >
        <ArrowLeft className="mr-2 size-4" />
        Back to Dashboard
      </Button>

      {/* HEADER */}

      <Card className="teal-wash mt-5 overflow-hidden shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-primary">
                Daily Action Report Draft
              </p>

              <h1 className="mt-2 max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl">
                {(
                  template.title ||
                  template.name ||
                  "DAILY ACTION REPORT"
                ).toUpperCase()}
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Complete all required fields and attach the supporting
                evidence before submitting.
              </p>

              <p className="mt-3 font-mono text-xs text-muted-foreground">
                {report.id}
              </p>
            </div>

            <span className="w-fit rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
              DRAFT
            </span>
          </div>

          {(report.customerName || report.customerAddress) && (
            <div className="mt-5 grid gap-3 border-t border-primary/10 pt-4 text-sm sm:grid-cols-2">
              {report.customerName && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Customer
                  </p>

                  <p className="mt-1 font-semibold">
                    {report.customerName}
                  </p>
                </div>
              )}

              {report.customerAddress && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Address
                  </p>

                  <p className="mt-1 font-medium">
                    {report.customerAddress}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* NOTICE */}

      {notice && (
        <div
          role="status"
          className={`mt-5 rounded-lg border px-4 py-3 text-sm ${
            notice.toLowerCase().includes("success")
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          {notice}
        </div>
      )}

      {/* MAIN CONTENT */}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* SECTIONS */}

        <div className="flex min-w-0 flex-col gap-6">
          {sections.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="font-medium">
                  No template fields are available.
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Check that the Daily Action Report template contains
                  sections with fields.
                </p>
              </CardContent>
            </Card>
          ) : (
            sections.map((section, sectionIndex) => {
              const sectionFields = section.fields ?? [];

              return (
                <section
                  key={
                    section.id ||
                    section.name ||
                    `section-${sectionIndex}`
                  }
                >
                  {/* SECTION HEADER */}

                  <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Check className="size-5" />
                      </span>

                      <div className="min-w-0">
                        <h2 className="font-semibold">
                          {section.name ||
                            section.title ||
                            `Section ${sectionIndex + 1}`}
                        </h2>

                        <p className="text-xs text-muted-foreground">
                          Complete the fields in this section
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
                      {sectionFields.length}{" "}
                      {sectionFields.length === 1 ? "field" : "fields"}
                    </span>
                  </div>

                  {/* SECTION FIELDS */}

                  <Card className="shadow-sm">
                    <CardContent className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                      {sectionFields.map((field) => {
                        const type = getFieldType(field);

                        const fullWidth =
                          type === "textarea" ||
                          type === "multiline" ||
                          type === "single-choice" ||
                          type === "multiple-choice" ||
                          type === "checkbox" ||
                          isCameraField(field) ||
                          isSignatureField(field) ||
                          field.multiple;

                        return (
                          <div
                            key={field.id}
                            data-field-id={field.id}
                            className={
                              fullWidth ? "sm:col-span-2" : ""
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

                            {field.description && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {field.description}
                              </p>
                            )}

                            <div className="mt-2">
                              {renderField(field)}
                            </div>

                            {errors[field.id] && (
                              <p className="mt-1 text-xs font-medium text-red-500">
                                {errors[field.id]}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </section>
              );
            })
          )}
        </div>

        {/* PROGRESS SIDEBAR */}

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">
                Daily Action Report Progress
              </CardTitle>

              <p className="text-sm text-muted-foreground">
                {completedRequiredCount} of {requiredFields.length}{" "}
                required fields completed
              </p>
            </CardHeader>

            <CardContent>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="mt-3 text-2xl font-bold text-primary">
                {progress}%
              </p>

              <div className="mt-5 space-y-2 border-t pt-4">
                <div className="rounded-lg bg-secondary p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Report
                  </p>

                  <p className="mt-1 break-all font-mono text-sm font-semibold">
                    {report.id}
                  </p>
                </div>

                <div className="rounded-lg bg-secondary p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </p>

                  <p className="mt-1 text-sm font-semibold">DRAFT</p>
                </div>

                <div className="rounded-lg bg-secondary p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Evidence
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {Object.values(evidence).reduce(
                      (total, items) => total + items.length,
                      0,
                    )}{" "}
                    files attached
                  </p>
                </div>

                <div className="rounded-lg bg-secondary p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Signatures
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {Object.keys(signatures).length} completed
                  </p>
                </div>
              </div>

              {/* DESKTOP ACTIONS */}

              <div className="mt-5 hidden flex-col gap-2 border-t pt-4 lg:flex">
                <Button
                  type="button"
                  variant="outline"
                  onClick={saveDraft}
                  disabled={busy || loadingTemplate}
                >
                  {saving ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 size-4" />
                  )}

                  {saving ? "Saving..." : "Save Draft"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={deleteDraft}
                  disabled={busy || loadingTemplate}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  {deleting ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 size-4" />
                  )}

                  {deleting ? "Deleting..." : "Delete Draft"}
                </Button>

                <Button
                  type="button"
                  onClick={submitReport}
                  disabled={busy || loadingTemplate}
                >
                  {submitting ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 size-4" />
                  )}

                  {submitting ? "Submitting..." : "Submit Report"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* MOBILE ACTION BAR */}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-w-0 flex-1"
            onClick={saveDraft}
            disabled={busy || loadingTemplate}
          >
            {saving ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}

            {saving ? "Saving..." : "Save"}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Delete draft"
            onClick={deleteDraft}
            disabled={busy || loadingTemplate}
            className="shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            {deleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </Button>

          <Button
            type="button"
            className="min-w-0 flex-1"
            onClick={submitReport}
            disabled={busy || loadingTemplate}
          >
            {submitting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Send className="mr-2 size-4" />
            )}

            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>
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
  field: TemplateField;
  existingSignature?: string;
  onSave: (signature: string) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const hasDrawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#111827";

    if (existingSignature) {
      const image = new Image();

      image.onload = () => {
        context.drawImage(
          image,
          0,
          0,
          canvas.width,
          canvas.height,
        );

        hasDrawingRef.current = true;
      };

      image.src = existingSignature;
    }
  }, [existingSignature]);

  function getPoint(
    event: React.PointerEvent<HTMLCanvasElement>,
  ) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();

    return {
      x:
        ((event.clientX - rect.left) / rect.width) *
        canvas.width,
      y:
        ((event.clientY - rect.top) / rect.height) *
        canvas.height,
    };
  }

  function startDrawing(
    event: React.PointerEvent<HTMLCanvasElement>,
  ) {
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

  function draw(
    event: React.PointerEvent<HTMLCanvasElement>,
  ) {
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

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height,
    );

    context.fillStyle = "#ffffff";
    context.fillRect(
      0,
      0,
      canvas.width,
      canvas.height,
    );

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

    onSave(canvas.toDataURL("image/png"));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-background p-5 shadow-2xl">
        {/* HEADER */}

        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">
              {field.label}
            </h2>

            <p className="text-sm text-muted-foreground">
              Sign using touch, mouse, or trackpad.
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close signature pad"
            onClick={onCancel}
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* CANVAS */}

        <div className="overflow-hidden rounded-xl border bg-white">
          <canvas
            ref={canvasRef}
            width={1000}
            height={400}
            aria-label={`${field.label} drawing area`}
            className="block h-64 w-full touch-none cursor-crosshair"
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            onPointerLeave={stopDrawing}
          />
        </div>

        {/* ACTIONS */}

        <div className="mt-4 flex flex-wrap justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={clearSignature}
          >
            Clear
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSave}
            >
              <CheckCircle2 className="mr-2 size-4" />
              Save Signature
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
