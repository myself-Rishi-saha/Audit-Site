// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";

// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";

// type EvidenceItem = {
//   id?: string;
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
//   title?: string;
//   sections: Section[];
// };

// type Audit = {
//   id: string;
//   employeeId: string;
//   employeeName: string;
//   templateId: string;
//   templateSnapshot: AuditTemplate;
//   formData: Record<string, unknown>;
//   evidence: Record<string, EvidenceItem[]>;
//   signatures: Record<string, SignatureData>;
//   status: "DRAFT" | "COMPLETED";
//   score?: number;
//   createdAt: string;
//   updatedAt: string;
// };

// export function AdminAuditEditor({ audit }: { audit: Audit }) {
//   const router = useRouter();
//   const [value, setValue] = useState<Audit>(audit);
//    console.log(audit);
//   const [editing, setEditing] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const template =
//     value.templateSnapshot ||
//     ({
//       id: value.templateId,
//       title: "AUDIT REPORT",
//       sections: [],
//     } as AuditTemplate);

//   function updateFormValue(
//     fieldId: string,
//     fieldValue: unknown,
//   ) {
//     setValue((current) => ({
//       ...current,
//       formData: {
//         ...current.formData,
//         [fieldId]: fieldValue,
//       },
//     }));
//   }

//   function updateEvidence(
//     fieldId: string,
//     evidence: EvidenceItem[],
//   ) {
//     setValue((current) => ({
//       ...current,
//       evidence: {
//         ...current.evidence,
//         [fieldId]: evidence,
//       },
//     }));
//   }

//   function updateSignature(
//     fieldId: string,
//     signature: SignatureData | undefined,
//   ) {
//     setValue((current) => {
//       const signatures = {
//         ...current.signatures,
//       };

//       if (signature) {
//         signatures[fieldId] = signature;
//       } else {
//         delete signatures[fieldId];
//       }

//       return {
//         ...current,
//         signatures,
//       };
//     });
//   }
//   // console.log(value.formData+" dd");
//   async function save() {
//     setSaving(true);

//     try {
//       const res = await fetch(
//         `/api/audits/${value.id}`,
//         {
//           method: "PUT",
//           headers: {
//             "content-type": "application/json",
//           },
//           body: JSON.stringify({
//             templateId: value.templateId,
//             templateSnapshot: value.templateSnapshot,
//             formData: value.formData,
//             evidence: value.evidence,
//             signatures: value.signatures,
//           }),
//         },
//       );

//       if (!res.ok) {
//         throw new Error("Failed to save audit");
//       }

//       const updatedAudit = await res.json();

//       setValue(updatedAudit);
//       setEditing(false);

//       router.refresh();
//     } catch (error) {
//       console.error("Save audit error:", error);
//     } finally {
//       setSaving(false);
//     }
//   }

//   function renderField(field: Field) {
//     const fieldValue = value.formData?.[field.id];

//     /*
//      * CAMERA PHOTO / VIDEO
//      */
//     if (
//       field.type === "camera-photo" ||
//       field.type === "camera-video"
//     ) {
//       const evidence =
//         value.evidence?.[field.id] || [];

//       return (
//         <div className="rounded-xl border bg-muted/30 p-4">
//           {evidence.length > 0 ? (
//             <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
//               {evidence.map((item, index) => (
//                 <div
//                   key={`${item.url}-${index}`}
//                   className="overflow-hidden rounded-xl border bg-muted"
//                 >
//                   {item.type === "video" ? (
//                     <video
//                       src={item.url}
//                       controls
//                       playsInline
//                       className="aspect-video w-full object-cover"
//                     />
//                   ) : (
//                     <a
//                       href={item.url}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                     >
//                       <img
//                         src={item.url}
//                         alt={`Evidence ${index + 1}`}
//                         className="aspect-video w-full object-cover"
//                       />
//                     </a>
//                   )}

//                   <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
//                     <span>
//                       {item.type === "video"
//                         ? "Video evidence"
//                         : "Photo evidence"}
//                     </span>

