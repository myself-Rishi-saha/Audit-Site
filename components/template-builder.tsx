// "use client";
// import { useEffect, useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";

// export function TemplateBuilder() {
//   const [templates, setTemplates] = useState<any[]>([]);
//   const [selected, setSelected] = useState<any>(null);
//   const [saving, setSaving] = useState(false);
//   useEffect(() => {
//     fetch("/api/templates")
//       .then((r) => r.json())
//       .then(setTemplates);
//   }, []);
//   function choose(t: any) {
//     setSelected(JSON.parse(JSON.stringify(t)));
//   }
//   function update(sectionIndex: number, questionIndex: number, text: string) {
//     const next = {
//       ...selected,
//       sections: selected.sections.map((s: any, si: number) =>
//         si === sectionIndex
//           ? {
//               ...s,
//               questions: s.questions.map((q: any, qi: number) =>
//                 qi === questionIndex ? { ...q, text } : q,
//               ),
//             }
//           : s,
//       ),
//     };
//     setSelected(next);
//   }
//   function add(sectionIndex: number) {
//     setSelected({
//       ...selected,
//       sections: selected.sections.map((s: any, si: number) =>
//         si === sectionIndex
//           ? {
//               ...s,
//               questions: [
//                 ...s.questions,
//                 {
//                   id: `question-${Date.now()}`,
//                   text: "NEW QUESTION?",
//                   required: true,
//                 },
//               ],
//             }
//           : s,
//       ),
//     });
//   }
//   function remove(sectionIndex: number, questionIndex: number) {
//     setSelected({
//       ...selected,
//       sections: selected.sections.map((s: any, si: number) =>
//         si === sectionIndex
//           ? {
//               ...s,
//               questions: s.questions.filter(
//                 (_: any, qi: number) => qi !== questionIndex,
//               ),
//             }
//           : s,
//       ),
//     });
//   }
//   async function save() {
//     setSaving(true);
//     const next = templates.map((t) => (t.id === selected.id ? selected : t));
//     await fetch("/api/templates", {
//       method: "PUT",
//       headers: { "content-type": "application/json" },
//       body: JSON.stringify(next),
//     });
//     setTemplates(next);
//     setSaving(false);
//   }
//   return (
//     <main className="mx-auto max-w-5xl px-5 py-8">
//       <p className="text-sm font-medium text-primary">Administration</p>
//       <h1 className="mt-1 text-3xl font-semibold">Form template management</h1>
//       {!selected ? (
//         <div className="mt-8 grid gap-4 sm:grid-cols-2">
//           {templates.map((t) => (
//             <Card key={t.id}>
//               <CardHeader>
//                 <CardTitle>{t.title}</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <Button onClick={() => choose(t)}>Edit Template</Button>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       ) : (
//         <Card className="mt-8">
//           <CardHeader>
//             <CardTitle>{selected.title}</CardTitle>
//           </CardHeader>
//           <CardContent className="flex flex-col gap-8">
//             {selected.sections.map((s: any, si: number) => (
//               <section key={s.title}>
//                 <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
//                   {s.title}
//                 </h2>
//                 <div className="flex flex-col gap-3">
//                   {s.questions.map((q: any, qi: number) => (
//                     <div key={q.id} className="flex gap-2">
//                       <Input
//                         value={q.text}
//                         onChange={(e) => update(si, qi, e.target.value)}
//                       />
//                       <Button
//                         type="button"
//                         variant="outline"
//                         onClick={() => remove(si, qi)}
//                       >
//                         Delete
//                       </Button>
//                     </div>
//                   ))}
//                 </div>
//                 <Button
//                   className="mt-3"
//                   variant="outline"
//                   onClick={() => add(si)}
//                 >
//                   + Add Question
//                 </Button>
//               </section>
//             ))}
//             <div className="flex gap-2">
//               <Button onClick={save} disabled={saving}>
//                 {saving ? "Saving…" : "Save Template"}
//               </Button>
//               <Button variant="ghost" onClick={() => setSelected(null)}>
//                 Back
//               </Button>
//             </div>
//           </CardContent>
//         </Card>
//       )}
//     </main>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type TemplateField = {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  multiple?: boolean;
};

type TemplateSection = {
  id: string;
  name?: string;
  title?: string;
  fields: TemplateField[];
};

type Template = {
  id: string;
  type: string;
  name: string;
  title?: string;
  sections: TemplateSection[];
};

