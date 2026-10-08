// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   ArrowLeft,
//   Camera,
//   Check,
//   Plus,
//   Save,
//   Send,
//   Trash2,
//   Video,
//   X,
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

// type SignatureData = {
//   signature: string;
//   signedAt: string;
// };

// type Field = {
//   id: string;
//   label: string;
//   type: string;
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

// type ServiceTemplate = {
//   id: string;
//   name?: string;
//   title?: string;
//   type?: string;
//   sections: Section[];
// };

// type ServiceData = {
//   customer: string;
//   address: string;
//   engineer: string;
//   date: string;
//   time: string;
//   equipment: string;
//   serial: string;
//   serviceType: string;
//   systems: string[];
//   reportedFault: string;
//   actions: string[];
//   customerName: string;
//   customerRemarks: string;

//   evidence: Record<string, EvidenceItem[]>;

//   signatures: Record<string, SignatureData>;
// };

// const keyMap: Record<string, keyof ServiceData> = {
//   "customer-name": "customer",
//   "customer-address": "address",
//   "engineer-name": "engineer",
//   "service-call-date": "date",
//   "service-call-time": "time",
//   equipment: "equipment",
//   "serial-number": "serial",
//   "service-type": "serviceType",
//   "installed-systems": "systems",
//   "reported-fault": "reportedFault",
//   actions: "actions",
//   "customer-name-evidence": "customerName",
//   "customer-remarks": "customerRemarks",
// };

// export function ServiceReportDraft({
//   report,
// }: {
//   report: any;
// }) {
//   const router = useRouter();

//   const [template, setTemplate] =
//     useState<ServiceTemplate | null>(
//       report.template || null,
//     );

//   const [data, setData] =
//     useState<ServiceData>({
//       customer: report.customer || "",
//       address: report.address || "",
//       engineer: report.engineer || "",
//       date: report.date || "",
//       time: report.time || "",
//       equipment: report.equipment || "",
//       serial: report.serial || "",
//       serviceType:
//         report.serviceType || "",
//       systems: Array.isArray(
//         report.systems,
//       )
//         ? report.systems
//         : [],
//       reportedFault:
//         report.reportedFault || "",
//       actions:
//         Array.isArray(
//           report.actions,
//         ) &&
//         report.actions.length > 0
//           ? report.actions
//           : [""],
//       customerName:
//         report.customerName || "",
//       customerRemarks:
//         report.customerRemarks || "",
//       evidence:
//         report.evidence &&
//         typeof report.evidence ===
//           "object" &&
//         !Array.isArray(
//           report.evidence,
//         )
//           ? report.evidence
//           : {},
//       signatures:
//         report.signatures &&
//         typeof report.signatures ===
//           "object" &&
//         !Array.isArray(
//           report.signatures,
//         )
//           ? report.signatures
//           : {},
//     });

//   const [saving, setSaving] =
//     useState(false);

//   const [cameraMode, setCameraMode] =
//     useState<CameraMode | null>(null);

//   const [cameraFieldId, setCameraFieldId] =
//     useState<string | null>(null);

//   const [signatureFieldId, setSignatureFieldId] =
//     useState<string | null>(null);

//   const [errors, setErrors] =
//     useState<Record<string, boolean>>(
//       {},
//     );

//   // --------------------------------------------------
//   // LOAD TEMPLATE
//   // --------------------------------------------------

//   useEffect(() => {
//     if (report.template) return;

//     fetch(
//       "/api/templates/service-report",
//     )
//       .then(async (response) => {
//         if (!response.ok) {
//           throw new Error(
//             "Failed to load service report template.",
//           );
//         }

//         return response.json();
//       })
//       .then((result) => {
//         setTemplate(result);
//       })
//       .catch((error) => {
//         console.error(
//           "SERVICE TEMPLATE ERROR:",
//           error,
//         );
//       });
//   }, [report.template]);

//   const sections =
//     template?.sections || [];

//   // --------------------------------------------------
//   // ALL TEMPLATE FIELDS
//   // --------------------------------------------------

//   const fields = useMemo(() => {
//     return sections.flatMap(
//       (section) =>
//         section.fields.map(
//           (field) => ({
//             ...field,
//             section:
//               section.name ||
//               section.title ||
//               "",
//           }),
//         ),
//     );
//   }, [sections]);

//   // --------------------------------------------------
//   // REQUIRED FIELDS
//   // --------------------------------------------------

//   const requiredFields = useMemo(
//     () => fields.filter(
//       (field) =>
//         field.required,
//     ),
//     [fields],
//   );

//   // --------------------------------------------------
//   // FIELD EMPTY CHECK
//   // --------------------------------------------------

//   function isFieldEmpty(
//     field: Field,
//   ) {
//     // Camera
//     if (
//       field.type ===
//         "camera-photo" ||
//       field.type ===
//         "camera-video"
//     ) {
//       return !(
//         data.evidence?.[
//           field.id
//         ]?.length > 0
//       );
//     }

//     // Signature
//     if (
//       field.type ===
//       "signature"
//     ) {
//       return !data.signatures?.[
//         field.id
//       ]?.signature;
//     }

//     const key =
//       keyMap[field.id];

//     if (!key) {
//       return true;
//     }

//     const value =
//       data[key];

//     if (Array.isArray(value)) {
//       return (
//         value.length === 0 ||
//         value.every(
//           (item) =>
//             !String(
//               item || "",
//             ).trim(),
//         )
//       );
//     }

//     return !String(
//       value ?? "",
//     ).trim();
//   }

//   // --------------------------------------------------
//   // PROGRESS
//   // --------------------------------------------------

//   const completedRequired =
//     requiredFields.filter(
//       (field) =>
//         !isFieldEmpty(field),
//     ).length;

//   const progress =
//     requiredFields.length
//       ? Math.round(
//           (completedRequired /
//             requiredFields.length) *
//             100,
//         )
//       : 0;

