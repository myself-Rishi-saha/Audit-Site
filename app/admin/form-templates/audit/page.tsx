
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
// } from "lucide-react";

// import { AppShell } from "@/components/app-shell";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Badge } from "@/components/ui/badge";

// type Question = {
//   id: string;
//   text: string;
//   required: boolean;
// };

// type Section = {
//   id: string;
//   title: string;
//   questions: Question[];
// };

// type AuditTemplate = {
//   id: string;
//   title: string;
//   description?: string;
//   sections: Section[];
// };

// const clone = <T,>(value: T): T =>
//   JSON.parse(JSON.stringify(value));

// export default function AuditTemplatePage() {
//   const router = useRouter();

//   const [template, setTemplate] =
//     useState<AuditTemplate | null>(null);

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [preview, setPreview] = useState(false);

//   const [dialog, setDialog] = useState<{
//     mode: "question" | "section";
//     section: number;
//     question?: number;
//   } | null>(null);

//   const [draft, setDraft] = useState({
//     id: "",
//     text: "",
//     title: "",
//     required: true,
//   });

//   useEffect(() => {
//     loadTemplate();
//   }, []);

//   async function loadTemplate() {
//     try {
//       const response = await fetch(
//         "/api/templates/audit",
//       );

//       if (!response.ok) {
//         throw new Error(
//           "Failed to load audit template",
//         );
//       }

//       const data = await response.json();

//       console.log("AUDIT TEMPLATE:", data);

//       setTemplate({
//         ...data,
//         sections: Array.isArray(data.sections)
//           ? data.sections
//           : [],
//       });
//     } catch (error) {
//       console.error(
//         "Failed to load audit template:",
//         error,
//       );
//     } finally {
//       setLoading(false);
//     }
//   }

//   /* =========================
//      QUESTION EDITOR
//   ========================= */

//   function openQuestion(
//     sectionIndex: number,
//     questionIndex?: number,
//   ) {
//     if (!template) return;

//     if (questionIndex === undefined) {
//       setDraft({
//         id: "",
//         text: "",
//         title: "",
//         required: true,
//       });
//     } else {
//       const question =
//         template.sections[sectionIndex].questions[
//           questionIndex
//         ];

//       setDraft({
//         id: question.id,
//         text: question.text,
//         title: "",
//         required: question.required,
//       });
//     }

//     setDialog({
//       mode: "question",
//       section: sectionIndex,
//       question: questionIndex,
//     });
//   }

//   /* =========================
//      SECTION EDITOR
//   ========================= */

//   function openSection(sectionIndex?: number) {
//     if (!template) return;

//     if (sectionIndex === undefined) {
//       setDraft({
//         id: "",
//         text: "",
//         title: "",
//         required: true,
//       });

//       setDialog({
//         mode: "section",
//         section: -1,
//       });

//       return;
//     }

//     const section =
//       template.sections[sectionIndex];

//     setDraft({
//       id: section.id,
//       text: "",
//       title: section.title,
//       required: true,
//     });

//     setDialog({
//       mode: "section",
//       section: sectionIndex,
//     });
//   }

//   /* =========================
//      SAVE DIALOG
//   ========================= */

//   function saveDialog() {
//     if (!template || !dialog) return;

//     const next = clone(template);

//     /* QUESTION */

//     if (dialog.mode === "question") {
//       const question: Question = {
//         id:
//           draft.id.trim() ||
//           `question-${Date.now()}`,
//         text:
//           draft.text.trim() ||
//           "NEW AUDIT QUESTION",
//         required: draft.required,
//       };

//       if (dialog.question === undefined) {
//         next.sections[
//           dialog.section
//         ].questions.push(question);
//       } else {
//         next.sections[dialog.section].questions[
//           dialog.question
//         ] = question;
//       }
//     }

//     /* SECTION */

//     if (dialog.mode === "section") {
//       if (dialog.section === -1) {
//         next.sections.push({
//           id:
//             draft.id.trim() ||
//             `section-${Date.now()}`,
//           title:
//             draft.title.trim() ||
//             "NEW SECTION",
//           questions: [],
//         });
//       } else {
//         next.sections[dialog.section].title =
//           draft.title.trim() || "UNTITLED SECTION";
//       }
//     }

//     setTemplate(next);
//     setDialog(null);
//   }

//   /* =========================
//      DELETE QUESTION
//   ========================= */

//   function removeQuestion(
//     sectionIndex: number,
//     questionIndex: number,
//   ) {
//     if (
//       !confirm(
//         "Delete this question?\n\nThis question will no longer appear in new audits.",
//       )
//     ) {
//       return;
//     }

//     if (!template) return;

//     const next = clone(template);

//     next.sections[sectionIndex].questions.splice(
//       questionIndex,
//       1,
//     );

//     setTemplate(next);
//   }

//   /* =========================
//      DELETE SECTION
//   ========================= */

//   function removeSection(sectionIndex: number) {
//     if (
//       !confirm(
//         "Delete this section?\n\nAll questions inside this section will also be deleted.",
//       )
//     ) {
//       return;
//     }

//     if (!template) return;

//     const next = clone(template);

//     next.sections.splice(sectionIndex, 1);

//     setTemplate(next);
//   }

//   /* =========================
//      MOVE SECTION
//   ========================= */

//   function moveSection(
//     sectionIndex: number,
//     direction: number,
//   ) {
//     if (!template) return;

//     const target =
//       sectionIndex + direction;

//     if (
//       target < 0 ||
//       target >= template.sections.length
//     ) {
//       return;
//     }

//     const next = clone(template);

//     [
//       next.sections[sectionIndex],
//       next.sections[target],
//     ] = [
//       next.sections[target],
//       next.sections[sectionIndex],
//     ];

//     setTemplate(next);
//   }

//   /* =========================
//      UPDATE BASIC INFORMATION
//   ========================= */

//   function updateTemplate(
//     patch: Partial<AuditTemplate>,
//   ) {
//     setTemplate((current) =>
//       current
//         ? {
//             ...current,
//             ...patch,
//           }
//         : current,
//     );
//   }

//   /* =========================
//      SAVE TEMPLATE
//   ========================= */

