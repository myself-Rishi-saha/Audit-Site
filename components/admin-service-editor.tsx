


// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Button } from "@/components/ui/button";

// type Field = {
//   id: string;
//   label: string;
//   type: string;
//   required?: boolean;
//   options?: string[];
//   multiple?: boolean;
// };

// type Section = {
//   id: string;
//   name: string;
//   fields: Field[];
// };

// type Template = {
//   id: string;
//   type?: string;
//   name?: string;
//   title?: string;
//   sections: Section[];
// };

// type EvidenceItem = {
//   id?: string;
//   reportId?: string;
//   type: string;
//   url: string;
//   fileName?: string;
//   capturedAt?: string;
// };

// type SignatureData = {
//   signature: string;
//   signedAt: string;
// };

// type ServiceReport = {
//   id: string;
//   employeeId?: string;
//   employeeName?: string;
//   templateId: string;
//   formData: Record<string, unknown>;
//   evidence: Record<string, EvidenceItem[]>;
//   signatures: Record<string, SignatureData>;
//   status?: string;
//   createdAt?: string;
//   updatedAt?: string;
// };

// export function AdminServiceEditor({
//   report,
// }: {
//   report: ServiceReport;
// }) {
//   const router = useRouter();

//   const [value, setValue] = useState<ServiceReport>({
//     ...report,
//     templateId: report?.templateId || "service-report",
//     formData:
//       report?.formData &&
//       typeof report.formData === "object" &&
//       !Array.isArray(report.formData)
//         ? report.formData
//         : {},
//     evidence:
//       report?.evidence &&
//       typeof report.evidence === "object" &&
//       !Array.isArray(report.evidence)
//         ? report.evidence
//         : {},
//     signatures:
//       report?.signatures &&
//       typeof report.signatures === "object" &&
//       !Array.isArray(report.signatures)
//         ? report.signatures
//         : {},
//   });

//   const [template, setTemplate] = useState<Template | null>(null);
//   const [loadingTemplate, setLoadingTemplate] = useState(true);

//   const [editing, setEditing] = useState(false);
//   const [saving, setSaving] = useState(false);

//   /*
//    * Load the template used by this report.
//    */
//   useEffect(() => {
//     async function loadTemplate() {
//       try {
//         setLoadingTemplate(true);

//         const response = await fetch(
//           `/api/templates/${value.templateId}`,
//         );

//         if (!response.ok) {
//           throw new Error("Failed to load service report template");
//         }

//         const data = await response.json();

//         setTemplate(data);
//       } catch (error) {
//         console.error("Failed to load service report template:", error);
//         setTemplate(null);
//       } finally {
//         setLoadingTemplate(false);
//       }
//     }

//     loadTemplate();
//   }, [value.templateId]);

//   /*
//    * Update a normal dynamic form field.
//    */
//   function setFieldValue(fieldId: string, fieldValue: unknown) {
//     setValue((current) => ({
//       ...current,
//       formData: {
//         ...current.formData,
//         [fieldId]: fieldValue,
//       },
//     }));
//   }

//   /*
//    * Read a dynamic form field.
//    */
//   function getFieldValue(fieldId: string) {
//     return value.formData?.[fieldId] ?? "";
//   }

//   /*
//    * Evidence is stored by field ID:
//    *
//    * evidence: {
//    *   "customer-photo": [...],
//    *   "equipment-photo": [...],
//    *   "evidence-video": [...]
//    * }
//    */
//   const evidence = Object.values(value.evidence || {}).flat();

//   /*
//    * Render a dynamic form field.
//    */
//   function renderField(field: Field) {
//     const fieldValue = getFieldValue(field.id);

//     const commonLabel = (
//       <label className="block text-sm font-medium">
//         <span>
//           {field.label}

//           {field.required && (
//             <span className="ml-1 text-destructive">*</span>
//           )}
//         </span>
//       </label>
//     );

//     /*
//      * TEXT
//      */
//     if (field.type === "text") {
//       return (
//         <div key={field.id}>
//           {commonLabel}

//           <Input
//             className="mt-2"
//             disabled={!editing}
//             value={String(fieldValue ?? "")}
//             onChange={(event) =>
//               setFieldValue(field.id, event.target.value)
//             }
//           />
//         </div>
//       );
//     }