export function TemplateBuilder() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadTemplates() {
      try {
        setLoading(true);
        setError("");

        const endpoints = [
          "/api/templates/audit",
          "/api/templates/service-report",
        ];

        const responses = await Promise.all(
          endpoints.map((url) =>
            fetch(url, {
              credentials: "include",
              cache: "no-store",
            })
          )
        );

        const failed = responses.find((response) => !response.ok);

        if (failed) {
          throw new Error(
            "Could not load templates. Check that both templates exist in the database."
          );
        }

        const results: Template[] = await Promise.all(
          responses.map((response) => response.json())
        );

        setTemplates(results);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load templates."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTemplates();
  }, []);

  function choose(template: Template) {
    setSelected(JSON.parse(JSON.stringify(template)));
    setError("");
    setMessage("");
  }

  function updateField(
    sectionIndex: number,
    fieldIndex: number,
    changes: Partial<TemplateField>
  ) {
    if (!selected) return;

    setSelected({
      ...selected,
      sections: selected.sections.map((section, si) =>
        si === sectionIndex
          ? {
              ...section,
              fields: section.fields.map((field, fi) =>
                fi === fieldIndex
                  ? { ...field, ...changes }
                  : field
              ),
            }
          : section
      ),
    });
  }

  function addField(sectionIndex: number) {
    if (!selected) return;

    setSelected({
      ...selected,
      sections: selected.sections.map((section, si) =>
        si === sectionIndex
          ? {
              ...section,
              fields: [
                ...section.fields,
                {
                  id: `field-${Date.now()}`,
                  label: "New field",
                  type: "text",
                  required: false,
                },
              ],
            }
          : section
      ),
    });
  }

  function removeField(sectionIndex: number, fieldIndex: number) {
    if (!selected) return;

    setSelected({
      ...selected,
      sections: selected.sections.map((section, si) =>
        si === sectionIndex
          ? {
              ...section,
              fields: section.fields.filter(
                (_, fi) => fi !== fieldIndex
              ),
            }
          : section
      ),
    });
  }

  async function save() {
    if (!selected) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const endpoint =
        selected.id === "audit-report"
          ? "/api/templates/audit"
          : selected.id === "service-report"
            ? "/api/templates/service-report"
            : null;

      if (!endpoint) {
        throw new Error("Unknown template ID.");
      }

      const response = await fetch(endpoint, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selected),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(
          details || "Failed to save template."
        );
      }

      const savedTemplate: Template = await response.json();

      setSelected(savedTemplate);
      setTemplates((current) =>
        current.map((template) =>
          template.id === savedTemplate.id
            ? savedTemplate
            : template
        )
      );

      setMessage("Template saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save template."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <p className="text-sm font-medium text-primary">
        Administration
      </p>

      <h1 className="mt-1 text-3xl font-semibold">
        Form template management
      </h1>

      {loading ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Loading templates...
        </p>
      ) : !selected ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle>
                  {template.title || template.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {template.sections.length} sections
                </p>
                <Button onClick={() => choose(template)}>
                  Edit Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>
              {selected.title || selected.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {selected.id}
            </p>
          </CardHeader>

          <CardContent className="flex flex-col gap-8">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Template title
              </label>
              <Input
                value={selected.title || ""}
                onChange={(event) =>
                  setSelected({
                    ...selected,
                    title: event.target.value,
                  })
                }
              />
            </div>

            {selected.sections.map((section, si) => (
              <section key={section.id}>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">
                  {section.name || section.title || section.id}
                </h2>

                <div className="flex flex-col gap-4">
                  {section.fields.map((field, fi) => (
                    <div
                      key={field.id}
                      className="rounded-xl border p-4"
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium">
                            Field label
                          </label>
                          <Input
                            value={field.label}
                            onChange={(event) =>
                              updateField(si, fi, {
                                label: event.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium">
                            Field type
                          </label>
                          <Input
                            value={field.type}
                            disabled
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={!!field.required}
                            onChange={(event) =>
                              updateField(si, fi, {
                                required: event.target.checked,
                              })
                            }
                          />
                          Required field
                        </label>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            removeField(si, fi)
                          }
                        >
                          Delete Field
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  className="mt-3"
                  variant="outline"
                  onClick={() => addField(si)}
                >
                  + Add Field
                </Button>
              </section>
            ))}

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            {message && (
              <p className="text-sm text-green-600">{message}</p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving..." : "Save Template"}
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  setSelected(null);
                  setError("");
                  setMessage("");
                }}
              >
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && error && !selected && (
        <p className="mt-4 text-sm text-red-500">{error}</p>
      )}
    </main>
  );
}
