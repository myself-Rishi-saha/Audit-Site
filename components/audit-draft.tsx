// "use client";

// import { useMemo, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   ArrowLeft,
//   Camera,
//   Check,
//   Save,
//   Send,
//   Video,
//   X,
//   Trash2,
// } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { CameraCapture } from "@/components/camera-capture";

// type CameraMode = "photo" | "video";

// type EvidenceItem = {
//   reportId?: string;
//   type: "image" | "video";
//   url: string;
//   fileName?: string;
//   capturedAt?: string;
// };

// type Answer = {
//   status?: "PASS" | "FAIL" | "N/A";
//   remarks?: string;
//   evidence?: EvidenceItem[];
// };

// type Question = {
//   id: string;
//   text?: string;
//   label?: string;
//   required?: boolean;
// };

// type Section = {
//   title: string;
//   questions: Question[];
// };

// type AuditTemplate = {
//   id: string;
//   title: string;
//   sections: Section[];
// };

// type Audit = {
//   id: string;
//   status: string;
//   customer: string;
//   location: string;
//   date: string;
//   employeeName: string;
//   templateId?: string;
//   template?: AuditTemplate;
//   answers?: Record<string, Answer>;
// };

// export function AuditDraft({ audit }: { audit: Audit }) {
//   const router = useRouter();

//   const [answers, setAnswers] = useState<Record<string, Answer>>(
//     audit.answers || {},
//   );

//   const [cameraMode, setCameraMode] = useState<CameraMode | null>(null);
//   const [cameraQuestionId, setCameraQuestionId] = useState<string | null>(null);

//   const [saving, setSaving] = useState(false);

//   const questions = useMemo(() => {
//     return (
//       audit.template?.sections?.flatMap((section) =>
//         section.questions.map((question) => ({
//           ...question,
//           section: section.title,
//         })),
//       ) || []
//     );
//   }, [audit.template]);

//   const answered = questions.filter(
//     (question) => answers[question.id]?.status,
//   ).length;

//   const pass = questions.filter(
//     (question) => answers[question.id]?.status === "PASS",
//   ).length;

//   const fail = questions.filter(
//     (question) => answers[question.id]?.status === "FAIL",
//   ).length;

//   const na = questions.filter(
//     (question) => answers[question.id]?.status === "N/A",
//   ).length;

//   const progress = questions.length
//     ? Math.round((answered / questions.length) * 100)
//     : 0;

//   function setAnswer(
//     questionId: string,
//     key: keyof Answer,
//     value: string | EvidenceItem[],
//   ) {
//     setAnswers((current) => ({
//       ...current,
//       [questionId]: {
//         ...current[questionId],
//         [key]: value,
//       },
//     }));
//   }

//   function removeEvidence(questionId: string, evidenceIndex: number) {
//     setAnswers((current) => ({
//       ...current,
//       [questionId]: {
//         ...current[questionId],
//         evidence: (current[questionId]?.evidence || []).filter(
//           (_, index) => index !== evidenceIndex,
//         ),
//       },
//     }));
//   }

//   async function deleteDraft() {
//     if (saving) return;

//     const confirmed = confirm(
//       "Delete this draft?\n\nThis action cannot be undone.",
//     );

//     if (!confirmed) return;

//     try {
//       setSaving(true);

//       const response = await fetch(`/api/audits/${audit.id}`, {
//         method: "DELETE",
//       });

//       if (!response.ok) {
//         let message = "Failed to delete draft.";

//         try {
//           const data = await response.json();
//           message = data?.error || message;
//         } catch {}

//         throw new Error(message);
//       }

//       router.push("/employee");
//       router.refresh();
//     } catch (error) {
//       console.error("DELETE DRAFT ERROR:", error);

//       alert(error instanceof Error ? error.message : "Failed to delete draft.");
//     } finally {
//       setSaving(false);
//     }
//   }

//   async function saveDraft() {
//     if (saving) return;

//     try {
//       setSaving(true);

//       const response = await fetch(`/api/audits/${audit.id}`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           answers,
//           status: "draft",
//         }),
//       });

//       if (!response.ok) {
//         let message = "Failed to save draft.";

