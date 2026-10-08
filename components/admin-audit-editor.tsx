// "use client";
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";

// export function AdminAuditEditor({ audit }: { audit: any }) {
//   const router = useRouter();
//   // const [value, setValue] = useState(audit);
//   const [value, setValue] = useState({
//     ...audit,
//     answers: audit?.answers || {},
//   });
//   //console.log("audit.answers:", value.answers);
//   const [editing, setEditing] = useState(false);
//   const [saving, setSaving] = useState(false);
//   // const updateAnswer = (id: string, patch: any) =>
//   //   setValue({
//   //     ...value,
//   //     answers: { ...value.answers, [id]: { ...value.answers[id], ...patch } },
//   //   });
//   const updateAnswer = (id: string, patch: any) =>
//     setValue({
//       ...value,
//       answers: {
//         ...(value.answers || {}),
//         [id]: {
//           ...(value.answers?.[id] || {}),
//           ...patch,
//         },
//       },
//     });
//   async function save() {
//     setSaving(true);
//     await fetch(`/api/audits/${value.id}`, {
//       method: "PUT",
//       headers: { "content-type": "application/json" },
//       body: JSON.stringify({
//         ...value,
//         lastUpdatedBy: "ADMIN001",
//         lastUpdatedAt: new Date().toISOString(),
//       }),
//     });
//     setSaving(false);
//     setEditing(false);
//     router.refresh();
//   }
//   const labels: Record<string, string> = {
//     "fda-panel": "FDA PANEL WORKING STATUS?",
//     "fire-pump": "FIRE PUMP WORKING STATUS?",
//     extinguishers: "FIRE EXTINGUISHERS AVAILABLE?",
//     "exit-clear": "EMERGENCY EXIT CLEAR?",
//   };
//   return (
//     <main className="mx-auto max-w-5xl px-5 py-8">
//       <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
//         <div>
//           <p className="text-sm font-medium text-primary">Admin review</p>
//           <h1 className="mt-1 text-3xl font-semibold">
//             FIRE SAFETY AUDIT REPORT
//           </h1>
//         </div>
//         <div className="flex gap-2">
//           <Button variant="outline" onClick={() => window.print()}>
//             Generate PDF
//           </Button>
//           <Button
//             onClick={() => (editing ? save() : setEditing(true))}
//             disabled={saving}
//           >
//             {saving ? "Saving…" : editing ? "Save Changes" : "Edit Report"}
//           </Button>
//         </div>
//       </div>
//       <Card>
//         <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
//           <label className="text-sm font-medium">
//             Customer
//             <Input
//               className="mt-2"
//               disabled={!editing}
//               value={value.customer}
//               onChange={(e) => setValue({ ...value, customer: e.target.value })}
//             />
//           </label>
//           <label className="text-sm font-medium">
//             Location
//             <Input
//               className="mt-2"
//               disabled={!editing}
//               value={value.location}
//               onChange={(e) => setValue({ ...value, location: e.target.value })}
//             />
//           </label>
//           <label className="text-sm font-medium">
//             Audit date
//             <Input
//               className="mt-2"
//               disabled={!editing}
//               value={value.date}
//               onChange={(e) => setValue({ ...value, date: e.target.value })}
//             />
//           </label>
//           <div className="text-sm">
//             <span className="text-muted-foreground">Audit ID</span>
//             <p className="mt-2 font-semibold">{value.id}</p>
//           </div>
//           <div className="text-sm">
//             <span className="text-muted-foreground">Auditor</span>
//             <p className="mt-2 font-semibold">{value.employeeName}</p>
//           </div>
//           <div className="text-sm">
//             <span className="text-muted-foreground">Status</span>
//             <p className="mt-2">
//               <Badge>{value.status}</Badge>
//             </p>
//           </div>
//         </CardContent>
//       </Card>
//       <div className="mt-8 flex flex-col gap-6">
//         <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
//           Compliance findings
//         </h2>
//         {/* {Object.entries(value.answers).map(([id, a]: any) => ( */}
//         {Object.entries(value.answers || {}).map(([id, a]: any) => (
//           <Card key={id}>
//             <CardHeader>
//               <CardTitle className="text-base">{labels[id] || id}</CardTitle>
//             </CardHeader>
//             <CardContent className="flex flex-col gap-4">
//               <div className="flex flex-wrap gap-2">
//                 {["PASS", "FAIL", "N/A"].map((status) => (
//                   <Button
//                     key={status}
//                     type="button"
//                     variant={a.status === status ? "default" : "outline"}
//                     disabled={!editing}
//                     onClick={() => updateAnswer(id, { status })}
//                   >
//                     {status}
//                   </Button>
//                 ))}
//               </div>
//               {/* <label className="text-sm font-medium">
//                 Remarks
//                 <Textarea
//                   className="mt-2 min-h-24"
//                   disabled={!editing}
//                   value={a.remarks || ""}
//                   onChange={(e) =>
//                     updateAnswer(id, { remarks: e.target.value })
//                   }
//                 />
//               </label> */}
//               <label className="text-sm font-medium">
//                 Remarks
//                 <Textarea
//                   className="mt-2 min-h-24"
//                   disabled={!editing}
//                   value={a.remarks || ""}
//                   onChange={(e) =>
//                     updateAnswer(id, { remarks: e.target.value })
//                   }
//                 />
//               </label>

