// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   ArrowLeft,
//   Camera,
//   Check,
//   Save,
//   Send,
//   Video,
//   X,
// } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Card,
//   CardContent,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { CameraCapture } from "@/components/camera-capture";

// // --------------------------------------------------
// // TYPES
// // --------------------------------------------------

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

// type FieldValue = {
//   value?: string | string[];
//   evidence?: EvidenceItem[];
//   signature?: SignatureData;
// };

// type FormData = Record<string, FieldValue>;

// // --------------------------------------------------
// // AUDIT FORM
// // --------------------------------------------------

// export default function AuditForm() {
//   const router = useRouter();

//   const [template, setTemplate] =
//     useState<Template | null>(null);

//   const [auditId, setAuditId] = useState("");

//   const [data, setData] =
//     useState<FormData>({});

//   const [errors, setErrors] =
//     useState<Record<string, boolean>>({});

//   const [customer, setCustomer] =
//     useState("");

//   const [location, setLocation] =
//     useState("");

//   const [camera, setCamera] =
//     useState<{
//       mode: "photo" | "video";
//       field: Field;
//     } | null>(null);

//   const [signatureField, setSignatureField] =
//     useState<Field | null>(null);

//   // --------------------------------------------------
//   // LOAD LATEST TEMPLATE
//   // --------------------------------------------------

//   useEffect(() => {
//     async function loadTemplate() {
//       try {
//         const response =
//           await fetch("/api/templates");

//         if (!response.ok) {
//           throw new Error(
//             "Failed to load audit template",
//           );
//         }

//         const templates: Template[] =
//           await response.json();

//         const auditTemplate =
//           templates.find(
//             (item) =>
//               item.type === "AUDIT",
//           );

//         if (!auditTemplate) {
//           throw new Error(
//             "Audit template not found",
//           );
//         }

//         // This is the latest template
//         // from template.json.
//         setTemplate(auditTemplate);

//         // Create initial values
//         // from the latest template.
//         const initialData: FormData = {};

//         auditTemplate.sections.forEach(
//           (section) => {
//             section.fields.forEach(
//               (field) => {
//                 if (
//                   field.type ===
//                   "multiple-choice"
//                 ) {
//                   initialData[field.id] = {
//                     value: [],
//                   };
//                 } else if (
//                   field.multiple
//                 ) {
//                   initialData[field.id] = {
//                     value: [""],
//                   };
//                 } else {
//                   initialData[field.id] = {
//                     value: "",
//                   };
//                 }
//               },
//             );
//           },
//         );

//         setData(initialData);
//       } catch (error) {
//         console.error(
//           "Failed to load audit template:",
//           error,
//         );
//       }
//     }

//     loadTemplate();
//   }, []);

//   // --------------------------------------------------
//   // GET FIELD DATA
//   // --------------------------------------------------

//   function getFieldData(
//     field: Field,
//   ): FieldValue {
//     return data[field.id] || {};
//   }

//   function getValue(field: Field) {
//     const fieldData =
//       getFieldData(field);

//     if (
//       field.type ===
//       "multiple-choice"
//     ) {
//       return Array.isArray(
//         fieldData.value,
//       )
//         ? fieldData.value
//         : [];
//     }

//     if (field.multiple) {
//       return Array.isArray(
//         fieldData.value,
//       )
//         ? fieldData.value
//         : [""];
//     }

//     return typeof fieldData.value ===
//       "string"
//       ? fieldData.value
//       : "";
//   }

//   // --------------------------------------------------
//   // UPDATE FIELD VALUE
//   // --------------------------------------------------

//   function setValue(
//     field: Field,
//     value: string | string[],
//   ) {
//     setData((current) => ({
//       ...current,
//       [field.id]: {
//         ...current[field.id],
//         value,
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
//   // VALIDATE REQUIRED FIELDS
//   // --------------------------------------------------

//   function validateRequiredFields() {
//     if (!template) {
//       return false;
//     }

//     const newErrors: Record<
//       string,
//       boolean
//     > = {};

//     for (const section of template.sections) {
//       for (const field of section.fields) {
//         if (!field.required) {
//           continue;
//         }

//         const fieldData =
//           getFieldData(field);

//         // --------------------------------------------
//         // SIGNATURE
//         // --------------------------------------------

//         if (
//           field.type ===
//           "signature"
//         ) {
//           if (
//             !fieldData.signature
//               ?.signature
//           ) {
//             newErrors[field.id] =
//               true;
//           }

//           continue;
//         }

//         // --------------------------------------------
//         // CAMERA
//         // --------------------------------------------

//         if (
//           field.type ===
//             "camera-photo" ||
//           field.type ===
//             "camera-video"
//         ) {
//           if (
//             !fieldData.evidence ||
//             fieldData.evidence.length ===
//               0
//           ) {
//             newErrors[field.id] =
//               true;
//           }

//           continue;
//         }

//         // --------------------------------------------
//         // NORMAL VALUE
//         // --------------------------------------------

//         const value =
//           getValue(field);

//         if (Array.isArray(value)) {
//           const empty =
//             value.length === 0 ||
//             value.every(
//               (item) =>
//                 !String(
//                   item ?? "",
//                 ).trim(),
//             );

//           if (empty) {
//             newErrors[field.id] =
//               true;
//           }
//         } else if (
//           !String(
//             value ?? "",
//           ).trim()
//         ) {
//           newErrors[field.id] =
//             true;
//         }
//       }
//     }

//     setErrors(newErrors);

//     if (
//       Object.keys(newErrors)
//         .length === 0
//     ) {
//       return true;
//     }

//     const firstMissingId =
//       Object.keys(newErrors)[0];

//     const firstField =
//       document.querySelector(
//         `[data-field-id="${firstMissingId}"]`,
//       );

//     firstField?.scrollIntoView({
//       behavior: "smooth",
//       block: "center",
//     });

//     return false;
//   }

//   // --------------------------------------------------
//   // CAMERA FIELD
//   // --------------------------------------------------