//   async function saveTemplate() {
//     if (!template) return;

//     setSaving(true);

//     try {
//       const response = await fetch(
//         "/api/templates/audit",
//         {
//           method: "PUT",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(template),
//         },
//       );

//       if (!response.ok) {
//         throw new Error(
//           "Failed to save audit template",
//         );
//       }

//       alert(
//         "Audit template saved successfully.",
//       );

//       router.push("/admin/form-templates");
//     } catch (error) {
//       console.error(
//         "Failed to save audit template:",
//         error,
//       );

//       alert(
//         "Failed to save audit template.",
//       );
//     } finally {
//       setSaving(false);
//     }
//   }

//   /* =========================
//      LOADING
//   ========================= */

//   if (loading) {
//     return (
//       <AppShell user="A. Sen · Admin">
//         <main className="p-8 text-muted-foreground">
//           Loading audit template…
//         </main>
//       </AppShell>
//     );
//   }

//   /* =========================
//      ERROR
//   ========================= */

//   if (!template) {
//     return (
//       <AppShell user="A. Sen · Admin">
//         <main className="p-8">
//           <Card>
//             <CardContent className="p-6">
//               Unable to load audit template.
//             </CardContent>
//           </Card>
//         </main>
//       </AppShell>
//     );
//   }

//   return (
//     <AppShell user="A. Sen · Admin">
//       <main className="mx-auto max-w-6xl px-5 py-8">
//         {/* =========================
//             HEADER
//         ========================= */}

//         <div className="flex flex-wrap items-start justify-between gap-4">
//           <div>
//             <Button
//               variant="ghost"
//               onClick={() =>
//                 router.push(
//                   "/admin/form-templates",
//                 )
//               }
//             >
//               <ArrowLeft data-icon="inline-start" />
//               Form Templates
//             </Button>

//             <p className="mt-6 text-sm font-medium text-primary">
//               Audit Template
//             </p>

//             <h1 className="mt-1 text-3xl font-bold">
//               {template.title}
//             </h1>

//             <p className="mt-2 text-muted-foreground">
//               Configure audit sections and
//               questions used by employees.
//             </p>
//           </div>

//           <div className="flex gap-2">
//             <Button
//               variant="outline"
//               onClick={() =>
//                 setPreview(!preview)
//               }
//             >
//               {preview
//                 ? "Close Preview"
//                 : "Preview Form"}
//             </Button>

//             <Button
//               onClick={saveTemplate}
//               disabled={saving}
//             >
//               <Save data-icon="inline-start" />

//               {saving
//                 ? "Saving…"
//                 : "Save Template"}
//             </Button>
//           </div>
//         </div>

//         {/* =========================
//             TEMPLATE INFORMATION
//         ========================= */}

//         <Card className="mt-8">
//           <CardHeader>
//             <CardTitle>
//               Template Information
//             </CardTitle>
//           </CardHeader>

//           <CardContent className="grid gap-5">
//             <label className="text-sm font-medium">
//               Template ID

//               <Input
//                 className="mt-2"
//                 value={template.id}
//                 onChange={(e) =>
//                   updateTemplate({
//                     id: e.target.value,
//                   })
//                 }
//               />
//             </label>

//             <label className="text-sm font-medium">
//               Template Title

//               <Input
//                 className="mt-2"
//                 value={template.title}
//                 onChange={(e) =>
//                   updateTemplate({
//                     title: e.target.value,
//                   })
//                 }
//               />
//             </label>

//             <label className="text-sm font-medium">
//               Description

//               <Textarea
//                 className="mt-2"
//                 value={
//                   template.description || ""
//                 }
//                 onChange={(e) =>
//                   updateTemplate({
//                     description:
//                       e.target.value,
//                   })
//                 }
//                 placeholder="Optional description..."
//               />
//             </label>
//           </CardContent>
//         </Card>

//         {/* =========================
//             SECTIONS
//         ========================= */}

//         <div className="mt-8 flex flex-col gap-5">
//           {template.sections.map(
//             (section, sectionIndex) => (
//               <Card
//                 key={
//                   section.id ||
//                   sectionIndex
//                 }
//                 className="overflow-hidden border-teal-100"
//               >
//                 {/* SECTION HEADER */}

//                 <CardHeader className="flex flex-row items-center justify-between bg-teal-50/70">
//                   <div>
//                     <p className="text-xs font-semibold uppercase tracking-wider text-primary">
//                       Section{" "}
//                       {sectionIndex + 1}
//                     </p>

//                     <CardTitle className="mt-1 text-base tracking-wide">
//                       {section.title}
//                     </CardTitle>
//                   </div>

//                   <div className="flex gap-1">
//                     {/* MOVE UP */}

//                     <Button
//                       size="sm"
//                       variant="ghost"
//                       onClick={() =>
//                         moveSection(
//                           sectionIndex,
//                           -1,
//                         )
//                       }
//                       disabled={
//                         sectionIndex === 0
//                       }
//                       aria-label="Move section up"
//                     >
//                       <ArrowUp />
//                     </Button>

//                     {/* MOVE DOWN */}

//                     <Button
//                       size="sm"
//                       variant="ghost"
//                       onClick={() =>
//                         moveSection(
//                           sectionIndex,
//                           1,
//                         )
//                       }
//                       disabled={
//                         sectionIndex ===
//                         template.sections
//                           .length -
//                           1
//                       }
//                       aria-label="Move section down"
//                     >
//                       <ArrowDown />
//                     </Button>

//                     {/* EDIT SECTION */}

//                     <Button
//                       size="sm"
//                       variant="ghost"
//                       onClick={() =>
//                         openSection(
//                           sectionIndex,
//                         )
//                       }
//                       aria-label="Edit section"
//                     >
//                       <Pencil />
//                     </Button>

//                     {/* DELETE SECTION */}

//                     <Button
//                       size="sm"
//                       variant="ghost"
//                       onClick={() =>
//                         removeSection(
//                           sectionIndex,
//                         )
//                       }
//                       aria-label="Delete section"
//                     >
//                       <Trash2 className="text-red-500" />
//                     </Button>
//                   </div>
//                 </CardHeader>