//                     {editing && (
//                       <Button
//                         type="button"
//                         variant="ghost"
//                         size="sm"
//                         className="h-7 px-2 text-destructive"
//                         onClick={() => {
//                           updateEvidence(
//                             field.id,
//                             evidence.filter(
//                               (_, i) => i !== index,
//                             ),
//                           );
//                         }}
//                       >
//                         Remove
//                       </Button>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p className="text-sm text-muted-foreground">
//               No evidence attached
//             </p>
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
//         <div className="rounded-xl border bg-muted/30 p-4">
//           {signature?.signature ? (
//             <>
//               <div className="rounded-lg border bg-white p-3">
//                 <img
//                   src={signature.signature}
//                   alt={field.label}
//                   className="max-h-40 w-auto"
//                 />
//               </div>

//               {signature.signedAt && (
//                 <p className="mt-2 text-xs text-muted-foreground">
//                   Signed:{" "}
//                   {new Date(
//                     signature.signedAt,
//                   ).toLocaleString("en-IN", {
//                     timeZone: "Asia/Kolkata",
//                     dateStyle: "medium",
//                     timeStyle: "short",
//                   })}
//                 </p>
//               )}

//               {editing && (
//                 <Button
//                   type="button"
//                   variant="outline"
//                   className="mt-3"
//                   onClick={() =>
//                     updateSignature(
//                       field.id,
//                       undefined,
//                     )
//                   }
//                 >
//                   Remove Signature
//                 </Button>
//               )}
//             </>
//           ) : (
//             <p className="text-sm text-muted-foreground">
//               No signature provided
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
//         <div>
//           <div className="flex flex-wrap gap-2">
//             {(field.options || []).map(
//               (option) => (
//                 <Button
//                   key={option}
//                   type="button"
//                   variant={
//                     fieldValue === option
//                       ? "default"
//                       : "outline"
//                   }
//                   disabled={!editing}
//                   onClick={() =>
//                     updateFormValue(
//                       field.id,
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

//     /*
//      * MULTIPLE CHOICE
//      */
//     if (field.type === "multiple-choice") {
//       const selected = Array.isArray(fieldValue)
//         ? fieldValue
//         : [];

//       return (
//         <div>
//           <div className="flex flex-wrap gap-2">
//             {(field.options || []).map(
//               (option) => {
//                 const isSelected =
//                   selected.includes(option);

//                 return (
//                   <Button
//                     key={option}
//                     type="button"
//                     variant={
//                       isSelected
//                         ? "default"
//                         : "outline"
//                     }
//                     disabled={!editing}
//                     onClick={() => {
//                       const next = isSelected
//                         ? selected.filter(
//                             (item) =>
//                               item !== option,
//                           )
//                         : [
//                             ...selected,
//                             option,
//                           ];

//                       updateFormValue(
//                         field.id,
//                         next,
//                       );
//                     }}
//                   >
//                     {option}
//                   </Button>
//                 );
//               },
//             )}
//           </div>
//         </div>
//       );
//     }

//     /*
//      * TEXTAREA
//      */
//     if (field.type === "textarea") {
//       return (
//         <Textarea
//           className="min-h-24"
//           disabled={!editing}
//           value={
//             typeof fieldValue === "string"
//               ? fieldValue
//               : ""
//           }
//           onChange={(e) =>
//             updateFormValue(
//               field.id,
//               e.target.value,
//             )
//           }
//         />
//       );
//     }

//     /*
//      * TEXT / NUMBER / DATE / TIME
//      */
//     if (
//       field.type === "date" ||
//       field.type === "time" ||
//       field.type === "number" ||
//       field.type === "text"
//     ) {
//       return (
//         <Input
//           type={
//             field.type === "number"
//               ? "number"
//               : field.type
//           }
//           disabled={!editing}
//           value={
//             typeof fieldValue === "string" ||
//             typeof fieldValue === "number"
//               ? String(fieldValue)
//               : ""
//           }
//           onChange={(e) =>
//             updateFormValue(
//               field.id,
//               e.target.value,
//             )
//           }
//         />
//       );
//     }

//     return null;
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
//               "AUDIT REPORT"}
//           </h1>
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
//               editing
//                 ? save()
//                 : setEditing(true)
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

//       {/* AUDIT INFORMATION */}
//       <Card>
//         <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
//           <label className="text-sm font-medium">
//             Customer

//             <Input
//               className="mt-2"
//               disabled={!editing}
//               value={
//                 typeof value?.customerName ===
//                 "string"
//                   ? value?.customerName
//                   : ""
//               }
//             />
//           </label>

//           <label className="text-sm font-medium">
//             Location