//   function renderCameraField(
//     field: Field,
//   ) {
//     const fieldData =
//       getFieldData(field);

//     const evidence =
//       fieldData.evidence || [];

//     const hasError =
//       !!errors[field.id];

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
//               mode:
//                 field.type ===
//                 "camera-video"
//                   ? "video"
//                   : "photo",
//               field,
//             })
//           }
//         >
//           {field.type ===
//           "camera-video" ? (
//             <Video data-icon="inline-start" />
//           ) : (
//             <Camera data-icon="inline-start" />
//           )}

//           {field.type ===
//           "camera-video"
//             ? "Capture Video"
//             : "Capture Photo"}
//         </Button>

//         {evidence.length > 0 && (
//           <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
//             {evidence.map(
//               (
//                 item,
//                 index,
//               ) => (
//                 <div
//                   key={`${item.url}-${index}`}
//                   className="group relative overflow-hidden rounded-xl border bg-muted"
//                 >
//                   {item.type ===
//                   "video" ? (
//                     <video
//                       src={item.url}
//                       controls
//                       playsInline
//                       className="aspect-video w-full object-cover"
//                     />
//                   ) : (
//                     <img
//                       src={item.url}
//                       alt={`Evidence ${
//                         index + 1
//                       }`}
//                       className="aspect-video w-full object-cover"
//                     />
//                   )}

//                   <button
//                     type="button"
//                     onClick={() => {
//                       setData(
//                         (current) => ({
//                           ...current,
//                           [field.id]: {
//                             ...current[
//                               field.id
//                             ],
//                             evidence:
//                               evidence.filter(
//                                 (
//                                   _,
//                                   i,
//                                 ) =>
//                                   i !==
//                                   index,
//                               ),
//                           },
//                         }),
//                       );
//                     }}
//                     className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600"
//                     aria-label="Remove evidence"
//                   >
//                     <X className="size-4" />
//                   </button>

//                   <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white">
//                     {item.type ===
//                     "video"
//                       ? "VIDEO"
//                       : "PHOTO"}
//                   </div>
//                 </div>
//               ),
//             )}
//           </div>
//         )}

//         <p className="text-xs text-muted-foreground">
//           Add supporting photo or
//           video evidence when
//           available.
//         </p>
//       </div>
//     );
//   }

//   // --------------------------------------------------
//   // SIGNATURE FIELD
//   // --------------------------------------------------

//   function renderSignatureField(
//     field: Field,
//   ) {
//     const fieldData =
//       getFieldData(field);

//     const signature =
//       fieldData.signature;

//     const hasError =
//       !!errors[field.id];

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
//                 src={
//                   signature.signature
//                 }
//                 alt={field.label}
//                 className="h-40 w-full object-contain"
//               />
//             </div>

//             <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
//               <p className="text-xs text-muted-foreground">
//                 Signed on{" "}
//                 {new Date(
//                   signature.signedAt,
//                 ).toLocaleString(
//                   "en-IN",
//                   {
//                     timeZone:
//                       "Asia/Kolkata",
//                     dateStyle:
//                       "medium",
//                     timeStyle:
//                       "short",
//                   },
//                 )}{" "}
//                 IST
//               </p>

//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() =>
//                   setSignatureField(
//                     field,
//                   )
//                 }
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
//             onClick={() =>
//               setSignatureField(
//                 field,
//               )
//             }
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

//   function fieldControl(
//     field: Field,
//   ) {
//     const value =
//       getValue(field);

//     const hasError =
//       !!errors[field.id];

//     // --------------------------------------------
//     // TEXTAREA
//     // --------------------------------------------

//     if (
//       field.type ===
//       "textarea"
//     ) {
//       return (
//         <Textarea
//           value={
//             Array.isArray(value)
//               ? value[0] || ""
//               : value
//           }
//           onChange={(e) =>
//             setValue(
//               field,
//               e.target.value,
//             )
//           }
//           className={
//             hasError
//               ? "border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500"
//               : ""
//           }
//         />
//       );
//     }

//     // --------------------------------------------
//     // SINGLE CHOICE
//     // --------------------------------------------

//     if (
//       field.type ===
//       "single-choice"
//     ) {
//       return (
//         <div
//           className={
//             hasError
//               ? "rounded-lg border border-red-500 p-2 ring-1 ring-red-500"
//               : ""
//           }
//         >
//           <div className="flex flex-wrap gap-2">
//             {(
//               field.options || []
//             ).map(
//               (option) => (
//                 <Button
//                   key={option}
//                   type="button"
//                   variant={
//                     value ===
//                     option
//                       ? "default"
//                       : "outline"
//                   }
//                   onClick={() =>
//                     setValue(
//                       field,
//                       option,
//                     )
//                   }
//                 >
//                   {option}
//                 </Button>
//               ),
//             )}
//           </div>
//         </div>
//       );
//     }

//     // --------------------------------------------
//     // MULTIPLE CHOICE
//     // --------------------------------------------

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
//           className={
//             hasError
//               ? "rounded-lg border border-red-500 p-3 ring-1 ring-red-500"
//               : ""
//           }
//         >
//           <div className="grid gap-2">
//             {(
//               field.options || []
//             ).map(
//               (option) => (
//                 <label
//                   key={option}
//                   className="flex cursor-pointer items-center gap-2 text-sm"
//                 >
//                   <input
//                     type="checkbox"
//                     checked={selected.includes(
//                       option,
//                     )}
//                     onChange={(
//                       e,
//                     ) => {
//                       setValue(
//                         field,
//                         e.target.checked
//                           ? [
//                               ...selected,
//                               option,
//                             ]
//                           : selected.filter(
//                               (
//                                 item,
//                               ) =>
//                                 item !==
//                                 option,
//                             ),
//                       );
//                     }}
//                   />

//                   {option}
//                 </label>
//               ),
//             )}
//           </div>
//         </div>
//       );
//     }

//     // --------------------------------------------
//     // CAMERA
//     // --------------------------------------------