//   // --------------------------------------------------
//   // SET NORMAL VALUE
//   // --------------------------------------------------

//   function setValue(
//     field: Field,
//     value: any,
//   ) {
//     const key =
//       keyMap[field.id];

//     if (!key) return;

//     setData((current) => ({
//       ...current,
//       [key]: value,
//     }));

//     setErrors((current) => {
//       if (!current[field.id]) {
//         return current;
//       }

//       const next = {
//         ...current,
//       };

//       delete next[field.id];

//       return next;
//     });
//   }

//   // --------------------------------------------------
//   // ADD EVIDENCE
//   // --------------------------------------------------

//   function addEvidence(
//     fieldId: string,
//     item: EvidenceItem,
//   ) {
//     setData((current) => ({
//       ...current,
//       evidence: {
//         ...current.evidence,
//         [fieldId]: [
//           ...(current.evidence?.[
//             fieldId
//           ] || []),
//           item,
//         ],
//       },
//     }));

//     setErrors((current) => {
//       if (!current[fieldId]) {
//         return current;
//       }

//       const next = {
//         ...current,
//       };

//       delete next[fieldId];

//       return next;
//     });
//   }

//   // --------------------------------------------------
//   // REMOVE EVIDENCE
//   // --------------------------------------------------

//   function removeEvidence(
//     fieldId: string,
//     index: number,
//   ) {
//     setData((current) => ({
//       ...current,
//       evidence: {
//         ...current.evidence,
//         [fieldId]: (
//           current.evidence?.[
//             fieldId
//           ] || []
//         ).filter(
//           (_, i) =>
//             i !== index,
//         ),
//       },
//     }));
//   }

//   // --------------------------------------------------
//   // SAVE SIGNATURE
//   // --------------------------------------------------

//   function saveSignature(
//     fieldId: string,
//     signature: string,
//   ) {
//     setData((current) => ({
//       ...current,
//       signatures: {
//         ...current.signatures,
//         [fieldId]: {
//           signature,
//           signedAt:
//             new Date().toISOString(),
//         },
//       },
//     }));

//     setErrors((current) => {
//       if (!current[fieldId]) {
//         return current;
//       }

//       const next = {
//         ...current,
//       };

//       delete next[fieldId];

//       return next;
//     });

//     setSignatureFieldId(null);
//   }

//   // --------------------------------------------------
//   // REMOVE SIGNATURE
//   // --------------------------------------------------

//   function removeSignature(
//     fieldId: string,
//   ) {
//     setData((current) => {
//       const signatures = {
//         ...current.signatures,
//       };

//       delete signatures[fieldId];

//       return {
//         ...current,
//         signatures,
//       };
//     });
//   }

//   // --------------------------------------------------
//   // VALIDATE
//   // --------------------------------------------------

//   function validateRequiredFields() {
//     const missing: Field[] = [];

//     for (const field of requiredFields) {
//       if (isFieldEmpty(field)) {
//         missing.push(field);
//       }
//     }

//     if (missing.length === 0) {
//       setErrors({});
//       return true;
//     }

//     const newErrors: Record<
//       string,
//       boolean
//     > = {};

//     missing.forEach((field) => {
//       newErrors[field.id] =
//         true;
//     });

//     setErrors(newErrors);

//     const firstMissing =
//       document.querySelector(
//         `[data-field-id="${missing[0].id}"]`,
//       );

//     firstMissing?.scrollIntoView({
//       behavior: "smooth",
//       block: "center",
//     });

//     return false;
//   }

//   // --------------------------------------------------
//   // DELETE DRAFT
//   // --------------------------------------------------

//   async function deleteDraft() {
//     if (saving) return;

//     const confirmed =
//       confirm(
//         "Delete this service report draft?\n\nThis action cannot be undone.",
//       );

//     if (!confirmed) return;

//     try {
//       setSaving(true);

//       const response =
//         await fetch(
//           `/api/service-reports/${report.id}`,
//           {
//             method: "DELETE",
//           },
//         );

//       if (!response.ok) {
//         let message =
//           "Failed to delete draft.";

//         try {
//           const result =
//             await response.json();

//           message =
//             result?.error ||
//             message;
//         } catch {}

//         throw new Error(
//           message,
//         );
//       }

//       router.push(
//         "/employee",
//       );

//       router.refresh();
//     } catch (error) {
//       console.error(
//         "DELETE SERVICE REPORT ERROR:",
//         error,
//       );

//       alert(
//         error instanceof Error
//           ? error.message
//           : "Failed to delete draft.",
//       );
//     } finally {
//       setSaving(false);
//     }
//   }

//   // --------------------------------------------------
//   // SAVE DRAFT
//   // --------------------------------------------------

//   async function saveDraft() {
//     if (saving) return;

//     try {
//       setSaving(true);

//       const response =
//         await fetch(
//           `/api/service-reports/${report.id}`,
//           {
//             method: "PUT",
//             headers: {
//               "Content-Type":
//                 "application/json",
//             },
//             body: JSON.stringify({
//               ...data,
//               status: "DRAFT",
//             }),
//           },
//         );

//       if (!response.ok) {
//         let message =
//           "Failed to save draft.";

//         try {
//           const result =
//             await response.json();

//           message =
//             result?.error ||
//             message;
//         } catch {}

//         throw new Error(
//           message,
//         );
//       }

//       alert(
//         "Service report draft saved successfully.",
//       );
//     } catch (error) {
//       console.error(
//         "SAVE SERVICE REPORT ERROR:",
//         error,
//       );

//       alert(
//         error instanceof Error
//           ? error.message
//           : "Failed to save draft.",
//       );
//     } finally {
//       setSaving(false);
//     }
//   }

//   // --------------------------------------------------
//   // SUBMIT
//   // --------------------------------------------------

//   async function submitReport() {
//     if (saving) return;

