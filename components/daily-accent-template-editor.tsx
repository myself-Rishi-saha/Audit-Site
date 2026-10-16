"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ClipboardList,
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

const API = "/api/templates/daily-accent-report";

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
    DAILY_ACCENT_REPORT: "Daily Accent Report",
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

function emptyDraft(): Draft {
  return {
    label: "",
    type: "text",
    required: false,
    multiple: false,
    options: "",
  };
}

function normalizeTemplate(data: any): Template {
  return {
    ...data,
    id: data.id || "daily-accent-report",
    type: data.type || "DAILY_ACCENT_REPORT",
    name:
      data.name ||
      data.title ||
      "Daily Accent Report",
    sections: Array.isArray(data.sections)
      ? data.sections.map((section: any, index: number) => ({
          ...section,
          id: section.id || `section-${index}`,
          name:
            section.name ||
            section.title ||
            `Section ${index + 1}`,
          fields: Array.isArray(section.fields)
            ? section.fields.map((field: any, fieldIndex: number) => ({
                ...field,
                id:
                  field.id ||
                  createFieldId(
                    field.label || `field-${fieldIndex + 1}`,
                  ),
                label: field.label || field.text || "",
                type: field.type || "text",
                required: field.required ?? false,
                ...(Array.isArray(field.options)
                  ? { options: field.options }
                  : {}),
              }))
            : Array.isArray(section.questions)
              ? section.questions.map((question: any) => ({
                  id:
                    question.id ||
                    createFieldId(
                      question.label || question.text || "field",
                    ),
                  label: question.label || question.text || "",
                  type: question.type || "text",
                  required: question.required ?? false,
                  ...(Array.isArray(question.options)
                    ? { options: question.options }
                    : {}),
                }))
              : [],
        }))
      : [],
  };
}