//     if (
//       field.type ===
//         "camera-photo" ||
//       field.type ===
//         "camera-video"
//     ) {
//       return renderCameraField(
//         field,
//       );
//     }

//     // --------------------------------------------
//     // SIGNATURE
//     // --------------------------------------------

//     if (
//       field.type ===
//       "signature"
//     ) {
//       return renderSignatureField(
//         field,
//       );
//     }

//     // --------------------------------------------
//     // NORMAL INPUT
//     // --------------------------------------------

//     return (
//       <Input
//         type={
//           field.type ===
//           "number"
//             ? "number"
//             : field.type
//         }
//         value={
//           Array.isArray(value)
//             ? value[0] || ""
//             : value
//         }
//         onChange={(e) =>
//           setValue(
//             field,
//             e.target.value,
//           )
//         }
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

//   function renderMultipleField(
//     field: Field,
//   ) {
//     const value =
//       getValue(field);

//     const values =
//       Array.isArray(value)
//         ? value
//         : [""];

//     return (
//       <div
//         className={
//           errors[field.id]
//             ? "rounded-lg border border-red-500 p-3 ring-1 ring-red-500"
//             : "flex flex-col gap-2"
//         }
//       >
//         {values.map(
//           (
//             item,
//             index,
//           ) => (
//             <div
//               key={index}
//               className="flex gap-2"
//             >
//               <Textarea
//                 value={item}
//                 onChange={(e) => {
//                   const updated = [
//                     ...values,
//                   ];

//                   updated[index] =
//                     e.target.value;

//                   setValue(
//                     field,
//                     updated,
//                   );
//                 }}
//               />

//               {index > 0 && (
//                 <Button
//                   type="button"
//                   variant="ghost"
//                   onClick={() => {
//                     setValue(
//                       field,
//                       values.filter(
//                         (
//                           _,
//                           i,
//                         ) =>
//                           i !==
//                           index,
//                       ),
//                     );
//                   }}
//                 >
//                   <X />
//                 </Button>
//               )}
//             </div>
//           ),
//         )}
//       </div>
//     );
//   }

//   // --------------------------------------------------
//   // PREPARE DATA FOR DATABASE
//   // --------------------------------------------------

//   function buildAuditPayload() {
//     if (!template) {
//       throw new Error(
//         "Audit template is not loaded.",
//       );
//     }

//     const formData: Record<
//       string,
//       unknown
//     > = {};

//     const evidence: Record<
//       string,
//       EvidenceItem[]
//     > = {};

//     const signatures: Record<
//       string,
//       SignatureData
//     > = {};

//     Object.entries(data).forEach(
//       ([fieldId, field]) => {
//         // Normal field value
//         if (
//           field.value !==
//           undefined
//         ) {
//           formData[fieldId] =
//             field.value;
//         }

//         // Evidence
//         if (
//           field.evidence &&
//           field.evidence.length >
//             0
//         ) {
//           evidence[fieldId] =
//             field.evidence;
//         }

//         // Signature
//         if (
//           field.signature
//         ) {
//           signatures[fieldId] =
//             field.signature;
//         }
//       },
//     );

//     // These are currently outside
//     // template.json, so preserve them
//     // inside formData.
//     formData.customer =
//       customer;

//     formData.location =
//       location;

//     formData.date =
//       "10/05/2026";

//     return {
//       templateId: template.id,

//       // IMPORTANT:
//       // Save the exact latest template
//       // that this employee used.
//       templateSnapshot: template,

//       formData,

//       evidence,

//       signatures,
//     };
//   }

//   // --------------------------------------------------
//   // SAVE / SUBMIT
//   // --------------------------------------------------

//   async function save(
//     submit = false,
//   ) {
//     if (submit) {
//       if (
//         !validateRequiredFields()
//       ) {
//         return;
//       }

//       if (
//         !confirm(
//           "Submit this audit? You will not be able to edit the completed report.",
//         )
//       ) {
//         return;
//       }
//     }

//     let id = auditId;

//     try {
//       const audit =
//         buildAuditPayload();

//       console.log(
//         "FINAL AUDIT DATA:",
//         JSON.stringify(
//           audit,
//           null,
//           2,
//         ),
//       );

//       // --------------------------------------------
//       // CREATE
//       // --------------------------------------------

//       if (!id) {
//         const response =
//           await fetch(
//             "/api/audits",
//             {
//               method: "POST",
//               headers: {
//                 "Content-Type":
//                   "application/json",
//               },
//               body: JSON.stringify(
//                 audit,
//               ),
//             },
//           );

//         if (!response.ok) {
//           const error =
//             await response.text();

//           console.error(
//             "Create audit failed:",
//             error,
//           );

//           throw new Error(
//             "Failed to create audit",
//           );
//         }

//         const created =
//           await response.json();

//         id = created.id;

//         setAuditId(id);
//       }

//       // --------------------------------------------
//       // UPDATE
//       // --------------------------------------------

//       else {
//         const response =
//           await fetch(
//             `/api/audits/${id}`,
//             {
//               method: "PUT",
//               headers: {
//                 "Content-Type":
//                   "application/json",
//               },
//               body: JSON.stringify(
//                 audit,
//               ),
//             },
//           );

//         if (!response.ok) {
//           const error =
//             await response.text();

//           console.error(
//             "Update audit failed:",
//             error,
//           );

//           throw new Error(
//             "Failed to save audit",
//           );
//         }
//       }

//       // --------------------------------------------
//       // SUBMIT
//       // --------------------------------------------

//       if (submit) {
//         const response =
//           await fetch(
//             `/api/audits/${id}/submit`,
//             {
//               method: "POST",
//             },
//           );

//         if (!response.ok) {
//           const error =
//             await response.text();

//           console.error(
//             "Submit audit failed:",
//             error,
//           );

//           throw new Error(
//             "Failed to submit audit",
//           );
//         }

//         router.push(
//           `/employee/audits/${id}`,
//         );
//       } else {
//         alert("Draft saved.");
//       }
//     } catch (error) {
//       console.error(
//         "SAVE AUDIT ERROR:",
//         error,
//       );