//     /*
//      * NUMBER
//      */
//     if (field.type === "number") {
//       return (
//         <div key={field.id}>
//           {commonLabel}

//           <Input
//             type="number"
//             className="mt-2"
//             disabled={!editing}
//             value={String(fieldValue ?? "")}
//             onChange={(event) =>
//               setFieldValue(field.id, event.target.value)
//             }
//           />
//         </div>
//       );
//     }

//     /*
//      * DATE
//      */
//     if (field.type === "date") {
//       return (
//         <div key={field.id}>
//           {commonLabel}

//           <Input
//             type="date"
//             className="mt-2"
//             disabled={!editing}
//             value={String(fieldValue ?? "")}
//             onChange={(event) =>
//               setFieldValue(field.id, event.target.value)
//             }
//           />
//         </div>
//       );
//     }

//     /*
//      * TIME
//      */
//     if (field.type === "time") {
//       return (
//         <div key={field.id}>
//           {commonLabel}

//           <Input
//             type="time"
//             className="mt-2"
//             disabled={!editing}
//             value={String(fieldValue ?? "")}
//             onChange={(event) =>
//               setFieldValue(field.id, event.target.value)
//             }
//           />
//         </div>
//       );
//     }

//     /*
//      * TEXTAREA
//      */
//     if (field.type === "textarea") {
//       const isMultiple = field.multiple === true;

//       const textareaValue = Array.isArray(fieldValue)
//         ? fieldValue.join("\n")
//         : String(fieldValue ?? "");

//       return (
//         <div key={field.id}>
//           {commonLabel}

//           <Textarea
//             className="mt-2 min-h-24"
//             disabled={!editing}
//             value={textareaValue}
//             onChange={(event) => {
//               const nextValue = event.target.value;

//               setFieldValue(
//                 field.id,
//                 isMultiple
//                   ? nextValue
//                       .split("\n")
//                       .map((item) => item.trim())
//                       .filter(Boolean)
//                   : nextValue,
//               );
//             }}
//           />

//           {isMultiple && (
//             <p className="mt-1 text-xs text-muted-foreground">
//               Enter each item on a new line.
//             </p>
//           )}
//         </div>
//       );
//     }

//     /*
//      * SINGLE CHOICE
//      */
//     if (field.type === "single-choice") {
//       return (
//         <div key={field.id}>
//           {commonLabel}

//           <div className="mt-2 flex flex-wrap gap-2">
//             {(field.options || []).map((option) => {
//               const selected = fieldValue === option;

//               return (
//                 <button
//                   key={option}
//                   type="button"
//                   disabled={!editing}
//                   onClick={() =>
//                     setFieldValue(field.id, option)
//                   }
//                   className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
//                     selected
//                       ? "border-primary bg-primary text-primary-foreground"
//                       : "bg-background hover:bg-muted"
//                   } ${
//                     !editing
//                       ? "cursor-default opacity-80"
//                       : ""
//                   }`}
//                 >
//                   {option}
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//       );
//     }

//     /*
//      * MULTIPLE CHOICE
//      */
//     if (field.type === "multiple-choice") {
//       const selectedValues = Array.isArray(fieldValue)
//         ? fieldValue
//         : [];

//       return (
//         <div key={field.id}>
//           {commonLabel}

//           <div className="mt-2 flex flex-wrap gap-2">
//             {(field.options || []).map((option) => {
//               const selected =
//                 selectedValues.includes(option);

//               return (
//                 <button
//                   key={option}
//                   type="button"
//                   disabled={!editing}
//                   onClick={() => {
//                     if (selected) {
//                       setFieldValue(
//                         field.id,
//                         selectedValues.filter(
//                           (item) => item !== option,
//                         ),
//                       );
//                     } else {
//                       setFieldValue(field.id, [
//                         ...selectedValues,
//                         option,
//                       ]);
//                     }
//                   }}
//                   className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
//                     selected
//                       ? "border-primary bg-primary text-primary-foreground"
//                       : "bg-background hover:bg-muted"
//                   } ${
//                     !editing
//                       ? "cursor-default opacity-80"
//                       : ""
//                   }`}
//                 >
//                   {option}
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//       );
//     }