//         try {
//           const data = await response.json();
//           message = data?.error || message;
//         } catch {}

//         throw new Error(message);
//       }

//       alert("Draft saved successfully.");
//     } catch (error) {
//       console.error("SAVE DRAFT ERROR:", error);

//       alert(error instanceof Error ? error.message : "Failed to save draft.");
//     } finally {
//       setSaving(false);
//     }
//   }

//   async function submitAudit() {
//     if (saving) return;

//     const missingRequired = questions.filter(
//       (question) => question.required && !answers[question.id]?.status,
//     );

//     if (missingRequired.length > 0) {
//       alert(
//         `Please complete all required questions.\n\nMissing: ${missingRequired
//           .map((question) => question.text || question.label)
//           .join("\n")}`,
//       );
//       return;
//     }

//     const confirmed = confirm(
//       "Submit this audit?\n\nAfter submission, you will not be able to edit it.",
//     );

//     if (!confirmed) return;

//     try {
//       setSaving(true);

//       // Save the latest answers first
//       const saveResponse = await fetch(`/api/audits/${audit.id}`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           answers,
//           status: "draft",
//         }),
//       });

//       if (!saveResponse.ok) {
//         let message = "Failed to save audit.";

//         try {
//           const data = await saveResponse.json();
//           message = data?.error || message;
//         } catch {}

//         throw new Error(message);
//       }

//       // Then submit
//       const submitResponse = await fetch(`/api/audits/${audit.id}/submit`, {
//         method: "POST",
//       });

//       if (!submitResponse.ok) {
//         let message = "Failed to submit audit.";

//         try {
//           const data = await submitResponse.json();
//           message = data?.error || message;
//         } catch {}

//         throw new Error(message);
//       }

//       router.push(`/employee/audits/${audit.id}`);
//       router.refresh();
//     } catch (error) {
//       console.error("SUBMIT AUDIT ERROR:", error);

//       alert(error instanceof Error ? error.message : "Failed to submit audit.");
//     } finally {
//       setSaving(false);
//     }
//   }

//   if (!audit.template) {
//     return (
//       <main className="mx-auto max-w-6xl px-5 py-8">
//         <Card>
//           <CardContent className="p-8 text-center">
//             <p className="font-semibold">Audit template could not be loaded.</p>

//             <p className="mt-2 text-sm text-muted-foreground">
//               Template ID: {audit.templateId || "Unknown"}
//             </p>
//           </CardContent>
//         </Card>
//       </main>
//     );
//   }

//   return (
//     <main className="mobile-safe-bottom mx-auto max-w-6xl px-5 py-8 sm:px-8">
//       {/* Back */}
//       <Button variant="ghost" onClick={() => router.push("/employee")}>
//         <ArrowLeft data-icon="inline-start" />
//         Back to Audits
//       </Button>

//       {/* Header */}
//       <Card className="teal-wash mt-5 overflow-hidden shadow-sm">
//         <CardContent className="p-6 sm:p-8">
//           <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
//             <div>
//               <p className="text-sm font-semibold text-primary">
//                 Audit Draft · {audit.date}
//               </p>

//               <h1 className="mt-2 max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl">
//                 {audit.template.title}
//               </h1>

//               <p className="mt-2 text-sm text-muted-foreground">
//                 Complete the inspection checklist and add supporting camera
//                 evidence.
//               </p>

//               <p className="mt-2 font-mono text-xs text-muted-foreground">
//                 {audit.id}
//               </p>
//             </div>

//             <Badge variant="secondary" className="w-fit">
//               DRAFT
//             </Badge>
//           </div>
//         </CardContent>
//       </Card>
//       {/* <Card className="shadow-sm">
//         <CardHeader>
//           <CardTitle className="text-sm uppercase tracking-[0.18em] text-primary">
//             Audit Information
//           </CardTitle>
//         </CardHeader>

//         <CardContent className="grid gap-4 sm:grid-cols-2">
//           <label className="text-sm font-medium">
//             Customer Name
//             <Input
//               className="mt-2"
//               value={audit.customer || ""}
//               onChange={(e) =>
//                 setAuditInfo((current) => ({
//                   ...current,
//                   customer: e.target.value,
//                 }))
//               }
//               placeholder="Enter customer name"
//             />
//           </label>