//     const valid =
//       validateRequiredFields();

//     if (!valid) {
//       alert(
//         "Please complete all required fields before submitting.",
//       );

//       return;
//     }

//     const confirmed =
//       confirm(
//         "Submit this service report?\n\nAfter submission, you will not be able to edit it.",
//       );

//     if (!confirmed) return;

//     try {
//       setSaving(true);

//       // Save latest data first
//       const saveResponse =
//         await fetch(
//           `/api/service-reports/${report.id}`,
//           {
//             method: "PUT",
//             headers: {
//               "Content-Type":
//                 "application/json",
//             },
//             body: JSON.stringify({
//               ...data,
//               status: "DRAFT",
//             }),
//           },
//         );

//       if (!saveResponse.ok) {
//         let message =
//           "Failed to save service report.";

//         try {
//           const result =
//             await saveResponse.json();

//           message =
//             result?.error ||
//             message;
//         } catch {}

//         throw new Error(
//           message,
//         );
//       }

//       // Submit
//       const submitResponse =
//         await fetch(
//           `/api/service-reports/${report.id}/submit`,
//           {
//             method: "POST",
//           },
//         );

//       if (!submitResponse.ok) {
//         let message =
//           "Failed to submit service report.";

//         try {
//           const result =
//             await submitResponse.json();

//           message =
//             result?.error ||
//             message;
//         } catch {}

//         throw new Error(
//           message,
//         );
//       }

//       router.push(
//         `/employee/service-reports/${report.id}`,
//       );

//       router.refresh();
//     } catch (error) {
//       console.error(
//         "SUBMIT SERVICE REPORT ERROR:",
//         error,
//       );

//       alert(
//         error instanceof Error
//           ? error.message
//           : "Failed to submit service report.",
//       );
//     } finally {
//       setSaving(false);
//     }
//   }

//   // --------------------------------------------------
//   // RENDER FIELD
//   // --------------------------------------------------

//   function renderField(
//     field: Field,
//   ) {
//     const key =
//       keyMap[field.id];

//     const value = key
//       ? data[key]
//       : "";

//     const hasError =
//       !!errors[field.id];

//     // ------------------------------------------------
//     // MULTIPLE TEXTAREA
//     // ------------------------------------------------

//     if (field.multiple) {
//       const actions =
//         Array.isArray(value)
//           ? value
//           : [""];

//       return (
//         <div className="space-y-3">
//           {actions.map(
//             (
//               action,
//               index,
//             ) => (
//               <div
//                 key={index}
//                 className="flex items-start gap-2"
//               >
//                 <Textarea
//                   value={String(
//                     action || "",
//                   )}
//                   onChange={(e) => {
//                     const updated =
//                       [...actions];

//                     updated[index] =
//                       e.target.value;

//                     setValue(
//                       field,
//                       updated,
//                     );
//                   }}
//                   placeholder={`Action ${
//                     index + 1
//                   }`}
//                   className={`min-h-24 resize-y ${
//                     hasError
//                       ? "border-red-500 focus-visible:ring-red-500"
//                       : ""
//                   }`}
//                 />

//                 {actions.length >
//                   1 && (
//                   <Button
//                     type="button"
//                     size="icon"
//                     variant="ghost"
//                     onClick={() => {
//                       setValue(
//                         field,
//                         actions.filter(
//                           (
//                             _,
//                             i,
//                           ) =>
//                             i !==
//                             index,
//                         ),
//                       );
//                     }}
//                   >
//                     <Trash2 />
//                   </Button>
//                 )}
//               </div>
//             ),
//           )}

//           <Button
//             type="button"
//             variant="outline"
//             size="sm"
//             onClick={() =>
//               setValue(
//                 field,
//                 [
//                   ...actions,
//                   "",
//                 ],
//               )
//             }
//           >
//             <Plus data-icon="inline-start" />
//             Add Action
//           </Button>
//         </div>
//       );
//     }

//     // ------------------------------------------------
//     // TEXTAREA
//     // ------------------------------------------------

//     if (
//       field.type ===
//       "textarea"
//     ) {
//       return (
//         <Textarea
//           value={String(
//             value || "",
//           )}
//           onChange={(e) =>
//             setValue(
//               field,
//               e.target.value,
//             )
//           }
//           placeholder={`Enter ${field.label.toLowerCase()}...`}
//           className={`min-h-28 resize-y ${
//             hasError
//               ? "border-red-500 focus-visible:ring-red-500"
//               : ""
//           }`}
//         />
//       );
//     }

//     // ------------------------------------------------
//     // SINGLE CHOICE
//     // ------------------------------------------------

//     if (
//       field.type ===
//       "single-choice"
//     ) {
//       return (
//         <div
//           className={`rounded-xl ${
//             hasError
//               ? "border border-red-500 bg-red-50/30 p-2"
//               : ""
//           }`}
//         >
//           <div className="flex flex-wrap gap-2">
//             {(
//               field.options ||
//               []
//             ).map(
//               (option) => (
//                 <button
//                   key={option}
//                   type="button"
//                   onClick={() =>
//                     setValue(
//                       field,
//                       option,
//                     )
//                   }
//                   className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
//                     value ===
//                     option
//                       ? "border-primary bg-primary text-primary-foreground"
//                       : "border-border bg-background hover:border-primary/40 hover:bg-muted"
//                   }`}
//                 >
//                   {value ===
//                     option && (
//                     <Check className="mr-1 inline size-4" />
//                   )}

//                   {option}
//                 </button>
//               ),
//             )}
//           </div>
//         </div>
//       );
//     }

//     // ------------------------------------------------
//     // MULTIPLE CHOICE
//     // ------------------------------------------------

//     if (
//       field.type ===
//       "multiple-choice"
//     ) {
//       const selected =
//         Array.isArray(value)
//           ? value
//           : [];

