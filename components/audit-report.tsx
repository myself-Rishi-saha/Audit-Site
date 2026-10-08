// import { Check, CircleX, Minus, ShieldCheck } from "lucide-react";
// import { Badge } from "@/components/ui/badge";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// export function AuditReport({
//   audit,
//   admin = false,
// }: {
//   audit: any;
//   admin?: boolean;
// }) {
//   const answers = Object.entries(audit.answers || {}) as [string, any][];
//   const pass = answers.filter(([, answer]) => answer.status === "PASS").length;
//   const fail = answers.filter(([, answer]) => answer.status === "FAIL").length;
//   const na = answers.filter(([, answer]) => answer.status === "N/A").length;
//   return (
//     <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
//       <div className="teal-wash rounded-xl border border-primary/15 p-6 sm:p-8">
//         <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
//           <div>
//             <p className="text-sm font-semibold text-primary">
//               {admin ? "Admin review" : "Audit report"}
//             </p>
//             <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
//               FIRE SAFETY AUDIT REPORT
//             </h1>
//             <p className="mt-2 font-mono text-sm text-muted-foreground">
//               {audit.id}
//             </p>
//           </div>
//           <Badge
//             variant={audit.status === "COMPLETED" ? "default" : "secondary"}
//           >
//             {audit.status}
//           </Badge>
//         </div>
//       </div>
//       <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
//         <Metric icon={ShieldCheck} label="Questions" value={answers.length} />
//         <Metric
//           icon={Check}
//           label="Pass"
//           value={pass}
//           tone="text-emerald-600"
//         />
//         <Metric icon={CircleX} label="Fail" value={fail} tone="text-red-600" />
//         <Metric
//           icon={ShieldCheck}
//           label="Score"
//           value={audit.score != null ? `${audit.score}%` : "—"}
//           tone="text-primary"
//         />
//       </div>
//       <Card className="mt-6 shadow-sm">
//         <CardHeader>
//           <CardTitle>Inspection details</CardTitle>
//         </CardHeader>
//         <CardContent className="grid gap-5 sm:grid-cols-4">
//           <Info label="Customer" value={audit.customer} />
//           <Info label="Location" value={audit.location} />
//           <Info label="Auditor" value={audit.employeeName} />
//           <Info label="Date" value={audit.date} />
//         </CardContent>
//       </Card>
//       <div className="mt-8 flex flex-col gap-8">
//         {["CHECKLIST FINDINGS", "GENERAL"].map((section, sectionIndex) => {
//           const sectionAnswers = answers.slice(
//             sectionIndex === 0 ? 0 : 2,
//             sectionIndex === 0 ? 2 : 4,
//           );
//           return (
//             <section key={section}>
//               <div className="mb-3 flex items-center justify-between">
//                 <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
//                   {section}
//                 </h2>
//                 <span className="text-sm text-muted-foreground">
//                   {sectionAnswers.length} questions
//                 </span>
//               </div>
//               <div className="flex flex-col gap-3">
//                 {sectionAnswers.map(([id, answer], index) => (
//                   <Card
//                     key={id}
//                     className={`shadow-sm ${answer.status === "FAIL" ? "border-l-4 border-l-red-400" : answer.status === "PASS" ? "border-l-4 border-l-emerald-400" : "border-l-4 border-l-slate-300"}`}
//                   >
//                     <CardContent className="p-5">
//                       <div className="flex items-start gap-4">
//                         <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold">
//                           {String(index + 1).padStart(2, "0")}
//                         </span>
//                         <div className="min-w-0 flex-1">
//                           <div className="flex flex-wrap items-center justify-between gap-2">
//                             <h3 className="font-bold">{label(id)}</h3>
//                             <Status status={answer.status} />
//                           </div>
//                           {/* {answer.remarks && (
//                             <p className="mt-3 text-sm leading-6 text-muted-foreground">
//                               {answer.remarks}
//                             </p>
//                           )}
//                           <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
//                             Evidence
//                           </p>
//                           <p className="mt-1 text-sm text-muted-foreground">
//                             No evidence attached
//                           </p> */}
//                           {answer.remarks && (
//                             <p className="mt-3 text-sm leading-6 text-muted-foreground">
//                               {answer.remarks}
//                             </p>
//                           )}

//                           <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
//                             Evidence
//                           </p>

//                           {answer.evidence?.length > 0 ? (
//                             <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
//                               {answer.evidence.map(
//                                 (item: any, evidenceIndex: number) => {
//                                   const url = item.url;

//                                   if (!url) return null;

//                                   if (item.type === "video") {
//                                     return (
//                                       <div
//                                         key={evidenceIndex}
//                                         className="overflow-hidden rounded-lg border bg-muted"
//                                       >
//                                         <video
//                                           src={url}
//                                           controls
//                                           className="h-40 w-full object-cover"
//                                         />
//                                       </div>
//                                     );
//                                   }