//           <label className="text-sm font-medium">
//             Location
//             <Input
//               className="mt-2"
//               value={audit.location || ""}
//               onChange={(e) =>
//                 setAuditInfo((current) => ({
//                   ...current,
//                   location: e.target.value,
//                 }))
//               }
//               placeholder="Enter audit location"
//             />
//           </label>

//           <label className="text-sm font-medium">
//             Audit Date
//             <Input className="mt-2" value={audit.date || ""} readOnly />
//           </label>

//           <label className="text-sm font-medium">
//             Auditor
//             <Input className="mt-2" value={audit.employeeName || ""} readOnly />
//           </label>
//         </CardContent>
//       </Card> */}

//       {/* Main content */}
//       <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
//         <div className="flex flex-col gap-6">
//           {/* Audit information */}
//           <Card className="shadow-sm">
//             <CardHeader>
//               <CardTitle className="text-sm uppercase tracking-[0.18em] text-primary">
//                 Audit Information
//               </CardTitle>
//             </CardHeader>

//             <CardContent className="grid gap-4 sm:grid-cols-2">
//               <label className="text-sm font-medium">
//                 Customer Name
//                 <Input className="mt-2" value={audit.customer || ""} readOnly />
//               </label>

//               <label className="text-sm font-medium">
//                 Location
//                 <Input className="mt-2" value={audit.location || ""} readOnly />
//               </label>

//               <label className="text-sm font-medium">
//                 Audit Date
//                 <Input className="mt-2" value={audit.date || ""} readOnly />
//               </label>

//               <label className="text-sm font-medium">
//                 Auditor
//                 <Input
//                   className="mt-2"
//                   value={audit.employeeName || ""}
//                   readOnly
//                 />
//               </label>
//             </CardContent>
//           </Card>

//           {/* Dynamic template sections */}
//           {audit.template.sections.map((section, sectionIndex) => (
//             <section key={`${section.title}-${sectionIndex}`}>
//               <div className="mb-3 flex items-center justify-between rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
//                 <div className="flex items-center gap-3">
//                   <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
//                     <Check className="size-5" />
//                   </span>

//                   <div>
//                     <h2 className="font-semibold">{section.title}</h2>

//                     <p className="text-xs text-muted-foreground">
//                       Complete the questions in this section
//                     </p>
//                   </div>
//                 </div>

//                 <Badge variant="secondary">
//                   {section.questions.length}{" "}
//                   {section.questions.length === 1 ? "question" : "questions"}
//                 </Badge>
//               </div>

//               <div className="flex flex-col gap-4">
//                 {section.questions.map((question, questionIndex) => {
//                   const answer = answers[question.id] || {};

//                   return (
//                     <Card
//                       key={question.id}
//                       className={`shadow-sm transition ${
//                         answer.status === "FAIL"
//                           ? "border-l-4 border-l-red-400"
//                           : answer.status === "PASS"
//                             ? "border-l-4 border-l-emerald-400"
//                             : answer.status === "N/A"
//                               ? "border-l-4 border-l-slate-400"
//                               : ""
//                       }`}
//                     >
//                       <CardContent className="p-5 sm:p-6">
//                         <div className="flex gap-4">
//                           {/* Question number */}
//                           <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold">
//                             {String(questionIndex + 1).padStart(2, "0")}
//                           </span>

//                           <div className="min-w-0 flex-1">
//                             {/* Question */}
//                             <h3 className="font-bold tracking-tight">
//                               {question.text || question.label}

//                               {question.required && (
//                                 <span className="ml-1 text-red-500">*</span>
//                               )}
//                             </h3>

//                             <p className="mt-1 text-sm text-muted-foreground">
//                               Select inspection status
//                             </p>