//                 {/* QUESTIONS */}

//                 <CardContent className="flex flex-col gap-3 p-5">
//                   {section.questions
//                     ?.length ? (
//                     section.questions.map(
//                       (
//                         question,
//                         questionIndex,
//                       ) => (
//                         <div
//                           key={
//                             question.id ||
//                             questionIndex
//                           }
//                           className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background p-4"
//                         >
//                           <div className="min-w-0 flex-1">
//                             <p className="font-medium">
//                               {question.text}
//                             </p>

//                             <div className="mt-2 flex flex-wrap gap-2">
//                               <Badge variant="secondary">
//                                 Question
//                               </Badge>

//                               <Badge
//                                 variant={
//                                   question.required
//                                     ? "default"
//                                     : "outline"
//                                 }
//                               >
//                                 {question.required
//                                   ? "Required"
//                                   : "Optional"}
//                               </Badge>

//                               <Badge variant="outline">
//                                 ID:{" "}
//                                 {question.id}
//                               </Badge>
//                             </div>
//                           </div>

//                           <div className="flex gap-2">
//                             <Button
//                               size="sm"
//                               variant="outline"
//                               onClick={() =>
//                                 openQuestion(
//                                   sectionIndex,
//                                   questionIndex,
//                                 )
//                               }
//                             >
//                               <Pencil data-icon="inline-start" />
//                               Edit
//                             </Button>

//                             <Button
//                               size="sm"
//                               variant="ghost"
//                               onClick={() =>
//                                 removeQuestion(
//                                   sectionIndex,
//                                   questionIndex,
//                                 )
//                               }
//                             >
//                               <Trash2
//                                 data-icon="inline-start"
//                                 className="text-red-500"
//                               />
//                               Delete
//                             </Button>
//                           </div>
//                         </div>
//                       ),
//                     )
//                   ) : (
//                     <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
//                       No questions in this
//                       section yet.
//                     </div>
//                   )}

//                   {/* ADD QUESTION */}

//                   <Button
//                     variant="outline"
//                     className="self-start"
//                     onClick={() =>
//                       openQuestion(
//                         sectionIndex,
//                       )
//                     }
//                   >
//                     <Plus data-icon="inline-start" />
//                     Add Question
//                   </Button>
//                 </CardContent>
//               </Card>
//             ),
//           )}

//           {/* ADD SECTION */}

//           <Button
//             variant="outline"
//             className="self-start"
//             onClick={() =>
//               openSection()
//             }
//           >
//             <Plus data-icon="inline-start" />
//             Add Section
//           </Button>

//           {/* SAVE */}

//           <div className="flex justify-end gap-2 border-t pt-5">
//             <Button
//               variant="outline"
//               onClick={() =>
//                 router.push(
//                   "/admin/form-templates",
//                 )
//               }
//             >
//               Cancel
//             </Button>

//             <Button
//               onClick={saveTemplate}
//               disabled={saving}
//             >
//               <Check data-icon="inline-start" />

//               {saving
//                 ? "Saving…"
//                 : "Save Template"}
//             </Button>
//           </div>
//         </div>

//         {/* =========================
//             DIALOG
//         ========================= */}

//         {dialog && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
//             <Card className="w-full max-w-lg shadow-xl">
//               <CardHeader>
//                 <CardTitle>
//                   {dialog.mode ===
//                   "question"
//                     ? dialog.question ===
//                       undefined
//                       ? "Add Audit Question"
//                       : "Edit Audit Question"
//                     : dialog.section === -1
//                       ? "Add Section"
//                       : "Edit Section"}
//                 </CardTitle>
//               </CardHeader>

//               <CardContent className="flex flex-col gap-4">
//                 {/* SECTION DIALOG */}

//                 {dialog.mode ===
//                   "section" && (
//                   <>
//                     <label className="text-sm font-medium">
//                       Section Name

//                       <Input
//                         className="mt-2"
//                         value={
//                           draft.title
//                         }
//                         onChange={(e) =>
//                           setDraft({
//                             ...draft,
//                             title:
//                               e.target
//                                 .value,
//                           })
//                         }
//                         placeholder="e.g. GENERAL"
//                         autoFocus
//                       />
//                     </label>

//                     {dialog.section ===
//                       -1 && (
//                       <label className="text-sm font-medium">
//                         Section ID

//                         <Input
//                           className="mt-2"
//                           value={
//                             draft.id
//                           }
//                           onChange={(e) =>
//                             setDraft({
//                               ...draft,
//                               id: e.target
//                                 .value,
//                             })
//                           }
//                           placeholder="section-id"
//                         />
//                       </label>
//                     )}
//                   </>
//                 )}

//                 {/* QUESTION DIALOG */}

//                 {dialog.mode ===
//                   "question" && (
//                   <>
//                     <label className="text-sm font-medium">
//                       Question

//                       <Input
//                         className="mt-2"
//                         value={
//                           draft.text
//                         }
//                         onChange={(e) =>
//                           setDraft({
//                             ...draft,
//                             text: e.target
//                               .value,
//                           })
//                         }
//                         placeholder="Enter audit question..."
//                         autoFocus
//                       />
//                     </label>

//                     <label className="text-sm font-medium">
//                       Question ID

//                       <Input
//                         className="mt-2"
//                         value={
//                           draft.id
//                         }
//                         onChange={(e) =>
//                           setDraft({
//                             ...draft,
//                             id: e.target
//                               .value,
//                           })
//                         }
//                         placeholder="question-id"
//                       />
//                     </label>

//                     <label className="flex items-center gap-2 text-sm">
//                       <input
//                         type="checkbox"
//                         checked={
//                           draft.required
//                         }
//                         onChange={(e) =>
//                           setDraft({
//                             ...draft,
//                             required:
//                               e.target
//                                 .checked,
//                           })
//                         }
//                       />

//                       Required
//                     </label>
//                   </>
//                 )}

//                 {/* DIALOG BUTTONS */}

//                 <div className="flex justify-end gap-2 pt-2">
//                   <Button
//                     variant="outline"
//                     onClick={() =>
//                       setDialog(null)
//                     }
//                   >
//                     Cancel
//                   </Button>