export function DailyAccentTemplateEditor() {
  const router = useRouter();

  const [template, setTemplate] = useState<Template | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadTemplate() {
      try {
        const response = await fetch(API, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            "Failed to load Daily Accent Report template.",
          );
        }

        const data = await response.json();

        if (!cancelled) {
          setTemplate(normalizeTemplate(data));
        }
      } catch (error) {
        console.error("Failed to load template:", error);

        if (!cancelled) {
          alert(
            "Failed to load Daily Accent Report template. Check that its API route exists.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTemplate();

    return () => {
      cancelled = true;
    };
  }, []);

  function openField(sectionIndex: number, fieldIndex?: number) {
    if (!template) return;

    if (fieldIndex === undefined) {
      setDraft(emptyDraft());
    } else {
      const field =
        template.sections[sectionIndex].fields[fieldIndex];

      setDraft({
        id: field.id,
        label: field.label,
        type: field.type,
        required: !!field.required,
        multiple: !!field.multiple,
        options: (field.options || []).join("\n"),
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

    setDraft({
      ...emptyDraft(),
      label:
        sectionIndex === undefined
          ? ""
          : template.sections[sectionIndex].name,
    });

    setDialog({
      mode: "section",
      section: sectionIndex ?? -1,
    });
  }

  function openOption(
    sectionIndex: number,
    fieldIndex: number,
    optionIndex?: number,
  ) {
    if (!template) return;

    const field =
      template.sections[sectionIndex].fields[fieldIndex];

    setDraft({
      ...emptyDraft(),
      label:
        optionIndex === undefined
          ? ""
          : field.options?.[optionIndex] || "",
      type: field.type,
      required: field.required,
      multiple: field.multiple,
    });

    setDialog({
      mode: "option",
      section: sectionIndex,
      field: fieldIndex,
      option: optionIndex,
    });
  }

  function saveDialog() {
    if (!template || !dialog) return;

    const label = draft.label.trim();

    if (!label) {
      alert(
        dialog.mode === "section"
          ? "Section name is required."
          : dialog.mode === "option"
            ? "Option is required."
            : "Field label is required.",
      );
      return;
    }

    const next = clone(template);

    if (dialog.mode === "field") {
      const field: Field = {
        id: draft.id || createFieldId(label),
        label,
        type: draft.type,
        required: !!draft.required,
        ...(draft.multiple ? { multiple: true } : {}),
      };

      if (
        draft.type === "single-choice" ||
        draft.type === "multiple-choice"
      ) {
        field.options = draft.options
          .split("\n")
          .map((option) => option.trim())
          .filter(Boolean);

        if (field.options.length === 0) {
          alert("Add at least one option for this field.");
          return;
        }
      }

      const fields = next.sections[dialog.section].fields;

      if (dialog.field === undefined) {
        fields.push(field);
      } else {
        fields[dialog.field] = field;
      }
    }

    if (dialog.mode === "section") {
      if (dialog.section === -1) {
        next.sections.push({
          id: `section-${Date.now()}`,
          name: label,
          fields: [],
        });
      } else {
        next.sections[dialog.section].name = label;
      }
    }

    if (dialog.mode === "option") {
      if (dialog.field === undefined) return;

      const field =
        next.sections[dialog.section].fields[dialog.field];

      const options = [...(field.options || [])];

      if (dialog.option === undefined) {
        if (
          options.some(
            (option) =>
              option.toLowerCase() === label.toLowerCase(),
          )
        ) {
          alert("This option already exists.");
          return;
        }

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
    if (!template || !confirm("Delete this option?")) return;

    const next = clone(template);
    const field =
      next.sections[sectionIndex].fields[fieldIndex];

    field.options = (field.options || []).filter(
      (_, index) => index !== optionIndex,
    );

    setTemplate(next);
  }

  function removeField(sectionIndex: number, fieldIndex: number) {
    if (
      !template ||
      !confirm(
        "Delete this field? It will no longer appear on new Daily Accent Reports.",
      )
    ) {
      return;
    }

    const next = clone(template);
    next.sections[sectionIndex].fields.splice(fieldIndex, 1);
    setTemplate(next);
  }

  function removeSection(sectionIndex: number) {
    if (
      !template ||
      !confirm(
        "Delete this section? All fields inside it will also be removed.",
      )
    ) {
      return;
    }

    const next = clone(template);
    next.sections.splice(sectionIndex, 1);
    setTemplate(next);
  }

  function moveSection(sectionIndex: number, direction: number) {
    if (!template) return;

    const target = sectionIndex + direction;

    if (target < 0 || target >= template.sections.length) return;

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

    const fields = template.sections[sectionIndex].fields;
    const target = fieldIndex + direction;

    if (target < 0 || target >= fields.length) return;

    const next = clone(template);
    const nextFields = next.sections[sectionIndex].fields;

    [nextFields[fieldIndex], nextFields[target]] = [
      nextFields[target],
      nextFields[fieldIndex],
    ];

    setTemplate(next);
  }

  async function save() {
    if (!template || saving) return;

    if (
      template.sections.some((section) => !section.name.trim())
    ) {
      alert("Every section must have a name.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(API, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ...template,
          id: "daily-accent-report",
          type: template.type || "DAILY_ACCENT_REPORT",
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Template save failed:", error);
        throw new Error("Failed to save Daily Accent Report template.");
      }

      router.push("/admin/form-templates");
      router.refresh();
    } catch (error) {
      console.error("SAVE TEMPLATE ERROR:", error);

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
          Loading Daily Accent Report template…
        </main>
      </AppShell>
    );
  }

  if (!template) {
    return (
      <AppShell user="A. Sen · Admin">
        <main className="mx-auto max-w-6xl px-5 py-8">
          <p className="text-lg font-semibold">
            Could not load the template.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Confirm that {API} returns the Daily Accent Report template.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => router.push("/admin/form-templates")}
          >
            <ArrowLeft data-icon="inline-start" />
            Form Templates
          </Button>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell user="A. Sen · Admin">
      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push("/admin/form-templates")}
            >
              <ArrowLeft data-icon="inline-start" />
              Form Templates
            </Button>

            <div className="mt-6 flex items-center gap-2 text-sm font-medium text-primary">
              <ClipboardList className="size-4" />
              Daily Accent Report
            </div>

            <h1 className="mt-1 text-3xl font-bold">
              {template.name}
            </h1>

            {template.title && (
              <p className="mt-2 text-muted-foreground">
                {template.title}
              </p>
            )}

            <p className="mt-2 text-muted-foreground">
              Configure sections, fields, options, and field behavior.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setPreview(!preview)}
            >
              {preview ? "Close Preview" : "Preview Form"}
            </Button>

            <Button onClick={save} disabled={saving}>
              <Save data-icon="inline-start" />
              {saving ? "Saving…" : "Save Template"}
            </Button>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-5">
          {template.sections.map((section, si) => (
            <Card key={section.id} className="border-teal-100">
              <CardHeader className="flex flex-row items-center justify-between gap-3 bg-teal-50/70">
                <CardTitle className="text-base tracking-wide">
                  {section.name}
                </CardTitle>

                <div className="flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => moveSection(si, -1)}
                    disabled={si === 0}
                    aria-label="Move section up"
                  >
                    <ArrowUp />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => moveSection(si, 1)}
                    disabled={si === template.sections.length - 1}
                    aria-label="Move section down"
                  >
                    <ArrowDown />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openSection(si)}
                    aria-label="Edit section"
                  >
                    <Pencil />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeSection(si)}
                    aria-label="Delete section"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col gap-3 p-5">
                {section.fields.length === 0 && (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No fields in this section yet.
                  </div>
                )}

                {section.fields.map((field, fi) => (
                  <div
                    key={field.id}
                    className="rounded-lg border bg-background p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{field.label}</p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="secondary">
                            {labelFor(field.type)}
                          </Badge>

                          <Badge
                            variant={field.required ? "default" : "outline"}
                          >
                            {field.required ? "Required" : "Optional"}
                          </Badge>

                          {field.multiple && (
                            <Badge variant="outline">Multiple entries</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveField(si, fi, -1)}
                          disabled={fi === 0}
                          aria-label="Move field up"
                        >
                          <ArrowUp />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveField(si, fi, 1)}
                          disabled={fi === section.fields.length - 1}
                          aria-label="Move field down"
                        >
                          <ArrowDown />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openField(si, fi)}
                        >
                          <Pencil data-icon="inline-start" />
                          Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeField(si, fi)}
                        >
                          <Trash2 data-icon="inline-start" />
                          Delete
                        </Button>
                      </div>
                    </div>

                    {(field.type === "single-choice" ||
                      field.type === "multiple-choice") && (
                      <div className="mt-4 rounded-lg bg-muted/30 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium">Options</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openOption(si, fi)}
                          >
                            <Plus data-icon="inline-start" />
                            Add Option
                          </Button>
                        </div>

                        <div className="mt-2 flex flex-col gap-2">
                          {(field.options || []).length === 0 && (
                            <p className="text-xs text-muted-foreground">
                              No options added.
                            </p>
                          )}

                          {(field.options || []).map((option, oi) => (
                            <div
                              key={`${field.id}-option-${oi}`}
                              className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm"
                            >
                              <span>{option}</span>

                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openOption(si, fi, oi)}
                                  aria-label="Edit option"
                                >
                                  <Pencil />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeOption(si, fi, oi)}
                                  aria-label="Delete option"
                                >
                                  <Trash2 />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <Button
                  variant="outline"
                  className="self-start"
                  onClick={() => openField(si)}
                >
                  <Plus data-icon="inline-start" />
                  Add Field
                </Button>
              </CardContent>
            </Card>
          ))}

          <Button
            variant="outline"
            className="self-start"
            onClick={() => openSection()}
          >
            <Plus data-icon="inline-start" />
            Add Section
          </Button>

          <div className="flex justify-end gap-2 border-t pt-5">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/form-templates")}
            >
              Cancel
            </Button>

            <Button onClick={save} disabled={saving}>
              <Check data-icon="inline-start" />
              {saving ? "Saving…" : "Save Template"}
            </Button>
          </div>
        </div>

        {dialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle>
                  {dialog.mode === "field"
                    ? dialog.field === undefined
                      ? "Add Field"
                      : "Edit Field"
                    : dialog.mode === "option"
                      ? dialog.option === undefined
                        ? "Add Option"
                        : "Edit Option"
                      : dialog.section === -1
                        ? "Add Section"
                        : "Edit Section"}
                </CardTitle>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setDialog(null)}
                  aria-label="Close dialog"
                >
                  <X />
                </Button>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                <label className="text-sm font-medium">
                  {dialog.mode === "section"
                    ? "Section Name"
                    : dialog.mode === "option"
                      ? "Option"
                      : "Field Label"}

                  <Input
                    className="mt-2"
                    value={draft.label}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        label: event.target.value,
                      })
                    }
                    placeholder={
                      dialog.mode === "section"
                        ? "e.g. Daily Work Summary"
                        : dialog.mode === "option"
                          ? "e.g. Completed"
                          : "e.g. Activity Description"
                    }
                  />
                </label>

                {dialog.mode === "field" && (
                  <>
                    <label className="text-sm font-medium">
                      Field Type

                      <select
                        className="mt-2 h-10 w-full rounded-md border bg-background px-3"
                        value={draft.type}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            type: event.target.value as FieldType,
                            options: "",
                          })
                        }
                      >
                        {fieldTypes.map((type) => (
                          <option key={type} value={type}>
                            {labelFor(type)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!draft.required}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            required: event.target.checked,
                          })
                        }
                      />
                      Required field
                    </label>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!draft.multiple}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            multiple: event.target.checked,
                          })
                        }
                      />
                      Allow multiple entries
                    </label>

                    {(draft.type === "single-choice" ||
                      draft.type === "multiple-choice") && (
                      <label className="text-sm font-medium">
                        Options

                        <Textarea
                          className="mt-2 min-h-32"
                          value={draft.options}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              options: event.target.value,
                            })
                          }
                          placeholder={
                            "Enter one option per line\nExample:\nCompleted\nPending\nNot Applicable"
                          }
                        />

                        <p className="mt-1 text-xs text-muted-foreground">
                          Enter one option per line.
                        </p>
                      </label>
                    )}
                  </>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setDialog(null)}
                  >
                    Cancel
                  </Button>

                  <Button onClick={saveDialog}>
                    {dialog.mode === "field" &&
                    dialog.field !== undefined
                      ? "Save Changes"
                      : dialog.mode === "option" &&
                          dialog.option !== undefined
                        ? "Save Changes"
                        : "Save"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {preview && (
          <Card className="mt-8 border-teal-200">
            <CardHeader>
              <CardTitle>Employee Preview</CardTitle>
              <p className="text-sm text-muted-foreground">
                Preview of the Daily Accent Report fields.
              </p>
            </CardHeader>

            <CardContent className="flex flex-col gap-6">
              {template.sections.map((section) => (
                <div key={section.id}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-primary">
                      {section.name}
                    </h3>

                    <Badge variant="secondary">
                      {section.fields.length} fields
                    </Badge>
                  </div>

                  {section.fields.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No fields in this section.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {section.fields.map((field) => (
                        <div
                          key={field.id}
                          className={
                            [
                              "textarea",
                              "single-choice",
                              "multiple-choice",
                              "camera-photo",
                              "camera-video",
                              "signature",
                            ].includes(field.type) || field.multiple
                              ? "rounded-lg border p-3 text-sm sm:col-span-2"
                              : "rounded-lg border p-3 text-sm"
                          }
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">
                              {field.label}
                            </p>

                            {field.required && (
                              <span className="text-red-500">*</span>
                            )}
                          </div>

                          <p className="mt-1 text-muted-foreground">
                            {labelFor(field.type)}
                            {field.required
                              ? " · Required"
                              : " · Optional"}
                            {field.multiple
                              ? " · Multiple entries"
                              : ""}
                          </p>

                          {(field.type === "single-choice" ||
                            field.type === "multiple-choice") &&
                            field.options?.length ? (
                              <p className="mt-2 text-xs text-muted-foreground">
                                Options: {field.options.join(" · ")}
                              </p>
                            ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </AppShell>
  );
}