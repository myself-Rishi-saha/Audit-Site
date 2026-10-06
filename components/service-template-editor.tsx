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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Field = {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  multiple?: boolean;
};
type Section = { id: string; name: string; fields: Field[] };
const fieldTypes = [
  "text",
  "textarea",
  "number",
  "date",
  "time",
  "single-choice",
  "multiple-choice",
  "camera-photo",
  "camera-video",
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
  })[type] || type;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export function ServiceTemplateEditor() {
  const router = useRouter();
  const [template, setTemplate] = useState<any>(null);
  const [dialog, setDialog] = useState<{
    mode: "field" | "option" | "section";
    section: number;
    field?: number;
    option?: number;
  } | null>(null);
  const [draft, setDraft] = useState<any>({
    label: "",
    type: "text",
    required: false,
    options: "",
  });
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    fetch("/api/templates/service-report")
      .then((r) => r.json())
      .then(setTemplate);
  }, []);
  if (!template)
    return (
      <AppShell user="A. Sen · Admin">
        <main className="p-8 text-muted-foreground">Loading template…</main>
      </AppShell>
    );
  const openField = (section: number, field?: number) => {
    const value =
      field === undefined
        ? { label: "", type: "text", required: false, options: "" }
        : {
            ...template.sections[section].fields[field],
            options: (
              template.sections[section].fields[field].options || []
            ).join("\n"),
          };
    setDraft(value);
    setDialog({ mode: "field", section, field });
  };
  const saveDialog = () => {
    const next = clone(template);
    if (dialog?.mode === "field") {
      const value = {
        ...draft,
        id:
          draft.id ||
          `${draft.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
        options: ["single-choice", "multiple-choice"].includes(draft.type)
          ? String(draft.options || "")
              .split("\n")
              .map((x: string) => x.trim())
              .filter(Boolean)
          : undefined,
      };
      if (dialog.field === undefined)
        next.sections[dialog.section].fields.push(value);
      else next.sections[dialog.section].fields[dialog.field] = value;
    }
    if (dialog?.mode === "section") {
      next.sections.push({
        id: `section-${Date.now()}`,
        name: draft.label.toUpperCase(),
        fields: [],
      });
    }
    if (dialog?.mode === "option") {
      const options = next.sections[dialog.section].fields[0].options || [];
      if (dialog.option === undefined) options.push(draft.label);
      else options[dialog.option] = draft.label;
      next.sections[dialog.section].fields[0].options = options;
    }
    setTemplate(next);
    setDialog(null);
  };
  const removeField = (si: number, fi: number) => {
    if (
      confirm(
        "Delete this field? This field will no longer appear on new Service Reports.",
      )
    ) {
      const next = clone(template);
      next.sections[si].fields.splice(fi, 1);
      setTemplate(next);
    }
  };
  const removeSection = (si: number) => {
    if (confirm("Delete this section?")) {
      const next = clone(template);
      next.sections.splice(si, 1);
      setTemplate(next);
    }
  };
  const move = (si: number, dir: number) => {
    const to = si + dir;
    if (to < 0 || to >= template.sections.length) return;
    const next = clone(template);
    [next.sections[si], next.sections[to]] = [
      next.sections[to],
      next.sections[si],
    ];
    setTemplate(next);
  };
  const openOption = (si: number, oi?: number) => {
    const options = template.sections[si].fields[0]?.options || [];
    setDraft({ label: oi === undefined ? "" : options[oi] });
    setDialog({ mode: "option", section: si, option: oi });
  };
  const save = async () => {
    setSaving(true);
    await fetch("/api/templates/service-report", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(template),
    });
    setSaving(false);
    router.push("/admin/form-templates");
  };
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
            <p className="mt-6 text-sm font-medium text-primary">
              Service Report Template
            </p>
            <h1 className="mt-1 text-3xl font-bold">{template.name}</h1>
            <p className="mt-2 text-muted-foreground">
              Configure fields, options and section order for new service
              reports.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPreview(!preview)}>
              {preview ? "Close Preview" : "Preview Form"}
            </Button>
            <Button onClick={save} disabled={saving}>
              <Save data-icon="inline-start" />
              {saving ? "Saving…" : "Save Template"}
            </Button>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-5">
          {template.sections.map((section: Section, si: number) => (
            <Card key={section.id} className="border-teal-100">
              <CardHeader className="flex flex-row items-center justify-between bg-teal-50/70">
                <CardTitle className="text-base tracking-wide">
                  {section.name}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => move(si, -1)}
                    aria-label="Move section up"
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => move(si, 1)}
                    aria-label="Move section down"
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setDraft({ label: section.name });
                      setDialog({ mode: "section", section: si });
                    }}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeSection(si)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 p-5">
                {section.fields.map((field, fi) => (
                  <div
                    key={field.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background p-3"
                  >
                    <div>
                      <p className="font-medium">{field.label}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          {labelFor(field.type)}
                        </Badge>
                        <Badge variant={field.required ? "default" : "outline"}>
                          {field.required ? "Required" : "Optional"}
                        </Badge>
                        {field.multiple && (
                          <Badge variant="outline">Multiple entries</Badge>
                        )}
                      </div>
                      {field.options?.length ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Options: {field.options.join(" · ")}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
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
                ))}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => openField(si)}>
                    <Plus data-icon="inline-start" />
                    Add Field
                  </Button>
                  {["SERVICE TYPE", "INSTALLED SYSTEM CHECKED"].includes(
                    section.name,
                  ) && (
                    <Button variant="ghost" onClick={() => openOption(si)}>
                      <Plus data-icon="inline-start" />
                      Add Option
                    </Button>
                  )}
                </div>
                {["SERVICE TYPE", "INSTALLED SYSTEM CHECKED"].includes(
                  section.name,
                ) && (
                  <div className="flex flex-col gap-2">
                    {(section.fields[0]?.options || []).map(
                      (option: string, oi: number) => (
                        <div
                          key={option}
                          className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm"
                        >
                          <span>{option}</span>
                          <span className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openOption(si, oi)}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const next = clone(template);
                                next.sections[si].fields[0].options.splice(
                                  oi,
                                  1,
                                );
                                setTemplate(next);
                              }}
                            >
                              <Trash2 />
                            </Button>
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          <Button
            variant="outline"
            className="self-start"
            onClick={() => {
              setDraft({ label: "", type: "text", required: false });
              setDialog({ mode: "section", section: -1 });
            }}
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
              Save Template
            </Button>
          </div>
        </div>
        {dialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <Card className="w-full max-w-lg shadow-xl">
              <CardHeader>
                <CardTitle>
                  {dialog.mode === "field"
                    ? "Add Service Report Field"
                    : dialog.mode === "option"
                      ? "Service Type Option"
                      : "Section"}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <label className="text-sm font-medium">
                  {dialog.mode === "section" ? "Section name" : "Label"}
                  <Input
                    className="mt-2"
                    value={draft.label || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, label: e.target.value })
                    }
                  />
                </label>
                {dialog.mode === "field" && (
                  <>
                    <label className="text-sm font-medium">
                      Field type
                      <select
                        className="mt-2 h-10 w-full rounded-md border bg-background px-3"
                        value={draft.type}
                        onChange={(e) =>
                          setDraft({ ...draft, type: e.target.value })
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
                        onChange={(e) =>
                          setDraft({ ...draft, required: e.target.checked })
                        }
                      />
                      Required
                    </label>
                    {["single-choice", "multiple-choice"].includes(
                      draft.type,
                    ) && (
                      <label className="text-sm font-medium">
                        Options (one per line)
                        <textarea
                          className="mt-2 min-h-24 w-full rounded-md border bg-background p-2"
                          value={draft.options || ""}
                          onChange={(e) =>
                            setDraft({ ...draft, options: e.target.value })
                          }
                        />
                      </label>
                    )}
                  </>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialog(null)}>
                    Cancel
                  </Button>
                  <Button onClick={saveDialog}>
                    {dialog.mode === "field" && dialog.field !== undefined
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
              <CardTitle>Employee preview</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {template.sections.map((section: Section) => (
                <div key={section.id}>
                  <h3 className="font-semibold text-primary">{section.name}</h3>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {section.fields.map((field) => (
                      <div
                        key={field.id}
                        className="rounded-lg border p-3 text-sm"
                      >
                        <p className="font-medium">{field.label}</p>
                        <p className="mt-1 text-muted-foreground">
                          {labelFor(field.type)}
                          {field.required ? " · Required" : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </AppShell>
  );
}