//                   <Button
//                     onClick={saveDialog}
//                   >
//                     <Save data-icon="inline-start" />

//                     {dialog.mode ===
//                       "question" &&
//                     dialog.question !==
//                       undefined
//                       ? "Save Changes"
//                       : "Save"}
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         )}

//         {/* =========================
//             PREVIEW
//         ========================= */}

//         {preview && (
//           <Card className="mt-8 border-teal-200">
//             <CardHeader>
//               <CardTitle>
//                 Employee Preview
//               </CardTitle>
//             </CardHeader>

//             <CardContent className="flex flex-col gap-6">
//               {template.sections.map(
//                 (section) => (
//                   <div
//                     key={section.id}
//                   >
//                     <h3 className="font-semibold text-primary">
//                       {section.title}
//                     </h3>

//                     <div className="mt-3 grid gap-3 sm:grid-cols-2">
//                       {section.questions.map(
//                         (question) => (
//                           <div
//                             key={
//                               question.id
//                             }
//                             className="rounded-lg border p-4"
//                           >
//                             <p className="font-medium">
//                               {
//                                 question.text
//                               }
//                             </p>

//                             <p className="mt-1 text-sm text-muted-foreground">
//                               {question.required
//                                 ? "Required"
//                                 : "Optional"}
//                             </p>
//                           </div>
//                         ),
//                       )}
//                     </div>
//                   </div>
//                 ),
//               )}
//             </CardContent>
//           </Card>
//         )}
//       </main>
//     </AppShell>
//   );
// }

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
// } from "lucide-react";

// import { AppShell } from "@/components/app-shell";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";

// type Question = {
//   id: string;
//   text: string;
//   required: boolean;
// };

// type Section = {
//   id?: string;
//   title: string;
//   questions: Question[];
// };

// type AuditTemplate = {
//   id: string;
//   title: string;
//   sections: Section[];
// };

// const clone = <T,>(value: T): T =>
//   JSON.parse(JSON.stringify(value));

// export default function AuditTemplatePage() {
//   const router = useRouter();

//   const [template, setTemplate] = useState<AuditTemplate | null>(null);

//   const [dialog, setDialog] = useState<{
//     mode: "question" | "section";
//     section: number;
//     question?: number;
//   } | null>(null);

//   const [draft, setDraft] = useState({
//     text: "",
//     required: true,
//     title: "",
//   });

//   const [saving, setSaving] = useState(false);

//   useEffect(() => {
//     fetch("/api/templates/audit")
//       .then((r) => r.json())
//       .then((data) => {
//         console.log("AUDIT TEMPLATE:", data);

//         setTemplate({
//           ...data,
//           sections: Array.isArray(data.sections)
//             ? data.sections
//             : [],
//         });
//       })
//       .catch((error) => {
//         console.error("Failed to load audit template:", error);
//       });
//   }, []);

//   if (!template) {
//     return (
//       <AppShell user="A. Sen · Admin">
//         <main className="p-8 text-muted-foreground">
//           Loading template…
//         </main>
//       </AppShell>
//     );
//   }

//   // -----------------------------
//   // QUESTION
//   // -----------------------------

//   const openQuestion = (
//     sectionIndex: number,
//     questionIndex?: number
//   ) => {
//     if (questionIndex === undefined) {
//       setDraft({
//         text: "",
//         required: true,
//         title: "",
//       });
//     } else {
//       const question =
//         template.sections[sectionIndex].questions[questionIndex];

//       setDraft({
//         text: question.text,
//         required: question.required,
//         title: "",
//       });
//     }

//     setDialog({
//       mode: "question",
//       section: sectionIndex,
//       question: questionIndex,
//     });
//   };

//   // -----------------------------
//   // SECTION
//   // -----------------------------

//   const openSection = (sectionIndex?: number) => {
//     if (sectionIndex === undefined) {
//       setDraft({
//         text: "",
//         required: true,
//         title: "",
//       });

//       setDialog({
//         mode: "section",
//         section: -1,
//       });

//       return;
//     }

//     setDraft({
//       text: "",
//       required: true,
//       title: template.sections[sectionIndex].title,
//     });

//     setDialog({
//       mode: "section",
//       section: sectionIndex,
//     });
//   };

//   // -----------------------------
//   // SAVE DIALOG
//   // -----------------------------

//   const saveDialog = () => {
//     if (!dialog) return;

//     const next = clone(template);

//     // QUESTION
//     if (dialog.mode === "question") {
//       const text = draft.text.trim();

//       if (!text) {
//         alert("Please enter a question.");
//         return;
//       }

//       const question: Question = {
//         id:
//           dialog.question === undefined
//             ? `${text
//                 .toLowerCase()
//                 .replace(/[^a-z0-9]+/g, "-")
//                 .replace(/^-|-$/g, "")}-${Date.now()}`
//             : next.sections[dialog.section].questions[
//                 dialog.question
//               ].id,

//         text,

//         required: draft.required,
//       };

//       if (dialog.question === undefined) {
//         next.sections[dialog.section].questions.push(question);
//       } else {
//         next.sections[dialog.section].questions[
//           dialog.question
//         ] = question;
//       }
//     }

//     // SECTION
//     if (dialog.mode === "section") {
//       const title = draft.title.trim();

//       if (!title) {
//         alert("Please enter a section name.");
//         return;
//       }

//       // ADD SECTION
//       if (dialog.section === -1) {
//         next.sections.push({
//           id: `${title
//             .toLowerCase()
//             .replace(/[^a-z0-9]+/g, "-")
//             .replace(/^-|-$/g, "")}-${Date.now()}`,

//           title: title.toUpperCase(),

//           questions: [],
//         });
//       }

//       // EDIT SECTION
//       else {
//         next.sections[dialog.section].title =
//           title.toUpperCase();
//       }
//     }

//     setTemplate(next);
//     setDialog(null);
//   };

//   // -----------------------------
//   // DELETE QUESTION
//   // -----------------------------

//   const removeQuestion = (
//     sectionIndex: number,
//     questionIndex: number
//   ) => {
//     const question =
//       template.sections[sectionIndex].questions[questionIndex];