//                             {/* Status */}
//                             <div className="mt-4 grid grid-cols-3 gap-2">
//                               {(["PASS", "FAIL", "N/A"] as const).map(
//                                 (status) => (
//                                   <button
//                                     key={status}
//                                     type="button"
//                                     onClick={() =>
//                                       setAnswer(question.id, "status", status)
//                                     }
//                                     className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
//                                       answer.status === status
//                                         ? status === "PASS"
//                                           ? "border-emerald-300 bg-emerald-50 text-emerald-700"
//                                           : status === "FAIL"
//                                             ? "border-red-300 bg-red-50 text-red-700"
//                                             : "border-slate-300 bg-slate-100 text-slate-700"
//                                         : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted/50"
//                                     }`}
//                                   >
//                                     {answer.status === status && (
//                                       <Check className="mr-1 inline size-4" />
//                                     )}

//                                     {status}
//                                   </button>
//                                 ),
//                               )}
//                             </div>

//                             {/* Remarks */}
//                             <label className="mt-5 block text-sm font-medium">
//                               Remarks
//                               <Textarea
//                                 className="mt-2 min-h-24 resize-y"
//                                 placeholder="Add your observation or remarks..."
//                                 value={answer.remarks || ""}
//                                 onChange={(e) =>
//                                   setAnswer(
//                                     question.id,
//                                     "remarks",
//                                     e.target.value,
//                                   )
//                                 }
//                               />
//                             </label>

//                             {/* Camera evidence */}
//                             <div className="mt-5">
//                               <p className="text-sm font-medium">Evidence</p>

//                               <p className="mt-1 text-xs text-muted-foreground">
//                                 Capture supporting evidence directly using the
//                                 camera.
//                               </p>

//                               <div className="mt-3 flex flex-wrap gap-2">
//                                 {/* Photo */}
//                                 <Button
//                                   type="button"
//                                   variant="outline"
//                                   size="sm"
//                                   onClick={() => {
//                                     setCameraQuestionId(question.id);
//                                     setCameraMode("photo");
//                                   }}
//                                 >
//                                   <Camera
//                                     data-icon="inline-start"
//                                     className="size-4"
//                                   />
//                                   Capture Photo
//                                 </Button>

//                                 {/* Video */}
//                                 <Button
//                                   type="button"
//                                   variant="outline"
//                                   size="sm"
//                                   onClick={() => {
//                                     setCameraQuestionId(question.id);
//                                     setCameraMode("video");
//                                   }}
//                                 >
//                                   <Video
//                                     data-icon="inline-start"
//                                     className="size-4"
//                                   />
//                                   Record Video
//                                 </Button>
//                               </div>

//                               {/* Existing evidence */}
//                               {answer.evidence &&
//                                 answer.evidence.length > 0 && (
//                                   <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
//                                     {answer.evidence.map(
//                                       (item, evidenceIndex) => (
//                                         <div
//                                           key={`${item.url}-${evidenceIndex}`}
//                                           className="group relative overflow-hidden rounded-xl border bg-muted"
//                                         >
//                                           {item.type === "video" ? (
//                                             <video
//                                               src={item.url}
//                                               controls
//                                               playsInline
//                                               className="aspect-video w-full object-cover"
//                                             />
//                                           ) : (
//                                             <img
//                                               src={item.url}
//                                               alt="Audit evidence"
//                                               className="aspect-video w-full object-cover"
//                                             />
//                                           )}

//                                           {/* Remove */}
//                                           <button
//                                             type="button"
//                                             onClick={() =>
//                                               removeEvidence(
//                                                 question.id,
//                                                 evidenceIndex,
//                                               )
//                                             }
//                                             className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600"
//                                             aria-label="Remove evidence"
//                                           >
//                                             <X className="size-4" />
//                                           </button>

//                                           <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white">
//                                             {item.type === "video"
//                                               ? "VIDEO"
//                                               : "PHOTO"}
//                                           </div>
//                                         </div>
//                                       ),
//                                     )}
//                                   </div>
//                                 )}
//                             </div>
//                           </div>
//                         </div>
//                       </CardContent>
//                     </Card>
//                   );
//                 })}
//               </div>
//             </section>
//           ))}
//         </div>

//         {/* Progress */}
//         <aside className="lg:sticky lg:top-24 lg:self-start">
//           <Card className="shadow-sm">
//             <CardHeader>
//               <CardTitle className="text-base">Audit Progress</CardTitle>