//                                   return (
//                                     <a
//                                       key={evidenceIndex}
//                                       href={url}
//                                       target="_blank"
//                                       rel="noopener noreferrer"
//                                       className="block overflow-hidden rounded-lg border bg-muted"
//                                     >
//                                       <img
//                                         src={url}
//                                         alt={`Evidence ${evidenceIndex + 1}`}
//                                         className="h-40 w-full object-cover transition-transform hover:scale-105"
//                                       />
//                                     </a>
//                                   );
//                                 },
//                               )}
//                             </div>
//                           ) : (
//                             <p className="mt-1 text-sm text-muted-foreground">
//                               No evidence attached
//                             </p>
//                           )}
//                         </div>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 ))}
//               </div>
//             </section>
//           );
//         })}
//       </div>
//     </main>
//   );
// }
// function label(id: string) {
//   return (
//     (
//       {
//         "fda-panel": "FDA PANEL WORKING STATUS?",
//         "fire-pump": "FIRE PUMP WORKING STATUS?",
//         extinguishers: "FIRE EXTINGUISHERS AVAILABLE?",
//         "exit-clear": "EMERGENCY EXIT CLEAR?",
//       } as any
//     )[id] || id
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
// function Info({ label, value }: { label: string; value: any }) {
//   return (
//     <div>
//       <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
//         {label}
//       </p>
//       <p className="mt-1 font-semibold">{value || "—"}</p>
//     </div>
//   );
// }
// function Metric({
//   icon: Icon,
//   label,
//   value,
//   tone = "text-foreground",
// }: {
//   icon: any;
//   label: string;
//   value: any;
//   tone?: string;
// }) {
//   return (
//     <Card className="shadow-sm">
//       <CardContent className="p-5">
//         <Icon className={`mb-3 ${tone}`} />
//         <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
//           {label}
//         </p>
//         <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
//       </CardContent>
//     </Card>
//   );
// }