//             <Input
//               className="mt-2"
//               disabled={!editing}
//               value={
//                 typeof value.customerAddress ===
//                 "string"
//                   ? value.customerAddress
//                   : ""
//               }
//             />
//           </label>

//           <label className="text-sm font-medium">
//             Audit date

//             <Input
//               className="mt-2"
//               disabled={!editing}
//               value={
//                 typeof value.formData?.date ===
//                 "string"
//                   ? value.formData.date
//                   : ""
//               }
//             />
//           </label>

//           <div className="text-sm">
//             <span className="text-muted-foreground">
//               Audit ID
//             </span>

//             <p className="mt-2 font-semibold">
//               {value.id}
//             </p>
//           </div>

//           <div className="text-sm">
//             <span className="text-muted-foreground">
//               Auditor
//             </span>

//             <p className="mt-2 font-semibold">
//               {value.employeeName}
//             </p>
//           </div>

//           <div className="text-sm">
//             <span className="text-muted-foreground">
//               Status
//             </span>

//             <p className="mt-2">
//               <Badge>
//                 {String(
//                   value.status || "DRAFT",
//                 ).toUpperCase()}
//               </Badge>
//             </p>
//           </div>

//           {/* {value.score !== undefined && (
//             <div className="text-sm">
//               <span className="text-muted-foreground">
//                 Score
//               </span>

//               <p className="mt-2 font-semibold">
//                 {value.score}%
//               </p>
//             </div>
//           )} */}
//         </CardContent>
//       </Card>

//       {/* DYNAMIC TEMPLATE SECTIONS */}
//       <div className="mt-8 flex flex-col gap-8">
//         {template.sections?.map(
//           (section, sectionIndex) => (
//             <div
//               key={
//                 section.id || sectionIndex
//               }
//               className="flex flex-col gap-4"
//             >
//               <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
//                 {section.name ||
//                   section.title}
//               </h2>

//               <div className="flex flex-col gap-6">
//                 {section.fields.map(
//                   (field) => (
//                     <Card key={field.id}>
//                       <CardHeader>
//                         <CardTitle className="text-base">
//                           {field.label}
//                         </CardTitle>
//                       </CardHeader>

//                       <CardContent>
//                         {renderField(field)}
//                       </CardContent>
//                     </Card>
//                   ),
//                 )}
//               </div>
//             </div>
//           ),
//         )}
//       </div>
//     </main>
//   );
// }

// export function PrintButton() {
//   return (
//     <Button
//       variant="outline"
//       onClick={() => window.print()}
//     >
//       Generate PDF
//     </Button>
//   );
// }

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateReportPdf } from "@/lib/generate-report-pdf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

type Audit = {
  id: string;
  employeeId: string;
  employeeName: string;
  customerName?: string;
  customerAddress?: string;
  templateId: string;
  templateSnapshot: AuditTemplate;
  formData: Record<string, unknown>;
  evidence: Record<string, EvidenceItem[]>;
  signatures: Record<string, SignatureData>;
  status: "DRAFT" | "COMPLETED";
  score?: number;
  createdAt: string;
  updatedAt: string;
};