//     if (
//       !confirm(
//         `Delete "${question.text}"?\n\nThis question will no longer appear in new audits.`
//       )
//     ) {
//       return;
//     }

//     const next = clone(template);

//     next.sections[sectionIndex].questions.splice(
//       questionIndex,
//       1
//     );

//     setTemplate(next);
//   };

//   // -----------------------------
//   // DELETE SECTION
//   // -----------------------------

//   const removeSection = (sectionIndex: number) => {
//     const section = template.sections[sectionIndex];

//     if (
//       !confirm(
//         `Delete "${section.title}"?\n\nAll questions inside this section will also be deleted.`
//       )
//     ) {
//       return;
//     }

//     const next = clone(template);

//     next.sections.splice(sectionIndex, 1);

//     setTemplate(next);
//   };

//   // -----------------------------
//   // MOVE SECTION
//   // -----------------------------

//   const moveSection = (
//     sectionIndex: number,
//     direction: number
//   ) => {
//     const targetIndex = sectionIndex + direction;

//     if (
//       targetIndex < 0 ||
//       targetIndex >= template.sections.length
//     ) {
//       return;
//     }

//     const next = clone(template);

//     [
//       next.sections[sectionIndex],
//       next.sections[targetIndex],
//     ] = [
//       next.sections[targetIndex],
//       next.sections[sectionIndex],
//     ];

//     setTemplate(next);
//   };

//   // -----------------------------
//   // SAVE TEMPLATE
//   // -----------------------------

//   const save = async () => {
//     try {
//       setSaving(true);

//       const response = await fetch("/api/templates/audit", {
//         method: "PUT",
//         headers: {
//           "content-type": "application/json",
//         },
//         body: JSON.stringify(template),
//       });

//       if (!response.ok) {
//         throw new Error("Failed to save audit template");
//       }

//       router.push("/admin/form-templates");
//     } catch (error) {
//       console.error(error);
//       alert("Failed to save audit template.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <AppShell user="A. Sen · Admin">
//       <main className="mx-auto max-w-6xl px-5 py-8">

//         {/* HEADER */}
//         <div className="flex flex-wrap items-start justify-between gap-4">

//           <div>
//             <Button
//               variant="ghost"
//               onClick={() =>
//                 router.push("/admin/form-templates")
//               }
//             >
//               <ArrowLeft data-icon="inline-start" />
//               Form Templates
//             </Button>

//             <p className="mt-6 text-sm font-medium text-primary">
//               Audit Template
//             </p>

//             <h1 className="mt-1 text-3xl font-bold">
//               {template.title}
//             </h1>

//             <p className="mt-2 text-muted-foreground">
//               Configure audit sections and checklist questions.
//             </p>
//           </div>

//           <Button onClick={save} disabled={saving}>
//             <Save data-icon="inline-start" />

//             {saving ? "Saving…" : "Save Template"}
//           </Button>
//         </div>

//         {/* SECTIONS */}
//         <div className="mt-8 flex flex-col gap-5">

//           {template.sections.map(
//             (section, sectionIndex) => (
//               <Card
//                 key={
//                   section.id ||
//                   `section-${sectionIndex}`
//                 }
//                 className="overflow-hidden border-teal-100"
//               >

//                 {/* SECTION HEADER */}
//                 <CardHeader className="flex flex-row items-center justify-between bg-teal-50/70">

//                   <div className="flex items-center gap-3">
//                     <CardTitle className="text-base tracking-wide">
//                       {section.title}
//                     </CardTitle>

//                     <Badge variant="secondary">
//                       {section.questions.length}{" "}
//                       {section.questions.length === 1
//                         ? "Question"
//                         : "Questions"}
//                     </Badge>
//                   </div>

//                   <div className="flex gap-1">

//                     {/* MOVE UP */}
//                     <Button
//                       size="sm"
//                       variant="ghost"
//                       onClick={() =>
//                         moveSection(
//                           sectionIndex,
//                           -1
//                         )
//                       }
//                       disabled={sectionIndex === 0}
//                       aria-label="Move section up"
//                     >
//                       <ArrowUp />
//                     </Button>

//                     {/* MOVE DOWN */}
//                     <Button
//                       size="sm"
//                       variant="ghost"
//                       onClick={() =>
//                         moveSection(
//                           sectionIndex,
//                           1
//                         )
//                       }
//                       disabled={
//                         sectionIndex ===
//                         template.sections.length - 1
//                       }
//                       aria-label="Move section down"
//                     >
//                       <ArrowDown />
//                     </Button>

//                     {/* EDIT SECTION */}
//                     <Button
//                       size="sm"
//                       variant="ghost"
//                       onClick={() =>
//                         openSection(sectionIndex)
//                       }
//                       aria-label="Edit section"
//                     >
//                       <Pencil />
//                     </Button>

//                     {/* DELETE SECTION */}
//                     <Button
//                       size="sm"
//                       variant="ghost"
//                       onClick={() =>
//                         removeSection(sectionIndex)
//                       }
//                       aria-label="Delete section"
//                     >
//                       <Trash2 />
//                     </Button>
//                   </div>
//                 </CardHeader>

//                 {/* QUESTIONS */}
//                 <CardContent className="flex flex-col gap-3 p-5">

//                   {section.questions.length === 0 && (
//                     <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
//                       No questions in this section yet.
//                     </div>
//                   )}

//                   {section.questions.map(
//                     (question, questionIndex) => (
//                       <div
//                         key={question.id}
//                         className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background p-4"
//                       >

//                         <div className="min-w-0 flex-1">

//                           <div className="flex items-start gap-3">
//                             <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700">
//                               {questionIndex + 1}
//                             </span>

//                             <div>
//                               <p className="font-medium">
//                                 {question.text}
//                               </p>

//                               <div className="mt-2 flex gap-2">
//                                 <Badge
//                                   variant={
//                                     question.required
//                                       ? "default"
//                                       : "outline"
//                                   }
//                                 >
//                                   {question.required
//                                     ? "Required"
//                                     : "Optional"}
//                                 </Badge>
//                               </div>
//                             </div>
//                           </div>

//                         </div>

