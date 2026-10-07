// "use client";

// import { useState } from "react";
// import {
//   Check,
//   CircleX,
//   Minus,
//   Save,
//   Send,
//   Trash2,
//   Upload,
//   Video,
//   Image as ImageIcon,
// } from "lucide-react";

// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Textarea } from "@/components/ui/textarea";

// const QUESTIONS = [
//   {
//     id: "fda-panel",
//     text: "FDA PANEL WORKING STATUS?",
//     section: "CHECKLIST FINDINGS",
//     required: true,
//   },
//   {
//     id: "fire-pump",
//     text: "FIRE PUMP WORKING STATUS?",
//     section: "CHECKLIST FINDINGS",
//     required: true,
//   },
//   {
//     id: "extinguishers",
//     text: "FIRE EXTINGUISHERS AVAILABLE?",
//     section: "GENERAL",
//     required: true,
//   },
//   {
//     id: "exit-clear",
//     text: "EMERGENCY EXIT CLEAR?",
//     section: "GENERAL",
//     required: true,
//   },
// ];

// type Evidence = {
//   reportId: string;
//   type: "image" | "video";
//   url: string;
//   fileName: string;
//   capturedAt: string;
// };

// type Answer = {
//   status?: "PASS" | "FAIL" | "N/A";
//   remarks?: string;
//   evidence?: Evidence[];
// };

// export function AuditDraft({ audit }: { audit: any }) {
//   const [answers, setAnswers] = useState<Record<string, Answer>>(
//     audit.answers || {},
//   );

//   const [saving, setSaving] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [uploading, setUploading] = useState<string | null>(null);
//   const [message, setMessage] = useState("");

//   function updateAnswer(id: string, changes: Partial<Answer>) {
//     setAnswers((prev) => ({
//       ...prev,
//       [id]: {
//         ...(prev[id] || {}),
//         ...changes,
//       },
//     }));
//   }

//   function setStatus(
//     id: string,
//     status: "PASS" | "FAIL" | "N/A",
//   ) {
//     updateAnswer(id, { status });
//   }

//   function setRemarks(id: string, remarks: string) {
//     updateAnswer(id, { remarks });
//   }

//   async function uploadEvidence(
//     questionId: string,
//     file: File,
//   ) {
//     try {
//       setUploading(questionId);
//       setMessage("");

//       const formData = new FormData();

//       formData.append("file", file);
//       formData.append("reportId", audit.id);
//       formData.append(
//         "type",
//         file.type.startsWith("video/") ? "video" : "image",
//       );

//       const response = await fetch("/api/upload", {
//         method: "POST",
//         body: formData,
//       });

//       const result = await response.json();

//       if (!response.ok) {
//         throw new Error(result?.error || "Upload failed.");
//       }

//       const evidence: Evidence = {
//         reportId: result.reportId,
//         type: result.type,
//         url: result.url,
//         fileName: result.fileName,
//         capturedAt: result.capturedAt,
//       };

//       /*
//        * Replace existing evidence with the newly uploaded file.
//        * This gives the auditor a simple "replace" workflow.
//        */
//       updateAnswer(questionId, {
//         evidence: [evidence],
//       });

//       setMessage("Evidence uploaded successfully.");
//     } catch (error) {
//       console.error("Evidence upload error:", error);

//       setMessage(
//         error instanceof Error
//           ? error.message
//           : "Failed to upload evidence.",
//       );
//     } finally {
//       setUploading(null);
//     }
//   }

//   function removeEvidence(questionId: string) {
//     updateAnswer(questionId, {
//       evidence: [],
//     });
//   }

//   async function saveDraft() {
//     try {
//       setSaving(true);
//       setMessage("");

//       const response = await fetch(`/api/audits/${audit.id}`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           answers,
//           status: "DRAFT",
//         }),
//       });

//       const result = await response.json();

//       if (!response.ok) {
//         throw new Error(result?.error || "Failed to save draft.");
//       }