export function AdminAuditEditor({ audit }: { audit: Audit }) {
  const router = useRouter();

  const [value, setValue] = useState<Audit>(audit);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const template =
    value.templateSnapshot ||
    ({
      id: value.templateId,
      title: "AUDIT REPORT",
      sections: [],
    } as AuditTemplate);

  function updateFormValue(fieldId: string, fieldValue: unknown) {
    setValue((current) => ({
      ...current,
      formData: {
        ...current.formData,
        [fieldId]: fieldValue,
      },
    }));
  }

  function updateEvidence(fieldId: string, evidence: EvidenceItem[]) {
    setValue((current) => ({
      ...current,
      evidence: {
        ...current.evidence,
        [fieldId]: evidence,
      },
    }));
  }

  async function save() {
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(`/api/audits/${value.id}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          formData: value.formData,
          evidence: value.evidence,
        }),
      });

      if (!res.ok) {
        const result = await res.json().catch(() => null);

        throw new Error(result?.error || "Failed to save audit changes.");
      }

      const updatedAudit = (await res.json()) as Audit;

      setValue(updatedAudit);
      setEditing(false);
      setSuccessMessage("Audit report updated successfully.");

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while saving.",
      );
    } finally {
      setSaving(false);
    }
  }

  function renderField(field: Field) {
    const fieldValue = value.formData?.[field.id];

    // Customer evidence: display existing files and allow removal while editing.
    if (field.type === "camera-photo" || field.type === "camera-video") {
      const evidence = value.evidence?.[field.id] || [];

      return (
        <div className="rounded-xl border bg-muted/30 p-4">
          {evidence.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {evidence.map((item, index) => (
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
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={item.url}
                        alt={`Evidence ${index + 1}`}
                        className="aspect-video w-full object-cover"
                      />
                    </a>
                  )}

                  <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-muted-foreground">
                    <span>
                      {item.type === "video"
                        ? "Video evidence"
                        : "Photo evidence"}
                    </span>

                    {/* {editing && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-destructive"
                        onClick={() => {
                          if (
                            !window.confirm(
                              "Remove this evidence from the report?",
                            )
                          ) {
                            return;
                          }

                          updateEvidence(
                            field.id,
                            evidence.filter((_, i) => i !== index),
                          );
                        }}
                      >
                        Remove
                      </Button>
                    )} */}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No evidence attached
            </p>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            Existing evidence can be viewed
            {editing ? " or removed." : "."} Uploading new evidence is not
            available in this editor.
          </p>
        </div>
      );
    }

    // Signatures are always read-only for admins.
    if (field.type === "signature") {
      const signature = value.signatures?.[field.id];

      return (
        <div className="rounded-xl border bg-muted/30 p-4">
          {signature?.signature ? (
            <>
              <div className="rounded-lg border bg-white p-3">
                <img
                  src={signature.signature}
                  alt={field.label}
                  className="max-h-40 w-auto"
                />
              </div>

              {signature.signedAt && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Signed:{" "}
                  {new Date(signature.signedAt).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              )}

              <Badge variant="secondary" className="mt-3">
                Read-only signature
              </Badge>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No signature provided
            </p>
          )}
        </div>
      );
    }

    // Single choice.
    if (field.type === "single-choice") {
      return (
        <div className="flex flex-wrap gap-2">
          {(field.options || []).map((option) => (
            <Button
              key={option}
              type="button"
              variant={fieldValue === option ? "default" : "outline"}
              disabled={!editing}
              onClick={() => updateFormValue(field.id, option)}
            >
              {option}
            </Button>
          ))}
        </div>
      );
    }

    // Multiple choice.
    if (field.type === "multiple-choice") {
      const selected = Array.isArray(fieldValue)
        ? fieldValue.filter((item): item is string => typeof item === "string")
        : [];

      return (
        <div className="flex flex-wrap gap-2">
          {(field.options || []).map((option) => {
            const isSelected = selected.includes(option);

            return (
              <Button
                key={option}
                type="button"
                variant={isSelected ? "default" : "outline"}
                disabled={!editing}
                onClick={() => {
                  const next = isSelected
                    ? selected.filter((item) => item !== option)
                    : [...selected, option];

                  updateFormValue(field.id, next);
                }}
              >
                {option}
              </Button>
            );
          })}
        </div>
      );
    }

    // Textarea.
    if (field.type === "textarea") {
      return (
        <Textarea
          className="min-h-24"
          disabled={!editing}
          value={typeof fieldValue === "string" ? fieldValue : ""}
          onChange={(e) => updateFormValue(field.id, e.target.value)}
        />
      );
    }

    // Text, number, date and time.
    if (
      field.type === "text" ||
      field.type === "number" ||
      field.type === "date" ||
      field.type === "time"
    ) {
      return (
        <Input
          type={field.type}
          disabled={!editing}
          value={
            typeof fieldValue === "string" || typeof fieldValue === "number"
              ? String(fieldValue)
              : ""
          }
          onChange={(e) => updateFormValue(field.id, e.target.value)}
        />
      );
    }

    return (
      <p className="text-sm text-muted-foreground">Unsupported field type</p>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 print:max-w-none print:px-0 print:py-0">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <p className="text-sm font-medium text-primary">Admin review</p>

          <h1 className="mt-1 text-3xl font-semibold">
            {template.title || template.name || "AUDIT REPORT"}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Edit report values without changing customer details or signatures.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* <Button
            type="button"
            variant="outline"
            onClick={() => window.print()}
          >
            Generate PDF
          </Button> */}
          <Button
            type="button"
            variant="outline"
            onClick={() => generateReportPdf(audit, "Audit Report")}
          >
            Generate PDF
          </Button>
          {editing && (
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => {
                setValue(audit);
                setEditing(false);
                setErrorMessage("");
                setSuccessMessage("");
              }}
            >
              Cancel
            </Button>
          )}

          <Button
            type="button"
            disabled={saving}
            onClick={() => {
              if (editing) {
                void save();
              } else {
                setErrorMessage("");
                setSuccessMessage("");
                setEditing(true);
              }
            }}
          >
            {saving ? "Saving…" : editing ? "Save Changes" : "Edit Report"}
          </Button>
        </div>
      </div>

      {/* Save messages */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive print:hidden"
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-green-600/30 bg-green-600/10 p-3 text-sm print:hidden"
        >
          {successMessage}
        </div>
      )}

      Audit information
      {/* <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
          <label className="text-sm font-medium">
            Customer
            <Input className="mt-2" disabled value={value.customerName || ""} />
          </label>

          <label className="text-sm font-medium">
            Location
            <Input
              className="mt-2"
              disabled
              value={value.customerAddress || ""}
            />
          </label>

          <div className="text-sm">
            <span className="text-muted-foreground">Report date</span>
            <p className="mt-2 font-semibold">
              {value.createdAt
                ? new Date(value.createdAt).toLocaleDateString("en-GB", {
                    timeZone: "Asia/Kolkata",
                  })
                : "—"}
            </p>
          </div>

          <div className="text-sm">
            <span className="text-muted-foreground">Audit ID</span>
            <p className="mt-2 font-semibold">{value.id}</p>
          </div>

          <div className="text-sm">
            <span className="text-muted-foreground">Auditor</span>
            <p className="mt-2 font-semibold">{value.employeeName}</p>
          </div>

          <div className="text-sm">
            <span className="text-muted-foreground">Status</span>
            <p className="mt-2">
              <Badge>{value.status.toUpperCase()}</Badge>
            </p>
          </div>
        </CardContent>
      </Card> */}

{/* Audit information */}
<Card>
  <CardContent className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
    <label className="text-sm font-medium">
      Customer
      <Input
        className="mt-2"
        disabled
        value={value.customerName || ""}
      />
    </label>

    <label className="text-sm font-medium">
      Location
      <Input
        className="mt-2"
        disabled
        value={value.customerAddress || ""}
      />
    </label>

    <label className="text-sm font-medium">
      GST No.
      <Input
        className="mt-2"
        disabled
        value={value.customerGstNo || ""}
      />
    </label>

    <label className="text-sm font-medium">
      Contact Number
      <Input
        className="mt-2"
        disabled
        value={value.customerContactNumber || ""}
      />
    </label>

    <div className="text-sm">
      <span className="text-muted-foreground">Report date</span>
      <p className="mt-2 font-semibold">
        {value.createdAt
          ? new Date(value.createdAt).toLocaleDateString("en-GB", {
              timeZone: "Asia/Kolkata",
            })
          : "—"}
      </p>
    </div>

    <div className="text-sm">
      <span className="text-muted-foreground">Audit ID</span>
      <p className="mt-2 font-semibold">{value.id}</p>
    </div>

    <div className="text-sm">
      <span className="text-muted-foreground">Auditor</span>
      <p className="mt-2 font-semibold">{value.employeeName}</p>
    </div>

    <div className="text-sm">
      <span className="text-muted-foreground">Status</span>
      <p className="mt-2">
        <Badge>{value.status.toUpperCase()}</Badge>
      </p>
    </div>
  </CardContent>
</Card>

      {/* Dynamic template sections */}
      <div className="mt-8 flex flex-col gap-8">
        {template.sections?.map((section, sectionIndex) => (
          <section
            key={section.id || sectionIndex}
            className="flex flex-col gap-4"
          >
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              {section.name || section.title}
            </h2>

            <div className="flex flex-col gap-6">
              {section.fields.map((field) => (
                <Card key={field.id} className="break-inside-avoid">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {field.label}
                      {field.required && (
                        <span className="ml-1 text-destructive">*</span>
                      )}
                    </CardTitle>
                  </CardHeader>

                  <CardContent>{renderField(field)}</CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

export function PrintButton() {
  return (
    <Button type="button" variant="outline" onClick={() => window.print()}>
      Generate PDF
    </Button>
  );
}
