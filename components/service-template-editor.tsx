// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   ArrowDown,
//   ArrowLeft,
//   ArrowUp,
//   Check,
//   Pencil,
//   Plus,
//   Save,
//   Trash2,
//   X,
// } from "lucide-react";
// import { AppShell } from "@/components/app-shell";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";

// type Field = {
//   id: string;
//   label: string;
//   type: string;
//   required: boolean;
//   options?: string[];
//   multiple?: boolean;
// };
// type Section = { id: string; name: string; fields: Field[] };
// const fieldTypes = [
//   "text",
//   "textarea",
//   "number",
//   "date",
//   "time",
//   "single-choice",
//   "multiple-choice",
//   "camera-photo",
//   "camera-video",
//   "signature",
// ];
// // const labelFor = (type: string) =>
// //   ({
// //     text: "Text",
// //     textarea: "Long Text",
// //     number: "Number",
// //     date: "Date",
// //     time: "Time",
// //     "single-choice": "Single Choice",
// //     "multiple-choice": "Multiple Choice",
// //     "camera-photo": "Camera Photo",
// //     "camera-video": "Camera Video",
// //   })[type] || type;
// const labelFor = (type: string) =>
//   ({
//     text: "Text",
//     textarea: "Long Text",
//     number: "Number",
//     date: "Date",
//     time: "Time",
//     "single-choice": "Single Choice",
//     "multiple-choice": "Multiple Choice",
//     "camera-photo": "Camera Photo",
//     "camera-video": "Camera Video",
//     signature: "Signature",
//   })[type] || type;
// const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