//       alert(
//         error instanceof Error
//           ? error.message
//           : "Failed to save audit.",
//       );
//     }
//   }

//   // --------------------------------------------------
//   // LOADING
//   // --------------------------------------------------

//   if (!template) {
//     return (
//       <main className="p-8 text-muted-foreground">
//         Loading audit template…
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
//           router.push("/employee")
//         }
//       >
//         <ArrowLeft data-icon="inline-start" />
//         Back to Audits
//       </Button>

//       {/* HEADER */}

//       <Card className="teal-wash mt-5 overflow-hidden shadow-sm">
//         <CardContent className="p-6 sm:p-8">
//           <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
//             <div>
//               <p className="text-sm font-semibold text-primary">
//                 New Audit
//               </p>

//               <h1 className="mt-2 max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl">
//                 {template.title ||
//                   template.name}
//               </h1>

//               <p className="mt-2 text-sm text-muted-foreground">
//                 Complete the audit
//                 checklist and attach
//                 supporting evidence.
//               </p>
//             </div>

//             <Badge variant="secondary">
//               Draft
//             </Badge>
//           </div>
//         </CardContent>
//       </Card>

//       {/* AUDIT INFORMATION

//       <Card className="mt-6 shadow-sm">
//         <CardContent className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
//           <div>
//             <label className="text-sm font-medium">
//               Customer Name
//             </label>

//             <Input
//               className="mt-2"
//               placeholder="Enter customer name"
//               value={customer}
//               onChange={(e) => {
//                 setCustomer(
//                   e.target.value,
//                 );
//               }}
//             />
//           </div>

//           <div>
//             <label className="text-sm font-medium">
//               Location
//             </label>

//             <Input
//               className="mt-2"
//               placeholder="Enter location"
//               value={location}
//               onChange={(e) => {
//                 setLocation(
//                   e.target.value,
//                 );
//               }}
//             />
//           </div>

//           <div>
//             <label className="text-sm font-medium">
//               Audit Date
//             </label>

//             <Input
//               className="mt-2"
//               value="10/05/2026"
//               readOnly
//             />
//           </div>

//           <div>
//             <label className="text-sm font-medium">
//               Auditor
//             </label>

//             <Input
//               className="mt-2"
//               value="S. Roy"
//               readOnly
//             />
//           </div>
//         </CardContent>
//       </Card> */}

//       {/* SECTIONS */}

//       <div className="mt-6 flex flex-col gap-6">
//         {template.sections.map(
//           (section) => (
//             <section
//               key={section.id}
//             >
//               {/* SECTION HEADER */}

//               <div className="mb-3 flex items-center justify-between rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
//                 <div>
//                   <h2 className="font-semibold">
//                     {section.name ||
//                       section.title}
//                   </h2>

//                   <p className="text-xs text-muted-foreground">
//                     Complete the
//                     information below.
//                   </p>
//                 </div>

//                 <Badge variant="secondary">
//                   {
//                     section.fields
//                       .length
//                   }{" "}
//                   fields
//                 </Badge>
//               </div>

//               {/* SECTION CONTENT */}

//               <Card className="shadow-sm">
//                 <CardContent className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
//                   {section.fields.map(
//                     (field) => {
//                       const fullWidth =
//                         field.type ===
//                           "textarea" ||
//                         field.type ===
//                           "multiple-choice" ||
//                         field.type ===
//                           "single-choice" ||
//                         field.type ===
//                           "camera-photo" ||
//                         field.type ===
//                           "camera-video" ||
//                         field.type ===
//                           "signature" ||
//                         field.multiple;

//                       return (
//                         <div
//                           key={field.id}
//                           data-field-id={
//                             field.id
//                           }
//                           className={
//                             fullWidth
//                               ? "sm:col-span-2"
//                               : ""
//                           }
//                         >
//                           <label className="flex flex-col gap-2 text-sm font-medium">
//                             <span>
//                               {
//                                 field.label
//                               }

//                               {field.required && (
//                                 <span className="ml-1 text-red-500">
//                                   *
//                                 </span>
//                               )}
//                             </span>

//                             {field.multiple ? (
//                               renderMultipleField(
//                                 field,
//                               )
//                             ) : (
//                               fieldControl(
//                                 field,
//                               )
//                             )}
//                           </label>

//                           {errors[
//                             field.id
//                           ] && (
//                             <p className="mt-1 text-xs font-medium text-red-500">
//                               This field
//                               is
//                               required.
//                             </p>
//                           )}
//                         </div>
//                       );
//                     },
//                   )}
//                 </CardContent>
//               </Card>
//             </section>
//           ),
//         )}
//       </div>

//       {/* ACTIONS */}

//       <div className="mt-6 flex justify-end gap-3 border-t pt-4">
//         <Button
//           variant="outline"
//           onClick={() =>
//             save(false)
//           }
//         >
//           <Save data-icon="inline-start" />
//           Save Draft
//         </Button>

//         <Button
//           onClick={() =>
//             save(true)
//           }
//         >
//           <Send data-icon="inline-start" />
//           Submit Audit
//         </Button>
//       </div>

//       {/* CAMERA */}

//       {camera && (
//         <CameraCapture
//           mode={camera.mode}
//           reportId={
//             auditId ||
//             "new-audit"
//           }
//           onCancel={() =>
//             setCamera(null)
//           }
//           onUse={(
//             item: EvidenceItem,
//           ) => {
//             const fieldId =
//               camera.field.id;

//             setData(
//               (current) => ({
//                 ...current,
//                 [fieldId]: {
//                   ...current[fieldId],
//                   evidence: [
//                     ...(current[
//                       fieldId
//                     ]?.evidence ||
//                       []),
//                     item,
//                   ],
//                 },
//               }),
//             );

//             setErrors(
//               (current) => {
//                 const updated = {
//                   ...current,
//                 };

//                 delete updated[
//                   fieldId
//                 ];