//       setMessage("Draft saved successfully.");
//     } catch (error) {
//       console.error("Save draft error:", error);

//       setMessage(
//         error instanceof Error
//           ? error.message
//           : "Failed to save draft.",
//       );
//     } finally {
//       setSaving(false);
//     }
//   }

//   async function submitAudit() {
//     try {
//       setSubmitting(true);
//       setMessage("");

//       /*
//        * Validate required questions before submitting.
//        */
//       const missing = QUESTIONS.filter(
//         (question) => question.required && !answers[question.id]?.status,
//       );

//       if (missing.length > 0) {
//         setMessage(
//           `Please answer: ${missing.map((q) => q.text).join(", ")}`,
//         );
//         setSubmitting(false);
//         return;
//       }

//       const response = await fetch(
//         `/api/audits/${audit.id}/submit`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             answers,
//           }),
//         },
//       );

//       const result = await response.json();

//       if (!response.ok) {
//         throw new Error(result?.error || "Failed to submit audit.");
//       }

//       /*
//        * Reload the page after submission.
//        * The page will now see status = "completed"
//        * and render AuditReport instead of AuditDraft.
//        */
//       window.location.reload();
//     } catch (error) {
//       console.error("Submit audit error:", error);

//       setMessage(
//         error instanceof Error
//           ? error.message
//           : "Failed to submit audit.",
//       );
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   const sections = ["CHECKLIST FINDINGS", "GENERAL"];

//   return (
//     <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
//       {/* Header */}
//       <div className="teal-wash rounded-xl border border-primary/15 p-6 sm:p-8">
//         <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
//           <div>
//             <p className="text-sm font-semibold text-primary">
//               Audit draft
//             </p>

//             <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
//               FIRE SAFETY AUDIT
//             </h1>

//             <p className="mt-2 font-mono text-sm text-muted-foreground">
//               {audit.id}
//             </p>
//           </div>

//           <Badge variant="secondary">DRAFT</Badge>
//         </div>
//       </div>

//       {/* Inspection details */}
//       <Card className="mt-6 shadow-sm">
//         <CardHeader>
//           <CardTitle>Inspection details</CardTitle>
//         </CardHeader>

//         <CardContent className="grid gap-5 sm:grid-cols-4">
//           <Info label="Customer" value={audit.customer} />
//           <Info label="Location" value={audit.location} />
//           <Info
//             label="Auditor"
//             value={audit.employeeName}
//           />
//           <Info label="Date" value={audit.date} />
//         </CardContent>
//       </Card>

//       {/* Questions */}
//       <div className="mt-8 flex flex-col gap-8">
//         {sections.map((section) => {
//           const sectionQuestions = QUESTIONS.filter(
//             (question) => question.section === section,
//           );

//           return (
//             <section key={section}>
//               <div className="mb-3 flex items-center justify-between">
//                 <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
//                   {section}
//                 </h2>

//                 <span className="text-sm text-muted-foreground">
//                   {sectionQuestions.length} questions
//                 </span>
//               </div>

//               <div className="flex flex-col gap-4">
//                 {sectionQuestions.map((question, index) => {
//                   const answer = answers[question.id] || {};
//                   const evidence = answer.evidence || [];

//                   return (
//                     <Card
//                       key={question.id}
//                       className="shadow-sm"
//                     >
//                       <CardContent className="p-5 sm:p-6">
//                         <div className="flex gap-4">
//                           <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold">
//                             {String(index + 1).padStart(2, "0")}
//                           </span>

//                           <div className="min-w-0 flex-1">
//                             {/* Question */}
//                             <div className="flex flex-wrap items-center justify-between gap-3">
//                               <h3 className="font-bold">
//                                 {question.text}
//                               </h3>

//                               {answer.status && (
//                                 <Status status={answer.status} />
//                               )}
//                             </div>