//       return (
//         <div
//           className={`grid gap-2 rounded-xl ${
//             hasError
//               ? "border border-red-500 bg-red-50/30 p-3"
//               : ""
//           }`}
//         >
//           {(
//             field.options ||
//             []
//           ).map(
//             (option) => {
//               const checked =
//                 selected.includes(
//                   option,
//                 );

//               return (
//                 <label
//                   key={option}
//                   className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
//                     checked
//                       ? "border-primary bg-primary/5"
//                       : "border-border hover:bg-muted/50"
//                   }`}
//                 >
//                   <input
//                     type="checkbox"
//                     checked={
//                       checked
//                     }
//                     onChange={(
//                       e,
//                     ) => {
//                       if (
//                         e.target
//                           .checked
//                       ) {
//                         setValue(
//                           field,
//                           [
//                             ...selected,
//                             option,
//                           ],
//                         );
//                       } else {
//                         setValue(
//                           field,
//                           selected.filter(
//                             (
//                               item,
//                             ) =>
//                               item !==
//                               option,
//                           ),
//                         );
//                       }
//                     }}
//                     className="size-4"
//                   />

//                   <span className="text-sm">
//                     {option}
//                   </span>
//                 </label>
//               );
//             },
//           )}
//         </div>
//       );
//     }

//     // ------------------------------------------------
//     // CAMERA
//     // ------------------------------------------------

//     if (
//       field.type ===
//         "camera-photo" ||
//       field.type ===
//         "camera-video"
//     ) {
//       const evidence =
//         data.evidence?.[
//           field.id
//         ] || [];

//       return (
//         <div
//           className={`rounded-xl ${
//             hasError
//               ? "border border-red-500 bg-red-50/30 p-3"
//               : ""
//           }`}
//         >
//           <div className="flex flex-wrap gap-2">
//             <Button
//               type="button"
//               variant="outline"
//               size="sm"
//               onClick={() => {
//                 setCameraFieldId(
//                   field.id,
//                 );

//                 setCameraMode(
//                   field.type ===
//                     "camera-video"
//                     ? "video"
//                     : "photo",
//                 );
//               }}
//             >
//               {field.type ===
//               "camera-video" ? (
//                 <Video
//                   data-icon="inline-start"
//                   className="size-4"
//                 />
//               ) : (
//                 <Camera
//                   data-icon="inline-start"
//                   className="size-4"
//                 />
//               )}

//               {field.type ===
//               "camera-video"
//                 ? "Record Video"
//                 : "Capture Photo"}
//             </Button>
//           </div>

//           {evidence.length >
//             0 && (
//             <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
//               {evidence.map(
//                 (
//                   item,
//                   index,
//                 ) => (
//                   <div
//                     key={`${item.url}-${index}`}
//                     className="group relative overflow-hidden rounded-xl border bg-muted"
//                   >
//                     {item.type ===
//                     "video" ? (
//                       <video
//                         src={
//                           item.url
//                         }
//                         controls
//                         playsInline
//                         className="aspect-video w-full object-cover"
//                       />
//                     ) : (
//                       <img
//                         src={
//                           item.url
//                         }
//                         alt={`${field.label} ${
//                           index + 1
//                         }`}
//                         className="aspect-video w-full object-cover"
//                       />
//                     )}

//                     <button
//                       type="button"
//                       onClick={() =>
//                         removeEvidence(
//                           field.id,
//                           index,
//                         )
//                       }
//                       className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600"
//                       aria-label="Remove evidence"
//                     >
//                       <X className="size-4" />
//                     </button>

//                     <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white">
//                       {item.type ===
//                       "video"
//                         ? "VIDEO"
//                         : "PHOTO"}
//                     </div>
//                   </div>
//                 ),
//               )}
//             </div>
//           )}

//           <p className="mt-2 text-xs text-muted-foreground">
//             Capture supporting
//             evidence when
//             available.
//           </p>
//         </div>
//       );
//     }

//     // ------------------------------------------------
//     // SIGNATURE
//     // ------------------------------------------------

//     if (
//       field.type ===
//       "signature"
//     ) {
//       const signature =
//         data.signatures?.[
//           field.id
//         ];

//       return (
//         <div
//           className={`space-y-3 rounded-xl ${
//             hasError
//               ? "border border-red-500 bg-red-50/30 p-3"
//               : ""
//           }`}
//         >
//           {signature?.signature ? (
//             <>
//               <div className="overflow-hidden rounded-xl border bg-white">
//                 <img
//                   src={
//                     signature.signature
//                   }
//                   alt={
//                     field.label
//                   }
//                   className="h-40 w-full object-contain"
//                 />
//               </div>

//               <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
//                 <p className="text-xs text-muted-foreground">
//                   Signed on{" "}
//                   {new Date(
//                     signature.signedAt,
//                   ).toLocaleString(
//                     "en-IN",
//                     {
//                       timeZone:
//                         "Asia/Kolkata",
//                       dateStyle:
//                         "medium",
//                       timeStyle:
//                         "short",
//                     },
//                   )}{" "}
//                   IST
//                 </p>

//                 <div className="flex gap-2">
//                   <Button
//                     type="button"
//                     variant="outline"
//                     size="sm"
//                     onClick={() =>
//                       removeSignature(
//                         field.id,
//                       )
//                     }
//                   >
//                     Clear
//                   </Button>

//                   <Button
//                     type="button"
//                     variant="outline"
//                     size="sm"
//                     onClick={() =>
//                       setSignatureFieldId(
//                         field.id,
//                       )
//                     }
//                   >
//                     Re-sign
//                   </Button>
//                 </div>
//               </div>
//             </>
//           ) : (
//             <Button
//               type="button"
//               variant="outline"
//               className="h-24 w-full border-dashed"
//               onClick={() =>
//                 setSignatureFieldId(
//                   field.id,
//                 )
//               }
//             >
//               Sign on Touch Pad
//             </Button>
//           )}
//         </div>
//       );
//     }