//                 return updated;
//               },
//             );

//             setCamera(null);
//           }}
//         />
//       )}

//       {/* SIGNATURE */}

//       {signatureField && (
//         <SignaturePad
//           field={signatureField}
//           onCancel={() =>
//             setSignatureField(
//               null,
//             )
//           }
//           onSave={(
//             signature,
//           ) => {
//             setData(
//               (current) => ({
//                 ...current,
//                 [signatureField.id]:
//                   {
//                     ...current[
//                       signatureField.id
//                     ],
//                     signature: {
//                       signature,
//                       signedAt:
//                         new Date().toISOString(),
//                     },
//                   },
//               }),
//             );

//             setErrors(
//               (current) => {
//                 const updated = {
//                   ...current,
//                 };

//                 delete updated[
//                   signatureField.id
//                 ];

//                 return updated;
//               },
//             );

//             setSignatureField(
//               null,
//             );
//           }}
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
//   onCancel,
//   onSave,
// }: {
//   field: Field;
//   onCancel: () => void;
//   onSave: (
//     signature: string,
//   ) => void;
// }) {
//   const [canvas, setCanvas] =
//     useState<HTMLCanvasElement | null>(
//       null,
//     );

//   const [drawing, setDrawing] =
//     useState(false);

//   useEffect(() => {
//     if (!canvas) {
//       return;
//     }

//     const context =
//       canvas.getContext("2d");

//     if (!context) {
//       return;
//     }

//     context.fillStyle =
//       "#ffffff";

//     context.fillRect(
//       0,
//       0,
//       canvas.width,
//       canvas.height,
//     );

//     context.lineWidth = 2;
//     context.lineCap = "round";
//     context.lineJoin = "round";
//     context.strokeStyle =
//       "#000000";
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

//     const rect =
//       canvas.getBoundingClientRect();

//     if ("touches" in event) {
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

//     if (!canvas) {
//       return;
//     }

//     const context =
//       canvas.getContext("2d");

//     if (!context) {
//       return;
//     }

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

//     if (!context) {
//       return;
//     }

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
//     if (!canvas) {
//       return;
//     }

//     const context =
//       canvas.getContext("2d");

//     if (!context) {
//       return;
//     }

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
//     if (!canvas) {
//       return;
//     }

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

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Camera,
  Check,
  ChevronDown,
  Save,
  Send,
  Video,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CameraCapture } from "@/components/camera-capture";

// --------------------------------------------------
// TYPES
// --------------------------------------------------

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

type FieldValue = {
  value?: string | string[];
  evidence?: EvidenceItem[];
  signature?: SignatureData;
};

type FormData = Record<string, FieldValue>;

// --------------------------------------------------
// CUSTOMER TYPE
// --------------------------------------------------

type Customer = {
  id: string;
  name: string;
  address: string;
  gstNo: string | null;
  contactNumber: string;
};

// --------------------------------------------------
// AUDIT FORM
// --------------------------------------------------