//     /*
//      * CAMERA PHOTO
//      *
//      * Evidence itself is not edited here.
//      * It is displayed in the evidence gallery below.
//      */
//     if (field.type === "camera-photo") {
//       const fieldEvidence =
//         value.evidence?.[field.id] || [];

//       return (
//         <div
//           key={field.id}
//           className="rounded-xl border bg-muted/20 p-4"
//         >
//           <div className="flex items-center justify-between gap-3">
//             <div>
//               <p className="text-sm font-medium">
//                 {field.label}
//               </p>

//               {field.required && (
//                 <span className="text-xs text-destructive">
//                   Required
//                 </span>
//               )}
//             </div>

//             <span className="text-xs text-muted-foreground">
//               {fieldEvidence.length}{" "}
//               {fieldEvidence.length === 1
//                 ? "file"
//                 : "files"}
//             </span>
//           </div>

//           {fieldEvidence.length > 0 && (
//             <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
//               {fieldEvidence.map((item, index) => (
//                 <div
//                   key={`${item.url}-${index}`}
//                   className="overflow-hidden rounded-lg border bg-background"
//                 >
//                   <img
//                     src={item.url}
//                     alt={`${field.label} ${index + 1}`}
//                     className="aspect-video w-full object-cover"
//                   />

//                   <div className="p-2">
//                     <a
//                       href={item.url}
//                       target="_blank"
//                       rel="noreferrer"
//                       className="text-xs font-medium text-primary hover:underline"
//                     >
//                       Open image
//                     </a>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       );
//     }

//     /*
//      * CAMERA VIDEO
//      */
//     if (field.type === "camera-video") {
//       const fieldEvidence =
//         value.evidence?.[field.id] || [];

//       return (
//         <div
//           key={field.id}
//           className="rounded-xl border bg-muted/20 p-4"
//         >
//           <div className="flex items-center justify-between gap-3">
//             <div>
//               <p className="text-sm font-medium">
//                 {field.label}
//               </p>

//               {field.required && (
//                 <span className="text-xs text-destructive">
//                   Required
//                 </span>
//               )}
//             </div>

//             <span className="text-xs text-muted-foreground">
//               {fieldEvidence.length}{" "}
//               {fieldEvidence.length === 1
//                 ? "file"
//                 : "files"}
//             </span>
//           </div>

//           {fieldEvidence.length > 0 && (
//             <div className="mt-3 grid gap-3 sm:grid-cols-2">
//               {fieldEvidence.map((item, index) => (
//                 <div
//                   key={`${item.url}-${index}`}
//                   className="overflow-hidden rounded-lg border bg-background"
//                 >
//                   <video
//                     src={item.url}
//                     controls
//                     playsInline
//                     className="aspect-video w-full object-cover"
//                   />

//                   <div className="p-2">
//                     <a
//                       href={item.url}
//                       target="_blank"
//                       rel="noreferrer"
//                       className="text-xs font-medium text-primary hover:underline"
//                     >
//                       Open video
//                     </a>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       );
//     }

//     /*
//      * SIGNATURE
//      */
//     if (field.type === "signature") {
//       const signature =
//         value.signatures?.[field.id];

//       return (
//         <div
//           key={field.id}
//           className="rounded-xl border bg-muted/20 p-4"
//         >
//           <p className="text-sm font-medium">
//             {field.label}
//           </p>

//           {signature?.signature ? (
//             <div className="mt-3 overflow-hidden rounded-lg border bg-white">
//               <img
//                 src={signature.signature}
//                 alt={`${field.label} signature`}
//                 className="max-h-40 w-full object-contain"
//               />
//             </div>
//           ) : (
//             <p className="mt-2 text-sm text-muted-foreground">
//               No signature attached.
//             </p>
//           )}

//           {signature?.signedAt && (
//             <p className="mt-2 text-xs text-muted-foreground">
//               Signed:{" "}
//               {new Date(
//                 signature.signedAt,
//               ).toLocaleString()}
//             </p>
//           )}
//         </div>
//       );
//     }

//     /*
//      * UNKNOWN FIELD TYPE
//      *
//      * Still show it as a text field instead of silently
//      * hiding it. This makes the editor safer when an
//      * admin adds a new field type later.
//      */
//     return (
//       <div key={field.id}>
//         {commonLabel}