//     // ------------------------------------------------
//     // DATE
//     // ------------------------------------------------

//     if (
//       field.type ===
//       "date"
//     ) {
//       return (
//         <Input
//           type="text"
//           value={String(
//             value || "",
//           )}
//           onChange={(e) =>
//             setValue(
//               field,
//               e.target.value,
//             )
//           }
//           placeholder="DD/MM/YYYY"
//           className={
//             hasError
//               ? "border-red-500 focus-visible:ring-red-500"
//               : ""
//           }
//         />
//       );
//     }

//     // ------------------------------------------------
//     // TIME
//     // ------------------------------------------------

//     if (
//       field.type ===
//       "time"
//     ) {
//       return (
//         <Input
//           type="text"
//           value={String(
//             value || "",
//           )}
//           onChange={(e) =>
//             setValue(
//               field,
//               e.target.value,
//             )
//           }
//           placeholder="e.g. 11:30 AM"
//           className={
//             hasError
//               ? "border-red-500 focus-visible:ring-red-500"
//               : ""
//           }
//         />
//       );
//     }

//     // ------------------------------------------------
//     // NORMAL INPUT
//     // ------------------------------------------------

//     return (
//       <Input
//         type={
//           field.type ===
//           "number"
//             ? "number"
//             : "text"
//         }
//         value={String(
//           value || "",
//         )}
//         onChange={(e) =>
//           setValue(
//             field,
//             e.target.value,
//           )
//         }
//         placeholder={`Enter ${field.label.toLowerCase()}...`}
//         className={
//           hasError
//             ? "border-red-500 focus-visible:ring-red-500"
//             : ""
//         }
//       />
//     );
//   }

//   // --------------------------------------------------
//   // LOADING
//   // --------------------------------------------------

//   if (!template) {
//     return (
//       <main className="mx-auto max-w-6xl px-5 py-8">
//         <Card>
//           <CardContent className="p-8 text-center">
//             <p className="font-semibold">
//               Service report
//               template could
//               not be loaded.
//             </p>
//           </CardContent>
//         </Card>
//       </main>
//     );
//   }

//   // --------------------------------------------------
//   // UI
//   // --------------------------------------------------

//   return (
//     <main className="mobile-safe-bottom mx-auto max-w-6xl px-5 py-8 sm:px-8">
//       {/* BACK */}

//       <Button
//         variant="ghost"
//         onClick={() =>
//           router.push(
//             "/employee",
//           )
//         }
//       >
//         <ArrowLeft data-icon="inline-start" />
//         Back to Dashboard
//       </Button>

//       {/* HEADER */}

//       <Card className="teal-wash mt-5 overflow-hidden shadow-sm">
//         <CardContent className="p-6 sm:p-8">
//           <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
//             <div>
//               <p className="text-sm font-semibold text-primary">
//                 Service Report
//                 Draft ·{" "}
//                 {data.date ||
//                   report.date}
//               </p>

//               <h1 className="mt-2 max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl">
//                 {(
//                   template.title ||
//                   template.name ||
//                   "SERVICE REPORT"
//                 ).toUpperCase()}
//               </h1>

//               <p className="mt-2 text-sm text-muted-foreground">
//                 Complete the
//                 service report
//                 and add
//                 supporting
//                 evidence.
//               </p>

//               <p className="mt-2 font-mono text-xs text-muted-foreground">
//                 {report.id}
//               </p>
//             </div>

//             <Badge
//               variant="secondary"
//               className="w-fit"
//             >
//               DRAFT
//             </Badge>
//           </div>
//         </CardContent>
//       </Card>

//       {/* MAIN */}

//       <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
//         <div className="flex flex-col gap-6">
//           {sections.map(
//             (
//               section,
//               sectionIndex,
//             ) => (
//               <section
//                 key={`${
//                   section.id ||
//                   section.name
//                 }-${sectionIndex}`}
//               >
//                 {/* SECTION HEADER */}

//                 <div className="mb-3 flex items-center justify-between rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
//                   <div className="flex items-center gap-3">
//                     <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
//                       <Check className="size-5" />
//                     </span>

//                     <div>
//                       <h2 className="font-semibold">
//                         {section.name ||
//                           section.title}
//                       </h2>

//                       <p className="text-xs text-muted-foreground">
//                         Complete the
//                         fields in
//                         this section
//                       </p>
//                     </div>
//                   </div>

//                   <Badge variant="secondary">
//                     {
//                       section
//                         .fields
//                         .length
//                     }{" "}
//                     {section
//                       .fields
//                       .length ===
//                     1
//                       ? "field"
//                       : "fields"}
//                   </Badge>
//                 </div>

//                 {/* SECTION FIELDS */}

//                 <Card className="shadow-sm">
//                   <CardContent className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
//                     {section.fields.map(
//                       (field) => {
//                         const fullWidth =
//                           field.type ===
//                             "textarea" ||
//                           field.type ===
//                             "single-choice" ||
//                           field.type ===
//                             "multiple-choice" ||
//                           field.type ===
//                             "camera-photo" ||
//                           field.type ===
//                             "camera-video" ||
//                           field.type ===
//                             "signature" ||
//                           field.multiple;

//                         return (
//                           <div
//                             key={
//                               field.id
//                             }
//                             data-field-id={
//                               field.id
//                             }
//                             className={
//                               fullWidth
//                                 ? "sm:col-span-2"
//                                 : ""
//                             }
//                           >
//                             <label className="block text-sm font-medium">
//                               <span className="flex items-center gap-1">
//                                 {
//                                   field.label
//                                 }

//                                 {field.required && (
//                                   <span className="text-red-500">
//                                     *
//                                   </span>
//                                 )}
//                               </span>

//                               {field.required && (
//                                 <span className="mt-1 block text-xs font-normal text-muted-foreground">
//                                   Required
//                                 </span>
//                               )}
//                             </label>