//               {/* Evidence */}
//               <div>
//                 <p className="text-sm font-medium">Evidence</p>

//                 {a.evidence?.length > 0 ? (
//                   <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
//                     {a.evidence.map((item: any, index: number) => (
//                       <div
//                         key={`${item.url}-${index}`}
//                         className="overflow-hidden rounded-xl border bg-muted"
//                       >
//                         {item.type === "video" ? (
//                           <video
//                             src={item.url}
//                             controls
//                             playsInline
//                             className="aspect-video w-full object-cover"
//                           />
//                         ) : (
//                           <a
//                             href={item.url}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                           >
//                             <img
//                               src={item.url}
//                               alt={`Evidence ${index + 1}`}
//                               className="aspect-video w-full object-cover"
//                             />
//                           </a>
//                         )}

//                         <div className="px-3 py-2 text-xs text-muted-foreground">
//                           {item.type === "video"
//                             ? "Video evidence"
//                             : "Photo evidence"}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <p className="mt-2 text-sm text-muted-foreground">
//                     No evidence attached
//                   </p>
//                 )}
//               </div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>
//     </main>
//   );
// }

// export function PrintButton() {
//   return (
//     <Button variant="outline" onClick={() => window.print()}>
//       Generate PDF
//     </Button>
//   );
// }

"use client";

import { useEffect, useState } from "react";
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
  reportId?: string;
  type: "image" | "video";
  url: string;
  fileName?: string;
  capturedAt?: string;
};

type Answer = {
  value?: string | string[];
  remarks?: string;
  evidence?: EvidenceItem[];
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
  | "number";

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
  title: string;
  sections: Section[];
};

