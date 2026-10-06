"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TemplateBuilder() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then(setTemplates);
  }, []);
  function choose(t: any) {
    setSelected(JSON.parse(JSON.stringify(t)));
  }
  function update(sectionIndex: number, questionIndex: number, text: string) {
    const next = {
      ...selected,
      sections: selected.sections.map((s: any, si: number) =>
        si === sectionIndex
          ? {
              ...s,
              questions: s.questions.map((q: any, qi: number) =>
                qi === questionIndex ? { ...q, text } : q,
              ),
            }
          : s,
      ),
    };
    setSelected(next);
  }
  function add(sectionIndex: number) {
    setSelected({
      ...selected,
      sections: selected.sections.map((s: any, si: number) =>
        si === sectionIndex
          ? {
              ...s,
              questions: [
                ...s.questions,
                {
                  id: `question-${Date.now()}`,
                  text: "NEW QUESTION?",
                  required: true,
                },
              ],
            }
          : s,
      ),
    });
  }
  function remove(sectionIndex: number, questionIndex: number) {
    setSelected({
      ...selected,
      sections: selected.sections.map((s: any, si: number) =>
        si === sectionIndex
          ? {
              ...s,
              questions: s.questions.filter(
                (_: any, qi: number) => qi !== questionIndex,
              ),
            }
          : s,
      ),
    });
  }
  async function save() {
    setSaving(true);
    const next = templates.map((t) => (t.id === selected.id ? selected : t));
    await fetch("/api/templates", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(next),
    });
    setTemplates(next);
    setSaving(false);
  }
  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <p className="text-sm font-medium text-primary">Administration</p>
      <h1 className="mt-1 text-3xl font-semibold">Form template management</h1>
      {!selected ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {templates.map((t) => (
            <Card key={t.id}>
              <CardHeader>
                <CardTitle>{t.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={() => choose(t)}>Edit Template</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>{selected.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-8">
            {selected.sections.map((s: any, si: number) => (
              <section key={s.title}>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                  {s.title}
                </h2>
                <div className="flex flex-col gap-3">
                  {s.questions.map((q: any, qi: number) => (
                    <div key={q.id} className="flex gap-2">
                      <Input
                        value={q.text}
                        onChange={(e) => update(si, qi, e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => remove(si, qi)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  className="mt-3"
                  variant="outline"
                  onClick={() => add(si)}
                >
                  + Add Question
                </Button>
              </section>
            ))}
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save Template"}
              </Button>
              <Button variant="ghost" onClick={() => setSelected(null)}>
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
