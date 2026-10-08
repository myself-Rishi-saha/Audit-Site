
// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   ArrowLeft,
//   Camera,
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
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { CameraCapture } from "@/components/camera-capture";

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
//   id: string;
//   name: string;
//   title?: string;
//   fields: Field[];
// };

// type Template = {
//   id: string;
//   type: string;
//   name: string;
//   title: string;
//   sections: Section[];
// };

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

// type FormState = {
//   templateId: string;
//   templateSnapshot: Template;
//   formData: Record<string, unknown>;
//   evidence: Record<string, EvidenceItem[]>;
//   signatures: Record<string, SignatureData>;
// };

// export default function ServiceReportForm() {
//   const router = useRouter();

//   const [template, setTemplate] = useState<Template | null>(null);

//   const [serviceReportId, setServiceReportId] = useState("");

//   const [data, setData] = useState<FormState>({
//     templateId: "service-report",
//     templateSnapshot: {
//       id: "service-report",
//       type: "SERVICE_REPORT",
//       name: "",
//       title: "",
//       sections: [],
//     },
//     formData: {},
//     evidence: {},
//     signatures: {},
//   });

//   const [errors, setErrors] = useState<Record<string, boolean>>({});

//   const [camera, setCamera] = useState<{
//     mode: "photo" | "video";
//     field: Field;
//   } | null>(null);

//   const [signatureField, setSignatureField] = useState<Field | null>(null);

//   // --------------------------------------------------
//   // LOAD TEMPLATE
//   // --------------------------------------------------

//   useEffect(() => {
//     async function loadTemplate() {
//       try {
//         const response = await fetch("/api/templates/service-report");

//         if (!response.ok) {
//           throw new Error("Failed to load service report template");
//         }

//         const templateData: Template = await response.json();

//         setTemplate(templateData);

//         /*
//          * Create initial normal values
//          * entirely from the template.
//          */
//         const initialFormData: Record<string, unknown> = {};

//         templateData.sections.forEach((section) => {
//           section.fields.forEach((field) => {
//             if (field.type === "multiple-choice") {
//               initialFormData[field.id] = [];
//             } else if (field.multiple) {
//               initialFormData[field.id] = [""];
//             } else {
//               initialFormData[field.id] = "";
//             }
//           });
//         });

//         setData({
//           templateId: templateData.id,

//           templateSnapshot: templateData,

//           formData: initialFormData,

//           evidence: {},

//           signatures: {},
//         });
//       } catch (error) {
//         console.error("Failed to load service report template:", error);
//       }
//     }

//     loadTemplate();
//   }, []);

//   // --------------------------------------------------
//   // GET VALUE
//   // --------------------------------------------------

//   function getValue(field: Field): unknown {
//     return data.formData?.[field.id] ?? "";
//   }

//   // --------------------------------------------------
//   // SET VALUE
//   // --------------------------------------------------

//   function setValue(field: Field, value: unknown) {
//     setData((current) => ({
//       ...current,

//       formData: {
//         ...current.formData,
//         [field.id]: value,
//       },
//     }));

//     setErrors((current) => {
//       if (!current[field.id]) {
//         return current;
//       }

//       const updated = {
//         ...current,
//       };

//       delete updated[field.id];

//       return updated;
//     });
//   }

//   // --------------------------------------------------
//   // VALIDATE
//   // --------------------------------------------------

//   function validateRequiredFields() {
//     if (!template) {
//       return false;
//     }

//     const newErrors: Record<string, boolean> = {};

//     for (const section of template.sections) {
//       for (const field of section.fields) {
//         if (!field.required) {
//           continue;
//         }

//         // ------------------------------------------
//         // SIGNATURE
//         // ------------------------------------------

//         if (field.type === "signature") {
//           if (!data.signatures?.[field.id]?.signature) {
//             newErrors[field.id] = true;
//           }

//           continue;
//         }

//         // ------------------------------------------
//         // CAMERA
//         // ------------------------------------------

//         if (field.type === "camera-photo" || field.type === "camera-video") {
//           if (
//             !data.evidence?.[field.id] ||
//             data.evidence[field.id].length === 0
//           ) {
//             newErrors[field.id] = true;
//           }

//           continue;
//         }

//         // ------------------------------------------
//         // NORMAL VALUES
//         // ------------------------------------------

//         const value = getValue(field);

//         if (Array.isArray(value)) {
//           const empty =
//             value.length === 0 ||
//             value.every((item) => !String(item ?? "").trim());

//           if (empty) {
//             newErrors[field.id] = true;
//           }
//         } else if (!String(value ?? "").trim()) {
//           newErrors[field.id] = true;
//         }
//       }
//     }

//     setErrors(newErrors);

//     if (Object.keys(newErrors).length === 0) {
//       return true;
//     }

//     const firstMissingId = Object.keys(newErrors)[0];

//     const firstField = document.querySelector(
//       `[data-field-id="${firstMissingId}"]`,
//     );

//     firstField?.scrollIntoView({
//       behavior: "smooth",
//       block: "center",
//     });

//     return false;
//   }

//   // --------------------------------------------------
//   // CAMERA
//   // --------------------------------------------------

//   function renderCameraField(field: Field) {
//     const evidence = data.evidence?.[field.id] || [];

//     const hasError = !!errors[field.id];

//     return (
//       <div
//         className={
//           hasError
//             ? "space-y-3 rounded-lg border border-red-500 p-3 ring-1 ring-red-500"
//             : "space-y-3"
//         }
//       >
//         <Button
//           type="button"
//           variant="outline"
//           onClick={() =>
//             setCamera({
//               mode: field.type === "camera-video" ? "video" : "photo",
//               field,
//             })
//           }
//         >
//           {field.type === "camera-video" ? (
//             <Video data-icon="inline-start" />
//           ) : (
//             <Camera data-icon="inline-start" />
//           )}

//           {field.type === "camera-video" ? "Capture Video" : "Capture Photo"}
//         </Button>