// export function ServiceTemplateEditor() {
//   const router = useRouter();
//   const [template, setTemplate] = useState<any>(null);
//   const [dialog, setDialog] = useState<{
//     mode: "field" | "option" | "section";
//     section: number;
//     field?: number;
//     option?: number;
//   } | null>(null);
//   const [draft, setDraft] = useState<any>({
//     label: "",
//     type: "text",
//     required: false,
//     options: "",
//   });
//   const [saving, setSaving] = useState(false);
//   const [preview, setPreview] = useState(false);
//   useEffect(() => {
//     fetch("/api/templates/service-report")
//       .then((r) => r.json())
//       .then(setTemplate);
//   }, []);
//   if (!template)
//     return (
//       <AppShell user="A. Sen · Admin">
//         <main className="p-8 text-muted-foreground">Loading template…</main>
//       </AppShell>
//     );
//   const openField = (section: number, field?: number) => {
//     const value =
//       field === undefined
//         ? { label: "", type: "text", required: false, options: "" }
//         : {
//             ...template.sections[section].fields[field],
//             options: (
//               template.sections[section].fields[field].options || []
//             ).join("\n"),
//           };
//     setDraft(value);
//     setDialog({ mode: "field", section, field });
//   };
//   const saveDialog = () => {
//     const next = clone(template);
//     if (dialog?.mode === "field") {
//       const value = {
//         ...draft,
//         id:
//           draft.id ||
//           `${draft.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
//         options: ["single-choice", "multiple-choice"].includes(draft.type)
//           ? String(draft.options || "")
//               .split("\n")
//               .map((x: string) => x.trim())
//               .filter(Boolean)
//           : undefined,
//       };
//       if (dialog.field === undefined)
//         next.sections[dialog.section].fields.push(value);
//       else next.sections[dialog.section].fields[dialog.field] = value;
//     }
//     if (dialog?.mode === "section") {
//       next.sections.push({
//         id: `section-${Date.now()}`,
//         name: draft.label.toUpperCase(),
//         fields: [],
//       });
//     }
//     if (dialog?.mode === "option") {
//       const options = next.sections[dialog.section].fields[0].options || [];
//       if (dialog.option === undefined) options.push(draft.label);
//       else options[dialog.option] = draft.label;
//       next.sections[dialog.section].fields[0].options = options;
//     }
//     setTemplate(next);
//     setDialog(null);
//   };
//   const removeField = (si: number, fi: number) => {
//     if (
//       confirm(
//         "Delete this field? This field will no longer appear on new Service Reports.",
//       )
//     ) {
//       const next = clone(template);
//       next.sections[si].fields.splice(fi, 1);
//       setTemplate(next);
//     }
//   };
//   const removeSection = (si: number) => {
//     if (confirm("Delete this section?")) {
//       const next = clone(template);
//       next.sections.splice(si, 1);
//       setTemplate(next);
//     }
//   };
//   const move = (si: number, dir: number) => {
//     const to = si + dir;
//     if (to < 0 || to >= template.sections.length) return;
//     const next = clone(template);
//     [next.sections[si], next.sections[to]] = [
//       next.sections[to],
//       next.sections[si],
//     ];
//     setTemplate(next);
//   };
//   const openOption = (si: number, oi?: number) => {
//     const options = template.sections[si].fields[0]?.options || [];
//     setDraft({ label: oi === undefined ? "" : options[oi] });
//     setDialog({ mode: "option", section: si, option: oi });
//   };
//   const save = async () => {
//     setSaving(true);
//     await fetch("/api/templates/service-report", {
//       method: "PUT",
//       headers: { "content-type": "application/json" },
//       body: JSON.stringify(template),
//     });
//     setSaving(false);
//     router.push("/admin/form-templates");
//   };
//   return (
//     <AppShell user="A. Sen · Admin">
//       <main className="mx-auto max-w-6xl px-5 py-8">
//         <div className="flex flex-wrap items-start justify-between gap-4">
//           <div>
//             <Button
//               variant="ghost"
//               onClick={() => router.push("/admin/form-templates")}
//             >
//               <ArrowLeft data-icon="inline-start" />
//               Form Templates
//             </Button>
//             <p className="mt-6 text-sm font-medium text-primary">
//               Service Report Template
//             </p>
//             <h1 className="mt-1 text-3xl font-bold">{template.name}</h1>
//             <p className="mt-2 text-muted-foreground">
//               Configure fields, options and section order for new service
//               reports.
//             </p>
//           </div>
//           <div className="flex gap-2">
//             <Button variant="outline" onClick={() => setPreview(!preview)}>
//               {preview ? "Close Preview" : "Preview Form"}
//             </Button>
//             <Button onClick={save} disabled={saving}>
//               <Save data-icon="inline-start" />
//               {saving ? "Saving…" : "Save Template"}
//             </Button>
//           </div>
//         </div>
//         <div className="mt-8 flex flex-col gap-5">
//           {template.sections.map((section: Section, si: number) => (
//             <Card key={section.id} className="border-teal-100">
//               <CardHeader className="flex flex-row items-center justify-between bg-teal-50/70">
//                 <CardTitle className="text-base tracking-wide">
//                   {section.name}
//                 </CardTitle>
//                 <div className="flex gap-1">
//                   <Button
//                     size="sm"
//                     variant="ghost"
//                     onClick={() => move(si, -1)}
//                     aria-label="Move section up"
//                   >
//                     <ArrowUp />
//                   </Button>
//                   <Button
//                     size="sm"
//                     variant="ghost"
//                     onClick={() => move(si, 1)}
//                     aria-label="Move section down"
//                   >
//                     <ArrowDown />
//                   </Button>
//                   <Button
//                     size="sm"
//                     variant="ghost"
//                     onClick={() => {
//                       setDraft({ label: section.name });
//                       setDialog({ mode: "section", section: si });
//                     }}
//                   >
//                     <Pencil />
//                   </Button>
//                   <Button
//                     size="sm"
//                     variant="ghost"
//                     onClick={() => removeSection(si)}
//                   >
//                     <Trash2 />
//                   </Button>
//                 </div>
//               </CardHeader>
//               <CardContent className="flex flex-col gap-3 p-5">
//                 {section.fields.map((field, fi) => (
//                   <div
//                     key={field.id}
//                     className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background p-3"
//                   >
//                     <div>
//                       <p className="font-medium">{field.label}</p>
//                       <div className="mt-1 flex flex-wrap gap-2">
//                         <Badge variant="secondary">
//                           {labelFor(field.type)}
//                         </Badge>
//                         <Badge variant={field.required ? "default" : "outline"}>
//                           {field.required ? "Required" : "Optional"}
//                         </Badge>
//                         {field.multiple && (
//                           <Badge variant="outline">Multiple entries</Badge>
//                         )}
//                       </div>
//                       {field.options?.length ? (
//                         <p className="mt-2 text-xs text-muted-foreground">
//                           Options: {field.options.join(" · ")}
//                         </p>
//                       ) : null}
//                     </div>
//                     <div className="flex gap-2">
//                       <Button
//                         size="sm"
//                         variant="outline"
//                         onClick={() => openField(si, fi)}
//                       >
//                         <Pencil data-icon="inline-start" />
//                         Edit
//                       </Button>
//                       <Button
//                         size="sm"
//                         variant="ghost"
//                         onClick={() => removeField(si, fi)}
//                       >
//                         <Trash2 data-icon="inline-start" />
//                         Delete
//                       </Button>
//                     </div>
//                   </div>
//                 ))}
//                 <div className="flex flex-wrap gap-2">
//                   <Button variant="outline" onClick={() => openField(si)}>
//                     <Plus data-icon="inline-start" />
//                     Add Field
//                   </Button>
//                   {["SERVICE TYPE", "INSTALLED SYSTEM CHECKED"].includes(
//                     section.name,
//                   ) && (
//                     <Button variant="ghost" onClick={() => openOption(si)}>
//                       <Plus data-icon="inline-start" />
//                       Add Option
//                     </Button>
//                   )}
//                 </div>
//                 {["SERVICE TYPE", "INSTALLED SYSTEM CHECKED"].includes(
//                   section.name,
//                 ) && (
//                   <div className="flex flex-col gap-2">
//                     {(section.fields[0]?.options || []).map(
//                       (option: string, oi: number) => (
//                         <div
//                           key={option}
//                           className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm"
//                         >
//                           <span>{option}</span>
//                           <span className="flex gap-1">
//                             <Button
//                               size="sm"
//                               variant="ghost"
//                               onClick={() => openOption(si, oi)}
//                             >
//                               <Pencil />
//                             </Button>
//                             <Button
//                               size="sm"
//                               variant="ghost"
//                               onClick={() => {
//                                 const next = clone(template);
//                                 next.sections[si].fields[0].options.splice(
//                                   oi,
//                                   1,
//                                 );
//                                 setTemplate(next);
//                               }}
//                             >
//                               <Trash2 />
//                             </Button>
//                           </span>
//                         </div>
//                       ),
//                     )}
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           ))}
//           <Button
//             variant="outline"
//             className="self-start"
//             onClick={() => {
//               setDraft({ label: "", type: "text", required: false });
//               setDialog({ mode: "section", section: -1 });
//             }}
//           >
//             <Plus data-icon="inline-start" />
//             Add Section
//           </Button>
//           <div className="flex justify-end gap-2 border-t pt-5">
//             <Button
//               variant="outline"
//               onClick={() => router.push("/admin/form-templates")}
//             >
//               Cancel
//             </Button>
//             <Button onClick={save} disabled={saving}>
//               <Check data-icon="inline-start" />
//               Save Template
//             </Button>
//           </div>
//         </div>
//         {dialog && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
//             <Card className="w-full max-w-lg shadow-xl">
//               <CardHeader>
//                 <CardTitle>
//                   {dialog.mode === "field"
//                     ? "Add Service Report Field"
//                     : dialog.mode === "option"
//                       ? "Service Type Option"
//                       : "Section"}
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="flex flex-col gap-4">
//                 <label className="text-sm font-medium">
//                   {dialog.mode === "section" ? "Section name" : "Label"}
//                   <Input
//                     className="mt-2"
//                     value={draft.label || ""}
//                     onChange={(e) =>
//                       setDraft({ ...draft, label: e.target.value })
//                     }
//                   />
//                 </label>
//                 {dialog.mode === "field" && (
//                   <>
//                     <label className="text-sm font-medium">
//                       Field type
//                       <select
//                         className="mt-2 h-10 w-full rounded-md border bg-background px-3"
//                         value={draft.type}
//                         onChange={(e) =>
//                           setDraft({ ...draft, type: e.target.value })
//                         }
//                       >
//                         {fieldTypes.map((type) => (
//                           <option key={type} value={type}>
//                             {labelFor(type)}
//                           </option>
//                         ))}
//                       </select>
//                     </label>
//                     <label className="flex items-center gap-2 text-sm">
//                       <input
//                         type="checkbox"
//                         checked={!!draft.required}
//                         onChange={(e) =>
//                           setDraft({ ...draft, required: e.target.checked })
//                         }
//                       />
//                       Required
//                     </label>
//                     {["single-choice", "multiple-choice"].includes(
//                       draft.type,
//                     ) && (
//                       <label className="text-sm font-medium">
//                         Options (one per line)
//                         <textarea
//                           className="mt-2 min-h-24 w-full rounded-md border bg-background p-2"
//                           value={draft.options || ""}
//                           onChange={(e) =>
//                             setDraft({ ...draft, options: e.target.value })
//                           }
//                         />
//                       </label>
//                     )}
//                   </>
//                 )}
//                 <div className="flex justify-end gap-2">
//                   <Button variant="outline" onClick={() => setDialog(null)}>
//                     Cancel
//                   </Button>
//                   <Button onClick={saveDialog}>
//                     {dialog.mode === "field" && dialog.field !== undefined
//                       ? "Save Changes"
//                       : "Save"}
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         )}
//         {preview && (
//           <Card className="mt-8 border-teal-200">
//             <CardHeader>
//               <CardTitle>Employee preview</CardTitle>
//             </CardHeader>
//             <CardContent className="flex flex-col gap-5">
//               {template.sections.map((section: Section) => (
//                 <div key={section.id}>
//                   <h3 className="font-semibold text-primary">{section.name}</h3>
//                   <div className="mt-2 grid gap-3 sm:grid-cols-2">
//                     {section.fields.map((field) => (
//                       <div
//                         key={field.id}
//                         className="rounded-lg border p-3 text-sm"
//                       >
//                         <p className="font-medium">{field.label}</p>
//                         <p className="mt-1 text-muted-foreground">
//                           {labelFor(field.type)}
//                           {field.required ? " · Required" : ""}
//                         </p>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               ))}
//             </CardContent>
//           </Card>
//         )}
//       </main>
//     </AppShell>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "time"
  | "single-choice"
  | "multiple-choice"
  | "camera-photo"
  | "camera-video"
  | "signature";

