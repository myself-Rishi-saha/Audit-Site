// "use client";

// import { useEffect, useState } from "react";
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

// type Answer = {
//   value?: string | string[];
//   remarks?: string;
//   evidence?: EvidenceItem[];
//   signature?: SignatureData;
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
//   title: string;
//   sections: Section[];
// };

// export function AdminAuditEditor({ audit }: { audit: any }) {
//   const router = useRouter();

//   const [value, setValue] = useState({
//     ...audit,
//     answers: audit?.answers || {},
//   });

//   const [template, setTemplate] =
//     useState<AuditTemplate | null>(null);

//   const [editing, setEditing] = useState(false);
//   const [saving, setSaving] = useState(false);

//   useEffect(() => {
//     async function loadTemplate() {
//       try {
//         const res = await fetch("/api/templates");

//         if (!res.ok) {
//           throw new Error("Failed to load templates");
//         }

//         const templates: AuditTemplate[] = await res.json();

//         const currentTemplate =
//           templates.find(
//             (item) => item.id === audit.templateId,
//           ) || null;

//         setTemplate(currentTemplate);
//       } catch (error) {
//         console.error(
//           "Failed to load audit template:",
//           error,
//         );
//       }
//     }

//     loadTemplate();
//   }, [audit.templateId]);

//   const updateAnswer = (
//     id: string,
//     patch: Partial<Answer>,
//   ) => {
//     setValue((current: any) => ({
//       ...current,
//       answers: {
//         ...(current.answers || {}),
//         [id]: {
//           ...(current.answers?.[id] || {}),
//           ...patch,
//         },
//       },
//     }));
//   };

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
//             ...value,
//             lastUpdatedBy: "ADMIN001",
//             lastUpdatedAt: new Date().toISOString(),
//           }),
//         },
//       );

//       if (!res.ok) {
//         throw new Error("Failed to save audit");
//       }

//       setEditing(false);
//       router.refresh();
//     } catch (error) {
//       console.error("Save audit error:", error);
//     } finally {
//       setSaving(false);
//     }
//   }

//   function renderField(field: Field) {
//     const answer: Answer =
//       value.answers?.[field.id] || {};

//     const fieldValue = answer.value;

//     /*
//      * CAMERA PHOTO / VIDEO
//      */
//     if (
//       field.type === "camera-photo" ||
//       field.type === "camera-video"
//     ) {
//       return (
//         <div className="rounded-xl border bg-muted/30 p-4">
//           <p className="text-sm font-medium">
//             {field.label}
//           </p>

//           {answer.evidence?.length ? (
//             <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
//               {answer.evidence.map((item, index) => (
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

//                   <div className="px-3 py-2 text-xs text-muted-foreground">
//                     {item.type === "video"
//                       ? "Video evidence"
//                       : "Photo evidence"}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p className="mt-2 text-sm text-muted-foreground">
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
//         typeof answer.signature === "object"
//           ? answer.signature
//           : undefined;

//       return (
//         <div className="rounded-xl border bg-muted/30 p-4">
//           <p className="text-sm font-medium">
//             {field.label}
//           </p>

//           {signature?.signature ? (
//             <>
//               <div className="mt-3 rounded-lg border bg-white p-3">
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
//             </>
//           ) : (
//             <p className="mt-2 text-sm text-muted-foreground">
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
//           <p className="text-sm font-medium">
//             {field.label}
//           </p>

//           <div className="mt-3 flex flex-wrap gap-2">
//             {(field.options || []).map((option) => (
//               <Button
//                 key={option}
//                 type="button"
//                 variant={
//                   fieldValue === option
//                     ? "default"
//                     : "outline"
//                 }
//                 disabled={!editing}
//                 onClick={() =>
//                   updateAnswer(field.id, {
//                     value: option,
//                   })
//                 }
//               >
//                 {option}
//               </Button>
//             ))}
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
//           <p className="text-sm font-medium">
//             {field.label}
//           </p>