//         {evidence.length > 0 && (
//           <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
//             {evidence.map((item, index) => (
//               <div
//                 key={`${item.url}-${index}`}
//                 className="group relative overflow-hidden rounded-xl border bg-muted"
//               >
//                 {item.type === "video" ? (
//                   <video
//                     src={item.url}
//                     controls
//                     playsInline
//                     className="aspect-video w-full object-cover"
//                   />
//                 ) : (
//                   <img
//                     src={item.url}
//                     alt={`Evidence ${index + 1}`}
//                     className="aspect-video w-full object-cover"
//                   />
//                 )}

//                 <button
//                   type="button"
//                   onClick={() => {
//                     setData((current) => ({
//                       ...current,

//                       evidence: {
//                         ...current.evidence,

//                         [field.id]: evidence.filter((_, i) => i !== index),
//                       },
//                     }));
//                   }}
//                   className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600"
//                   aria-label="Remove evidence"
//                 >
//                   <X className="size-4" />
//                 </button>

//                 <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white">
//                   {item.type === "video" ? "VIDEO" : "PHOTO"}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}

//         <p className="text-xs text-muted-foreground">
//           Add supporting photo or video evidence when available.
//         </p>
//       </div>
//     );
//   }

//   // --------------------------------------------------
//   // SIGNATURE
//   // --------------------------------------------------

//   function renderSignatureField(field: Field) {
//     const signature = data.signatures?.[field.id];

//     const hasError = !!errors[field.id];

//     return (
//       <div
//         className={
//           hasError
//             ? "space-y-3 rounded-lg border border-red-500 p-3 ring-1 ring-red-500"
//             : "space-y-3"
//         }
//       >
//         {signature?.signature ? (
//           <>
//             <div className="overflow-hidden rounded-xl border bg-white">
//               <img
//                 src={signature.signature}
//                 alt={field.label}
//                 className="h-40 w-full object-contain"
//               />
//             </div>

//             <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
//               <p className="text-xs text-muted-foreground">
//                 Signed on{" "}
//                 {new Date(signature.signedAt).toLocaleString("en-IN", {
//                   timeZone: "Asia/Kolkata",
//                   dateStyle: "medium",
//                   timeStyle: "short",
//                 })}{" "}
//                 IST
//               </p>

//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => setSignatureField(field)}
//               >
//                 Re-sign
//               </Button>
//             </div>
//           </>
//         ) : (
//           <Button
//             type="button"
//             variant="outline"
//             className="h-24 w-full border-dashed"
//             onClick={() => setSignatureField(field)}
//           >
//             Sign on Touch Pad
//           </Button>
//         )}
//       </div>
//     );
//   }

//   // --------------------------------------------------
//   // NORMAL FIELD CONTROL
//   // --------------------------------------------------

//   function fieldControl(field: Field) {
//     const value = getValue(field);

//     const hasError = !!errors[field.id];

//     // TEXTAREA
//     if (field.type === "textarea") {
//       return (
//         <Textarea
//           value={
//             Array.isArray(value) ? String(value[0] || "") : String(value || "")
//           }
//           onChange={(e) => setValue(field, e.target.value)}
//           className={
//             hasError
//               ? "border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500"
//               : ""
//           }
//         />
//       );
//     }

//     // SINGLE CHOICE
//     if (field.type === "single-choice") {
//       return (
//         <div
//           className={
//             hasError
//               ? "rounded-lg border border-red-500 p-2 ring-1 ring-red-500"
//               : ""
//           }
//         >
//           <div className="flex flex-wrap gap-2">
//             {(field.options || []).map((option) => (
//               <Button
//                 key={option}
//                 type="button"
//                 variant={value === option ? "default" : "outline"}
//                 onClick={() => setValue(field, option)}
//               >
//                 {option}
//               </Button>
//             ))}
//           </div>
//         </div>
//       );
//     }

//     // MULTIPLE CHOICE
//     if (field.type === "multiple-choice") {
//       const selected = Array.isArray(value) ? value.map(String) : [];

//       return (
//         <div
//           className={
//             hasError
//               ? "rounded-lg border border-red-500 p-3 ring-1 ring-red-500"
//               : ""
//           }
//         >
//           <div className="grid gap-2">
//             {(field.options || []).map((option) => (
//               <label
//                 key={option}
//                 className="flex cursor-pointer items-center gap-2 text-sm"
//               >
//                 <input
//                   type="checkbox"
//                   checked={selected.includes(option)}
//                   onChange={(e) => {
//                     setValue(
//                       field,
//                       e.target.checked
//                         ? [...selected, option]
//                         : selected.filter((item) => item !== option),
//                     );
//                   }}
//                 />

//                 {option}
//               </label>
//             ))}
//           </div>
//         </div>
//       );
//     }

//     // CAMERA
//     if (field.type === "camera-photo" || field.type === "camera-video") {
//       return renderCameraField(field);
//     }

//     // SIGNATURE
//     if (field.type === "signature") {
//       return renderSignatureField(field);
//     }

//     // NORMAL INPUT
//     return (
//       <Input
//         type={field.type === "number" ? "number" : field.type}
//         value={
//           Array.isArray(value) ? String(value[0] || "") : String(value || "")
//         }
//         onChange={(e) => setValue(field, e.target.value)}
//         className={
//           hasError
//             ? "border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500"
//             : ""
//         }
//       />
//     );
//   }

//   // --------------------------------------------------
//   // MULTIPLE FIELD
//   // --------------------------------------------------

//   function renderMultipleField(field: Field) {
//     const value = getValue(field);

//     const values = Array.isArray(value) ? value.map(String) : [""];

//     const hasError = !!errors[field.id];

//     return (
//       <div
//         className={
//           hasError
//             ? "rounded-lg border border-red-500 p-3 ring-1 ring-red-500"
//             : "flex flex-col gap-2"
//         }
//       >
//         {values.map((item, index) => (
//           <div key={index} className="flex gap-2">
//             <Textarea
//               value={item}
//               onChange={(e) => {
//                 const updated = [...values];

