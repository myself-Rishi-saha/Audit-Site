"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Check, Save, Send, Video, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CameraCapture } from "@/components/camera-capture";

export default function AuditForm() {
  const router = useRouter();

  const [template, setTemplate] = useState<any>(null);
  const [customer, setCustomer] = useState("");
  const [location, setLocation] = useState("");
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [auditId, setAuditId] = useState("");

  // Camera state
  const [cameraMode, setCameraMode] = useState<"photo" | "video" | null>(null);

  const [cameraQuestionId, setCameraQuestionId] = useState<string | null>(null);

  // --------------------------------------------------
  // Load template
  // --------------------------------------------------

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((d) => setTemplate(d[0]))
      .catch((err) => {
        console.error("Failed to load template:", err);
      });
  }, []);

  // --------------------------------------------------
  // Update answer
  // --------------------------------------------------

  function setAnswer(id: string, key: string, value: string) {
    setAnswers((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [key]: value,
      },
    }));
  }

  // --------------------------------------------------
  // Save / Submit audit
  // --------------------------------------------------

  async function save(submit = false) {
    if (
      submit &&
      template?.sections
        .flatMap((s: any) => s.questions)
        .some((q: any) => !answers[q.id]?.status)
    ) {
      alert("Please select PASS, FAIL, or N/A for every question.");
      return;
    }

    if (
      submit &&
      !confirm(
        "Submit this audit? You will not be able to edit the completed report.",
      )
    ) {
      return;
    }

    let id = auditId;

    const audit = {
      customer,
      location,
      date: "10/05/2026",
      answers,
    };
    console.log("FINAL ANSWERS BEFORE SAVE:", JSON.stringify(answers, null, 2));
    try {
      // Create audit
      if (!id) {
        const response = await fetch("/api/audits", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(audit),
        });

        if (!response.ok) {
          throw new Error("Failed to create audit");
        }

        const created = await response.json();

        id = created.id;

        setAuditId(id);
      }

      // Update existing audit
      else {
        const response = await fetch(`/api/audits/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(audit),
        });

        if (!response.ok) {
          throw new Error("Failed to save audit");
        }
      }

      // Submit
      if (submit) {
        const response = await fetch(`/api/audits/${id}/submit`, {
          method: "POST",
        });

        if (!response.ok) {
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
  // Flatten questions for progress
  // --------------------------------------------------

  const questions = useMemo(
    () =>
      template?.sections.flatMap((section: any) =>
        section.questions.map((question: any) => ({
          ...question,
          section: section.title,
        })),
      ) || [],
    [template],
  );

  const answered = questions.filter((q: any) => answers[q.id]?.status).length;

  const progress = questions.length
    ? Math.round((answered / questions.length) * 100)
    : 0;

  // --------------------------------------------------
  // Loading
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

      {/* ==================================================
          HEADER
      ================================================== */}

      <Card className="teal-wash mt-5 overflow-hidden shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-primary">
                New Audit · 10/05/2026
              </p>

              <h1 className="mt-2 max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl">
                {template.title}
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Safety inspection checklist
              </p>
            </div>

            <Badge variant="secondary" className="w-fit">
              Draft · 10 May 2026
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-6">
          {/* ==================================================
              AUDIT INFORMATION
          ================================================== */}

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-[0.18em] text-primary">
                Audit Information
              </CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 sm:grid-cols-2">
              {/* CUSTOMER */}
              <label className="text-sm font-medium">
                Customer Name
                <Input
                  className="mt-2"
                  placeholder="Enter customer name"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                />
              </label>

              {/* LOCATION */}
              <label className="text-sm font-medium">
                Location
                <Input
                  className="mt-2"
                  placeholder="Enter location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </label>

              {/* DATE */}
              <label className="text-sm font-medium">
                Audit Date
                <Input className="mt-2" value="10/05/2026" readOnly />
              </label>

              {/* AUDITOR */}
              <label className="text-sm font-medium">
                Auditor
                <Input className="mt-2" value="S. Roy" readOnly />
              </label>
            </CardContent>
          </Card>

          {/* ==================================================
              SECTIONS
          ================================================== */}

          {template.sections.map((section: any) => (
            <section key={section.title}>
              {/* SECTION HEADER */}
              <div className="mb-3 flex items-center justify-between rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Check className="size-5" />
                  </span>

                  <div>
                    <h2 className="font-semibold">{section.title}</h2>

                    <p className="text-xs text-muted-foreground">
                      Verify the condition of installed systems
                    </p>
                  </div>
                </div>

                <Badge variant="secondary">
                  {section.questions.length} questions
                </Badge>
              </div>

              {/* QUESTIONS */}
              <div className="flex flex-col gap-4">
                {section.questions.map((question: any, index: number) => {
                  const answer = answers[question.id] || {};

                  return (
                    <Card key={question.id} className="shadow-sm">
                      <CardContent className="p-5 sm:p-6">
                        <div className="flex gap-4">
                          {/* QUESTION NUMBER */}
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
                            {String(index + 1).padStart(2, "0")}
                          </span>

                          <div className="min-w-0 flex-1">
                            {/* QUESTION */}
                            <h3 className="font-bold tracking-tight">
                              {question.label}
                            </h3>

                            <h3 className="font-bold tracking-tight">
                              {question.text}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Select inspection status
                            </p>

                            {/* ==================================================
                                  STATUS
                              ================================================== */}

                            <div className="mt-4 grid grid-cols-3 gap-2">
                              {["PASS", "FAIL", "N/A"].map((status) => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() =>
                                    setAnswer(question.id, "status", status)
                                  }
                                  className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                                    answer.status === status
                                      ? status === "PASS"
                                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                        : status === "FAIL"
                                          ? "border-red-300 bg-red-50 text-red-700"
                                          : "border-slate-300 bg-slate-100 text-slate-700"
                                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted/50"
                                  }`}
                                >
                                  {answer.status === status && (
                                    <Check className="mr-1 inline size-4" />
                                  )}

                                  {status}
                                </button>
                              ))}
                            </div>

                            {/* ==================================================
                                  REMARKS
                              ================================================== */}

                            <label className="mt-5 block text-sm font-medium">
                              Remarks
                              <Textarea
                                className="mt-2 min-h-24 resize-y"
                                placeholder="Add your observation or remarks..."
                                value={answer.remarks || ""}
                                onChange={(e) =>
                                  setAnswer(
                                    question.id,
                                    "remarks",
                                    e.target.value,
                                  )
                                }
                              />
                            </label>

                            {/* ==================================================
                                  EVIDENCE
                              ================================================== */}

                            <div className="mt-5">
                              <p className="text-sm font-medium">Evidence</p>

                              {/* CAMERA BUTTONS */}
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCameraQuestionId(question.id);
                                    setCameraMode("photo");
                                  }}
                                >
                                  <Camera data-icon="inline-start" />
                                  Capture Photo
                                </Button>

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCameraQuestionId(question.id);
                                    setCameraMode("video");
                                  }}
                                >
                                  <Video data-icon="inline-start" />
                                  Record Video
                                </Button>
                              </div>

                              {/* ==================================================
                                    EVIDENCE PREVIEWS
                                ================================================== */}

                              {answer.evidence?.length > 0 && (
                                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                  {answer.evidence.map(
                                    (item: any, evidenceIndex: number) => (
                                      <div
                                        key={`${item.url}-${evidenceIndex}`}
                                        className="group relative overflow-hidden rounded-xl border bg-muted"
                                      >
                                        {/* VIDEO */}
                                        {item.type === "video" ? (
                                          <video
                                            src={item.url}
                                            controls
                                            playsInline
                                            className="aspect-video w-full object-cover"
                                          />
                                        ) : (
                                          /* IMAGE */
                                          <img
                                            src={item.url}
                                            alt="Audit evidence"
                                            className="aspect-video w-full object-cover"
                                          />
                                        )}

                                        {/* DELETE BUTTON */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setAnswers((current) => ({
                                              ...current,
                                              [question.id]: {
                                                ...current[question.id],
                                                evidence: (
                                                  current[question.id]
                                                    ?.evidence || []
                                                ).filter(
                                                  (_: any, i: number) =>
                                                    i !== evidenceIndex,
                                                ),
                                              },
                                            }));
                                          }}
                                          className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600"
                                          aria-label="Remove evidence"
                                        >
                                          <X className="size-4" />
                                        </button>

                                        {/* TYPE LABEL */}
                                        <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white">
                                          {item.type === "video"
                                            ? "VIDEO"
                                            : "PHOTO"}
                                        </div>
                                      </div>
                                    ),
                                  )}
                                </div>
                              )}

                              <p className="mt-2 text-xs text-muted-foreground">
                                Add supporting evidence when available.
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* ==================================================
            PROGRESS SIDEBAR
        ================================================== */}

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Audit progress</CardTitle>

              <p className="text-sm text-muted-foreground">
                {answered} of {questions.length} questions answered
              </p>
            </CardHeader>

            <CardContent>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-2xl font-bold text-primary">
                {progress}%
              </p>

              <div className="mt-5 flex flex-col gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => save(false)}>
                  <Save data-icon="inline-start" />
                  Save Draft
                </Button>

                <Button onClick={() => save(true)}>
                  <Send data-icon="inline-start" />
                  Submit Audit
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* ==================================================
          MOBILE ACTION BAR
      ================================================== */}

      <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-card/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => save(false)}
          >
            Save Draft
          </Button>

          <Button className="flex-1" onClick={() => save(true)}>
            Submit Audit
          </Button>
        </div>
      </div>

      {/* ==================================================
          CAMERA MODAL
      ================================================== */}

      {cameraMode && cameraQuestionId && (
        <CameraCapture
          mode={cameraMode}
          reportId={auditId || "new-audit"}
          onUse={(item) => {
            console.log("Uploaded evidence:", item);

            setAnswers((current) => ({
              ...current,
              [cameraQuestionId]: {
                ...current[cameraQuestionId],

                evidence: [
                  ...(current[cameraQuestionId]?.evidence || []),
                  item,
                ],
              },
            }));

            // Close camera
            setCameraMode(null);
            setCameraQuestionId(null);
          }}
          onCancel={() => {
            setCameraMode(null);
            setCameraQuestionId(null);
          }}
        />
      )}
    </main>
  );
}