//           <div className="mt-3 flex flex-wrap gap-2">
//             {(field.options || []).map((option) => {
//               const isSelected =
//                 selected.includes(option);

//               return (
//                 <Button
//                   key={option}
//                   type="button"
//                   variant={
//                     isSelected
//                       ? "default"
//                       : "outline"
//                   }
//                   disabled={!editing}
//                   onClick={() => {
//                     const next = isSelected
//                       ? selected.filter(
//                           (item) => item !== option,
//                         )
//                       : [...selected, option];

//                     updateAnswer(field.id, {
//                       value: next,
//                     });
//                   }}
//                 >
//                   {option}
//                 </Button>
//               );
//             })}
//           </div>
//         </div>
//       );
//     }

//     /*
//      * TEXTAREA
//      */
//     if (field.type === "textarea") {
//       return (
//         <label className="text-sm font-medium">
//           {field.label}

//           <Textarea
//             className="mt-2 min-h-24"
//             disabled={!editing}
//             value={
//               typeof fieldValue === "string"
//                 ? fieldValue
//                 : ""
//             }
//             onChange={(e) =>
//               updateAnswer(field.id, {
//                 value: e.target.value,
//               })
//             }
//           />
//         </label>
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
//         <label className="text-sm font-medium">
//           {field.label}

//           <Input
//             className="mt-2"
//             type={
//               field.type === "number"
//                 ? "number"
//                 : field.type
//             }
//             disabled={!editing}
//             value={
//               typeof fieldValue === "string"
//                 ? fieldValue
//                 : ""
//             }
//             onChange={(e) =>
//               updateAnswer(field.id, {
//                 value: e.target.value,
//               })
//             }
//           />
//         </label>
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
//             {template?.title ||
//               audit.title ||
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
//               value={value.customer || ""}
//               onChange={(e) =>
//                 setValue({
//                   ...value,
//                   customer: e.target.value,
//                 })
//               }
//             />
//           </label>

//           <label className="text-sm font-medium">
//             Location

//             <Input
//               className="mt-2"
//               disabled={!editing}
//               value={value.location || ""}
//               onChange={(e) =>
//                 setValue({
//                   ...value,
//                   location: e.target.value,
//                 })
//               }
//             />
//           </label>

//           <label className="text-sm font-medium">
//             Audit date

//             <Input
//               className="mt-2"
//               disabled={!editing}
//               value={value.date || ""}
//               onChange={(e) =>
//                 setValue({
//                   ...value,
//                   date: e.target.value,
//                 })
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
//               <Badge>{value.status}</Badge>
//             </p>
//           </div>
//         </CardContent>
//       </Card>

//       {/* DYNAMIC TEMPLATE SECTIONS */}
//       <div className="mt-8 flex flex-col gap-8">
//         {template?.sections?.map(
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
//                   (field) => {
//                     const answer: Answer =
//                       value.answers?.[
//                         field.id
//                       ] || {};

//                     return (
//                       <Card key={field.id}>
//                         <CardHeader>
//                           <CardTitle className="text-base">
//                             {field.label}
//                           </CardTitle>
//                         </CardHeader>

//                         <CardContent className="flex flex-col gap-4">
//                           {renderField(field)}

//                           {/* REMARKS */}
//                           {field.type !==
//                             "camera-photo" &&
//                             field.type !==
//                               "camera-video" &&
//                             field.type !==
//                               "signature" && (
//                               <label className="text-sm font-medium">
//                                 Remarks

//                                 <Textarea
//                                   className="mt-2 min-h-24"
//                                   disabled={
//                                     !editing
//                                   }
//                                   value={answerRemarks(
//                                     answer,
//                                   )}
//                                   onChange={(e) =>
//                                     updateAnswer(
//                                       field.id,
//                                       {
//                                         remarks:
//                                           e.target
//                                             .value,
//                                       },
//                                     )
//                                   }
//                                 />
//                               </label>
//                             )}
//                         </CardContent>
//                       </Card>
//                     );
//                   },
//                 )}
//               </div>
//             </div>
//           ),
//         )}
//       </div>
//     </main>
//   );
// }