//         <Input
//           className="mt-2"
//           disabled={!editing}
//           value={String(fieldValue ?? "")}
//           onChange={(event) =>
//             setFieldValue(field.id, event.target.value)
//           }
//         />

//         <p className="mt-1 text-xs text-muted-foreground">
//           Field type: {field.type}
//         </p>
//       </div>
//     );
//   }

//   async function save() {
//     setSaving(true);

//     try {
//       const response = await fetch(
//         `/api/service-reports/${value.id}`,
//         {
//           method: "PUT",
//           headers: {
//             "content-type": "application/json",
//           },
//           body: JSON.stringify({
//             ...value,
//             lastUpdatedBy: "ADMIN001",
//             lastUpdatedAt: new Date().toISOString(),
//           }),
//         },
//       );

//       if (!response.ok) {
//         const errorText = await response.text();

//         console.error(
//           "Failed to save service report:",
//           errorText,
//         );

//         alert("Failed to save service report.");
//         return;
//       }

//       const updated = await response.json();

//       setValue((current) => ({
//         ...current,
//         ...updated,
//         formData:
//           updated.formData || current.formData || {},
//         evidence:
//           updated.evidence || current.evidence || {},
//         signatures:
//           updated.signatures || current.signatures || {},
//       }));

//       setEditing(false);
//       router.refresh();
//     } catch (error) {
//       console.error("Save error:", error);
//       alert("Failed to save service report.");
//     } finally {
//       setSaving(false);
//     }
//   }

//   if (loadingTemplate) {
//     return (
//       <main className="mx-auto max-w-5xl px-5 py-8">
//         <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
//           Loading service report template...
//         </div>
//       </main>
//     );
//   }

//   if (!template) {
//     return (
//       <main className="mx-auto max-w-5xl px-5 py-8">
//         <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
//           <p className="font-medium">
//             Service report template could not be loaded.
//           </p>

//           <p className="mt-1 text-sm text-muted-foreground">
//             Template ID: {value.templateId}
//           </p>

//           <Button
//             className="mt-4"
//             variant="outline"
//             onClick={() => router.back()}
//           >
//             Go Back
//           </Button>
//         </div>
//       </main>
//     );
//   }

//   return (
//     <main className="mx-auto max-w-5xl px-5 py-8">
//       {/* HEADER */}
//       <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
//         <div>
//           <p className="text-sm font-medium text-primary">
//             Admin review
//           </p>

//           <h1 className="mt-1 text-3xl font-semibold">
//             {template.title ||
//               template.name ||
//               "Service Report"}
//           </h1>

//           <p className="mt-2 text-sm text-muted-foreground">
//             Report ID: {value.id}
//           </p>

//           {value.employeeName && (
//             <p className="mt-1 text-sm text-muted-foreground">
//               Employee: {value.employeeName}
//             </p>
//           )}
//         </div>

//         <div className="flex gap-2">
//           <Button
//             variant="outline"
//             onClick={() => window.print()}
//           >
//             Generate PDF
//           </Button>

//           <Button
//             onClick={() =>
//               editing ? save() : setEditing(true)
//             }
//             disabled={saving}
//           >
//             {saving
//               ? "Saving…"
//               : editing
//                 ? "Save Changes"
//                 : "Edit Report"}
//           </Button>
//         </div>
//       </div>

//       {/* DYNAMIC TEMPLATE SECTIONS */}
//       {template.sections?.map((section) => (
//         <Card
//           key={section.id}
//           className="mb-6"
//         >
//           <CardHeader>
//             <CardTitle>
//               {section.name}
//             </CardTitle>
//           </CardHeader>

//           <CardContent
//             className={
//               section.fields?.some(
//                 (field) =>
//                   field.type === "camera-photo" ||
//                   field.type === "camera-video" ||
//                   field.type === "signature",
//               )
//                 ? "space-y-5"
//                 : "grid gap-5 sm:grid-cols-2"
//             }
//           >
//             {section.fields?.map((field) =>
//               renderField(field),
//             )}
//           </CardContent>
//         </Card>
//       ))}

//       {/* EVIDENCE GALLERY */}
//       <Card className="mt-6">
//         <CardHeader>
//           <CardTitle>Evidence</CardTitle>
//         </CardHeader>