//                             <div className="mt-2">
//                               {renderField(
//                                 field,
//                               )}
//                             </div>

//                             {errors[
//                               field.id
//                             ] && (
//                               <p className="mt-1 text-xs font-medium text-red-500">
//                                 This
//                                 field
//                                 is
//                                 required.
//                               </p>
//                             )}
//                           </div>
//                         );
//                       },
//                     )}
//                   </CardContent>
//                 </Card>
//               </section>
//             ),
//           )}
//         </div>

//         {/* PROGRESS */}

//         <aside className="lg:sticky lg:top-24 lg:self-start">
//           <Card className="shadow-sm">
//             <CardHeader>
//               <CardTitle className="text-base">
//                 Service Report
//                 Progress
//               </CardTitle>

//               <p className="text-sm text-muted-foreground">
//                 {
//                   completedRequired
//                 }{" "}
//                 of{" "}
//                 {
//                   requiredFields.length
//                 }{" "}
//                 required fields
//                 completed
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

//               <div className="mt-5 border-t pt-4">
//                 <div className="rounded-lg bg-secondary p-3">
//                   <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
//                     Report
//                   </p>

//                   <p className="mt-1 font-mono text-sm font-semibold">
//                     {report.id}
//                   </p>
//                 </div>

//                 <div className="mt-2 rounded-lg bg-secondary p-3">
//                   <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
//                     Status
//                   </p>

//                   <p className="mt-1 text-sm font-semibold">
//                     DRAFT
//                   </p>
//                 </div>
//               </div>

//               {/* DESKTOP ACTIONS */}

//               <div className="mt-5 hidden flex-col gap-2 border-t pt-4 lg:flex">
//                 <Button
//                   variant="outline"
//                   onClick={saveDraft}
//                   disabled={saving}
//                 >
//                   <Save data-icon="inline-start" />
//                   {saving
//                     ? "Saving..."
//                     : "Save Draft"}
//                 </Button>

//                 <Button
//                   variant="outline"
//                   onClick={
//                     deleteDraft
//                   }
//                   disabled={saving}
//                   className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
//                 >
//                   <Trash2 data-icon="inline-start" />
//                   Delete Draft
//                 </Button>

//                 <Button
//                   onClick={
//                     submitReport
//                   }
//                   disabled={saving}
//                 >
//                   <Send data-icon="inline-start" />
//                   {saving
//                     ? "Processing..."
//                     : "Submit Report"}
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>
//         </aside>
//       </div>

//       {/* MOBILE ACTIONS */}

//       <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-card/95 p-3 backdrop-blur lg:hidden">
//         <div className="mx-auto flex max-w-6xl gap-2">
//           <Button
//             variant="outline"
//             className="flex-1"
//             onClick={
//               saveDraft
//             }
//             disabled={saving}
//           >
//             <Save data-icon="inline-start" />
//             {saving
//               ? "Saving..."
//               : "Save"}
//           </Button>

//           <Button
//             variant="outline"
//             size="icon"
//             onClick={
//               deleteDraft
//             }
//             disabled={saving}
//             className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
//           >
//             <Trash2 />
//           </Button>

//           <Button
//             className="flex-1"
//             onClick={
//               submitReport
//             }
//             disabled={saving}
//           >
//             <Send data-icon="inline-start" />
//             {saving
//               ? "Processing..."
//               : "Submit"}
//           </Button>
//         </div>
//       </div>

//       {/* CAMERA */}

//       {cameraMode &&
//         cameraFieldId && (
//           <CameraCapture
//             mode={cameraMode}
//             reportId={report.id}
//             onUse={(
//               item,
//             ) => {
//               addEvidence(
//                 cameraFieldId,
//                 item,
//               );

//               setCameraMode(
//                 null,
//               );

//               setCameraFieldId(
//                 null,
//               );
//             }}
//             onCancel={() => {
//               setCameraMode(
//                 null,
//               );

//               setCameraFieldId(
//                 null,
//               );
//             }}
//           />
//         )}

//       {/* SIGNATURE */}

//       {signatureFieldId && (
//         <SignaturePad
//           field={
//             fields.find(
//               (field) =>
//                 field.id ===
//                 signatureFieldId,
//             )!
//           }
//           existingSignature={
//             data.signatures?.[
//               signatureFieldId
//             ]?.signature
//           }
//           onSave={(
//             signature,
//           ) => {
//             saveSignature(
//               signatureFieldId,
//               signature,
//             );
//           }}
//           onCancel={() =>
//             setSignatureFieldId(
//               null,
//             )
//           }
//         />
//       )}
//     </main>
//   );
// }

// // ==================================================
// // SIGNATURE PAD
// // ==================================================

// function SignaturePad({
//   field,
//   existingSignature,
//   onSave,
//   onCancel,
// }: {
//   field: Field;
//   existingSignature?: string;
//   onSave: (
//     signature: string,
//   ) => void;
//   onCancel: () => void;
// }) {
//   const [
//     canvas,
//     setCanvas,
//   ] =
//     useState<HTMLCanvasElement | null>(
//       null,
//     );

//   const [
//     drawing,
//     setDrawing,
//   ] =
//     useState(false);

//   useEffect(() => {
//     if (!canvas) return;

//     const context =
//       canvas.getContext("2d");

//     if (!context) return;

//     context.fillStyle =
//       "#ffffff";

//     context.fillRect(
//       0,
//       0,
//       canvas.width,
//       canvas.height,
//     );

//     context.lineWidth = 2;
//     context.lineCap =
//       "round";
//     context.lineJoin =
//       "round";
//     context.strokeStyle =
//       "#000000";

//     if (existingSignature) {
//       const image =
//         new Image();

//       image.onload = () => {
//         context.drawImage(
//           image,
//           0,
//           0,
//           canvas.width,
//           canvas.height,
//         );
//       };