//                 updated[index] = e.target.value;

//                 setValue(field, updated);
//               }}
//             />

//             {index > 0 && (
//               <Button
//                 type="button"
//                 variant="ghost"
//                 onClick={() => {
//                   setValue(
//                     field,
//                     values.filter((_, i) => i !== index),
//                   );
//                 }}
//               >
//                 <Trash2 />
//               </Button>
//             )}
//           </div>
//         ))}

//         <Button
//           type="button"
//           variant="outline"
//           className="self-start"
//           onClick={() => setValue(field, [...values, ""])}
//         >
//           <Plus data-icon="inline-start" />
//           Add
//         </Button>
//       </div>
//     );
//   }

//   // --------------------------------------------------
//   // SAVE / SUBMIT
//   // --------------------------------------------------

//   async function save(submit = false) {
//     if (submit) {
//       if (!validateRequiredFields()) {
//         return;
//       }

//       if (
//         !confirm(
//           "Submit this service report? You will not be able to edit the completed report.",
//         )
//       ) {
//         return;
//       }
//     }

//     let id = serviceReportId;

//     try {
//       /*
//        * This is now exactly the structure
//        * expected by the dynamic backend.
//        */
// const payload = {
//   templateId: data.templateId,

//   templateSnapshot: data.templateSnapshot,

//   formData: data.formData,

//   evidence: data.evidence,

//   signatures: data.signatures,

//   status: "DRAFT",
// };

//       // --------------------------------------------
//       // CREATE
//       // --------------------------------------------

//       if (!id) {
//         const response = await fetch("/api/service-reports", {
//           method: "POST",

//           headers: {
//             "Content-Type": "application/json",
//           },

//           body: JSON.stringify(payload),
//         });

//         if (!response.ok) {
//           const error = await response.text();

//           console.error("Create service report failed:", error);

//           throw new Error("Failed to create service report");
//         }

//         const created = await response.json();

//         id = created.id;

//         setServiceReportId(id);
//       }

//       // --------------------------------------------
//       // UPDATE
//       // --------------------------------------------
//       else {
//         const response = await fetch(`/api/service-reports/${id}`, {
//           method: "PUT",

//           headers: {
//             "Content-Type": "application/json",
//           },

//           body: JSON.stringify(payload),
//         });

//         if (!response.ok) {
//           const error = await response.text();

//           console.error("Update service report failed:", error);

//           throw new Error("Failed to save service report");
//         }
//       }

//       // --------------------------------------------
//       // SUBMIT
//       // --------------------------------------------

//       if (submit) {
//         const response = await fetch(`/api/service-reports/${id}/submit`, {
//           method: "POST",
//         });

//         if (!response.ok) {
//           const error = await response.text();

//           console.error("Submit service report failed:", error);

//           throw new Error("Failed to submit service report");
//         }

//         router.push(`/employee/service-reports/${id}`);

//         router.refresh();
//       } else {
//         alert("Draft saved.");
//       }
//     } catch (error) {
//       console.error("SAVE SERVICE REPORT ERROR:", error);

//       alert(
//         error instanceof Error
//           ? error.message
//           : "Failed to save service report.",
//       );
//     }
//   }

//   // --------------------------------------------------
//   // LOADING
//   // --------------------------------------------------

//   if (!template) {
//     return (
//       <main className="p-8 text-muted-foreground">
//         Loading service report template…
//       </main>
//     );
//   }

//   // --------------------------------------------------
//   // UI
//   // --------------------------------------------------

//   return (
//     <main className="mobile-safe-bottom mx-auto max-w-6xl px-5 py-8 sm:px-8">
//       {/* BACK */}

//       <Button variant="ghost" onClick={() => router.push("/employee")}>
//         <ArrowLeft data-icon="inline-start" />
//         Back to Service Reports
//       </Button>

//       {/* HEADER */}

//       <Card className="teal-wash mt-5 overflow-hidden shadow-sm">
//         <CardContent className="p-6 sm:p-8">
//           <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
//             <div>
//               <p className="text-sm font-semibold text-primary">
//                 New Service Report
//               </p>

//               <h1 className="mt-2 max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl">
//                 {template.title || template.name}
//               </h1>

//               <p className="mt-2 text-sm text-muted-foreground">
//                 Record service calls, reported faults, and corrective actions
//                 taken.
//               </p>
//             </div>

//             <Badge variant="secondary">Draft</Badge>
//           </div>
//         </CardContent>
//       </Card>

//       {/* SECTIONS */}

//       <div className="mt-6 flex flex-col gap-6">
//         {template.sections.map((section) => (
//           <section key={section.id}>
//             {/* SECTION HEADER */}

//             <div className="mb-3 flex items-center justify-between rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
//               <div>
//                 <h2 className="font-semibold">
//                   {section.name || section.title}
//                 </h2>

//                 <p className="text-xs text-muted-foreground">
//                   Complete the information below.
//                 </p>
//               </div>

//               <Badge variant="secondary">
//                 {section.fields.length}{" "}
//                 {section.fields.length === 1 ? "field" : "fields"}
//               </Badge>
//             </div>

//             {/* FIELDS */}

//             <Card className="shadow-sm">
//               <CardContent className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
//                 {section.fields.map((field) => {
//                   const fullWidth =
//                     field.type === "textarea" ||
//                     field.type === "multiple-choice" ||
//                     field.type === "single-choice" ||
//                     field.type === "camera-photo" ||
//                     field.type === "camera-video" ||
//                     field.type === "signature" ||
//                     field.multiple;

//                   return (
//                     <div
//                       key={field.id}
//                       data-field-id={field.id}
//                       className={fullWidth ? "sm:col-span-2" : ""}
//                     >
//                       <label className="flex flex-col gap-2 text-sm font-medium">
//                         <span>
//                           {field.label}

//                           {field.required && (
//                             <span className="ml-1 text-red-500">*</span>
//                           )}
//                         </span>