export function AdminAuditEditor({ audit }: { audit: any }) {
  const router = useRouter();

  const [value, setValue] = useState({
    ...audit,
    answers: audit?.answers || {},
  });

  const [template, setTemplate] = useState<AuditTemplate | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadTemplate() {
      try {
        const res = await fetch("/api/templates");

        if (!res.ok) {
          throw new Error("Failed to load templates");
        }

        const templates: AuditTemplate[] = await res.json();

        const currentTemplate =
          templates.find((item) => item.id === audit.templateId) ||
          templates[0];

        setTemplate(currentTemplate || null);
      } catch (error) {
        console.error("Failed to load audit template:", error);
      }
    }

    loadTemplate();
  }, [audit.templateId]);

  const updateAnswer = (id: string, patch: Partial<Answer>) => {
    setValue((current: any) => ({
      ...current,
      answers: {
        ...(current.answers || {}),
        [id]: {
          ...(current.answers?.[id] || {}),
          ...patch,
        },
      },
    }));
  };

  async function save() {
    setSaving(true);

    try {
      const res = await fetch(`/api/audits/${value.id}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ...value,
          lastUpdatedBy: "ADMIN001",
          lastUpdatedAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save audit");
      }

      setEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Save audit error:", error);
    } finally {
      setSaving(false);
    }
  }

  function renderField(field: Field) {
    const answer: Answer = value.answers?.[field.id] || {};
    const fieldValue = answer.value;

    if (
      field.type === "camera-photo" ||
      field.type === "camera-video"
    ) {
      return (
        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="text-sm font-medium">{field.label}</p>

          {answer.evidence?.length ? (
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {answer.evidence.map((item, index) => (
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

                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    {item.type === "video"
                      ? "Video evidence"
                      : "Photo evidence"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              No evidence attached
            </p>
          )}
        </div>
      );
    }

    if (field.type === "single-choice") {
      return (
        <div>
          <p className="text-sm font-medium">{field.label}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {(field.options || []).map((option) => (
              <Button
                key={option}
                type="button"
                variant={fieldValue === option ? "default" : "outline"}
                disabled={!editing}
                onClick={() =>
                  updateAnswer(field.id, {
                    value: option,
                  })
                }
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
      );
    }

    if (field.type === "multiple-choice") {
      const selected = Array.isArray(fieldValue)
        ? fieldValue
        : [];

      return (
        <div>
          <p className="text-sm font-medium">{field.label}</p>

          <div className="mt-3 flex flex-wrap gap-2">
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

                    updateAnswer(field.id, {
                      value: next,
                    });
                  }}
                >
                  {option}
                </Button>
              );
            })}
          </div>
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <label className="text-sm font-medium">
          {field.label}

          <Textarea
            className="mt-2 min-h-24"
            disabled={!editing}
            value={typeof fieldValue === "string" ? fieldValue : ""}
            onChange={(e) =>
              updateAnswer(field.id, {
                value: e.target.value,
              })
            }
          />
        </label>
      );
    }

    if (
      field.type === "date" ||
      field.type === "time" ||
      field.type === "number" ||
      field.type === "text"
    ) {
      return (
        <label className="text-sm font-medium">
          {field.label}

          <Input
            className="mt-2"
            type={
              field.type === "number"
                ? "number"
                : field.type
            }
            disabled={!editing}
            value={typeof fieldValue === "string" ? fieldValue : ""}
            onChange={(e) =>
              updateAnswer(field.id, {
                value: e.target.value,
              })
            }
          />
        </label>
      );
    }

    return null;
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">
            Admin review
          </p>

          <h1 className="mt-1 text-3xl font-semibold">
            {template?.title || audit.title || "AUDIT REPORT"}
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
              editing ? save() : setEditing(true)
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

      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
          <label className="text-sm font-medium">
            Customer

            <Input
              className="mt-2"
              disabled={!editing}
              value={value.customer || ""}
              onChange={(e) =>
                setValue({
                  ...value,
                  customer: e.target.value,
                })
              }
            />
          </label>

          <label className="text-sm font-medium">
            Location

            <Input
              className="mt-2"
              disabled={!editing}
              value={value.location || ""}
              onChange={(e) =>
                setValue({
                  ...value,
                  location: e.target.value,
                })
              }
            />
          </label>

          <label className="text-sm font-medium">
            Audit date

            <Input
              className="mt-2"
              disabled={!editing}
              value={value.date || ""}
              onChange={(e) =>
                setValue({
                  ...value,
                  date: e.target.value,
                })
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
              <Badge>{value.status}</Badge>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 flex flex-col gap-8">
        {template?.sections?.map((section, sectionIndex) => (
          <div
            key={section.id || sectionIndex}
            className="flex flex-col gap-4"
          >
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              {section.name || section.title}
            </h2>

            <div className="flex flex-col gap-6">
              {section.fields.map((field) => (
                <Card key={field.id}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {field.label}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="flex flex-col gap-4">
                    {renderField(field)}

                    {field.type !== "camera-photo" &&
                      field.type !== "camera-video" && (
                        <label className="text-sm font-medium">
                          Remarks

                          <Textarea
                            className="mt-2 min-h-24"
                            disabled={!editing}
                            value={answerRemarks(
                              value.answers?.[field.id],
                            )}
                            onChange={(e) =>
                              updateAnswer(field.id, {
                                remarks: e.target.value,
                              })
                            }
                          />
                        </label>
                      )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function answerRemarks(answer: Answer | undefined) {
  return answer?.remarks || "";
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