//       image.src =
//         existingSignature;
//     }
//   }, [
//     canvas,
//     existingSignature,
//   ]);

//   function getPosition(
//     event:
//       | React.MouseEvent<HTMLCanvasElement>
//       | React.TouchEvent<HTMLCanvasElement>,
//   ) {
//     if (!canvas) {
//       return {
//         x: 0,
//         y: 0,
//       };
//     }

//     const rect =
//       canvas.getBoundingClientRect();

//     if (
//       "touches" in event
//     ) {
//       const touch =
//         event.touches[0];

//       if (!touch) {
//         return {
//           x: 0,
//           y: 0,
//         };
//       }

//       return {
//         x:
//           ((touch.clientX -
//             rect.left) /
//             rect.width) *
//           canvas.width,

//         y:
//           ((touch.clientY -
//             rect.top) /
//             rect.height) *
//           canvas.height,
//       };
//     }

//     return {
//       x:
//         ((event.clientX -
//           rect.left) /
//           rect.width) *
//         canvas.width,

//       y:
//         ((event.clientY -
//           rect.top) /
//           rect.height) *
//         canvas.height,
//     };
//   }

//   function startDrawing(
//     event:
//       | React.MouseEvent<HTMLCanvasElement>
//       | React.TouchEvent<HTMLCanvasElement>,
//   ) {
//     event.preventDefault();

//     if (!canvas) return;

//     const context =
//       canvas.getContext("2d");

//     if (!context) return;

//     const position =
//       getPosition(event);

//     context.beginPath();

//     context.moveTo(
//       position.x,
//       position.y,
//     );

//     setDrawing(true);
//   }

//   function draw(
//     event:
//       | React.MouseEvent<HTMLCanvasElement>
//       | React.TouchEvent<HTMLCanvasElement>,
//   ) {
//     event.preventDefault();

//     if (
//       !drawing ||
//       !canvas
//     ) {
//       return;
//     }

//     const context =
//       canvas.getContext("2d");

//     if (!context) return;

//     const position =
//       getPosition(event);

//     context.lineTo(
//       position.x,
//       position.y,
//     );

//     context.stroke();
//   }

//   function stopDrawing() {
//     setDrawing(false);
//   }

//   function clearSignature() {
//     if (!canvas) return;

//     const context =
//       canvas.getContext("2d");

//     if (!context) return;

//     context.fillStyle =
//       "#ffffff";

//     context.fillRect(
//       0,
//       0,
//       canvas.width,
//       canvas.height,
//     );

//     context.strokeStyle =
//       "#000000";
//   }

//   function saveSignature() {
//     if (!canvas) return;

//     const signature =
//       canvas.toDataURL(
//         "image/png",
//       );

//     onSave(signature);
//   }

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
//       <div className="w-full max-w-2xl rounded-2xl bg-background p-5 shadow-2xl">
//         {/* HEADER */}

//         <div className="mb-4 flex items-center justify-between">
//           <div>
//             <h2 className="text-lg font-semibold">
//               {field.label}
//             </h2>

//             <p className="text-sm text-muted-foreground">
//               Sign using touch,
//               mouse, or trackpad.
//             </p>
//           </div>

//           <Button
//             type="button"
//             variant="ghost"
//             size="icon"
//             onClick={
//               onCancel
//             }
//           >
//             <X />
//           </Button>
//         </div>

//         {/* CANVAS */}

//         <div className="overflow-hidden rounded-xl border bg-white">
//           <canvas
//             ref={setCanvas}
//             width={1000}
//             height={400}
//             className="h-64 w-full touch-none cursor-crosshair"
//             onMouseDown={
//               startDrawing
//             }
//             onMouseMove={draw}
//             onMouseUp={
//               stopDrawing
//             }
//             onMouseLeave={
//               stopDrawing
//             }
//             onTouchStart={
//               startDrawing
//             }
//             onTouchMove={draw}
//             onTouchEnd={
//               stopDrawing
//             }
//           />
//         </div>

//         {/* ACTIONS */}

//         <div className="mt-4 flex justify-between gap-3">
//           <Button
//             type="button"
//             variant="outline"
//             onClick={
//               clearSignature
//             }
//           >
//             Clear
//           </Button>

//           <div className="flex gap-2">
//             <Button
//               type="button"
//               variant="ghost"
//               onClick={
//                 onCancel
//               }
//             >
//               Cancel
//             </Button>

//             <Button
//               type="button"
//               onClick={
//                 saveSignature
//               }
//             >
//               <Check data-icon="inline-start" />
//               Save Signature
//             </Button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

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

type ServiceTemplate = {
  id: string;
  name?: string;
  title?: string;
  type?: string;
  sections: Section[];
};

type ServiceData = {
  templateId: string;

  /*
   * All normal fields are stored dynamically here.
   *
   * Example:
   *
   * {
   *   "customer-name": "ABC Ltd",
   *   "equipment": "Fire Panel",
   *   "machine-age": "8 years"
   * }
   */
  formData: Record<string, unknown>;

  evidence: Record<string, EvidenceItem[]>;

  signatures: Record<string, SignatureData>;
};

/*
 * Converts your OLD service-report structure into
 * the new dynamic formData structure.
 *
 * This is only for compatibility with reports that
 * were already created before the dynamic migration.
 */