//                         {field.multiple
//                           ? renderMultipleField(field)
//                           : fieldControl(field)}
//                       </label>

//                       {errors[field.id] && (
//                         <p className="mt-1 text-xs font-medium text-red-500">
//                           This field is required.
//                         </p>
//                       )}
//                     </div>
//                   );
//                 })}
//               </CardContent>
//             </Card>
//           </section>
//         ))}
//       </div>

//       {/* ACTIONS */}

//       <div className="mt-6 flex justify-end gap-3 border-t pt-4">
//         <Button variant="outline" onClick={() => save(false)}>
//           <Save data-icon="inline-start" />
//           Save Draft
//         </Button>

//         <Button onClick={() => save(true)}>
//           <Send data-icon="inline-start" />
//           Submit Report
//         </Button>
//       </div>

//       {/* CAMERA */}

//       {camera && (
//         <CameraCapture
//           mode={camera.mode}
//           reportId={serviceReportId || "new-service-report"}
//           onCancel={() => setCamera(null)}
//           onUse={(item: EvidenceItem) => {
//             const fieldId = camera.field.id;

//             setData((current) => ({
//               ...current,

//               evidence: {
//                 ...current.evidence,

//                 [fieldId]: [...(current.evidence?.[fieldId] || []), item],
//               },
//             }));

//             setErrors((current) => {
//               const updated = {
//                 ...current,
//               };

//               delete updated[fieldId];

//               return updated;
//             });

//             setCamera(null);
//           }}
//         />
//       )}

//       {/* SIGNATURE */}

//       {signatureField && (
//         <SignaturePad
//           field={signatureField}
//           onCancel={() => setSignatureField(null)}
//           onSave={(signature) => {
//             setData((current) => ({
//               ...current,

//               signatures: {
//                 ...current.signatures,

//                 [signatureField.id]: {
//                   signature,
//                   signedAt: new Date().toISOString(),
//                 },
//               },
//             }));

//             setErrors((current) => {
//               const updated = {
//                 ...current,
//               };

//               delete updated[signatureField.id];

//               return updated;
//             });

//             setSignatureField(null);
//           }}
//         />
//       )}
//     </main>
//   );
// }

// // --------------------------------------------------
// // SIGNATURE PAD
// // --------------------------------------------------

// function SignaturePad({
//   field,
//   onCancel,
//   onSave,
// }: {
//   field: Field;
//   onCancel: () => void;
//   onSave: (signature: string) => void;
// }) {
//   const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

//   const [drawing, setDrawing] = useState(false);

//   useEffect(() => {
//     if (!canvas) {
//       return;
//     }

//     const context = canvas.getContext("2d");

//     if (!context) {
//       return;
//     }

//     context.fillStyle = "#ffffff";

//     context.fillRect(0, 0, canvas.width, canvas.height);

//     context.lineWidth = 2;
//     context.lineCap = "round";
//     context.lineJoin = "round";
//     context.strokeStyle = "#000000";
//   }, [canvas]);

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

//     const rect = canvas.getBoundingClientRect();

//     if ("touches" in event) {
//       const touch = event.touches[0];

//       if (!touch) {
//         return {
//           x: 0,
//           y: 0,
//         };
//       }

//       return {
//         x: ((touch.clientX - rect.left) / rect.width) * canvas.width,

//         y: ((touch.clientY - rect.top) / rect.height) * canvas.height,
//       };
//     }

//     return {
//       x: ((event.clientX - rect.left) / rect.width) * canvas.width,

//       y: ((event.clientY - rect.top) / rect.height) * canvas.height,
//     };
//   }

//   function startDrawing(
//     event:
//       | React.MouseEvent<HTMLCanvasElement>
//       | React.TouchEvent<HTMLCanvasElement>,
//   ) {
//     event.preventDefault();

//     if (!canvas) {
//       return;
//     }

//     const context = canvas.getContext("2d");

//     if (!context) {
//       return;
//     }

//     const position = getPosition(event);

//     context.beginPath();

//     context.moveTo(position.x, position.y);

//     setDrawing(true);
//   }

//   function draw(
//     event:
//       | React.MouseEvent<HTMLCanvasElement>
//       | React.TouchEvent<HTMLCanvasElement>,
//   ) {
//     event.preventDefault();

//     if (!drawing || !canvas) {
//       return;
//     }

//     const context = canvas.getContext("2d");

//     if (!context) {
//       return;
//     }

//     const position = getPosition(event);

//     context.lineTo(position.x, position.y);

//     context.stroke();
//   }

//   function stopDrawing() {
//     setDrawing(false);
//   }

//   function clearSignature() {
//     if (!canvas) {
//       return;
//     }

//     const context = canvas.getContext("2d");

//     if (!context) {
//       return;
//     }

//     context.fillStyle = "#ffffff";

//     context.fillRect(0, 0, canvas.width, canvas.height);

//     context.strokeStyle = "#000000";
//   }

//   function saveSignature() {
//     if (!canvas) {
//       return;
//     }

//     const signature = canvas.toDataURL("image/png");

//     onSave(signature);
//   }

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
//       <div className="w-full max-w-2xl rounded-2xl bg-background p-5 shadow-2xl">
//         <div className="mb-4 flex items-center justify-between">
//           <div>
//             <h2 className="text-lg font-semibold">{field.label}</h2>

//             <p className="text-sm text-muted-foreground">
//               Sign using touch, mouse, or trackpad.
//             </p>
//           </div>

//           <Button variant="ghost" size="icon" onClick={onCancel}>
//             <X />
//           </Button>
//         </div>

//         <div className="overflow-hidden rounded-xl border bg-white">
//           <canvas
//             ref={setCanvas}
//             width={1000}
//             height={400}
//             className="h-64 w-full touch-none"
//             onMouseDown={startDrawing}
//             onMouseMove={draw}
//             onMouseUp={stopDrawing}
//             onMouseLeave={stopDrawing}
//             onTouchStart={startDrawing}
//             onTouchMove={draw}
//             onTouchEnd={stopDrawing}
//           />
//         </div>