//                             {/* Status buttons */}
//                             <div className="mt-5 grid grid-cols-3 gap-2">
//                               <StatusButton
//                                 active={answer.status === "PASS"}
//                                 onClick={() =>
//                                   setStatus(question.id, "PASS")
//                                 }
//                                 type="PASS"
//                               />

//                               <StatusButton
//                                 active={answer.status === "FAIL"}
//                                 onClick={() =>
//                                   setStatus(question.id, "FAIL")
//                                 }
//                                 type="FAIL"
//                               />

//                               <StatusButton
//                                 active={answer.status === "N/A"}
//                                 onClick={() =>
//                                   setStatus(question.id, "N/A")
//                                 }
//                                 type="N/A"
//                               />
//                             </div>

//                             {/* Remarks */}
//                             <div className="mt-5">
//                               <label className="text-sm font-semibold">
//                                 Remarks
//                               </label>

//                               <Textarea
//                                 value={answer.remarks || ""}
//                                 onChange={(e) =>
//                                   setRemarks(
//                                     question.id,
//                                     e.target.value,
//                                   )
//                                 }
//                                 placeholder="Enter remarks..."
//                                 className="mt-2 min-h-24"
//                               />
//                             </div>

//                             {/* Evidence */}
//                             <div className="mt-5">
//                               <div className="flex items-center justify-between">
//                                 <p className="text-sm font-semibold">
//                                   Evidence
//                                 </p>

//                                 <div className="text-xs text-muted-foreground">
//                                   Image / Video
//                                 </div>
//                               </div>

//                               {/* Existing evidence */}
//                               {evidence.length > 0 && (
//                                 <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
//                                   {evidence.map(
//                                     (item, evidenceIndex) => (
//                                       <div
//                                         key={evidenceIndex}
//                                         className="relative overflow-hidden rounded-xl border bg-muted"
//                                       >
//                                         {item.type === "video" ? (
//                                           <video
//                                             src={item.url}
//                                             controls
//                                             className="h-48 w-full object-cover"
//                                           />
//                                         ) : (
//                                           <a
//                                             href={item.url}
//                                             target="_blank"
//                                             rel="noopener noreferrer"
//                                           >
//                                             <img
//                                               src={item.url}
//                                               alt="Audit evidence"
//                                               className="h-48 w-full object-cover"
//                                             />
//                                           </a>
//                                         )}

//                                         <Button
//                                           type="button"
//                                           size="icon"
//                                           variant="destructive"
//                                           className="absolute right-2 top-2"
//                                           onClick={() =>
//                                             removeEvidence(
//                                               question.id,
//                                             )
//                                           }
//                                         >
//                                           <Trash2 />
//                                         </Button>
//                                       </div>
//                                     ),
//                                   )}
//                                 </div>
//                               )}

//                               {/* Upload */}
//                               <label
//                                 className={`mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-5 text-sm font-semibold transition hover:bg-secondary ${
//                                   uploading === question.id
//                                     ? "pointer-events-none opacity-50"
//                                     : ""
//                                 }`}
//                               >
//                                 {uploading === question.id ? (
//                                   <>
//                                     <span className="animate-pulse">
//                                       Uploading...
//                                     </span>
//                                   </>
//                                 ) : (
//                                   <>
//                                     <Upload className="size-4" />
//                                     {evidence.length > 0
//                                       ? "Replace Evidence"
//                                       : "Upload Evidence"}
//                                   </>
//                                 )}

//                                 <input
//                                   type="file"
//                                   accept="image/*,video/*"
//                                   className="hidden"
//                                   disabled={
//                                     uploading === question.id
//                                   }
//                                   onChange={(e) => {
//                                     const file =
//                                       e.target.files?.[0];

//                                     if (file) {
//                                       uploadEvidence(
//                                         question.id,
//                                         file,
//                                       );
//                                     }