//                         <div className="flex gap-2">

//                           {/* EDIT QUESTION */}
//                           <Button
//                             size="sm"
//                             variant="outline"
//                             onClick={() =>
//                               openQuestion(
//                                 sectionIndex,
//                                 questionIndex
//                               )
//                             }
//                           >
//                             <Pencil data-icon="inline-start" />
//                             Edit
//                           </Button>

//                           {/* DELETE QUESTION */}
//                           <Button
//                             size="sm"
//                             variant="ghost"
//                             onClick={() =>
//                               removeQuestion(
//                                 sectionIndex,
//                                 questionIndex
//                               )
//                             }
//                           >
//                             <Trash2 data-icon="inline-start" />
//                             Delete
//                           </Button>

//                         </div>
//                       </div>
//                     )
//                   )}

//                   {/* ADD QUESTION */}
//                   <Button
//                     variant="outline"
//                     className="self-start"
//                     onClick={() =>
//                       openQuestion(sectionIndex)
//                     }
//                   >
//                     <Plus data-icon="inline-start" />
//                     Add Question
//                   </Button>

//                 </CardContent>
//               </Card>
//             )
//           )}

//           {/* ADD SECTION */}
//           <Button
//             variant="outline"
//             className="self-start"
//             onClick={() => openSection()}
//           >
//             <Plus data-icon="inline-start" />
//             Add Section
//           </Button>

//           {/* BOTTOM ACTIONS */}
//           <div className="flex justify-end gap-2 border-t pt-5">

//             <Button
//               variant="outline"
//               onClick={() =>
//                 router.push("/admin/form-templates")
//               }
//             >
//               Cancel
//             </Button>

//             <Button
//               onClick={save}
//               disabled={saving}
//             >
//               <Check data-icon="inline-start" />

//               {saving
//                 ? "Saving…"
//                 : "Save Template"}
//             </Button>

//           </div>
//         </div>

//         {/* DIALOG */}
//         {dialog && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">

//             <Card className="w-full max-w-lg shadow-xl">

//               <CardHeader>
//                 <CardTitle>
//                   {dialog.mode === "question"
//                     ? dialog.question === undefined
//                       ? "Add Audit Question"
//                       : "Edit Audit Question"
//                     : dialog.section === -1
//                       ? "Add Section"
//                       : "Edit Section"}
//                 </CardTitle>
//               </CardHeader>

//               <CardContent className="flex flex-col gap-5">

//                 {/* QUESTION FORM */}
//                 {dialog.mode === "question" && (
//                   <>
//                     <label className="text-sm font-medium">
//                       Question

//                       <Input
//                         className="mt-2"
//                         placeholder="Enter audit question"
//                         value={draft.text}
//                         onChange={(e) =>
//                           setDraft({
//                             ...draft,
//                             text: e.target.value,
//                           })
//                         }
//                         autoFocus
//                       />
//                     </label>

//                     <label className="flex items-center gap-2 text-sm font-medium">
//                       <input
//                         type="checkbox"
//                         checked={draft.required}
//                         onChange={(e) =>
//                           setDraft({
//                             ...draft,
//                             required:
//                               e.target.checked,
//                           })
//                         }
//                       />

//                       Required question
//                     </label>
//                   </>
//                 )}

//                 {/* SECTION FORM */}
//                 {dialog.mode === "section" && (
//                   <label className="text-sm font-medium">
//                     Section name

//                     <Input
//                       className="mt-2"
//                       placeholder="Example: CHECKLIST FINDINGS"
//                       value={draft.title}
//                       onChange={(e) =>
//                         setDraft({
//                           ...draft,
//                           title: e.target.value,
//                         })
//                       }
//                       autoFocus
//                     />
//                   </label>
//                 )}

//                 {/* ACTIONS */}
//                 <div className="flex justify-end gap-2">

//                   <Button
//                     variant="outline"
//                     onClick={() =>
//                       setDialog(null)
//                     }
//                   >
//                     Cancel
//                   </Button>

//                   <Button onClick={saveDialog}>
//                     <Check data-icon="inline-start" />

//                     {dialog.mode === "question" &&
//                     dialog.question !== undefined
//                       ? "Save Changes"
//                       : "Save"}
//                   </Button>

//                 </div>

//               </CardContent>
//             </Card>
//           </div>
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

import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";



// type FieldType =
//   | "text"
//   | "textarea"
//   | "date"
//   | "time"
//   | "single-choice"
//   | "multiple-choice"
//   | "camera-photo"
//   | "camera-video"
//   | "number";
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
  title: string;
  sections: Section[];
};

const clone = <T,>(value: T): T =>
  JSON.parse(JSON.stringify(value));

const FIELD_TYPES: {
  value: FieldType;
  label: string;
}[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Long Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
  { value: "single-choice", label: "Single Choice" },
  { value: "multiple-choice", label: "Multiple Choice" },
  { value: "camera-photo", label: "Camera Photo" },
  { value: "camera-video", label: "Camera Video" },
  { value: "signature", label: "Signature" },
];

function createFieldId(label: string) {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    Date.now()
  );
}