//         <CardContent>
//           {evidence.length > 0 ? (
//             <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
//               {evidence.map(
//                 (item: EvidenceItem, index: number) => (
//                   <div
//                     key={`${item.url}-${index}`}
//                     className="overflow-hidden rounded-xl border bg-muted"
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
//                         alt={`Evidence ${index + 1}`}
//                         className="aspect-video w-full object-cover"
//                       />
//                     )}

//                     <div className="flex items-center justify-between p-3">
//                       <div>
//                         <p className="text-sm font-medium capitalize">
//                           {item.type === "video"
//                             ? "Video"
//                             : "Photo"}
//                         </p>

//                         {item.fileName && (
//                           <p className="mt-1 truncate text-xs text-muted-foreground">
//                             {item.fileName}
//                           </p>
//                         )}
//                       </div>

//                       <a
//                         href={item.url}
//                         target="_blank"
//                         rel="noreferrer"
//                         className="text-xs font-medium text-primary hover:underline"
//                       >
//                         Open
//                       </a>
//                     </div>
//                   </div>
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

//       {/* SIGNATURE SUMMARY */}
//       {Object.keys(value.signatures || {}).length > 0 && (
//         <Card className="mt-6">
//           <CardHeader>
//             <CardTitle>Signatures</CardTitle>
//           </CardHeader>

//           <CardContent className="grid gap-5 sm:grid-cols-2">
//             {Object.entries(value.signatures).map(
//               ([fieldId, signature]) => (
//                 <div
//                   key={fieldId}
//                   className="rounded-xl border bg-muted/20 p-4"
//                 >
//                   <p className="text-sm font-medium">
//                     {template.sections
//                       ?.flatMap((section) => section.fields || [])
//                       .find((field) => field.id === fieldId)
//                       ?.label || fieldId}
//                   </p>

//                   <div className="mt-3 overflow-hidden rounded-lg border bg-white">
//                     <img
//                       src={signature.signature}
//                       alt={`${fieldId} signature`}
//                       className="max-h-40 w-full object-contain"
//                     />
//                   </div>

//                   {signature.signedAt && (
//                     <p className="mt-2 text-xs text-muted-foreground">
//                       Signed:{" "}
//                       {new Date(
//                         signature.signedAt,
//                       ).toLocaleString()}
//                     </p>
//                   )}
//                 </div>
//               ),
//             )}
//           </CardContent>
//         </Card>
//       )}
//     </main>
//   );
// }