export default function AuditForm() {
  const router = useRouter();

  const [template, setTemplate] = useState<Template | null>(null);

  const [auditId, setAuditId] = useState("");

  const [data, setData] = useState<FormData>({});

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const [customer, setCustomer] = useState("");

  const [location, setLocation] = useState("");

  // --------------------------------------------------
  // CUSTOMER STATE
  // --------------------------------------------------

  const [customers, setCustomers] = useState<Customer[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  const [customersLoading, setCustomersLoading] = useState(true);

  const [customerLoadError, setCustomerLoadError] = useState(false);

  // --------------------------------------------------

  const [camera, setCamera] = useState<{
    mode: "photo" | "video";
    field: Field;
  } | null>(null);

  const [signatureField, setSignatureField] = useState<Field | null>(null);

  // --------------------------------------------------
  // LOAD LATEST TEMPLATE
  // --------------------------------------------------

  useEffect(() => {
    async function loadTemplate() {
      try {
        const response = await fetch("/api/templates");

        if (!response.ok) {
          throw new Error("Failed to load audit template");
        }

        const templates: Template[] = await response.json();

        const auditTemplate = templates.find((item) => item.type === "AUDIT");

        if (!auditTemplate) {
          throw new Error("Audit template not found");
        }

        // This is the latest template
        // from template.json.
        setTemplate(auditTemplate);

        // Create initial values
        // from the latest template.
        const initialData: FormData = {};

        auditTemplate.sections.forEach((section) => {
          section.fields.forEach((field) => {
            if (field.type === "multiple-choice") {
              initialData[field.id] = {
                value: [],
              };
            } else if (field.multiple) {
              initialData[field.id] = {
                value: [""],
              };
            } else {
              initialData[field.id] = {
                value: "",
              };
            }
          });
        });

        setData(initialData);
      } catch (error) {
        console.error("Failed to load audit template:", error);
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

        const response = await fetch("/employee/customers", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const text = await response.text();

        let result: Customer[] = [];

        try {
          result = text ? JSON.parse(text) : [];
        } catch {
          throw new Error("Invalid customer response");
        }

        if (!response.ok) {
          throw new Error(
            result instanceof Array
              ? "Failed to load customers"
              : "Failed to load customers",
          );
        }

        setCustomers(result);
      } catch (error) {
        console.error("Load customers error:", error);

        setCustomerLoadError(true);
      } finally {
        setCustomersLoading(false);
      }
    }

    loadCustomers();
  }, []);

  // --------------------------------------------------
  // CUSTOMER SELECTION
  // --------------------------------------------------

  function handleCustomerChange(customerId: string) {
    setSelectedCustomerId(customerId);

    const selected = customers.find((item) => item.id === customerId) || null;

    setSelectedCustomer(selected);

    // Preserve existing customer variable
    // functionality.
    setCustomer(selected?.name || "");

    // Preserve existing location variable
    // functionality.
    setLocation(selected?.address || "");

    setErrors((current) => {
      if (!current.customer) {
        return current;
      }

      const updated = {
        ...current,
      };

      delete updated.customer;

      return updated;
    });
  }

  // --------------------------------------------------
  // GET FIELD DATA
  // --------------------------------------------------

  function getFieldData(field: Field): FieldValue {
    return data[field.id] || {};
  }

  function getValue(field: Field) {
    const fieldData = getFieldData(field);

    if (field.type === "multiple-choice") {
      return Array.isArray(fieldData.value) ? fieldData.value : [];
    }

    if (field.multiple) {
      return Array.isArray(fieldData.value) ? fieldData.value : [""];
    }

    return typeof fieldData.value === "string" ? fieldData.value : "";
  }

  // --------------------------------------------------
  // UPDATE FIELD VALUE
  // --------------------------------------------------

  function setValue(field: Field, value: string | string[]) {
    setData((current) => ({
      ...current,
      [field.id]: {
        ...current[field.id],
        value,
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
  // VALIDATE REQUIRED FIELDS
  // --------------------------------------------------

  function validateRequiredFields() {
    if (!template) {
      return false;
    }

    const newErrors: Record<string, boolean> = {};

    // CUSTOMER IS REQUIRED
    if (!selectedCustomerId) {
      newErrors.customer = true;
    }

    for (const section of template.sections) {
      for (const field of section.fields) {
        if (!field.required) {
          continue;
        }

        const fieldData = getFieldData(field);

        // --------------------------------------------
        // SIGNATURE
        // --------------------------------------------

        if (field.type === "signature") {
          if (!fieldData.signature?.signature) {
            newErrors[field.id] = true;
          }

          continue;
        }

        // --------------------------------------------
        // CAMERA
        // --------------------------------------------

        if (field.type === "camera-photo" || field.type === "camera-video") {
          if (!fieldData.evidence || fieldData.evidence.length === 0) {
            newErrors[field.id] = true;
          }

          continue;
        }

        // --------------------------------------------
        // NORMAL VALUE
        // --------------------------------------------

        const value = getValue(field);

        if (Array.isArray(value)) {
          const empty =
            value.length === 0 ||
            value.every((item) => !String(item ?? "").trim());

          if (empty) {
            newErrors[field.id] = true;
          }
        } else if (!String(value ?? "").trim()) {
          newErrors[field.id] = true;
        }
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      return true;
    }

    // CUSTOMER ERROR FIRST
    if (newErrors.customer) {
      const customerElement = document.getElementById("customer-selector");

      customerElement?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      return false;
    }

    const firstMissingId = Object.keys(newErrors)[0];

    const firstField = document.querySelector(
      `[data-field-id="${firstMissingId}"]`,
    );

    firstField?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    return false;
  }

  // --------------------------------------------------
  // CAMERA FIELD
  // --------------------------------------------------

  function renderCameraField(field: Field) {
    const fieldData = getFieldData(field);

    const evidence = fieldData.evidence || [];

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
              mode: field.type === "camera-video" ? "video" : "photo",
              field,
            })
          }
        >
          {field.type === "camera-video" ? (
            <Video data-icon="inline-start" />
          ) : (
            <Camera data-icon="inline-start" />
          )}

          {field.type === "camera-video" ? "Capture Video" : "Capture Photo"}
        </Button>

        {evidence.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                    alt={`Evidence ${index + 1}`}
                    className="aspect-video w-full object-cover"
                  />
                )}

                <button
                  type="button"
                  onClick={() => {
                    setData((current) => ({
                      ...current,
                      [field.id]: {
                        ...current[field.id],
                        evidence: evidence.filter((_, i) => i !== index),
                      },
                    }));
                  }}
                  className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600"
                  aria-label="Remove evidence"
                >
                  <X className="size-4" />
                </button>

                <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white">
                  {item.type === "video" ? "VIDEO" : "PHOTO"}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Add supporting photo or video evidence when available.
        </p>
      </div>
    );
  }

  // --------------------------------------------------
  // SIGNATURE FIELD
  // --------------------------------------------------

  function renderSignatureField(field: Field) {
    const fieldData = getFieldData(field);

    const signature = fieldData.signature;

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
                {new Date(signature.signedAt).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  dateStyle: "medium",
                  timeStyle: "short",
                })}{" "}
                IST
              </p>

              <Button
                type="button"
                variant="outline"
                onClick={() => setSignatureField(field)}
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
            onClick={() => setSignatureField(field)}
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

    // --------------------------------------------
    // TEXTAREA
    // --------------------------------------------

    if (field.type === "textarea") {
      return (
        <Textarea
          value={Array.isArray(value) ? value[0] || "" : value}
          onChange={(e) => setValue(field, e.target.value)}
          className={
            hasError
              ? "border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500"
              : ""
          }
        />
      );
    }

    // --------------------------------------------
    // SINGLE CHOICE
    // --------------------------------------------

    if (field.type === "single-choice") {
      return (
        <div
          className={
            hasError
              ? "rounded-lg border border-red-500 p-2 ring-1 ring-red-500"
              : ""
          }
        >
          <div className="flex flex-wrap gap-2">
            {(field.options || []).map((option) => (
              <Button
                key={option}
                type="button"
                variant={value === option ? "default" : "outline"}
                onClick={() => setValue(field, option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
      );
    }

    // --------------------------------------------
    // MULTIPLE CHOICE
    // --------------------------------------------

    if (field.type === "multiple-choice") {
      const selected = Array.isArray(value) ? value : [];

      return (
        <div
          className={
            hasError
              ? "rounded-lg border border-red-500 p-3 ring-1 ring-red-500"
              : ""
          }
        >
          <div className="grid gap-2">
            {(field.options || []).map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={(e) => {
                    setValue(
                      field,
                      e.target.checked
                        ? [...selected, option]
                        : selected.filter((item) => item !== option),
                    );
                  }}
                />

                {option}
              </label>
            ))}
          </div>
        </div>
      );
    }

    // --------------------------------------------
    // CAMERA
    // --------------------------------------------

    if (field.type === "camera-photo" || field.type === "camera-video") {
      return renderCameraField(field);
    }

    // --------------------------------------------
    // SIGNATURE
    // --------------------------------------------

    if (field.type === "signature") {
      return renderSignatureField(field);
    }

    // --------------------------------------------
    // NORMAL INPUT
    // --------------------------------------------

    return (
      <Input
        type={field.type === "number" ? "number" : field.type}
        value={Array.isArray(value) ? value[0] || "" : value}
        onChange={(e) => setValue(field, e.target.value)}
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

  function renderMultipleField(field: Field) {
    const value = getValue(field);

    const values = Array.isArray(value) ? value : [""];

    return (
      <div
        className={
          errors[field.id]
            ? "rounded-lg border border-red-500 p-3 ring-1 ring-red-500"
            : "flex flex-col gap-2"
        }
      >
        {values.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Textarea
              value={item}
              onChange={(e) => {
                const updated = [...values];

                updated[index] = e.target.value;

                setValue(field, updated);
              }}
            />

            {index > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setValue(
                    field,
                    values.filter((_, i) => i !== index),
                  );
                }}
              >
                <X />
              </Button>
            )}
          </div>
        ))}
      </div>
    );
  }

  // --------------------------------------------------
  // PREPARE DATA FOR DATABASE
  // --------------------------------------------------

  function buildAuditPayload() {
    if (!template) {
      throw new Error("Audit template is not loaded.");
    }

    // CUSTOMER MUST BE SELECTED
    if (!selectedCustomer) {
      throw new Error("Please select a customer before saving the audit.");
    }

    const formData: Record<string, unknown> = {};

    const evidence: Record<string, EvidenceItem[]> = {};

    const signatures: Record<string, SignatureData> = {};

    Object.entries(data).forEach(([fieldId, field]) => {
      // Normal field value
      if (field.value !== undefined) {
        formData[fieldId] = field.value;
      }

      // Evidence
      if (field.evidence && field.evidence.length > 0) {
        evidence[fieldId] = field.evidence;
      }

      // Signature
      if (field.signature) {
        signatures[fieldId] = field.signature;
      }
    });

    // --------------------------------------------------
    // CUSTOMER INFORMATION
    // --------------------------------------------------

    // formData.customerId = selectedCustomer.id;

    // formData.customer = selectedCustomer.name;

    // formData.customerAddress = selectedCustomer.address;

    // formData.customerGstNo = selectedCustomer.gstNo;

    formData.customerContactNumber = selectedCustomer.contactNumber;

    // Preserve existing location
    formData.location = selectedCustomer.address;

    // Preserve existing date
    formData.date = "10/05/2026";

    return {
      templateId: template.id,

      // IMPORTANT:
      // Save the exact latest template
      // that this employee used.
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerAddress: selectedCustomer.address,
      templateSnapshot: template,

      formData,

      evidence,

      signatures,
    };
  }

  // --------------------------------------------------
  // SAVE / SUBMIT
  // --------------------------------------------------

  async function save(submit = false) {
    // CUSTOMER REQUIRED BEFORE ANY SAVE
    if (!selectedCustomerId) {
      setErrors((current) => ({
        ...current,
        customer: true,
      }));

      document.getElementById("customer-selector")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      return;
    }

    if (submit) {
      if (!validateRequiredFields()) {
        return;
      }

      if (
        !confirm(
          "Submit this audit? You will not be able to edit the completed report.",
        )
      ) {
        return;
      }
    }

    let id = auditId;

    try {
      const audit = buildAuditPayload();

      // console.log("FINAL AUDIT DATA:", JSON.stringify(audit, null, 2));

      // --------------------------------------------
      // CREATE
      // --------------------------------------------

      if (!id) {
        const response = await fetch("/api/audits", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(audit),
        });

        if (!response.ok) {
          const error = await response.text();

          console.error("Create audit failed:", error);

          throw new Error("Failed to create audit");
        }

        const created = await response.json();

        id = created.id;

        setAuditId(id);
      }

      // --------------------------------------------
      // UPDATE
      // --------------------------------------------
      else {
        const response = await fetch(`/api/audits/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(audit),
        });

        if (!response.ok) {
          const error = await response.text();

          console.error("Update audit failed:", error);

          throw new Error("Failed to save audit");
        }
      }

      // --------------------------------------------
      // SUBMIT
      // --------------------------------------------

      if (submit) {
        const response = await fetch(`/api/audits/${id}/submit`, {
          method: "POST",
        });

        if (!response.ok) {
          const error = await response.text();

          console.error("Submit audit failed:", error);

          throw new Error("Failed to submit audit");
        }

        router.push(`/employee/audits/${id}`);
      } else {
        alert("Draft saved.");
      }
    } catch (error) {
      console.error("SAVE AUDIT ERROR:", error);

      alert(error instanceof Error ? error.message : "Failed to save audit.");
    }
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (!template) {
    return (
      <main className="p-8 text-muted-foreground">Loading audit template…</main>
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <main className="mobile-safe-bottom mx-auto max-w-6xl px-5 py-8 sm:px-8">
      {/* BACK */}

      <Button variant="ghost" onClick={() => router.push("/employee")}>
        <ArrowLeft data-icon="inline-start" />
        Back to Audits
      </Button>

      {/* HEADER */}

      <Card className="teal-wash mt-5 overflow-hidden shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-primary">New Audit</p>

              <h1 className="mt-2 max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl">
                {template.title || template.name}
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Complete the audit checklist and attach supporting evidence.
              </p>
            </div>

            <Badge variant="secondary">Draft</Badge>
          </div>
        </CardContent>
      </Card>

      {/* CUSTOMER INFORMATION */}

      <Card
        id="customer-selector"
        className={`mt-6 shadow-sm ${
          errors.customer ? "border-red-500 ring-1 ring-red-500" : ""
        }`}
      >
        <CardContent className="p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </div>

            <div>
              <h2 className="font-semibold">Customer Information</h2>

              <p className="text-xs text-muted-foreground">
                Select the customer before filling the audit form.
              </p>
            </div>
          </div>

          {customersLoading ? (
            <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              Loading customers...
            </div>
          ) : customerLoadError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              Failed to load customers. Please refresh the page.
            </div>
          ) : customers.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              No customers are available. Please contact the administrator.
            </div>
          ) : (
            <>
              <div className="relative">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className={`h-11 w-full appearance-none rounded-lg border bg-background px-3 pr-10 text-sm outline-none transition focus:ring-2 focus:ring-primary/20 ${
                    errors.customer ? "border-red-500" : "border-input"
                  }`}
                >
                  <option value="">Select Customer *</option>

                  {customers.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>

              {errors.customer && (
                <p className="mt-2 text-xs font-medium text-red-500">
                  Please select a customer.
                </p>
              )}

              {/* SELECTED CUSTOMER DETAILS */}

              {selectedCustomer && (
                <div className="mt-4 rounded-xl border bg-muted/30 p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Customer Name
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {selectedCustomer.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Contact Number
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {selectedCustomer.contactNumber}
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs text-muted-foreground">Address</p>

                      <p className="mt-1 text-sm font-semibold">
                        {selectedCustomer.address}
                      </p>
                    </div>

                    {selectedCustomer.gstNo && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          GST Number
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          {selectedCustomer.gstNo}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* SECTIONS */}

      <div className="mt-6 flex flex-col gap-6">
        {template.sections.map((section) => (
          <section key={section.id}>
            {/* SECTION HEADER */}

            <div className="mb-3 flex items-center justify-between rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
              <div>
                <h2 className="font-semibold">
                  {section.name || section.title}
                </h2>

                <p className="text-xs text-muted-foreground">
                  Complete the information below.
                </p>
              </div>

              <Badge variant="secondary">{section.fields.length} fields</Badge>
            </div>

            {/* SECTION CONTENT */}

            <Card className="shadow-sm">
              <CardContent className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                {section.fields.map((field) => {
                  const fullWidth =
                    field.type === "textarea" ||
                    field.type === "multiple-choice" ||
                    field.type === "single-choice" ||
                    field.type === "camera-photo" ||
                    field.type === "camera-video" ||
                    field.type === "signature" ||
                    field.multiple;

                  return (
                    <div
                      key={field.id}
                      data-field-id={field.id}
                      className={fullWidth ? "sm:col-span-2" : ""}
                    >
                      <label className="flex flex-col gap-2 text-sm font-medium">
                        <span>
                          {field.label}

                          {field.required && (
                            <span className="ml-1 text-red-500">*</span>
                          )}
                        </span>

                        {field.multiple
                          ? renderMultipleField(field)
                          : fieldControl(field)}
                      </label>

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

      {/* ACTIONS */}

      <div className="mt-6 flex justify-end gap-3 border-t pt-4">
        <Button variant="outline" onClick={() => save(false)}>
          <Save data-icon="inline-start" />
          Save Draft
        </Button>

        <Button onClick={() => save(true)}>
          <Send data-icon="inline-start" />
          Submit Audit
        </Button>
      </div>

      {/* CAMERA */}

      {camera && (
        <CameraCapture
          mode={camera.mode}
          reportId={auditId || "new-audit"}
          onCancel={() => setCamera(null)}
          onUse={(item: EvidenceItem) => {
            const fieldId = camera.field.id;

            setData((current) => ({
              ...current,
              [fieldId]: {
                ...current[fieldId],
                evidence: [...(current[fieldId]?.evidence || []), item],
              },
            }));

            setErrors((current) => {
              const updated = {
                ...current,
              };

              delete updated[fieldId];

              return updated;
            });

            setCamera(null);
          }}
        />
      )}

      {/* SIGNATURE */}

      {signatureField && (
        <SignaturePad
          field={signatureField}
          onCancel={() => setSignatureField(null)}
          onSave={(signature) => {
            setData((current) => ({
              ...current,
              [signatureField.id]: {
                ...current[signatureField.id],
                signature: {
                  signature,
                  signedAt: new Date().toISOString(),
                },
              },
            }));

            setErrors((current) => {
              const updated = {
                ...current,
              };

              delete updated[signatureField.id];

              return updated;
            });

            setSignatureField(null);
          }}
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
  onCancel,
  onSave,
}: {
  field: Field;
  onCancel: () => void;
  onSave: (signature: string) => void;
}) {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.fillStyle = "#ffffff";

    context.fillRect(0, 0, canvas.width, canvas.height);

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

    const rect = canvas.getBoundingClientRect();

    if ("touches" in event) {
      const touch = event.touches[0];

      if (!touch) {
        return {
          x: 0,
          y: 0,
        };
      }

      return {
        x: ((touch.clientX - rect.left) / rect.width) * canvas.width,

        y: ((touch.clientY - rect.top) / rect.height) * canvas.height,
      };
    }

    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,

      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
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

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const position = getPosition(event);

    context.beginPath();

    context.moveTo(position.x, position.y);

    setDrawing(true);
  }

  function draw(
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) {
    event.preventDefault();

    if (!drawing || !canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const position = getPosition(event);

    context.lineTo(position.x, position.y);

    context.stroke();
  }

  function stopDrawing() {
    setDrawing(false);
  }

  function clearSignature() {
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.fillStyle = "#ffffff";

    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = "#000000";
  }

  function saveSignature() {
    if (!canvas) {
      return;
    }

    const signature = canvas.toDataURL("image/png");

    onSave(signature);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-background p-5 shadow-2xl">
        {/* HEADER */}

        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{field.label}</h2>

            <p className="text-sm text-muted-foreground">
              Sign using touch, mouse, or trackpad.
            </p>
          </div>

          <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
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
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        {/* ACTIONS */}

        <div className="mt-4 flex justify-between gap-3">
          <Button type="button" variant="outline" onClick={clearSignature}>
            Clear
          </Button>

          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>

            <Button type="button" onClick={saveSignature}>
              <Check data-icon="inline-start" />
              Save Signature
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