import { Check, CircleX, Minus, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AuditReport({
  audit,
  admin = false,
}: {
  audit: any;
  admin?: boolean;
}) {
  const template = audit.template;

  /*
   * New structure:
   *
   * template.sections[].fields[]
   *
   * answers:
   * {
   *   "field-id": {
   *      value: "PASS",
   *      remarks: "...",
   *      evidence: [...]
   *   }
   * }
   */

  const fields =
    template?.sections?.flatMap((section: any) => section.fields || []) || [];

  /*
   * Camera fields are evidence fields, so they should not
   * be counted as inspection questions.
   */
  const answerFields = fields.filter(
    (field: any) =>
      field.type !== "camera-photo" && field.type !== "camera-video",
  );

  const pass = answerFields.filter(
    (field: any) => audit.answers?.[field.id]?.value === "PASS",
  ).length;

  const fail = answerFields.filter(
    (field: any) => audit.answers?.[field.id]?.value === "FAIL",
  ).length;

  const na = answerFields.filter(
    (field: any) => audit.answers?.[field.id]?.value === "N/A",
  ).length;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      {/* Header */}
      <div className="teal-wash rounded-xl border border-primary/15 p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-primary">
              {admin ? "Admin review" : "Audit report"}
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {template?.title || "AUDIT REPORT"}
            </h1>

            <p className="mt-2 font-mono text-sm text-muted-foreground">
              {audit.id}
            </p>
          </div>

          <Badge
            variant={
              audit.status === "COMPLETED" ? "default" : "secondary"
            }
          >
            {audit.status}
          </Badge>
        </div>
      </div>

      {/* Metrics */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric
          icon={ShieldCheck}
          label="Fields"
          value={answerFields.length}
        />

        <Metric
          icon={Check}
          label="Pass"
          value={pass}
          tone="text-emerald-600"
        />

        <Metric
          icon={CircleX}
          label="Fail"
          value={fail}
          tone="text-red-600"
        />

        <Metric
          icon={ShieldCheck}
          label="Score"
          value={audit.score != null ? `${audit.score}%` : "—"}
          tone="text-primary"
        />
      </div>

      {/* Audit information */}
      <Card className="mt-6 shadow-sm">
        <CardHeader>
          <CardTitle>Inspection details</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-5 sm:grid-cols-4">
          <Info label="Customer" value={audit.customer} />
          <Info label="Location" value={audit.location} />
          <Info label="Auditor" value={audit.employeeName} />
          <Info label="Date" value={audit.date} />
        </CardContent>
      </Card>

      {/* Dynamic sections */}
      <div className="mt-8 flex flex-col gap-8">
        {template?.sections?.map((section: any, sectionIndex: number) => {
          const sectionFields = section.fields || [];

          return (
            <section
              key={section.id || `${section.name}-${sectionIndex}`}
            >
              {/* Section heading */}
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
                  {section.name || section.title}
                </h2>

                <span className="text-sm text-muted-foreground">
                  {sectionFields.length}{" "}
                  {sectionFields.length === 1 ? "field" : "fields"}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {sectionFields.map(
                  (field: any, fieldIndex: number) => {
                    const answer = audit.answers?.[field.id] || {};
                    const value = answer.value;

                    /*
                     * Camera-only fields are displayed as evidence
                     * fields and do not get PASS/FAIL status.
                     */
                    if (
                      field.type === "camera-photo" ||
                      field.type === "camera-video"
                    ) {
                      return (
                        <Card
                          key={field.id}
                          className="shadow-sm"
                        >
                          <CardContent className="p-5">
                            <div className="flex items-start gap-4">
                              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold">
                                {String(fieldIndex + 1).padStart(2, "0")}
                              </span>

                              <div className="min-w-0 flex-1">
                                <h3 className="font-bold">
                                  {field.label}
                                </h3>

                                <Evidence
                                  evidence={answer.evidence}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }

                    return (
                      <Card
                        key={field.id}
                        className={`shadow-sm ${
                          value === "FAIL"
                            ? "border-l-4 border-l-red-400"
                            : value === "PASS"
                              ? "border-l-4 border-l-emerald-400"
                              : value === "N/A"
                                ? "border-l-4 border-l-slate-300"
                                : ""
                        }`}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            {/* Field number */}
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold">
                              {String(fieldIndex + 1).padStart(2, "0")}
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="font-bold">
                                  {field.label}

                                  {field.required && (
                                    <span className="ml-1 text-red-500">
                                      *
                                    </span>
                                  )}
                                </h3>

                                {/* Status only for fields with a value */}
                                {value &&
                                  typeof value === "string" && (
                                    <Status status={value} />
                                  )}
                              </div>

                              {/* Non-choice value */}
                              {value &&
                                typeof value === "string" &&
                                value !== "PASS" &&
                                value !== "FAIL" &&
                                value !== "N/A" && (
                                  <p className="mt-3 text-sm font-medium">
                                    {value}
                                  </p>
                                )}

                              {/* Multiple choice */}
                              {Array.isArray(value) &&
                                value.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {value.map((item: string) => (
                                      <Badge
                                        key={item}
                                        variant="secondary"
                                      >
                                        {item}
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                              {/* Remarks */}
                              {answer.remarks && (
                                <div className="mt-4">
                                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Remarks
                                  </p>

                                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                    {answer.remarks}
                                  </p>
                                </div>
                              )}

                              {/* Evidence */}
                              <Evidence
                                evidence={answer.evidence}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  },
                )}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}

/* -------------------------------------------------------
 * Evidence
 * ----------------------------------------------------- */

function Evidence({
  evidence,
}: {
  evidence?: any[];
}) {
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Evidence
      </p>

      {evidence?.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {evidence.map((item: any, evidenceIndex: number) => {
            const url = item.url;

            if (!url) return null;

            if (item.type === "video") {
              return (
                <div
                  key={`${url}-${evidenceIndex}`}
                  className="overflow-hidden rounded-lg border bg-muted"
                >
                  <video
                    src={url}
                    controls
                    playsInline
                    className="h-40 w-full object-cover"
                  />
                </div>
              );
            }

            return (
              <a
                key={`${url}-${evidenceIndex}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-lg border bg-muted"
              >
                <img
                  src={url}
                  alt={`Evidence ${evidenceIndex + 1}`}
                  className="h-40 w-full object-cover transition-transform hover:scale-105"
                />
              </a>
            );
          })}
        </div>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">
          No evidence attached
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------
 * Status
 * ----------------------------------------------------- */

function Status({ status }: { status: string }) {
  if (!["PASS", "FAIL", "N/A"].includes(status)) {
    return null;
  }

  return (
    <Badge
      variant={
        status === "FAIL"
          ? "destructive"
          : status === "PASS"
            ? "default"
            : "secondary"
      }
    >
      {status === "PASS" ? (
        <Check data-icon="inline-start" />
      ) : status === "FAIL" ? (
        <CircleX data-icon="inline-start" />
      ) : (
        <Minus data-icon="inline-start" />
      )}

      {status}
    </Badge>
  );
}

/* -------------------------------------------------------
 * Info
 * ----------------------------------------------------- */

function Info({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 font-semibold">
        {value || "—"}
      </p>
    </div>
  );
}

/* -------------------------------------------------------
 * Metric
 * ----------------------------------------------------- */

function Metric({
  icon: Icon,
  label,
  value,
  tone = "text-foreground",
}: {
  icon: any;
  label: string;
  value: any;
  tone?: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <Icon className={`mb-3 ${tone}`} />

        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>

        <p className={`mt-1 text-2xl font-bold ${tone}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