type Field = {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  multiple?: boolean;
};

type Section = {
  id: string;
  name: string;
  fields: Field[];
};

type Template = {
  id: string;
  type: string;
  name: string;
  title?: string;
  sections: Section[];
};

type DialogState = {
  mode: "field" | "option" | "section";
  section: number;
  field?: number;
  option?: number;
};

type Draft = {
  id?: string;
  label: string;
  type: FieldType;
  required: boolean;
  multiple?: boolean;
  options: string;
};

const fieldTypes: FieldType[] = [
  "text",
  "textarea",
  "number",
  "date",
  "time",
  "single-choice",
  "multiple-choice",
  "camera-photo",
  "camera-video",
  "signature",
];

const labelFor = (type: string) =>
  ({
    text: "Text",
    textarea: "Long Text",
    number: "Number",
    date: "Date",
    time: "Time",
    "single-choice": "Single Choice",
    "multiple-choice": "Multiple Choice",
    "camera-photo": "Camera Photo",
    "camera-video": "Camera Video",
    signature: "Signature",
  })[type] || type;

const clone = <T,>(value: T): T =>
  JSON.parse(JSON.stringify(value));

function createFieldId(label: string) {
  const slug = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "field"}-${Date.now()}`;
}

export function ServiceTemplateEditor() {
  const router = useRouter();

  const [template, setTemplate] =
    useState<Template | null>(null);

  const [dialog, setDialog] =
    useState<DialogState | null>(null);

  const [draft, setDraft] = useState<Draft>({
    label: "",
    type: "text",
    required: false,
    multiple: false,
    options: "",
  });

  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTemplate() {
      try {
        const response = await fetch(
          "/api/templates/service-report",
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load service report template.",
          );
        }

        const data: Template =
          await response.json();

        setTemplate(data);
      } catch (error) {
        console.error(
          "Failed to load template:",
          error,
        );

        alert(
          "Failed to load service report template.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadTemplate();
  }, []);

  function openField(
    sectionIndex: number,
    fieldIndex?: number,
  ) {
    if (!template) return;

    if (fieldIndex === undefined) {
      setDraft({
        label: "",
        type: "text",
        required: false,
        multiple: false,
        options: "",
      });
    } else {
      const field =
        template.sections[sectionIndex]
          .fields[fieldIndex];

      setDraft({
        id: field.id,
        label: field.label,
        type: field.type,
        required: !!field.required,
        multiple: !!field.multiple,
        options: (
          field.options || []
        ).join("\n"),
      });
    }

    setDialog({
      mode: "field",
      section: sectionIndex,
      field: fieldIndex,
    });
  }

  function openSection(sectionIndex?: number) {
    if (!template) return;

    if (sectionIndex === undefined) {
      setDraft({
        label: "",
        type: "text",
        required: false,
        multiple: false,
        options: "",
      });

      setDialog({
        mode: "section",
        section: -1,
      });

      return;
    }

    setDraft({
      label: template.sections[sectionIndex].name,
      type: "text",
      required: false,
      multiple: false,
      options: "",
    });

    setDialog({
      mode: "section",
      section: sectionIndex,
    });
  }

  function openOption(
    sectionIndex: number,
    fieldIndex: number,
    optionIndex?: number,
  ) {
    if (!template) return;

    const field =
      template.sections[sectionIndex]
        .fields[fieldIndex];

    const options = field.options || [];

    setDraft({
      label:
        optionIndex === undefined
          ? ""
          : options[optionIndex] || "",
      type: field.type,
      required: field.required,
      multiple: field.multiple,
      options: "",
    });

    setDialog({
      mode: "option",
      section: sectionIndex,
      field: fieldIndex,
      option: optionIndex,
    });
  }

  function saveDialog() {
    if (!template || !dialog) {
      return;
    }

    const label = draft.label.trim();

    if (!label) {
      alert(
        dialog.mode === "section"
          ? "Section name is required."
          : "Label is required.",
      );
      return;
    }

    const next = clone(template);

    /*
     * FIELD
     */
    if (dialog.mode === "field") {
      const field: Field = {
        id:
          draft.id ||
          createFieldId(label),
        label,
        type: draft.type,
        required: !!draft.required,
        multiple:
          draft.multiple === true
            ? true
            : undefined,
      };

      if (
        draft.type === "single-choice" ||
        draft.type === "multiple-choice"
      ) {
        field.options = String(
          draft.options || "",
        )
          .split("\n")
          .map((option) => option.trim())
          .filter(Boolean);
      }

      if (dialog.field === undefined) {
        next.sections[
          dialog.section
        ].fields.push(field);
      } else {
        next.sections[
          dialog.section
        ].fields[dialog.field] = field;
      }
    }

    /*
     * SECTION
     */
    if (dialog.mode === "section") {
      if (dialog.section === -1) {
        next.sections.push({
          id: `section-${Date.now()}`,
          name: label,
          fields: [],
        });
      } else {
        next.sections[
          dialog.section
        ].name = label;
      }
    }

    /*
     * OPTION
     */
    if (dialog.mode === "option") {
      if (dialog.field === undefined) {
        return;
      }

      const field =
        next.sections[dialog.section]
          .fields[dialog.field];

      const options = [
        ...(field.options || []),
      ];

      if (dialog.option === undefined) {
        options.push(label);
      } else {
        options[dialog.option] = label;
      }

      field.options = options;
    }

    setTemplate(next);
    setDialog(null);
  }

  function removeOption(
    sectionIndex: number,
    fieldIndex: number,
    optionIndex: number,
  ) {
    if (!template) return;

    if (
      !confirm(
        "Delete this option?",
      )
    ) {
      return;
    }

    const next = clone(template);

    const field =
      next.sections[sectionIndex]
        .fields[fieldIndex];

    field.options = (
      field.options || []
    ).filter(
      (_, index) =>
        index !== optionIndex,
    );

    setTemplate(next);
  }

  function removeField(
    sectionIndex: number,
    fieldIndex: number,
  ) {
    if (!template) return;

    if (
      !confirm(
        "Delete this field? This field will no longer appear on new Service Reports.",
      )
    ) {
      return;
    }

    const next = clone(template);

    next.sections[
      sectionIndex
    ].fields.splice(fieldIndex, 1);

    setTemplate(next);
  }

  function removeSection(
    sectionIndex: number,
  ) {
    if (!template) return;

    if (
      !confirm(
        "Delete this section? All fields inside this section will also be removed.",
      )
    ) {
      return;
    }

    const next = clone(template);

    next.sections.splice(
      sectionIndex,
      1,
    );

    setTemplate(next);
  }

  function moveSection(
    sectionIndex: number,
    direction: number,
  ) {
    if (!template) return;

    const target =
      sectionIndex + direction;

    if (
      target < 0 ||
      target >= template.sections.length
    ) {
      return;
    }

    const next = clone(template);

    [
      next.sections[sectionIndex],
      next.sections[target],
    ] = [
      next.sections[target],
      next.sections[sectionIndex],
    ];

    setTemplate(next);
  }

  function moveField(
    sectionIndex: number,
    fieldIndex: number,
    direction: number,
  ) {
    if (!template) return;

    const fields =
      template.sections[sectionIndex]
        .fields;

    const target =
      fieldIndex + direction;

    if (
      target < 0 ||
      target >= fields.length
    ) {
      return;
    }

    const next = clone(template);

    [
      next.sections[sectionIndex]
        .fields[fieldIndex],
      next.sections[sectionIndex]
        .fields[target],
    ] = [
      next.sections[sectionIndex]
        .fields[target],
      next.sections[sectionIndex]
        .fields[fieldIndex],
    ];

    setTemplate(next);
  }

  async function save() {
    if (!template) return;

    setSaving(true);

    try {
      const response = await fetch(
        "/api/templates/service-report",
        {
          method: "PUT",
          headers: {
            "content-type":
              "application/json",
          },
          body: JSON.stringify(template),
        },
      );

      if (!response.ok) {
        const error =
          await response.text();

        console.error(
          "Template save failed:",
          error,
        );

        throw new Error(
          "Failed to save template.",
        );
      }

      router.push(
        "/admin/form-templates",
      );
    } catch (error) {
      console.error(
        "SAVE TEMPLATE ERROR:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save template.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell user="A. Sen · Admin">
        <main className="p-8 text-muted-foreground">
          Loading template…
        </main>
      </AppShell>
    );
  }

  if (!template) {
    return (
      <AppShell user="A. Sen · Admin">
        <main className="p-8">
          Failed to load template.
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell user="A. Sen · Admin">
      <main className="mx-auto max-w-6xl px-5 py-8">
        {/* HEADER */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Button
              variant="ghost"
              onClick={() =>
                router.push(
                  "/admin/form-templates",
                )
              }
            >
              <ArrowLeft data-icon="inline-start" />
              Form Templates
            </Button>

            <p className="mt-6 text-sm font-medium text-primary">
              {labelFor(template.type)}
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              {template.name}
            </h1>

            {template.title && (
              <p className="mt-2 text-muted-foreground">
                {template.title}
              </p>
            )}

            <p className="mt-2 text-muted-foreground">
              Configure sections, fields,
              options and field behavior.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setPreview(!preview)
              }
            >
              {preview
                ? "Close Preview"
                : "Preview Form"}
            </Button>

            <Button
              onClick={save}
              disabled={saving}
            >
              <Save data-icon="inline-start" />
              {saving
                ? "Saving…"
                : "Save Template"}
            </Button>
          </div>
        </div>

        {/* SECTIONS */}
        <div className="mt-8 flex flex-col gap-5">
          {template.sections.map(
            (section, si) => (
              <Card
                key={section.id}
                className="border-teal-100"
              >
                <CardHeader className="flex flex-row items-center justify-between bg-teal-50/70">
                  <CardTitle className="text-base tracking-wide">
                    {section.name}
                  </CardTitle>

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        moveSection(
                          si,
                          -1,
                        )
                      }
                      disabled={si === 0}
                      aria-label="Move section up"
                    >
                      <ArrowUp />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        moveSection(
                          si,
                          1,
                        )
                      }
                      disabled={
                        si ===
                        template.sections
                          .length -
                          1
                      }
                      aria-label="Move section down"
                    >
                      <ArrowDown />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        openSection(si)
                      }
                      aria-label="Edit section"
                    >
                      <Pencil />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        removeSection(si)
                      }
                      aria-label="Delete section"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-3 p-5">
                  {/* FIELDS */}
                  {section.fields.length ===
                    0 && (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      No fields in this
                      section.
                    </div>
                  )}

                  {section.fields.map(
                    (field, fi) => (
                      <div
                        key={field.id}
                        className="rounded-lg border bg-background p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">
                              {field.label}
                            </p>

                            <div className="mt-1 flex flex-wrap gap-2">
                              <Badge variant="secondary">
                                {labelFor(
                                  field.type,
                                )}
                              </Badge>

                              <Badge
                                variant={
                                  field.required
                                    ? "default"
                                    : "outline"
                                }
                              >
                                {field.required
                                  ? "Required"
                                  : "Optional"}
                              </Badge>

                              {field.multiple && (
                                <Badge variant="outline">
                                  Multiple
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                moveField(
                                  si,
                                  fi,
                                  -1,
                                )
                              }
                              disabled={
                                fi === 0
                              }
                              aria-label="Move field up"
                            >
                              <ArrowUp />
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                moveField(
                                  si,
                                  fi,
                                  1,
                                )
                              }
                              disabled={
                                fi ===
                                section
                                  .fields
                                  .length -
                                  1
                              }
                              aria-label="Move field down"
                            >
                              <ArrowDown />
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                openField(
                                  si,
                                  fi,
                                )
                              }
                            >
                              <Pencil data-icon="inline-start" />
                              Edit
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                removeField(
                                  si,
                                  fi,
                                )
                              }
                            >
                              <Trash2 data-icon="inline-start" />
                              Delete
                            </Button>
                          </div>
                        </div>

                        {/* OPTIONS */}
                        {(field.type ===
                          "single-choice" ||
                          field.type ===
                            "multiple-choice") && (
                          <div className="mt-4 rounded-lg bg-muted/30 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium">
                                Options
                              </p>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  openOption(
                                    si,
                                    fi,
                                  )
                                }
                              >
                                <Plus data-icon="inline-start" />
                                Add Option
                              </Button>
                            </div>

                            <div className="mt-2 flex flex-col gap-2">
                              {(
                                field.options ||
                                []
                              ).length ===
                                0 && (
                                <p className="text-xs text-muted-foreground">
                                  No options
                                  added.
                                </p>
                              )}

                              {(
                                field.options ||
                                []
                              ).map(
                                (
                                  option,
                                  oi,
                                ) => (
                                  <div
                                    key={`${field.id}-option-${oi}`}
                                    className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm"
                                  >
                                    <span>
                                      {
                                        option
                                      }
                                    </span>

                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                          openOption(
                                            si,
                                            fi,
                                            oi,
                                          )
                                        }
                                        aria-label="Edit option"
                                      >
                                        <Pencil />
                                      </Button>

                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                          removeOption(
                                            si,
                                            fi,
                                            oi,
                                          )
                                        }
                                        aria-label="Delete option"
                                      >
                                        <Trash2 />
                                      </Button>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ),
                  )}

                  {/* ADD FIELD */}
                  <Button
                    variant="outline"
                    className="self-start"
                    onClick={() =>
                      openField(si)
                    }
                  >
                    <Plus data-icon="inline-start" />
                    Add Field
                  </Button>
                </CardContent>
              </Card>
            ),
          )}

          {/* ADD SECTION */}
          <Button
            variant="outline"
            className="self-start"
            onClick={() =>
              openSection()
            }
          >
            <Plus data-icon="inline-start" />
            Add Section
          </Button>

          {/* BOTTOM ACTIONS */}
          <div className="flex justify-end gap-2 border-t pt-5">
            <Button
              variant="outline"
              onClick={() =>
                router.push(
                  "/admin/form-templates",
                )
              }
            >
              Cancel
            </Button>

            <Button
              onClick={save}
              disabled={saving}
            >
              <Check data-icon="inline-start" />
              {saving
                ? "Saving…"
                : "Save Template"}
            </Button>
          </div>
        </div>

        {/* DIALOG */}
        {dialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <Card className="w-full max-w-lg shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {dialog.mode ===
                  "field"
                    ? dialog.field ===
                      undefined
                      ? "Add Field"
                      : "Edit Field"
                    : dialog.mode ===
                        "option"
                      ? dialog.option ===
                        undefined
                        ? "Add Option"
                        : "Edit Option"
                      : dialog.section ===
                          -1
                        ? "Add Section"
                        : "Edit Section"}
                </CardTitle>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    setDialog(null)
                  }
                >
                  <X />
                </Button>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                {/* LABEL */}
                <label className="text-sm font-medium">
                  {dialog.mode ===
                  "section"
                    ? "Section Name"
                    : dialog.mode ===
                        "option"
                      ? "Option"
                      : "Field Label"}

                  <Input
                    className="mt-2"
                    value={
                      draft.label
                    }
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        label:
                          e.target
                            .value,
                      })
                    }
                    placeholder={
                      dialog.mode ===
                      "section"
                        ? "e.g. Job Information"
                        : dialog.mode ===
                            "option"
                          ? "e.g. BDC"
                          : "e.g. Customer Name"
                    }
                  />
                </label>

                {/* FIELD SETTINGS */}
                {dialog.mode ===
                  "field" && (
                  <>
                    <label className="text-sm font-medium">
                      Field Type

                      <select
                        className="mt-2 h-10 w-full rounded-md border bg-background px-3"
                        value={
                          draft.type
                        }
                        onChange={(
                          e,
                        ) =>
                          setDraft({
                            ...draft,
                            type: e
                              .target
                              .value as FieldType,
                          })
                        }
                      >
                        {fieldTypes.map(
                          (
                            type,
                          ) => (
                            <option
                              key={
                                type
                              }
                              value={
                                type
                              }
                            >
                              {labelFor(
                                type,
                              )}
                            </option>
                          ),
                        )}
                      </select>
                    </label>

                    {/* REQUIRED */}
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={
                          !!draft.required
                        }
                        onChange={(
                          e,
                        ) =>
                          setDraft({
                            ...draft,
                            required:
                              e
                                .target
                                .checked,
                          })
                        }
                      />
                      Required
                    </label>

                    {/* MULTIPLE */}
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={
                          !!draft.multiple
                        }
                        onChange={(
                          e,
                        ) =>
                          setDraft({
                            ...draft,
                            multiple:
                              e
                                .target
                                .checked,
                          })
                        }
                      />
                      Allow multiple entries
                    </label>

                    {/* OPTIONS */}
                    {(
                      [
                        "single-choice",
                        "multiple-choice",
                      ] as FieldType[]
                    ).includes(
                      draft.type,
                    ) && (
                      <label className="text-sm font-medium">
                        Options

                        <Textarea
                          className="mt-2 min-h-32"
                          value={
                            draft.options
                          }
                          onChange={(
                            e,
                          ) =>
                            setDraft({
                              ...draft,
                              options:
                                e
                                  .target
                                  .value,
                            })
                          }
                          placeholder={
                            "Enter one option per line\nExample:\nPASS\nFAIL\nN/A"
                          }
                        />

                        <p className="mt-1 text-xs text-muted-foreground">
                          Enter one
                          option per
                          line.
                        </p>
                      </label>
                    )}
                  </>
                )}

                {/* ACTIONS */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setDialog(null)
                    }
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={
                      saveDialog
                    }
                  >
                    {dialog.mode ===
                      "field" &&
                    dialog.field !==
                      undefined
                      ? "Save Changes"
                      : dialog.mode ===
                          "option" &&
                        dialog.option !==
                          undefined
                        ? "Save Changes"
                        : "Save"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PREVIEW */}
        {preview && (
          <Card className="mt-8 border-teal-200">
            <CardHeader>
              <CardTitle>
                Employee Preview
              </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col gap-6">
              {template.sections.map(
                (section) => (
                  <div
                    key={section.id}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold text-primary">
                        {
                          section.name
                        }
                      </h3>

                      <Badge variant="secondary">
                        {
                          section
                            .fields
                            .length
                        }{" "}
                        fields
                      </Badge>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {section.fields.map(
                        (field) => (
                          <div
                            key={
                              field.id
                            }
                            className={
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
                              field.multiple
                                ? "rounded-lg border p-3 text-sm sm:col-span-2"
                                : "rounded-lg border p-3 text-sm"
                            }
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">
                                {
                                  field.label
                                }
                              </p>

                              {field.required && (
                                <span className="text-red-500">
                                  *
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-muted-foreground">
                              {labelFor(
                                field.type,
                              )}

                              {field.required
                                ? " · Required"
                                : " · Optional"}

                              {field.multiple
                                ? " · Multiple entries"
                                : ""}
                            </p>

                            {(
                              field.type ===
                                "single-choice" ||
                              field.type ===
                                "multiple-choice"
                            ) &&
                              field
                                .options
                                ?.length ? (
                              <p className="mt-2 text-xs text-muted-foreground">
                                Options:{" "}
                                {field.options.join(
                                  " · ",
                                )}
                              </p>
                            ) : null}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                ),
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </AppShell>
  );
}