function getLegacyFormData(report: any) {
  const formData: Record<string, unknown> = {};

  if (report.customer !== undefined) {
    formData["customer-name"] = report.customer;
  }

  if (report.address !== undefined) {
    formData["customer-address"] = report.address;
  }

  if (report.engineer !== undefined) {
    formData["engineer-name"] = report.engineer;
  }

  if (report.date !== undefined) {
    formData["service-call-date"] = report.date;
  }

  if (report.time !== undefined) {
    formData["service-call-time"] = report.time;
  }

  if (report.equipment !== undefined) {
    formData["equipment"] = report.equipment;
  }

  if (report.serial !== undefined) {
    formData["serial-number"] = report.serial;
  }

  if (report.serviceType !== undefined) {
    formData["service-type"] = report.serviceType;
  }

  if (Array.isArray(report.systems)) {
    formData["installed-systems"] = report.systems;
  }

  if (report.reportedFault !== undefined) {
    formData["reported-fault"] =
      report.reportedFault;
  }

  if (Array.isArray(report.actions)) {
    formData["actions"] =
      report.actions.length > 0
        ? report.actions
        : [""];
  }

  if (report.customerName !== undefined) {
    formData["customer-name-evidence"] =
      report.customerName;
  }

  if (report.customerRemarks !== undefined) {
    formData["customer-remarks"] =
      report.customerRemarks;
  }

  return formData;
}

function getInitialFormData(report: any) {
  /*
   * New dynamic data takes priority.
   */
  if (
    report.formData &&
    typeof report.formData === "object" &&
    !Array.isArray(report.formData)
  ) {
    return report.formData;
  }

  /*
   * Fall back to old fixed-field data.
   */
  return getLegacyFormData(report);
}

export function ServiceReportDraft({
  report,
}: {
  report: any;
}) {
  const router = useRouter();

  const [template, setTemplate] =
    useState<ServiceTemplate | null>(
      report.template || null,
    );

  const [data, setData] =
    useState<ServiceData>({
      templateId:
        report.templateId ||
        report.template?.id ||
        "service-report",

      formData:
        getInitialFormData(report),

      evidence:
        report.evidence &&
        typeof report.evidence === "object" &&
        !Array.isArray(report.evidence)
          ? report.evidence
          : {},

      signatures:
        report.signatures &&
        typeof report.signatures === "object" &&
        !Array.isArray(report.signatures)
          ? report.signatures
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
    if (report.template) return;

    fetch(
      "/api/templates/service-report",
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            "Failed to load service report template.",
          );
        }

        return response.json();
      })
      .then((result) => {
        setTemplate(result);

        /*
         * If this is a new/dynamic report and we don't
         * already have a template ID, store the loaded ID.
         */
        setData((current) => ({
          ...current,
          templateId:
            current.templateId ||
            result?.id ||
            "service-report",
        }));
      })
      .catch((error) => {
        console.error(
          "SERVICE TEMPLATE ERROR:",
          error,
        );
      });
  }, [report.template]);

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

    /*
     * Dynamic normal field.
     *
     * The field ID itself is used as the
     * formData key.
     */
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
        "Delete this service report draft?\n\nThis action cannot be undone.",
      );

    if (!confirmed) return;

    try {
      setSaving(true);

      const response =
        await fetch(
          `/api/service-reports/${report.id}`,
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
        "DELETE SERVICE REPORT ERROR:",
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
          `/api/service-reports/${report.id}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              ...data,
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
        "Service report draft saved successfully.",
      );
    } catch (error) {
      console.error(
        "SAVE SERVICE REPORT ERROR:",
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

  async function submitReport() {
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
        "Submit this service report?\n\nAfter submission, you will not be able to edit it.",
      );

    if (!confirmed) return;

    try {
      setSaving(true);

      // Save latest data first
      const saveResponse =
        await fetch(
          `/api/service-reports/${report.id}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              ...data,
              status: "DRAFT",
            }),
          },
        );

      if (!saveResponse.ok) {
        let message =
          "Failed to save service report.";

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
          `/api/service-reports/${report.id}/submit`,
          {
            method: "POST",
          },
        );

      if (!submitResponse.ok) {
        let message =
          "Failed to submit service report.";

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
        `/employee/service-reports/${report.id}`,
      );

      router.refresh();
    } catch (error) {
      console.error(
        "SUBMIT SERVICE REPORT ERROR:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to submit service report.",
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
    /*
     * IMPORTANT:
     *
     * There is no keyMap anymore.
     *
     * Every normal field uses its own ID.
     */
    const value =
      data.formData?.[field.id] ?? "";

    const hasError =
      !!errors[field.id];

    // ------------------------------------------------
    // MULTIPLE TEXTAREA
    // ------------------------------------------------

    if (field.multiple) {
      const actions =
        Array.isArray(value)
          ? value
          : [""];

      return (
        <div className="space-y-3">
          {actions.map(
            (
              action,
              index,
            ) => (
              <div
                key={index}
                className="flex items-start gap-2"
              >
                <Textarea
                  value={String(
                    action || "",
                  )}
                  onChange={(e) => {
                    const updated =
                      [...actions];

                    updated[index] =
                      e.target.value;

                    setValue(
                      field,
                      updated,
                    );
                  }}
                  placeholder={`Action ${
                    index + 1
                  }`}
                  className={`min-h-24 resize-y ${
                    hasError
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }`}
                />

                {actions.length >
                  1 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setValue(
                        field,
                        actions.filter(
                          (
                            _,
                            i,
                          ) =>
                            i !==
                            index,
                        ),
                      );
                    }}
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
            ),
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setValue(
                field,
                [
                  ...actions,
                  "",
                ],
              )
            }
          >
            <Plus data-icon="inline-start" />
            Add Action
          </Button>
        </div>
      );
    }

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
    // NORMAL INPUT
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
              Service report
              template could
              not be loaded.
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
                Service Report
                Draft ·{" "}
                {String(
                  data.formData?.[
                    "service-call-date"
                  ] ||
                    report.date ||
                    "",
                )}
              </p>

              <h1 className="mt-2 max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl">
                {(
                  template.title ||
                  template.name ||
                  "SERVICE REPORT"
                ).toUpperCase()}
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Complete the
                service report
                and add
                supporting
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
                Service Report
                Progress
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
                    submitReport
                  }
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
              submitReport
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
            reportId={report.id}
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