//               <p className="text-sm text-muted-foreground">
//                 {answered} of {questions.length} questions answered
//               </p>
//             </CardHeader>

//             <CardContent>
//               <div className="h-2 overflow-hidden rounded-full bg-muted">
//                 <div
//                   className="h-full rounded-full bg-primary transition-all"
//                   style={{
//                     width: `${progress}%`,
//                   }}
//                 />
//               </div>

//               <p className="mt-3 text-2xl font-bold text-primary">
//                 {progress}%
//               </p>

//               <div className="mt-5 grid grid-cols-3 gap-2 border-t pt-4">
//                 <div className="rounded-lg bg-emerald-50 p-2 text-center">
//                   <p className="text-lg font-bold text-emerald-700">{pass}</p>

//                   <p className="text-[10px] font-semibold uppercase text-emerald-700">
//                     Pass
//                   </p>
//                 </div>

//                 <div className="rounded-lg bg-red-50 p-2 text-center">
//                   <p className="text-lg font-bold text-red-700">{fail}</p>

//                   <p className="text-[10px] font-semibold uppercase text-red-700">
//                     Fail
//                   </p>
//                 </div>

//                 <div className="rounded-lg bg-slate-100 p-2 text-center">
//                   <p className="text-lg font-bold text-slate-700">{na}</p>

//                   <p className="text-[10px] font-semibold uppercase text-slate-700">
//                     N/A
//                   </p>
//                 </div>
//               </div>

//               {/* Desktop buttons */}
//               <div className="mt-5 hidden flex-col gap-2 border-t pt-4 lg:flex">
//                 <Button variant="outline" onClick={saveDraft} disabled={saving}>
//                   <Save data-icon="inline-start" />
//                   {saving ? "Saving..." : "Save Draft"}
//                 </Button>
//                 <Button
//                   variant="outline"
//                   onClick={deleteDraft}
//                   disabled={saving}
//                   className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
//                 >
//                   <Trash2 data-icon="inline-start" />
//                   Delete Draft
//                 </Button>
//                 <Button onClick={submitAudit} disabled={saving}>
//                   <Send data-icon="inline-start" />
//                   {saving ? "Processing..." : "Submit Audit"}
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>
//         </aside>
//       </div>

//       {/* Mobile bottom buttons */}
//       <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-card/95 p-3 backdrop-blur lg:hidden">
//         <div className="mx-auto flex max-w-6xl gap-2">
//           <Button
//             variant="outline"
//             className="flex-1"
//             onClick={saveDraft}
//             disabled={saving}
//           >
//             <Save data-icon="inline-start" />
//             {saving ? "Saving..." : "Save Draft"}
//           </Button>

//           <Button className="flex-1" onClick={submitAudit} disabled={saving}>
//             <Send data-icon="inline-start" />
//             {saving ? "Processing..." : "Submit"}
//           </Button>
//         </div>
//       </div>

//       {/* Camera modal */}
//       {cameraMode && cameraQuestionId && (
//         <CameraCapture
//           mode={cameraMode}
//           reportId={audit.id}
//           onUse={(item) => {
//             console.log("Uploaded evidence:", item);

//             setAnswers((current) => ({
//               ...current,
//               [cameraQuestionId]: {
//                 ...current[cameraQuestionId],
//                 evidence: [
//                   ...(current[cameraQuestionId]?.evidence || []),
//                   item,
//                 ],
//               },
//             }));