//                                     e.currentTarget.value = "";
//                                   }}
//                                 />
//                               </label>
//                             </div>
//                           </div>
//                         </div>
//                       </CardContent>
//                     </Card>
//                   );
//                 })}
//               </div>
//             </section>
//           );
//         })}
//       </div>

//       {/* Message */}
//       {message && (
//         <div className="mt-6 rounded-lg border bg-secondary/50 p-4 text-sm font-medium">
//           {message}
//         </div>
//       )}

//       {/* Bottom actions */}
//       <div className="sticky bottom-4 z-10 mt-8 flex flex-col gap-3 rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:justify-end">
//         <Button
//           type="button"
//           variant="outline"
//           onClick={saveDraft}
//           disabled={saving || submitting}
//           className="sm:min-w-36"
//         >
//           <Save />
//           {saving ? "Saving..." : "Save Draft"}
//         </Button>

//         <Button
//           type="button"
//           onClick={submitAudit}
//           disabled={saving || submitting}
//           className="sm:min-w-40"
//         >
//           <Send />
//           {submitting ? "Submitting..." : "Submit Audit"}
//         </Button>
//       </div>
//     </main>
//   );
// }

// function StatusButton({
//   type,
//   active,
//   onClick,
// }: {
//   type: "PASS" | "FAIL" | "N/A";
//   active: boolean;
//   onClick: () => void;
// }) {
//   const Icon =
//     type === "PASS"
//       ? Check
//       : type === "FAIL"
//         ? CircleX
//         : Minus;

//   return (
//     <Button
//       type="button"
//       variant={active ? "default" : "outline"}
//       onClick={onClick}
//       className="h-11"
//     >
//       <Icon />
//       {type}
//     </Button>
//   );
// }

// function Status({ status }: { status: string }) {
//   return (
//     <Badge
//       variant={
//         status === "FAIL"
//           ? "destructive"
//           : status === "PASS"
//             ? "default"
//             : "secondary"
//       }
//     >
//       {status === "PASS" ? (
//         <Check data-icon="inline-start" />
//       ) : status === "FAIL" ? (
//         <CircleX data-icon="inline-start" />
//       ) : (
//         <Minus data-icon="inline-start" />
//       )}

//       {status}
//     </Badge>
//   );
// }

// function Info({
//   label,
//   value,
// }: {
//   label: string;
//   value: any;
// }) {
//   return (
//     <div>
//       <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
//         {label}
//       </p>

//       <p className="mt-1 font-semibold">
//         {value || "—"}
//       </p>
//     </div>
//   );
// }
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Check, Save, Send, Video, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CameraCapture } from "@/components/camera-capture";

type CameraMode = "photo" | "video";

type EvidenceItem = {
  reportId?: string;
  type: "image" | "video";
  url: string;
  fileName?: string;
  capturedAt?: string;
};

type Answer = {
  status?: "PASS" | "FAIL" | "N/A";
  remarks?: string;
  evidence?: EvidenceItem[];
};

type Question = {
  id: string;
  text?: string;
  label?: string;
  required?: boolean;
};

type Section = {
  title: string;
  questions: Question[];
};

type AuditTemplate = {
  id: string;
  title: string;
  sections: Section[];
};

type Audit = {
  id: string;
  status: string;
  customer: string;
  location: string;
  date: string;
  employeeName: string;
  templateId?: string;
  template?: AuditTemplate;
  answers?: Record<string, Answer>;
};