"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type ServiceReport = {
  id: string;
  employeeId?: string;
  employeeName?: string;

  templateId: string;

  // IMPORTANT:
  // Exact template used when this report was created.
  templateSnapshot: Template;

  formData: Record<string, unknown>;
  evidence: Record<string, EvidenceItem[]>;
  signatures: Record<string, SignatureData>;

  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export function AdminServiceEditor({
  report,
}: {
  report: ServiceReport;
}) {
  const router = useRouter();

  const [value, setValue] = useState<ServiceReport>({
    ...report,

    templateId:
      report?.templateId ||
      "service-report",

    templateSnapshot:
      report?.templateSnapshot || {
        id:
          report?.templateId ||
          "service-report",
        title: "Service Report",
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
  });

  const [editing, setEditing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  /*
   * IMPORTANT:
   *
   * Do NOT fetch /api/templates/:id here.
   *
   * The report already contains the exact
   * template that was used when it was created.
   */
  const template =
    value.templateSnapshot;

  /*
   * Update a normal dynamic form field.
   */
  function setFieldValue(
    fieldId: string,
    fieldValue: unknown,
  ) {
    setValue((current) => ({
      ...current,

      formData: {
        ...current.formData,
        [fieldId]: fieldValue,
      },
    }));
  }

  /*
   * Read a dynamic form field.
   */
  function getFieldValue(
    fieldId: string,
  ) {
    return (
      value.formData?.[fieldId] ??
      ""
    );
  }

  /*
   * Evidence is stored by field ID.
   */
  const evidence = Object.values(
    value.evidence || {},
  ).flat();

  /*
   * Render a dynamic form field.
   */
  function renderField(field: Field) {
    const fieldValue =
      getFieldValue(field.id);

    const commonLabel = (
      <label className="block text-sm font-medium">
        <span>
          {field.label}

          {field.required && (
            <span className="ml-1 text-destructive">
              *
            </span>
          )}
        </span>
      </label>
    );

    /*
     * TEXT
     */
    if (field.type === "text") {
      return (
        <div key={field.id}>
          {commonLabel}

          <Input
            className="mt-2"
            disabled={!editing}
            value={String(
              fieldValue ?? "",
            )}
            onChange={(event) =>
              setFieldValue(
                field.id,
                event.target.value,
              )
            }
          />
        </div>
      );
    }

    /*
     * NUMBER
     */
    if (field.type === "number") {
      return (
        <div key={field.id}>
          {commonLabel}

          <Input
            type="number"
            className="mt-2"
            disabled={!editing}
            value={String(
              fieldValue ?? "",
            )}
            onChange={(event) =>
              setFieldValue(
                field.id,
                event.target.value,
              )
            }
          />
        </div>
      );
    }

    /*
     * DATE
     */
    if (field.type === "date") {
      return (
        <div key={field.id}>
          {commonLabel}

          <Input
            type="date"
            className="mt-2"
            disabled={!editing}
            value={String(
              fieldValue ?? "",
            )}
            onChange={(event) =>
              setFieldValue(
                field.id,
                event.target.value,
              )
            }
          />
        </div>
      );
    }

    /*
     * TIME
     */
    if (field.type === "time") {
      return (
        <div key={field.id}>
          {commonLabel}

          <Input
            type="time"
            className="mt-2"
            disabled={!editing}
            value={String(
              fieldValue ?? "",
            )}
            onChange={(event) =>
              setFieldValue(
                field.id,
                event.target.value,
              )
            }
          />
        </div>
      );
    }

    /*
     * TEXTAREA
     */
    if (field.type === "textarea") {
      const isMultiple =
        field.multiple === true;

      const textareaValue =
        Array.isArray(fieldValue)
          ? fieldValue.join("\n")
          : String(
              fieldValue ?? "",
            );

      return (
        <div key={field.id}>
          {commonLabel}

          <Textarea
            className="mt-2 min-h-24"
            disabled={!editing}
            value={textareaValue}
            onChange={(event) => {
              const nextValue =
                event.target.value;

              setFieldValue(
                field.id,
                isMultiple
                  ? nextValue
                      .split("\n")
                      .map((item) =>
                        item.trim(),
                      )
                      .filter(Boolean)
                  : nextValue,
              );
            }}
          />

          {isMultiple && (
            <p className="mt-1 text-xs text-muted-foreground">
              Enter each item on a new
              line.
            </p>
          )}
        </div>
      );
    }

    /*
     * SINGLE CHOICE
     */
    if (
      field.type ===
      "single-choice"
    ) {
      return (
        <div key={field.id}>
          {commonLabel}

          <div className="mt-2 flex flex-wrap gap-2">
            {(field.options || []).map(
              (option) => {
                const selected =
                  fieldValue ===
                  option;

                return (
                  <button
                    key={option}
                    type="button"
                    disabled={!editing}
                    onClick={() =>
                      setFieldValue(
                        field.id,
                        option,
                      )
                    }
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted"
                    } ${
                      !editing
                        ? "cursor-default opacity-80"
                        : ""
                    }`}
                  >
                    {option}
                  </button>
                );
              },
            )}
          </div>
        </div>
      );
    }

    /*
     * MULTIPLE CHOICE
     */
    if (
      field.type ===
      "multiple-choice"
    ) {
      const selectedValues =
        Array.isArray(fieldValue)
          ? fieldValue
          : [];

      return (
        <div key={field.id}>
          {commonLabel}

          <div className="mt-2 flex flex-wrap gap-2">
            {(field.options || []).map(
              (option) => {
                const selected =
                  selectedValues.includes(
                    option,
                  );

                return (
                  <button
                    key={option}
                    type="button"
                    disabled={!editing}
                    onClick={() => {
                      if (selected) {
                        setFieldValue(
                          field.id,
                          selectedValues.filter(
                            (item) =>
                              item !==
                              option,
                          ),
                        );
                      } else {
                        setFieldValue(
                          field.id,
                          [
                            ...selectedValues,
                            option,
                          ],
                        );
                      }
                    }}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted"
                    } ${
                      !editing
                        ? "cursor-default opacity-80"
                        : ""
                    }`}
                  >
                    {option}
                  </button>
                );
              },
            )}
          </div>
        </div>
      );
    }

    /*
     * CAMERA PHOTO
     */
    if (
      field.type ===
      "camera-photo"
    ) {
      const fieldEvidence =
        value.evidence?.[
          field.id
        ] || [];

      return (
        <div
          key={field.id}
          className="rounded-xl border bg-muted/20 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">
                {field.label}
              </p>

              {field.required && (
                <span className="text-xs text-destructive">
                  Required
                </span>
              )}
            </div>

            <span className="text-xs text-muted-foreground">
              {fieldEvidence.length}{" "}
              {fieldEvidence.length ===
              1
                ? "file"
                : "files"}
            </span>
          </div>

          {fieldEvidence.length >
            0 && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {fieldEvidence.map(
                (
                  item,
                  index,
                ) => (
                  <div
                    key={`${item.url}-${index}`}
                    className="overflow-hidden rounded-lg border bg-background"
                  >
                    <img
                      src={
                        item.url
                      }
                      alt={`${field.label} ${
                        index + 1
                      }`}
                      className="aspect-video w-full object-cover"
                    />

                    <div className="p-2">
                      <a
                        href={
                          item.url
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Open image
                      </a>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      );
    }

    /*
     * CAMERA VIDEO
     */
    if (
      field.type ===
      "camera-video"
    ) {
      const fieldEvidence =
        value.evidence?.[
          field.id
        ] || [];

      return (
        <div
          key={field.id}
          className="rounded-xl border bg-muted/20 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">
                {field.label}
              </p>

              {field.required && (
                <span className="text-xs text-destructive">
                  Required
                </span>
              )}
            </div>

            <span className="text-xs text-muted-foreground">
              {fieldEvidence.length}{" "}
              {fieldEvidence.length ===
              1
                ? "file"
                : "files"}
            </span>
          </div>

          {fieldEvidence.length >
            0 && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {fieldEvidence.map(
                (
                  item,
                  index,
                ) => (
                  <div
                    key={`${item.url}-${index}`}
                    className="overflow-hidden rounded-lg border bg-background"
                  >
                    <video
                      src={
                        item.url
                      }
                      controls
                      playsInline
                      className="aspect-video w-full object-cover"
                    />

                    <div className="p-2">
                      <a
                        href={
                          item.url
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Open video
                      </a>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      );
    }

    /*
     * SIGNATURE
     */
    if (
      field.type ===
      "signature"
    ) {
      const signature =
        value.signatures?.[
          field.id
        ];

      return (
        <div
          key={field.id}
          className="rounded-xl border bg-muted/20 p-4"
        >
          <p className="text-sm font-medium">
            {field.label}
          </p>

          {signature?.signature ? (
            <div className="mt-3 overflow-hidden rounded-lg border bg-white">
              <img
                src={
                  signature.signature
                }
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
              {new Date(
                signature.signedAt,
              ).toLocaleString()}
            </p>
          )}
        </div>
      );
    }

    /*
     * UNKNOWN FIELD TYPE
     */
    return (
      <div key={field.id}>
        {commonLabel}

        <Input
          className="mt-2"
          disabled={!editing}
          value={String(
            fieldValue ?? "",
          )}
          onChange={(event) =>
            setFieldValue(
              field.id,
              event.target.value,
            )
          }
        />

        <p className="mt-1 text-xs text-muted-foreground">
          Field type:{" "}
          {field.type}
        </p>
      </div>
    );
  }

  /*
   * SAVE ADMIN CHANGES
   */
  async function save() {
    setSaving(true);

    try {
      const response =
        await fetch(
          `/api/service-reports/${value.id}`,
          {
            method: "PUT",

            headers: {
              "content-type":
                "application/json",
            },

            body: JSON.stringify({
              ...value,

              lastUpdatedBy:
                "ADMIN001",

              lastUpdatedAt:
                new Date().toISOString(),
            }),
          },
        );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Failed to save service report:",
          errorText,
        );

        alert(
          "Failed to save service report.",
        );

        return;
      }

      const updated =
        await response.json();

      setValue((current) => ({
        ...current,
        ...updated,

        /*
         * Keep the original snapshot.
         */
        templateSnapshot:
          updated.templateSnapshot ||
          current.templateSnapshot,

        formData:
          updated.formData ||
          current.formData ||
          {},

        evidence:
          updated.evidence ||
          current.evidence ||
          {},

        signatures:
          updated.signatures ||
          current.signatures ||
          {},
      }));

      setEditing(false);

      router.refresh();
    } catch (error) {
      console.error(
        "Save error:",
        error,
      );

      alert(
        "Failed to save service report.",
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * SAFETY FALLBACK
   */
  if (
    !template ||
    !template.sections
  ) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-8">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="font-medium">
            Saved report template
            could not be loaded.
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Report ID:{" "}
            {value.id}
          </p>

          <Button
            className="mt-4"
            variant="outline"
            onClick={() =>
              router.back()
            }
          >
            Go Back
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      {/* HEADER */}

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">
            Admin review
          </p>

          <h1 className="mt-1 text-3xl font-semibold">
            {template.title ||
              template.name ||
              "Service Report"}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Report ID:{" "}
            {value.id}
          </p>

          {value.employeeName && (
            <p className="mt-1 text-sm text-muted-foreground">
              Employee:{" "}
              {value.employeeName}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              window.print()
            }
          >
            Generate PDF
          </Button>

          <Button
            onClick={() =>
              editing
                ? save()
                : setEditing(true)
            }
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

      {/* DYNAMIC TEMPLATE SECTIONS */}

      {template.sections?.map(
        (section) => (
          <Card
            key={section.id}
            className="mb-6"
          >
            <CardHeader>
              <CardTitle>
                {section.name ||
                  section.title}
              </CardTitle>
            </CardHeader>

            <CardContent
              className={
                section.fields?.some(
                  (field) =>
                    field.type ===
                      "camera-photo" ||
                    field.type ===
                      "camera-video" ||
                    field.type ===
                      "signature",
                )
                  ? "space-y-5"
                  : "grid gap-5 sm:grid-cols-2"
              }
            >
              {section.fields?.map(
                (field) =>
                  renderField(
                    field,
                  ),
              )}
            </CardContent>
          </Card>
        ),
      )}

      {/* EVIDENCE GALLERY */}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            Evidence
          </CardTitle>
        </CardHeader>

        <CardContent>
          {evidence.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {evidence.map(
                (
                  item: EvidenceItem,
                  index: number,
                ) => (
                  <div
                    key={`${item.url}-${index}`}
                    className="overflow-hidden rounded-xl border bg-muted"
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
                        alt={`Evidence ${
                          index + 1
                        }`}
                        className="aspect-video w-full object-cover"
                      />
                    )}

                    <div className="flex items-center justify-between p-3">
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {item.type ===
                          "video"
                            ? "Video"
                            : "Photo"}
                        </p>

                        {item.fileName && (
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {
                              item.fileName
                            }
                          </p>
                        )}
                      </div>

                      <a
                        href={
                          item.url
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Open
                      </a>
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No evidence
              attached.
            </p>
          )}
        </CardContent>
      </Card>

      {/* SIGNATURE SUMMARY */}
{/* 
      {Object.keys(
        value.signatures || {},
      ).length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              Signatures
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-5 sm:grid-cols-2">
            {Object.entries(
              value.signatures,
            ).map(
              ([
                fieldId,
                signature,
              ]) => (
                <div
                  key={fieldId}
                  className="rounded-xl border bg-muted/20 p-4"
                >
                  <p className="text-sm font-medium">
                    {template.sections
                      ?.flatMap(
                        (
                          section,
                        ) =>
                          section.fields ||
                          [],
                      )
                      .find(
                        (field) =>
                          field.id ===
                          fieldId,
                      )
                      ?.label ||
                      fieldId}
                  </p>

                  <div className="mt-3 overflow-hidden rounded-lg border bg-white">
                    <img
                      src={
                        signature.signature
                      }
                      alt={`${fieldId} signature`}
                      className="max-h-40 w-full object-contain"
                    />
                  </div>

                  {signature.signedAt && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Signed:{" "}
                      {new Date(
                        signature.signedAt,
                      ).toLocaleString()}
                    </p>
                  )}
                </div>
              ),
            )}
          </CardContent>
        </Card>
      )} */}
    </main>
  );
}