//             setCameraMode(null);
//             setCameraQuestionId(null);
//           }}
//           onCancel={() => {
//             setCameraMode(null);
//             setCameraQuestionId(null);
//           }}
//         />
//       )}
//     </main>
//   );
// }

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Check,
  Save,
  Send,
  Video,
  X,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const [cameraFieldId, setCameraFieldId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  /*
   * Flatten all fields from all sections.
   *
   * This is now the same structure as Service Reports:
   *
   * sections[].fields[]
   */
  const fields = useMemo(() => {
    return (
      audit.template?.sections?.flatMap((section) =>
        section.fields.map((field) => ({
          ...field,
          section: section.name || section.title || "",
        })),
      ) || []
    );
  }, [audit.template]);

  /*
   * Only fields that require an actual answer are counted
   * in the progress/status calculation.
   *
   * Camera fields are evidence fields, not questions.
   */
  const answerFields = fields.filter(
    (field) =>
      field.type !== "camera-photo" && field.type !== "camera-video",
  );

  const answered = answerFields.filter((field) => {
    const value = answers[field.id]?.value;

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return value !== undefined && value !== "";
  }).length;

  /*
   * PASS / FAIL / N/A are only relevant to single-choice
   * inspection fields.
   */
  const pass = answerFields.filter(
    (field) => answers[field.id]?.value === "PASS",
  ).length;

  const fail = answerFields.filter(
    (field) => answers[field.id]?.value === "FAIL",
  ).length;

  const na = answerFields.filter(
    (field) => answers[field.id]?.value === "N/A",
  ).length;

  const progress = answerFields.length
    ? Math.round((answered / answerFields.length) * 100)
    : 0;

  function setAnswer(
    fieldId: string,
    key: keyof Answer,
    value: string | string[] | EvidenceItem[],
  ) {
    setAnswers((current) => ({
      ...current,
      [fieldId]: {
        ...current[fieldId],
        [key]: value,
      },
    }));
  }

  function removeEvidence(fieldId: string, evidenceIndex: number) {
    setAnswers((current) => ({
      ...current,
      [fieldId]: {
        ...current[fieldId],
        evidence: (current[fieldId]?.evidence || []).filter(
          (_, index) => index !== evidenceIndex,
        ),
      },
    }));
  }

  async function deleteDraft() {
    if (saving) return;

    const confirmed = confirm(
      "Delete this draft?\n\nThis action cannot be undone.",
    );

    if (!confirmed) return;

    try {
      setSaving(true);

      const response = await fetch(`/api/audits/${audit.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let message = "Failed to delete draft.";

        try {
          const data = await response.json();
          message = data?.error || message;
        } catch {}

        throw new Error(message);
      }

      router.push("/employee");
      router.refresh();
    } catch (error) {
      console.error("DELETE DRAFT ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete draft.",
      );
    } finally {
      setSaving(false);
    }
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

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save draft.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitAudit() {
    if (saving) return;

    /*
     * Required fields must have a value.
     *
     * Camera fields are intentionally excluded here because
     * they are evidence fields.
     */
    const missingRequired = answerFields.filter((field) => {
      if (!field.required) return false;

      const value = answers[field.id]?.value;

      if (Array.isArray(value)) {
        return value.length === 0;
      }

      return value === undefined || value === "";
    });

    if (missingRequired.length > 0) {
      alert(
        `Please complete all required fields.\n\nMissing: ${missingRequired
          .map((field) => field.label)
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

      // Save latest answers first
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
      const submitResponse = await fetch(
        `/api/audits/${audit.id}/submit`,
        {
          method: "POST",
        },
      );

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

      alert(
        error instanceof Error
          ? error.message
          : "Failed to submit audit.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!audit.template) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="font-semibold">
              Audit template could not be loaded.
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Template ID: {audit.templateId || "Unknown"}
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  /*
   * Render an individual field according to its type.
   */
  function renderField(
    field: Field,
    fieldIndex: number,
    sectionIndex: number,
  ) {
    const answer = answers[field.id] || {};
    const value = answer.value;

    /*
     * Camera photo field
     */
    if (field.type === "camera-photo") {
      return (
        <Card key={field.id} className="shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">
                  {field.label}

                  {field.required && (
                    <span className="ml-1 text-red-500">*</span>
                  )}
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Capture a photo using the camera.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCameraFieldId(field.id);
                  setCameraMode("photo");
                }}
              >
                <Camera data-icon="inline-start" />
                Capture Photo
              </Button>
            </div>

            {answer.evidence && answer.evidence.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {answer.evidence.map((item, evidenceIndex) => (
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
                        alt={field.label}
                        className="aspect-video w-full object-cover"
                      />
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        removeEvidence(field.id, evidenceIndex)
                      }
                      className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600"
                      aria-label="Remove evidence"
                    >
                      <X className="size-4" />
                    </button>

                    <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white">
                      PHOTO
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    /*
     * Camera video field
     */
    if (field.type === "camera-video") {
      return (
        <Card key={field.id} className="shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">
                  {field.label}

                  {field.required && (
                    <span className="ml-1 text-red-500">*</span>
                  )}
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Record a video using the camera.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCameraFieldId(field.id);
                  setCameraMode("video");
                }}
              >
                <Video data-icon="inline-start" />
                Record Video
              </Button>
            </div>

            {answer.evidence && answer.evidence.length > 0 && (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {answer.evidence.map((item, evidenceIndex) => (
                  <div
                    key={`${item.url}-${evidenceIndex}`}
                    className="group relative overflow-hidden rounded-xl border bg-muted"
                  >
                    <video
                      src={item.url}
                      controls
                      playsInline
                      className="aspect-video w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removeEvidence(field.id, evidenceIndex)
                      }
                      className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600"
                      aria-label="Remove video"
                    >
                      <X className="size-4" />
                    </button>

                    <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white">
                      VIDEO
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    /*
     * Normal field
     */
    return (
      <Card
        key={field.id}
        className={`shadow-sm transition ${
          value === "FAIL"
            ? "border-l-4 border-l-red-400"
            : value === "PASS"
              ? "border-l-4 border-l-emerald-400"
              : value === "N/A"
                ? "border-l-4 border-l-slate-400"
                : ""
        }`}
      >
        <CardContent className="p-5 sm:p-6">
          <div className="flex gap-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold">
              {String(fieldIndex + 1).padStart(2, "0")}
            </span>

            <div className="min-w-0 flex-1">
              <h3 className="font-bold tracking-tight">
                {field.label}

                {field.required && (
                  <span className="ml-1 text-red-500">*</span>
                )}
              </h3>

              {/* Text */}
              {field.type === "text" && (
                <Input
                  className="mt-4"
                  value={typeof value === "string" ? value : ""}
                  onChange={(e) =>
                    setAnswer(field.id, "value", e.target.value)
                  }
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              )}

              {/* Textarea */}
              {field.type === "textarea" && (
                <Textarea
                  className="mt-4 min-h-24 resize-y"
                  value={typeof value === "string" ? value : ""}
                  onChange={(e) =>
                    setAnswer(field.id, "value", e.target.value)
                  }
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              )}

              {/* Date */}
              {field.type === "date" && (
                <Input
                  type="date"
                  className="mt-4"
                  value={typeof value === "string" ? value : ""}
                  onChange={(e) =>
                    setAnswer(field.id, "value", e.target.value)
                  }
                />
              )}

              {/* Time */}
              {field.type === "time" && (
                <Input
                  type="time"
                  className="mt-4"
                  value={typeof value === "string" ? value : ""}
                  onChange={(e) =>
                    setAnswer(field.id, "value", e.target.value)
                  }
                />
              )}

              {/* Number */}
              {field.type === "number" && (
                <Input
                  type="number"
                  className="mt-4"
                  value={typeof value === "string" ? value : ""}
                  onChange={(e) =>
                    setAnswer(field.id, "value", e.target.value)
                  }
                />
              )}

              {/* Single choice */}
              {field.type === "single-choice" && (
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {(field.options || []).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() =>
                        setAnswer(field.id, "value", option)
                      }
                      className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                        value === option
                          ? option === "PASS"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                            : option === "FAIL"
                              ? "border-red-300 bg-red-50 text-red-700"
                              : option === "N/A"
                                ? "border-slate-300 bg-slate-100 text-slate-700"
                                : "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted/50"
                      }`}
                    >
                      {value === option && (
                        <Check className="mr-1 inline size-4" />
                      )}

                      {option}
                    </button>
                  ))}
                </div>
              )}

              {/* Multiple choice */}
              {field.type === "multiple-choice" && (
                <div className="mt-4 grid gap-2">
                  {(field.options || []).map((option) => {
                    const selected = Array.isArray(value)
                      ? value.includes(option)
                      : false;

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          const current = Array.isArray(value)
                            ? value
                            : [];

                          const next = selected
                            ? current.filter((item) => item !== option)
                            : [...current, option];

                          setAnswer(field.id, "value", next);
                        }}
                        className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition ${
                          selected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/40 hover:bg-muted/50"
                        }`}
                      >
                        {selected && (
                          <Check className="mr-2 inline size-4" />
                        )}

                        {option}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Remarks for normal fields */}
              <label className="mt-5 block text-sm font-medium">
                Remarks
                <Textarea
                  className="mt-2 min-h-24 resize-y"
                  placeholder="Add your observation or remarks..."
                  value={answer.remarks || ""}
                  onChange={(e) =>
                    setAnswer(field.id, "remarks", e.target.value)
                  }
                />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
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
                Complete the audit fields and add supporting camera evidence.
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
                <Input
                  className="mt-2"
                  value={audit.customer || ""}
                  readOnly
                />
              </label>

              <label className="text-sm font-medium">
                Location
                <Input
                  className="mt-2"
                  value={audit.location || ""}
                  readOnly
                />
              </label>

              <label className="text-sm font-medium">
                Audit Date
                <Input
                  className="mt-2"
                  value={audit.date || ""}
                  readOnly
                />
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
            <section
              key={section.id || `${section.name}-${sectionIndex}`}
            >
              <div className="mb-3 flex items-center justify-between rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Check className="size-5" />
                  </span>

                  <div>
                    <h2 className="font-semibold">
                      {section.name || section.title}
                    </h2>

                    <p className="text-xs text-muted-foreground">
                      Complete the fields in this section
                    </p>
                  </div>
                </div>

                <Badge variant="secondary">
                  {section.fields.length}{" "}
                  {section.fields.length === 1 ? "field" : "fields"}
                </Badge>
              </div>

              <div className="flex flex-col gap-4">
                {section.fields.map((field, fieldIndex) =>
                  renderField(field, fieldIndex, sectionIndex),
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Progress */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">
                Audit Progress
              </CardTitle>

              <p className="text-sm text-muted-foreground">
                {answered} of {answerFields.length} fields answered
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
                  <p className="text-lg font-bold text-emerald-700">
                    {pass}
                  </p>

                  <p className="text-[10px] font-semibold uppercase text-emerald-700">
                    Pass
                  </p>
                </div>

                <div className="rounded-lg bg-red-50 p-2 text-center">
                  <p className="text-lg font-bold text-red-700">
                    {fail}
                  </p>

                  <p className="text-[10px] font-semibold uppercase text-red-700">
                    Fail
                  </p>
                </div>

                <div className="rounded-lg bg-slate-100 p-2 text-center">
                  <p className="text-lg font-bold text-slate-700">
                    {na}
                  </p>

                  <p className="text-[10px] font-semibold uppercase text-slate-700">
                    N/A
                  </p>
                </div>
              </div>

              {/* Desktop buttons */}
              <div className="mt-5 hidden flex-col gap-2 border-t pt-4 lg:flex">
                <Button
                  variant="outline"
                  onClick={saveDraft}
                  disabled={saving}
                >
                  <Save data-icon="inline-start" />
                  {saving ? "Saving..." : "Save Draft"}
                </Button>

                <Button
                  variant="outline"
                  onClick={deleteDraft}
                  disabled={saving}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 data-icon="inline-start" />
                  Delete Draft
                </Button>

                <Button
                  onClick={submitAudit}
                  disabled={saving}
                >
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

          <Button
            className="flex-1"
            onClick={submitAudit}
            disabled={saving}
          >
            <Send data-icon="inline-start" />
            {saving ? "Processing..." : "Submit"}
          </Button>
        </div>
      </div>

      {/* Camera modal */}
      {cameraMode && cameraFieldId && (
        <CameraCapture
          mode={cameraMode}
          reportId={audit.id}
          onUse={(item) => {
            console.log("Uploaded evidence:", item);

            setAnswers((current) => ({
              ...current,
              [cameraFieldId]: {
                ...current[cameraFieldId],
                evidence: [
                  ...(current[cameraFieldId]?.evidence || []),
                  item,
                ],
              },
            }));

            setCameraMode(null);
            setCameraFieldId(null);
          }}
          onCancel={() => {
            setCameraMode(null);
            setCameraFieldId(null);
          }}
        />
      )}
    </main>
  );
}