// function answerRemarks(
//   answer: Answer | undefined,
// ) {
//   return answer?.remarks || "";
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

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  const template =
    value.templateSnapshot ||
    ({
      id: value.templateId,
      title: "AUDIT REPORT",
      sections: [],
    } as AuditTemplate);

  function updateFormValue(
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

  function updateEvidence(
    fieldId: string,
    evidence: EvidenceItem[],
  ) {
    setValue((current) => ({
      ...current,
      evidence: {
        ...current.evidence,
        [fieldId]: evidence,
      },
    }));
  }

  function updateSignature(
    fieldId: string,
    signature: SignatureData | undefined,
  ) {
    setValue((current) => {
      const signatures = {
        ...current.signatures,
      };

      if (signature) {
        signatures[fieldId] = signature;
      } else {
        delete signatures[fieldId];
      }

      return {
        ...current,
        signatures,
      };
    });
  }

  async function save() {
    setSaving(true);

    try {
      const res = await fetch(
        `/api/audits/${value.id}`,
        {
          method: "PUT",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            templateId: value.templateId,
            templateSnapshot: value.templateSnapshot,
            formData: value.formData,
            evidence: value.evidence,
            signatures: value.signatures,
          }),
        },
      );

      if (!res.ok) {
        throw new Error("Failed to save audit");
      }

      const updatedAudit = await res.json();

      setValue(updatedAudit);
      setEditing(false);

      router.refresh();
    } catch (error) {
      console.error("Save audit error:", error);
    } finally {
      setSaving(false);
    }
  }

  function renderField(field: Field) {
    const fieldValue = value.formData?.[field.id];

    /*
     * CAMERA PHOTO / VIDEO
     */
    if (
      field.type === "camera-photo" ||
      field.type === "camera-video"
    ) {
      const evidence =
        value.evidence?.[field.id] || [];

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

                  <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
                    <span>
                      {item.type === "video"
                        ? "Video evidence"
                        : "Photo evidence"}
                    </span>

                    {editing && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-destructive"
                        onClick={() => {
                          updateEvidence(
                            field.id,
                            evidence.filter(
                              (_, i) => i !== index,
                            ),
                          );
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No evidence attached
            </p>
          )}
        </div>
      );
    }

    /*
     * SIGNATURE
     */
    if (field.type === "signature") {
      const signature =
        value.signatures?.[field.id];

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
                  {new Date(
                    signature.signedAt,
                  ).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              )}

              {editing && (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3"
                  onClick={() =>
                    updateSignature(
                      field.id,
                      undefined,
                    )
                  }
                >
                  Remove Signature
                </Button>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No signature provided
            </p>
          )}
        </div>
      );
    }

    /*
     * SINGLE CHOICE
     */
    if (field.type === "single-choice") {
      return (
        <div>
          <div className="flex flex-wrap gap-2">
            {(field.options || []).map(
              (option) => (
                <Button
                  key={option}
                  type="button"
                  variant={
                    fieldValue === option
                      ? "default"
                      : "outline"
                  }
                  disabled={!editing}
                  onClick={() =>
                    updateFormValue(
                      field.id,
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

    /*
     * MULTIPLE CHOICE
     */
    if (field.type === "multiple-choice") {
      const selected = Array.isArray(fieldValue)
        ? fieldValue
        : [];

      return (
        <div>
          <div className="flex flex-wrap gap-2">
            {(field.options || []).map(
              (option) => {
                const isSelected =
                  selected.includes(option);

                return (
                  <Button
                    key={option}
                    type="button"
                    variant={
                      isSelected
                        ? "default"
                        : "outline"
                    }
                    disabled={!editing}
                    onClick={() => {
                      const next = isSelected
                        ? selected.filter(
                            (item) =>
                              item !== option,
                          )
                        : [
                            ...selected,
                            option,
                          ];

                      updateFormValue(
                        field.id,
                        next,
                      );
                    }}
                  >
                    {option}
                  </Button>
                );
              },
            )}
          </div>
        </div>
      );
    }

    /*
     * TEXTAREA
     */
    if (field.type === "textarea") {
      return (
        <Textarea
          className="min-h-24"
          disabled={!editing}
          value={
            typeof fieldValue === "string"
              ? fieldValue
              : ""
          }
          onChange={(e) =>
            updateFormValue(
              field.id,
              e.target.value,
            )
          }
        />
      );
    }

    /*
     * TEXT / NUMBER / DATE / TIME
     */
    if (
      field.type === "date" ||
      field.type === "time" ||
      field.type === "number" ||
      field.type === "text"
    ) {
      return (
        <Input
          type={
            field.type === "number"
              ? "number"
              : field.type
          }
          disabled={!editing}
          value={
            typeof fieldValue === "string" ||
            typeof fieldValue === "number"
              ? String(fieldValue)
              : ""
          }
          onChange={(e) =>
            updateFormValue(
              field.id,
              e.target.value,
            )
          }
        />
      );
    }

    return null;
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
              "AUDIT REPORT"}
          </h1>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.print()}
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

      {/* AUDIT INFORMATION */}
      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
          <label className="text-sm font-medium">
            Customer

            <Input
              className="mt-2"
              disabled={!editing}
              value={
                typeof value.formData?.customer ===
                "string"
                  ? value.formData.customer
                  : ""
              }
              onChange={(e) =>
                updateFormValue(
                  "customer",
                  e.target.value,
                )
              }
            />
          </label>

          <label className="text-sm font-medium">
            Location

            <Input
              className="mt-2"
              disabled={!editing}
              value={
                typeof value.formData?.location ===
                "string"
                  ? value.formData.location
                  : ""
              }
              onChange={(e) =>
                updateFormValue(
                  "location",
                  e.target.value,
                )
              }
            />
          </label>

          <label className="text-sm font-medium">
            Audit date

            <Input
              className="mt-2"
              disabled={!editing}
              value={
                typeof value.formData?.date ===
                "string"
                  ? value.formData.date
                  : ""
              }
              onChange={(e) =>
                updateFormValue(
                  "date",
                  e.target.value,
                )
              }
            />
          </label>

          <div className="text-sm">
            <span className="text-muted-foreground">
              Audit ID
            </span>

            <p className="mt-2 font-semibold">
              {value.id}
            </p>
          </div>

          <div className="text-sm">
            <span className="text-muted-foreground">
              Auditor
            </span>

            <p className="mt-2 font-semibold">
              {value.employeeName}
            </p>
          </div>

          <div className="text-sm">
            <span className="text-muted-foreground">
              Status
            </span>

            <p className="mt-2">
              <Badge>
                {String(
                  value.status || "DRAFT",
                ).toUpperCase()}
              </Badge>
            </p>
          </div>

          {value.score !== undefined && (
            <div className="text-sm">
              <span className="text-muted-foreground">
                Score
              </span>

              <p className="mt-2 font-semibold">
                {value.score}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DYNAMIC TEMPLATE SECTIONS */}
      <div className="mt-8 flex flex-col gap-8">
        {template.sections?.map(
          (section, sectionIndex) => (
            <div
              key={
                section.id || sectionIndex
              }
              className="flex flex-col gap-4"
            >
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                {section.name ||
                  section.title}
              </h2>

              <div className="flex flex-col gap-6">
                {section.fields.map(
                  (field) => (
                    <Card key={field.id}>
                      <CardHeader>
                        <CardTitle className="text-base">
                          {field.label}
                        </CardTitle>
                      </CardHeader>

                      <CardContent>
                        {renderField(field)}
                      </CardContent>
                    </Card>
                  ),
                )}
              </div>
            </div>
          ),
        )}
      </div>
    </main>
  );
}

export function PrintButton() {
  return (
    <Button
      variant="outline"
      onClick={() => window.print()}
    >
      Generate PDF
    </Button>
  );
}