//         <div className="mt-4 flex justify-between gap-3">
//           <Button type="button" variant="outline" onClick={clearSignature}>
//             Clear
//           </Button>

//           <div className="flex gap-2">
//             <Button type="button" variant="ghost" onClick={onCancel}>
//               Cancel
//             </Button>

//             <Button type="button" onClick={saveSignature}>
//               Save Signature
//             </Button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CameraCapture } from "@/components/camera-capture";

type FieldType =
  | "text"
  | "textarea"
  | "date"
  | "time"
  | "single-choice"
  | "multiple-choice"
  | "camera-photo"
  | "camera-video"
  | "number"
  | "signature";

type Field = {
  id: string;
  label: string;
  type: FieldType;
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
  type: string;
  name: string;
  title: string;
  sections: Section[];
};

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

type Customer = {
  id: string;
  name: string;
  address: string;
  gstNo: string | null;
  contactNumber: string;
};

type FormState = {
  templateId: string;
  templateSnapshot: Template;
  formData: Record<string, unknown>;
  evidence: Record<string, EvidenceItem[]>;
  signatures: Record<string, SignatureData>;
};

export default function ServiceReportForm() {
  const router = useRouter();

  const [template, setTemplate] =
    useState<Template | null>(null);

  const [serviceReportId, setServiceReportId] =
    useState("");

  // --------------------------------------------------
  // CUSTOMER STATE
  // --------------------------------------------------

  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] =
    useState("");

  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [customersLoading, setCustomersLoading] =
    useState(true);

  const [customerLoadError, setCustomerLoadError] =
    useState(false);

  // --------------------------------------------------
  // FORM STATE
  // --------------------------------------------------

  const [data, setData] = useState<FormState>({
    templateId: "service-report",

    templateSnapshot: {
      id: "service-report",
      type: "SERVICE_REPORT",
      name: "",
      title: "",
      sections: [],
    },

    formData: {},

    evidence: {},

    signatures: {},
  });

  const [errors, setErrors] =
    useState<Record<string, boolean>>({});

  const [camera, setCamera] = useState<{
    mode: "photo" | "video";
    field: Field;
  } | null>(null);

  const [signatureField, setSignatureField] =
    useState<Field | null>(null);

  // --------------------------------------------------
  // LOAD TEMPLATE
  // --------------------------------------------------

  useEffect(() => {
    async function loadTemplate() {
      try {
        const response = await fetch(
          "/api/templates/service-report",
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load service report template",
          );
        }

        const templateData: Template =
          await response.json();

        setTemplate(templateData);

        const initialFormData: Record<
          string,
          unknown
        > = {};

        templateData.sections.forEach(
          (section) => {
            section.fields.forEach((field) => {
              if (
                field.type ===
                "multiple-choice"
              ) {
                initialFormData[field.id] = [];
              } else if (field.multiple) {
                initialFormData[field.id] = [
                  "",
                ];
              } else {
                initialFormData[field.id] = "";
              }
            });
          },
        );

        setData({
          templateId: templateData.id,

          templateSnapshot: templateData,

          formData: initialFormData,

          evidence: {},

          signatures: {},
        });
      } catch (error) {
        console.error(
          "Failed to load service report template:",
          error,
        );
      }
    }

    loadTemplate();
  }, []);

  // --------------------------------------------------
  // LOAD CUSTOMERS
  // --------------------------------------------------

  useEffect(() => {
    async function loadCustomers() {
      try {
        setCustomersLoading(true);
        setCustomerLoadError(false);

        const response = await fetch(
          "/employee/customers",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load customers",
          );
        }

        const customerData: Customer[] =
          await response.json();

        setCustomers(customerData);
      } catch (error) {
        console.error(
          "Failed to load customers:",
          error,
        );

        setCustomerLoadError(true);
      } finally {
        setCustomersLoading(false);
      }
    }

    loadCustomers();
  }, []);

  // --------------------------------------------------
  // CUSTOMER CHANGE
  // --------------------------------------------------

  function handleCustomerChange(
    customerId: string,
  ) {
    setSelectedCustomerId(customerId);

    const customer =
      customers.find(
        (item) => item.id === customerId,
      ) || null;

    setSelectedCustomer(customer);

    setErrors((current) => {
      const updated = {
        ...current,
      };

      delete updated.customer;

      return updated;
    });
  }

  // --------------------------------------------------
  // GET VALUE
  // --------------------------------------------------

  function getValue(field: Field): unknown {
    return data.formData?.[field.id] ?? "";
  }

  // --------------------------------------------------
  // SET VALUE
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

      const updated = {
        ...current,
      };

      delete updated[field.id];

      return updated;
    });
  }

  // --------------------------------------------------
  // VALIDATE
  // --------------------------------------------------

  function validateRequiredFields() {
    if (!template) {
      return false;
    }

    const newErrors: Record<string, boolean> =
      {};

    // ------------------------------------------------
    // CUSTOMER
    // ------------------------------------------------

    if (!selectedCustomerId) {
      newErrors.customer = true;
    }

    // ------------------------------------------------
    // TEMPLATE FIELDS
    // ------------------------------------------------

    for (const section of template.sections) {
      for (const field of section.fields) {
        if (!field.required) {
          continue;
        }

        // ------------------------------------------
        // SIGNATURE
        // ------------------------------------------

        if (field.type === "signature") {
          if (
            !data.signatures?.[field.id]
              ?.signature
          ) {
            newErrors[field.id] = true;
          }

          continue;
        }

        // ------------------------------------------
        // CAMERA
        // ------------------------------------------

        if (
          field.type === "camera-photo" ||
          field.type === "camera-video"
        ) {
          if (
            !data.evidence?.[field.id] ||
            data.evidence[field.id].length === 0
          ) {
            newErrors[field.id] = true;
          }

          continue;
        }

        // ------------------------------------------
        // NORMAL VALUES
        // ------------------------------------------

        const value = getValue(field);

        if (Array.isArray(value)) {
          const empty =
            value.length === 0 ||
            value.every(
              (item) =>
                !String(
                  item ?? "",
                ).trim(),
            );

          if (empty) {
            newErrors[field.id] = true;
          }
        } else if (
          !String(value ?? "").trim()
        ) {
          newErrors[field.id] = true;
        }
      }
    }

    setErrors(newErrors);

    if (
      Object.keys(newErrors).length === 0
    ) {
      return true;
    }

    const firstMissingId =
      Object.keys(newErrors)[0];

    // Customer is outside dynamic fields
    if (firstMissingId === "customer") {
      document
        .getElementById(
          "customer-selector",
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

      return false;
    }

    const firstField =
      document.querySelector(
        `[data-field-id="${firstMissingId}"]`,
      );

    firstField?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    return false;
  }

  // --------------------------------------------------
  // CAMERA
  // --------------------------------------------------

  function renderCameraField(field: Field) {
    const evidence =
      data.evidence?.[field.id] || [];

    const hasError = !!errors[field.id];

    return (
      <div
        className={
          hasError
            ? "space-y-3 rounded-lg border border-red-500 p-3 ring-1 ring-red-500"
            : "space-y-3"
        }
      >
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setCamera({
              mode:
                field.type ===
                "camera-video"
                  ? "video"
                  : "photo",

              field,
            })
          }
        >
          {field.type ===
          "camera-video" ? (
            <Video data-icon="inline-start" />
          ) : (
            <Camera data-icon="inline-start" />
          )}

          {field.type ===
          "camera-video"
            ? "Capture Video"
            : "Capture Photo"}
        </Button>

        {evidence.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {evidence.map(
              (item, index) => (
                <div
                  key={`${item.url}-${index}`}
                  className="group relative overflow-hidden rounded-xl border bg-muted"
                >
                  {item.type ===
                  "video" ? (
                    <video
                      src={item.url}
                      controls
                      playsInline
                      className="aspect-video w-full object-cover"
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={`Evidence ${
                        index + 1
                      }`}
                      className="aspect-video w-full object-cover"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setData(
                        (current) => ({
                          ...current,

                          evidence: {
                            ...current.evidence,

                            [field.id]:
                              evidence.filter(
                                (_, i) =>
                                  i !==
                                  index,
                              ),
                          },
                        }),
                      );
                    }}
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

        <p className="text-xs text-muted-foreground">
          Add supporting photo or video
          evidence when available.
        </p>
      </div>
    );
  }

  // --------------------------------------------------
  // SIGNATURE
  // --------------------------------------------------

  function renderSignatureField(
    field: Field,
  ) {
    const signature =
      data.signatures?.[field.id];

    const hasError = !!errors[field.id];

    return (
      <div
        className={
          hasError
            ? "space-y-3 rounded-lg border border-red-500 p-3 ring-1 ring-red-500"
            : "space-y-3"
        }
      >
        {signature?.signature ? (
          <>
            <div className="overflow-hidden rounded-xl border bg-white">
              <img
                src={signature.signature}
                alt={field.label}
                className="h-40 w-full object-contain"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Signed on{" "}
                {new Date(
                  signature.signedAt,
                ).toLocaleString("en-IN", {
                  timeZone:
                    "Asia/Kolkata",
                  dateStyle: "medium",
                  timeStyle: "short",
                })}{" "}
                IST
              </p>

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setSignatureField(
                    field,
                  )
                }
              >
                Re-sign
              </Button>
            </div>
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="h-24 w-full border-dashed"
            onClick={() =>
              setSignatureField(field)
            }
          >
            Sign on Touch Pad
          </Button>
        )}
      </div>
    );
  }

  // --------------------------------------------------
  // NORMAL FIELD CONTROL
  // --------------------------------------------------

  function fieldControl(field: Field) {
    const value = getValue(field);

    const hasError = !!errors[field.id];

    // ------------------------------------------------
    // TEXTAREA
    // ------------------------------------------------

    if (field.type === "textarea") {
      return (
        <Textarea
          value={
            Array.isArray(value)
              ? String(
                  value[0] || "",
                )
              : String(value || "")
          }
          onChange={(e) =>
            setValue(
              field,
              e.target.value,
            )
          }
          className={
            hasError
              ? "border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500"
              : ""
          }
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
          className={
            hasError
              ? "rounded-lg border border-red-500 p-2 ring-1 ring-red-500"
              : ""
          }
        >
          <div className="flex flex-wrap gap-2">
            {(field.options || []).map(
              (option) => (
                <Button
                  key={option}
                  type="button"
                  variant={
                    value === option
                      ? "default"
                      : "outline"
                  }
                  onClick={() =>
                    setValue(
                      field,
                      option,
                    )
                  }
                >
                  {option}
                </Button>
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
          ? value.map(String)
          : [];

      return (
        <div
          className={
            hasError
              ? "rounded-lg border border-red-500 p-3 ring-1 ring-red-500"
              : ""
          }
        >
          <div className="grid gap-2">
            {(field.options || []).map(
              (option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(
                      option,
                    )}
                    onChange={(e) => {
                      setValue(
                        field,
                        e.target.checked
                          ? [
                              ...selected,
                              option,
                            ]
                          : selected.filter(
                              (item) =>
                                item !==
                                option,
                            ),
                      );
                    }}
                  />

                  {option}
                </label>
              ),
            )}
          </div>
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
      return renderCameraField(
        field,
      );
    }

    // ------------------------------------------------
    // SIGNATURE
    // ------------------------------------------------

    if (
      field.type ===
      "signature"
    ) {
      return renderSignatureField(
        field,
      );
    }

    // ------------------------------------------------
    // NORMAL INPUT
    // ------------------------------------------------

    return (
      <Input
        type={
          field.type === "number"
            ? "number"
            : field.type
        }
        value={
          Array.isArray(value)
            ? String(
                value[0] || "",
              )
            : String(value || "")
        }
        onChange={(e) =>
          setValue(
            field,
            e.target.value,
          )
        }
        className={
          hasError
            ? "border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500"
            : ""
        }
      />
    );
  }

  // --------------------------------------------------
  // MULTIPLE FIELD
  // --------------------------------------------------

  function renderMultipleField(
    field: Field,
  ) {
    const value = getValue(field);

    const values = Array.isArray(
      value,
    )
      ? value.map(String)
      : [""];

    const hasError = !!errors[field.id];

    return (
      <div
        className={
          hasError
            ? "rounded-lg border border-red-500 p-3 ring-1 ring-red-500"
            : "flex flex-col gap-2"
        }
      >
        {values.map(
          (item, index) => (
            <div
              key={index}
              className="flex gap-2"
            >
              <Textarea
                value={item}
                onChange={(e) => {
                  const updated = [
                    ...values,
                  ];

                  updated[index] =
                    e.target.value;

                  setValue(
                    field,
                    updated,
                  );
                }}
              />

              {index > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setValue(
                      field,
                      values.filter(
                        (_, i) =>
                          i !== index,
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
          className="self-start"
          onClick={() =>
            setValue(
              field,
              [...values, ""],
            )
          }
        >
          <Plus data-icon="inline-start" />
          Add
        </Button>
      </div>
    );
  }

  // --------------------------------------------------
  // SAVE / SUBMIT
  // --------------------------------------------------

  async function save(
    submit = false,
  ) {
    // ------------------------------------------------
    // CUSTOMER REQUIRED FOR BOTH SAVE + SUBMIT
    // ------------------------------------------------

    if (
      !selectedCustomerId ||
      !selectedCustomer
    ) {
      setErrors((current) => ({
        ...current,
        customer: true,
      }));

      document
        .getElementById(
          "customer-selector",
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

      return;
    }

    // ------------------------------------------------
    // SUBMIT VALIDATION
    // ------------------------------------------------

    if (submit) {
      if (!validateRequiredFields()) {
        return;
      }

      if (
        !confirm(
          "Submit this service report? You will not be able to edit the completed report.",
        )
      ) {
        return;
      }
    }

    let id = serviceReportId;

    try {
      // ----------------------------------------------
      // FINAL PAYLOAD
      // ----------------------------------------------

      const payload = {
        templateId:
          data.templateId,

        templateSnapshot:
          data.templateSnapshot,

        // Customer is stored outside formData
        customerId:
          selectedCustomer.id,

        customerName:
          selectedCustomer.name,

        customerAddress:
          selectedCustomer.address,

        formData:
          data.formData,

        evidence:
          data.evidence,

        signatures:
          data.signatures,

        status: "DRAFT",
      };

      console.log(
        "FINAL SERVICE REPORT DATA:",
        JSON.stringify(
          payload,
          null,
          2,
        ),
      );

      // ----------------------------------------------
      // CREATE
      // ----------------------------------------------

      if (!id) {
        const response =
          await fetch(
            "/api/service-reports",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                payload,
              ),
            },
          );

        if (!response.ok) {
          const error =
            await response.text();

          console.error(
            "Create service report failed:",
            error,
          );

          throw new Error(
            "Failed to create service report",
          );
        }

        const created =
          await response.json();

        id = created.id;

        setServiceReportId(id);
      }

      // ----------------------------------------------
      // UPDATE
      // ----------------------------------------------

      else {
        const response =
          await fetch(
            `/api/service-reports/${id}`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                payload,
              ),
            },
          );

        if (!response.ok) {
          const error =
            await response.text();

          console.error(
            "Update service report failed:",
            error,
          );

          throw new Error(
            "Failed to save service report",
          );
        }
      }

      // ----------------------------------------------
      // SUBMIT
      // ----------------------------------------------

      if (submit) {
        const response =
          await fetch(
            `/api/service-reports/${id}/submit`,
            {
              method: "POST",
            },
          );

        if (!response.ok) {
          const error =
            await response.text();

          console.error(
            "Submit service report failed:",
            error,
          );

          throw new Error(
            "Failed to submit service report",
          );
        }

        router.push(
          `/employee/service-reports/${id}`,
        );

        router.refresh();
      } else {
        alert("Draft saved.");
      }
    } catch (error) {
      console.error(
        "SAVE SERVICE REPORT ERROR:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save service report.",
      );
    }
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (!template) {
    return (
      <main className="p-8 text-muted-foreground">
        Loading service report
        template…
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
          router.push("/employee")
        }
      >
        <ArrowLeft data-icon="inline-start" />
        Back to Service Reports
      </Button>

      {/* HEADER */}

      <Card className="teal-wash mt-5 overflow-hidden shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-primary">
                New Service Report
              </p>

              <h1 className="mt-2 max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl">
                {template.title ||
                  template.name}
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Record service calls,
                reported faults, and
                corrective actions taken.
              </p>
            </div>

            <Badge variant="secondary">
              Draft
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* CUSTOMER */}

      <Card
        id="customer-selector"
        className="mt-6 shadow-sm"
      >
        <CardContent className="p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="font-semibold">
              Customer Information
            </h2>

            <p className="text-sm text-muted-foreground">
              Select the customer for
              this service report.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Customer
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <select
              value={
                selectedCustomerId
              }
              onChange={(e) =>
                handleCustomerChange(
                  e.target.value,
                )
              }
              disabled={
                customersLoading
              }
              className={`w-full rounded-lg border bg-background px-3 py-2 text-sm ${
                errors.customer
                  ? "border-red-500 ring-1 ring-red-500"
                  : ""
              }`}
            >
              <option value="">
                {customersLoading
                  ? "Loading customers..."
                  : "Select customer"}
              </option>

              {customers.map(
                (customer) => (
                  <option
                    key={customer.id}
                    value={customer.id}
                  >
                    {customer.name}
                  </option>
                ),
              )}
            </select>

            {errors.customer && (
              <p className="text-xs font-medium text-red-500">
                Please select a
                customer.
              </p>
            )}

            {customerLoadError && (
              <p className="text-xs font-medium text-red-500">
                Failed to load
                customers.
              </p>
            )}
          </div>

          {selectedCustomer && (
            <div className="mt-4 rounded-xl border bg-muted/30 p-4">
              <p className="font-medium">
                {selectedCustomer.name}
              </p>

              <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                {
                  selectedCustomer.address
                }
              </p>

              {selectedCustomer.gstNo && (
                <p className="mt-2 text-sm">
                  <span className="font-medium">
                    GST:
                  </span>{" "}
                  {
                    selectedCustomer.gstNo
                  }
                </p>
              )}

              <p className="mt-1 text-sm">
                <span className="font-medium">
                  Contact:
                </span>{" "}
                {
                  selectedCustomer.contactNumber
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTIONS */}

      <div className="mt-6 flex flex-col gap-6">
        {template.sections.map(
          (section) => (
            <section
              key={section.id}
            >
              {/* SECTION HEADER */}

              <div className="mb-3 flex items-center justify-between rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
                <div>
                  <h2 className="font-semibold">
                    {section.name ||
                      section.title}
                  </h2>

                  <p className="text-xs text-muted-foreground">
                    Complete the
                    information below.
                  </p>
                </div>

                <Badge variant="secondary">
                  {
                    section.fields
                      .length
                  }{" "}
                  {section.fields
                    .length === 1
                    ? "field"
                    : "fields"}
                </Badge>
              </div>

              {/* FIELDS */}

              <Card className="shadow-sm">
                <CardContent className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                  {section.fields.map(
                    (field) => {
                      const fullWidth =
                        field.type ===
                          "textarea" ||
                        field.type ===
                          "multiple-choice" ||
                        field.type ===
                          "single-choice" ||
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
                          <label className="flex flex-col gap-2 text-sm font-medium">
                            <span>
                              {
                                field.label
                              }

                              {field.required && (
                                <span className="ml-1 text-red-500">
                                  *
                                </span>
                              )}
                            </span>

                            {field.multiple
                              ? renderMultipleField(
                                  field,
                                )
                              : fieldControl(
                                  field,
                                )}
                          </label>

                          {errors[
                            field.id
                          ] && (
                            <p className="mt-1 text-xs font-medium text-red-500">
                              This field is
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

      {/* ACTIONS */}

      <div className="mt-6 flex justify-end gap-3 border-t pt-4">
        <Button
          variant="outline"
          onClick={() =>
            save(false)
          }
        >
          <Save data-icon="inline-start" />
          Save Draft
        </Button>

        <Button
          onClick={() =>
            save(true)
          }
        >
          <Send data-icon="inline-start" />
          Submit Report
        </Button>
      </div>

      {/* CAMERA */}

      {camera && (
        <CameraCapture
          mode={camera.mode}
          reportId={
            serviceReportId ||
            "new-service-report"
          }
          onCancel={() =>
            setCamera(null)
          }
          onUse={(
            item: EvidenceItem,
          ) => {
            const fieldId =
              camera.field.id;

            setData(
              (current) => ({
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
              }),
            );

            setErrors(
              (current) => {
                const updated = {
                  ...current,
                };

                delete updated[
                  fieldId
                ];

                return updated;
              },
            );

            setCamera(null);
          }}
        />
      )}

      {/* SIGNATURE */}

      {signatureField && (
        <SignaturePad
          field={signatureField}
          onCancel={() =>
            setSignatureField(null)
          }
          onSave={(signature) => {
            setData(
              (current) => ({
                ...current,

                signatures: {
                  ...current.signatures,

                  [signatureField.id]:
                    {
                      signature,
                      signedAt:
                        new Date().toISOString(),
                    },
                },
              }),
            );

            setErrors(
              (current) => {
                const updated = {
                  ...current,
                };

                delete updated[
                  signatureField.id
                ];

                return updated;
              },
            );

            setSignatureField(null);
          }}
        />
      )}
    </main>
  );
}

// --------------------------------------------------
// SIGNATURE PAD
// --------------------------------------------------

function SignaturePad({
  field,
  onCancel,
  onSave,
}: {
  field: Field;
  onCancel: () => void;
  onSave: (signature: string) => void;
}) {
  const [canvas, setCanvas] =
    useState<HTMLCanvasElement | null>(
      null,
    );

  const [drawing, setDrawing] =
    useState(false);

  useEffect(() => {
    if (!canvas) {
      return;
    }

    const context =
      canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.fillStyle = "#ffffff";

    context.fillRect(
      0,
      0,
      canvas.width,
      canvas.height,
    );

    context.lineWidth = 2;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#000000";
  }, [canvas]);

  function getPosition(
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) {
    if (!canvas) {
      return {
        x: 0,
        y: 0,
      };
    }

    const rect =
      canvas.getBoundingClientRect();

    if ("touches" in event) {
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
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) {
    event.preventDefault();

    if (!canvas) {
      return;
    }

    const context =
      canvas.getContext("2d");

    if (!context) {
      return;
    }

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
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
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

    if (!context) {
      return;
    }

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
    if (!canvas) {
      return;
    }

    const context =
      canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.fillStyle = "#ffffff";

    context.fillRect(
      0,
      0,
      canvas.width,
      canvas.height,
    );

    context.strokeStyle = "#000000";
  }

  function saveSignature() {
    if (!canvas) {
      return;
    }

    const signature =
      canvas.toDataURL(
        "image/png",
      );

    onSave(signature);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-background p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {field.label}
            </h2>

            <p className="text-sm text-muted-foreground">
              Sign using touch, mouse,
              or trackpad.
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
          >
            <X />
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border bg-white">
          <canvas
            ref={setCanvas}
            width={1000}
            height={400}
            className="h-64 w-full touch-none"
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
              onClick={onCancel}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={
                saveSignature
              }
            >
              Save Signature
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}