export default function AuditTemplatePage() {
  const router = useRouter();

  const [template, setTemplate] =
    useState<AuditTemplate | null>(null);

  const [dialog, setDialog] = useState<{
    mode: "field" | "section";
    section: number;
    field?: number;
  } | null>(null);

  const [draft, setDraft] = useState({
    label: "",
    type: "single-choice" as FieldType,
    required: true,
    options: "PASS\nFAIL\nN/A",
    title: "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/templates/audit")
      .then((r) => {
        if (!r.ok) {
          throw new Error("Failed to load audit template");
        }

        return r.json();
      })
      .then((data) => {
        console.log("AUDIT TEMPLATE:", data);

        setTemplate({
          ...data,
          sections: Array.isArray(data.sections)
            ? data.sections.map((section: any) => ({
                ...section,

                // Support the new structure.
                // Also prevents errors if an older template
                // temporarily contains questions.
                fields: Array.isArray(section.fields)
                  ? section.fields
                  : [],
              }))
            : [],
        });
      })
      .catch((error) => {
        console.error(
          "Failed to load audit template:",
          error,
        );
      });
  }, []);

  if (!template) {
    return (
      <AppShell user="A. Sen · Admin">
        <main className="p-8 text-muted-foreground">
          Loading template…
        </main>
      </AppShell>
    );
  }

  // -----------------------------
  // FIELD
  // -----------------------------

  const openField = (
    sectionIndex: number,
    fieldIndex?: number,
  ) => {
    if (fieldIndex === undefined) {
      setDraft({
        label: "",
        type: "single-choice",
        required: true,
        options: "PASS\nFAIL\nN/A",
        title: "",
      });
    } else {
      const field =
        template.sections[sectionIndex].fields[fieldIndex];

      setDraft({
        label: field.label,
        type: field.type,
        required: field.required ?? false,
        options: (field.options || []).join("\n"),
        title: "",
      });
    }

    setDialog({
      mode: "field",
      section: sectionIndex,
      field: fieldIndex,
    });
  };

  // -----------------------------
  // SECTION
  // -----------------------------

  const openSection = (sectionIndex?: number) => {
    if (sectionIndex === undefined) {
      setDraft({
        label: "",
        type: "single-choice",
        required: true,
        options: "PASS\nFAIL\nN/A",
        title: "",
      });

      setDialog({
        mode: "section",
        section: -1,
      });

      return;
    }

    const section = template.sections[sectionIndex];

    setDraft({
      label: "",
      type: "single-choice",
      required: true,
      options: "PASS\nFAIL\nN/A",
      title: section.name || section.title || "",
    });

    setDialog({
      mode: "section",
      section: sectionIndex,
    });
  };

  // -----------------------------
  // SAVE DIALOG
  // -----------------------------

  const saveDialog = () => {
    if (!dialog) return;

    const next = clone(template);

    // -----------------------------
    // FIELD
    // -----------------------------

    if (dialog.mode === "field") {
      const label = draft.label.trim();

      if (!label) {
        alert("Please enter a field label.");
        return;
      }

      const needsOptions =
        draft.type === "single-choice" ||
        draft.type === "multiple-choice";

      const options = draft.options
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      if (needsOptions && options.length === 0) {
        alert("Please enter at least one option.");
        return;
      }

      const existingField =
        dialog.field === undefined
          ? undefined
          : next.sections[dialog.section].fields[
              dialog.field
            ];

      const field: Field = {
        id:
          existingField?.id ||
          createFieldId(label),

        label,

        type: draft.type,

        required: draft.required,

        ...(needsOptions ? { options } : {}),
      };

      if (dialog.field === undefined) {
        next.sections[dialog.section].fields.push(field);
      } else {
        next.sections[dialog.section].fields[
          dialog.field
        ] = field;
      }
    }

    // -----------------------------
    // SECTION
    // -----------------------------

    if (dialog.mode === "section") {
      const title = draft.title.trim();

      if (!title) {
        alert("Please enter a section name.");
        return;
      }

      // ADD SECTION
      if (dialog.section === -1) {
        next.sections.push({
          id:
            title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "") +
            "-" +
            Date.now(),

          name: title.toUpperCase(),

          fields: [],
        });
      }

      // EDIT SECTION
      else {
        next.sections[dialog.section].name =
          title.toUpperCase();

        // Keep title synchronized if it exists
        if ("title" in next.sections[dialog.section]) {
          next.sections[dialog.section].title =
            title.toUpperCase();
        }
      }
    }

    setTemplate(next);
    setDialog(null);
  };

  // -----------------------------
  // DELETE FIELD
  // -----------------------------

  const removeField = (
    sectionIndex: number,
    fieldIndex: number,
  ) => {
    const field =
      template.sections[sectionIndex].fields[fieldIndex];

    if (
      !confirm(
        `Delete "${field.label}"?\n\nThis field will no longer appear in new audits.`,
      )
    ) {
      return;
    }

    const next = clone(template);

    next.sections[sectionIndex].fields.splice(
      fieldIndex,
      1,
    );

    setTemplate(next);
  };

  // -----------------------------
  // DELETE SECTION
  // -----------------------------

  const removeSection = (sectionIndex: number) => {
    const section = template.sections[sectionIndex];

    if (
      !confirm(
        `Delete "${section.name || section.title}"?\n\nAll fields inside this section will also be deleted.`,
      )
    ) {
      return;
    }

    const next = clone(template);

    next.sections.splice(sectionIndex, 1);

    setTemplate(next);
  };

  // -----------------------------
  // MOVE SECTION
  // -----------------------------

  const moveSection = (
    sectionIndex: number,
    direction: number,
  ) => {
    const targetIndex = sectionIndex + direction;

    if (
      targetIndex < 0 ||
      targetIndex >= template.sections.length
    ) {
      return;
    }

    const next = clone(template);

    [
      next.sections[sectionIndex],
      next.sections[targetIndex],
    ] = [
      next.sections[targetIndex],
      next.sections[sectionIndex],
    ];

    setTemplate(next);
  };

  // -----------------------------
  // SAVE TEMPLATE
  // -----------------------------

  const save = async () => {
    try {
      setSaving(true);

      const response = await fetch("/api/templates/audit", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(template),
      });

      if (!response.ok) {
        throw new Error("Failed to save audit template");
      }

      router.push("/admin/form-templates");
    } catch (error) {
      console.error(error);
      alert("Failed to save audit template.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell user="A. Sen · Admin">
      <main className="mx-auto max-w-6xl px-5 py-8">
        {/* HEADER */}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Button
              variant="ghost"
              onClick={() =>
                router.push("/admin/form-templates")
              }
            >
              <ArrowLeft data-icon="inline-start" />
              Form Templates
            </Button>

            <p className="mt-6 text-sm font-medium text-primary">
              Audit Template
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              {template.title}
            </h1>

            <p className="mt-2 text-muted-foreground">
              Configure audit sections and checklist fields.
            </p>
          </div>

          <Button onClick={save} disabled={saving}>
            <Save data-icon="inline-start" />

            {saving ? "Saving…" : "Save Template"}
          </Button>
        </div>

        {/* SECTIONS */}

        <div className="mt-8 flex flex-col gap-5">
          {template.sections.map(
            (section, sectionIndex) => {
              const sectionName =
                section.name || section.title || "SECTION";

              return (
                <Card
                  key={
                    section.id ||
                    `section-${sectionIndex}`
                  }
                  className="overflow-hidden border-teal-100"
                >
                  {/* SECTION HEADER */}

                  <CardHeader className="flex flex-row items-center justify-between bg-teal-50/70">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base tracking-wide">
                        {sectionName}
                      </CardTitle>

                      <Badge variant="secondary">
                        {section.fields.length}{" "}
                        {section.fields.length === 1
                          ? "Field"
                          : "Fields"}
                      </Badge>
                    </div>

                    <div className="flex gap-1">
                      {/* MOVE UP */}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          moveSection(
                            sectionIndex,
                            -1,
                          )
                        }
                        disabled={sectionIndex === 0}
                        aria-label="Move section up"
                      >
                        <ArrowUp />
                      </Button>

                      {/* MOVE DOWN */}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          moveSection(
                            sectionIndex,
                            1,
                          )
                        }
                        disabled={
                          sectionIndex ===
                          template.sections.length - 1
                        }
                        aria-label="Move section down"
                      >
                        <ArrowDown />
                      </Button>

                      {/* EDIT SECTION */}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          openSection(sectionIndex)
                        }
                        aria-label="Edit section"
                      >
                        <Pencil />
                      </Button>

                      {/* DELETE SECTION */}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          removeSection(sectionIndex)
                        }
                        aria-label="Delete section"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </CardHeader>

                  {/* FIELDS */}

                  <CardContent className="flex flex-col gap-3 p-5">
                    {section.fields.length === 0 && (
                      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        No fields in this section yet.
                      </div>
                    )}

                    {section.fields.map(
                      (field, fieldIndex) => (
                        <div
                          key={field.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background p-4"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-3">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700">
                                {fieldIndex + 1}
                              </span>

                              <div>
                                <p className="font-medium">
                                  {field.label}
                                </p>

                                <div className="mt-2 flex flex-wrap gap-2">
                                  <Badge variant="secondary">
                                    {FIELD_TYPES.find(
                                      (item) =>
                                        item.value ===
                                        field.type,
                                    )?.label ||
                                      field.type}
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

                                  {(field.type ===
                                    "single-choice" ||
                                    field.type ===
                                      "multiple-choice") &&
                                    field.options &&
                                    field.options.length >
                                      0 && (
                                      <Badge variant="outline">
                                        {
                                          field.options
                                            .length
                                        }{" "}
                                        options
                                      </Badge>
                                    )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {/* EDIT FIELD */}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                openField(
                                  sectionIndex,
                                  fieldIndex,
                                )
                              }
                            >
                              <Pencil data-icon="inline-start" />
                              Edit
                            </Button>

                            {/* DELETE FIELD */}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                removeField(
                                  sectionIndex,
                                  fieldIndex,
                                )
                              }
                            >
                              <Trash2 data-icon="inline-start" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ),
                    )}

                    {/* ADD FIELD */}

                    <Button
                      variant="outline"
                      className="self-start"
                      onClick={() =>
                        openField(sectionIndex)
                      }
                    >
                      <Plus data-icon="inline-start" />
                      Add Field
                    </Button>
                  </CardContent>
                </Card>
              );
            },
          )}

          {/* ADD SECTION */}

          <Button
            variant="outline"
            className="self-start"
            onClick={() => openSection()}
          >
            <Plus data-icon="inline-start" />
            Add Section
          </Button>

          {/* BOTTOM ACTIONS */}

          <div className="flex justify-end gap-2 border-t pt-5">
            <Button
              variant="outline"
              onClick={() =>
                router.push("/admin/form-templates")
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
              <CardHeader>
                <CardTitle>
                  {dialog.mode === "field"
                    ? dialog.field === undefined
                      ? "Add Audit Field"
                      : "Edit Audit Field"
                    : dialog.section === -1
                      ? "Add Section"
                      : "Edit Section"}
                </CardTitle>
              </CardHeader>

              <CardContent className="flex flex-col gap-5">
                {/* FIELD FORM */}

                {dialog.mode === "field" && (
                  <>
                    <label className="text-sm font-medium">
                      Field Label

                      <Input
                        className="mt-2"
                        placeholder="Example: FIRE PUMP WORKING STATUS?"
                        value={draft.label}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            label: e.target.value,
                          })
                        }
                        autoFocus
                      />
                    </label>

                    <label className="text-sm font-medium">
                      Field Type

                      <select
                        className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={draft.type}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            type: e.target
                              .value as FieldType,
                          })
                        }
                      >
                        {FIELD_TYPES.map((item) => (
                          <option
                            key={item.value}
                            value={item.value}
                          >
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    {(draft.type ===
                      "single-choice" ||
                      draft.type ===
                        "multiple-choice") && (
                      <label className="text-sm font-medium">
                        Options

                        <Textarea
                          className="mt-2 min-h-28"
                          placeholder={
                            "PASS\nFAIL\nN/A"
                          }
                          value={draft.options}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              options:
                                e.target.value,
                            })
                          }
                        />

                        <span className="mt-1 block text-xs text-muted-foreground">
                          Enter one option per line.
                        </span>
                      </label>
                    )}

                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={draft.required}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            required:
                              e.target.checked,
                          })
                        }
                      />

                      Required field
                    </label>
                  </>
                )}

                {/* SECTION FORM */}

                {dialog.mode === "section" && (
                  <label className="text-sm font-medium">
                    Section name

                    <Input
                      className="mt-2"
                      placeholder="Example: CHECKLIST FINDINGS"
                      value={draft.title}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          title: e.target.value,
                        })
                      }
                      autoFocus
                    />
                  </label>
                )}

                {/* ACTIONS */}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setDialog(null)
                    }
                  >
                    Cancel
                  </Button>

                  <Button onClick={saveDialog}>
                    <Check data-icon="inline-start" />

                    {dialog.mode === "field" &&
                    dialog.field !== undefined
                      ? "Save Changes"
                      : "Save"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </AppShell>
  );
}