export function AuditDraft({ audit }: { audit: Audit }) {
  const router = useRouter();

  const [answers, setAnswers] = useState<Record<string, Answer>>(
    audit.answers || {},
  );

  const [cameraMode, setCameraMode] = useState<CameraMode | null>(null);
  const [cameraQuestionId, setCameraQuestionId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  const questions = useMemo(() => {
    return (
      audit.template?.sections?.flatMap((section) =>
        section.questions.map((question) => ({
          ...question,
          section: section.title,
        })),
      ) || []
    );
  }, [audit.template]);

  const answered = questions.filter(
    (question) => answers[question.id]?.status,
  ).length;

  const pass = questions.filter(
    (question) => answers[question.id]?.status === "PASS",
  ).length;

  const fail = questions.filter(
    (question) => answers[question.id]?.status === "FAIL",
  ).length;

  const na = questions.filter(
    (question) => answers[question.id]?.status === "N/A",
  ).length;

  const progress = questions.length
    ? Math.round((answered / questions.length) * 100)
    : 0;

  function setAnswer(
    questionId: string,
    key: keyof Answer,
    value: string | EvidenceItem[],
  ) {
    setAnswers((current) => ({
      ...current,
      [questionId]: {
        ...current[questionId],
        [key]: value,
      },
    }));
  }

  function removeEvidence(questionId: string, evidenceIndex: number) {
    setAnswers((current) => ({
      ...current,
      [questionId]: {
        ...current[questionId],
        evidence: (current[questionId]?.evidence || []).filter(
          (_, index) => index !== evidenceIndex,
        ),
      },
    }));
  }

  async function saveDraft() {
    if (saving) return;

    try {
      setSaving(true);

      const response = await fetch(`/api/audits/${audit.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers,
          status: "draft",
        }),
      });

      if (!response.ok) {
        let message = "Failed to save draft.";

        try {
          const data = await response.json();
          message = data?.error || message;
        } catch {}

        throw new Error(message);
      }

      alert("Draft saved successfully.");
    } catch (error) {
      console.error("SAVE DRAFT ERROR:", error);

      alert(error instanceof Error ? error.message : "Failed to save draft.");
    } finally {
      setSaving(false);
    }
  }

  async function submitAudit() {
    if (saving) return;

    const missingRequired = questions.filter(
      (question) => question.required && !answers[question.id]?.status,
    );

    if (missingRequired.length > 0) {
      alert(
        `Please complete all required questions.\n\nMissing: ${missingRequired
          .map((question) => question.text || question.label)
          .join("\n")}`,
      );
      return;
    }

    const confirmed = confirm(
      "Submit this audit?\n\nAfter submission, you will not be able to edit it.",
    );

    if (!confirmed) return;

    try {
      setSaving(true);

      // Save the latest answers first
      const saveResponse = await fetch(`/api/audits/${audit.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers,
          status: "draft",
        }),
      });

      if (!saveResponse.ok) {
        let message = "Failed to save audit.";

        try {
          const data = await saveResponse.json();
          message = data?.error || message;
        } catch {}

        throw new Error(message);
      }

      // Then submit
      const submitResponse = await fetch(`/api/audits/${audit.id}/submit`, {
        method: "POST",
      });

      if (!submitResponse.ok) {
        let message = "Failed to submit audit.";

        try {
          const data = await submitResponse.json();
          message = data?.error || message;
        } catch {}

        throw new Error(message);
      }

      router.push(`/employee/audits/${audit.id}`);
      router.refresh();
    } catch (error) {
      console.error("SUBMIT AUDIT ERROR:", error);

      alert(error instanceof Error ? error.message : "Failed to submit audit.");
    } finally {
      setSaving(false);
    }
  }

  if (!audit.template) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="font-semibold">Audit template could not be loaded.</p>

            <p className="mt-2 text-sm text-muted-foreground">
              Template ID: {audit.templateId || "Unknown"}
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mobile-safe-bottom mx-auto max-w-6xl px-5 py-8 sm:px-8">
      {/* Back */}
      <Button variant="ghost" onClick={() => router.push("/employee")}>
        <ArrowLeft data-icon="inline-start" />
        Back to Audits
      </Button>

      {/* Header */}
      <Card className="teal-wash mt-5 overflow-hidden shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-primary">
                Audit Draft · {audit.date}
              </p>

              <h1 className="mt-2 max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl">
                {audit.template.title}
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Complete the inspection checklist and add supporting
                camera evidence.
              </p>

              <p className="mt-2 font-mono text-xs text-muted-foreground">
                {audit.id}
              </p>
            </div>

            <Badge variant="secondary" className="w-fit">
              DRAFT
            </Badge>
          </div>
        </CardContent>
      </Card>
      {/* <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-[0.18em] text-primary">
            Audit Information
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Customer Name
            <Input
              className="mt-2"
              value={audit.customer || ""}
              onChange={(e) =>
                setAuditInfo((current) => ({
                  ...current,
                  customer: e.target.value,
                }))
              }
              placeholder="Enter customer name"
            />
          </label>

          <label className="text-sm font-medium">
            Location
            <Input
              className="mt-2"
              value={audit.location || ""}
              onChange={(e) =>
                setAuditInfo((current) => ({
                  ...current,
                  location: e.target.value,
                }))
              }
              placeholder="Enter audit location"
            />
          </label>

          <label className="text-sm font-medium">
            Audit Date
            <Input className="mt-2" value={audit.date || ""} readOnly />
          </label>

          <label className="text-sm font-medium">
            Auditor
            <Input className="mt-2" value={audit.employeeName || ""} readOnly />
          </label>
        </CardContent>
      </Card> */}

      {/* Main content */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-6">
          {/* Audit information */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-[0.18em] text-primary">
                Audit Information
              </CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Customer Name
                <Input className="mt-2" value={audit.customer || ""} readOnly />
              </label>

              <label className="text-sm font-medium">
                Location
                <Input className="mt-2" value={audit.location || ""} readOnly />
              </label>

              <label className="text-sm font-medium">
                Audit Date
                <Input className="mt-2" value={audit.date || ""} readOnly />
              </label>

              <label className="text-sm font-medium">
                Auditor
                <Input
                  className="mt-2"
                  value={audit.employeeName || ""}
                  readOnly
                />
              </label>
            </CardContent>
          </Card>

          {/* Dynamic template sections */}
          {audit.template.sections.map((section, sectionIndex) => (
            <section key={`${section.title}-${sectionIndex}`}>
              <div className="mb-3 flex items-center justify-between rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Check className="size-5" />
                  </span>

                  <div>
                    <h2 className="font-semibold">{section.title}</h2>

                    <p className="text-xs text-muted-foreground">
                      Complete the questions in this section
                    </p>
                  </div>
                </div>

                <Badge variant="secondary">
                  {section.questions.length}{" "}
                  {section.questions.length === 1 ? "question" : "questions"}
                </Badge>
              </div>

              <div className="flex flex-col gap-4">
                {section.questions.map((question, questionIndex) => {
                  const answer = answers[question.id] || {};

                  return (
                    <Card
                      key={question.id}
                      className={`shadow-sm transition ${
                        answer.status === "FAIL"
                          ? "border-l-4 border-l-red-400"
                          : answer.status === "PASS"
                            ? "border-l-4 border-l-emerald-400"
                            : answer.status === "N/A"
                              ? "border-l-4 border-l-slate-400"
                              : ""
                      }`}
                    >
                      <CardContent className="p-5 sm:p-6">
                        <div className="flex gap-4">
                          {/* Question number */}
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold">
                            {String(questionIndex + 1).padStart(2, "0")}
                          </span>

                          <div className="min-w-0 flex-1">
                            {/* Question */}
                            <h3 className="font-bold tracking-tight">
                              {question.text || question.label}

                              {question.required && (
                                <span className="ml-1 text-red-500">*</span>
                              )}
                            </h3>

                            <p className="mt-1 text-sm text-muted-foreground">
                              Select inspection status
                            </p>

                            {/* Status */}
                            <div className="mt-4 grid grid-cols-3 gap-2">
                              {(["PASS", "FAIL", "N/A"] as const).map(
                                (status) => (
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
                                ),
                              )}
                            </div>

                            {/* Remarks */}
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

                            {/* Camera evidence */}
                            <div className="mt-5">
                              <p className="text-sm font-medium">Evidence</p>

                              <p className="mt-1 text-xs text-muted-foreground">
                                Capture supporting evidence directly using the
                                camera.
                              </p>

                              <div className="mt-3 flex flex-wrap gap-2">
                                {/* Photo */}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCameraQuestionId(question.id);
                                    setCameraMode("photo");
                                  }}
                                >
                                  <Camera
                                    data-icon="inline-start"
                                    className="size-4"
                                  />
                                  Capture Photo
                                </Button>

                                {/* Video */}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCameraQuestionId(question.id);
                                    setCameraMode("video");
                                  }}
                                >
                                  <Video
                                    data-icon="inline-start"
                                    className="size-4"
                                  />
                                  Record Video
                                </Button>
                              </div>

                              {/* Existing evidence */}
                              {answer.evidence &&
                                answer.evidence.length > 0 && (
                                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {answer.evidence.map(
                                      (item, evidenceIndex) => (
                                        <div
                                          key={`${item.url}-${evidenceIndex}`}
                                          className="group relative overflow-hidden rounded-xl border bg-muted"
                                        >
                                          {item.type === "video" ? (
                                            <video
                                              src={item.url}
                                              controls
                                              playsInline
                                              className="aspect-video w-full object-cover"
                                            />
                                          ) : (
                                            <img
                                              src={item.url}
                                              alt="Audit evidence"
                                              className="aspect-video w-full object-cover"
                                            />
                                          )}

                                          {/* Remove */}
                                          <button
                                            type="button"
                                            onClick={() =>
                                              removeEvidence(
                                                question.id,
                                                evidenceIndex,
                                              )
                                            }
                                            className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600"
                                            aria-label="Remove evidence"
                                          >
                                            <X className="size-4" />
                                          </button>

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

        {/* Progress */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Audit Progress</CardTitle>

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

              <div className="mt-5 grid grid-cols-3 gap-2 border-t pt-4">
                <div className="rounded-lg bg-emerald-50 p-2 text-center">
                  <p className="text-lg font-bold text-emerald-700">{pass}</p>

                  <p className="text-[10px] font-semibold uppercase text-emerald-700">
                    Pass
                  </p>
                </div>

                <div className="rounded-lg bg-red-50 p-2 text-center">
                  <p className="text-lg font-bold text-red-700">{fail}</p>

                  <p className="text-[10px] font-semibold uppercase text-red-700">
                    Fail
                  </p>
                </div>

                <div className="rounded-lg bg-slate-100 p-2 text-center">
                  <p className="text-lg font-bold text-slate-700">{na}</p>

                  <p className="text-[10px] font-semibold uppercase text-slate-700">
                    N/A
                  </p>
                </div>
              </div>

              {/* Desktop buttons */}
              <div className="mt-5 hidden flex-col gap-2 border-t pt-4 lg:flex">
                <Button variant="outline" onClick={saveDraft} disabled={saving}>
                  <Save data-icon="inline-start" />
                  {saving ? "Saving..." : "Save Draft"}
                </Button>

                <Button onClick={submitAudit} disabled={saving}>
                  <Send data-icon="inline-start" />
                  {saving ? "Processing..." : "Submit Audit"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Mobile bottom buttons */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-card/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={saveDraft}
            disabled={saving}
          >
            <Save data-icon="inline-start" />
            {saving ? "Saving..." : "Save Draft"}
          </Button>

          <Button className="flex-1" onClick={submitAudit} disabled={saving}>
            <Send data-icon="inline-start" />
            {saving ? "Processing..." : "Submit"}
          </Button>
        </div>
      </div>

      {/* Camera modal */}
      {cameraMode && cameraQuestionId && (
        <CameraCapture
          mode={cameraMode}
          reportId={audit.id}
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
