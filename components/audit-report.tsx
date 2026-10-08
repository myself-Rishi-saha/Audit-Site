// import { ShieldCheck } from "lucide-react";
// import { Badge } from "@/components/ui/badge";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";

// export function AuditReport({
//   audit,
//   admin = false,
// }: {
//   audit: any;
//   admin?: boolean;
// }) {
//   const template = audit.template;

//   const sections = template?.sections || [];

//   const fields = sections.flatMap(
//     (section: any) => section.fields || [],
//   );

//   /*
//    * Fields that actually contain answers.
//    * Evidence and signatures are displayed separately.
//    */
//   const answerFields = fields.filter(
//     (field: any) =>
//       field.type !== "camera-photo" &&
//       field.type !== "camera-video" &&
//       field.type !== "signature",
//   );

//   /*
//    * Dynamically calculate how many times each option
//    * has been selected.
//    *
//    * Example:
//    * PASS -> 5
//    * FAIL -> 2
//    * N/A  -> 1
//    *
//    * If another template has:
//    * YES -> 4
//    * NO -> 3
//    *
//    * it automatically becomes:
//    * YES -> 4
//    * NO -> 3
//    */
//   const optionCounts: Record<string, number> = {};

//   answerFields.forEach((field: any) => {
//     const value = audit.answers?.[field.id]?.value;

//     if (field.type !== "single-choice") {
//       return;
//     }

//     if (!value || typeof value !== "string") {
//       return;
//     }

//     optionCounts[value] = (optionCounts[value] || 0) + 1;
//   });

//   /*
//    * Get all unique options from the template.
//    *
//    * This means the report does not need to know
//    * anything about PASS / FAIL / N/A.
//    */
//   const allOptions = Array.from(
//     new Set(
//       answerFields
//         .filter((field: any) => field.type === "single-choice")
//         .flatMap((field: any) => field.options || []),
//     ),
//   );

//   /*
//    * Only show options that are actually used in the answers.
//    */
//   const selectedOptions = allOptions.filter(
//     (option: string) => optionCounts[option] !== undefined,
//   );

//   return (
//     <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
//       {/* Header */}
//       <div className="teal-wash rounded-xl border border-primary/15 p-6 sm:p-8">
//         <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
//           <div>
//             <p className="text-sm font-semibold text-primary">
//               {admin ? "Admin review" : "Audit report"}
//             </p>

//             <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
//               {template?.title || "AUDIT REPORT"}
//             </h1>

//             <p className="mt-2 font-mono text-sm text-muted-foreground">
//               {audit.id}
//             </p>
//           </div>

//           <Badge
//             variant={
//               audit.status === "COMPLETED"
//                 ? "default"
//                 : "secondary"
//             }
//           >
//             {audit.status}
//           </Badge>
//         </div>
//       </div>

//       {/* Dynamic Metrics */}
//       <div
//         className={`mt-6 grid gap-4 ${
//           selectedOptions.length > 0
//             ? `grid-cols-2 lg:grid-cols-${Math.min(
//                 selectedOptions.length + 1,
//                 5,
//               )}`
//             : "grid-cols-2 lg:grid-cols-3"
//         }`}
//       >
//         <Metric
//           icon={ShieldCheck}
//           label="Fields"
//           value={answerFields.length}
//         />

//         {selectedOptions.map((option: string) => (
//           <Metric
//             key={option}
//             icon={ShieldCheck}
//             label={option}
//             value={optionCounts[option]}
//           />
//         ))}

//         <Metric
//           icon={ShieldCheck}
//           label="Score"
//           value={
//             audit.score != null
//               ? `${audit.score}%`
//               : "—"
//           }
//           tone="text-primary"
//         />
//       </div>

//       {/* Inspection Details */}
//       {/* <Card className="mt-6 shadow-sm">
//         <CardHeader>
//           <CardTitle>Inspection details</CardTitle>
//         </CardHeader>

//         <CardContent className="grid gap-5 sm:grid-cols-4">
//           <Info label="Customer" value={audit.customer} />
//           <Info label="Location" value={audit.location} />
//           <Info label="Auditor" value={audit.employeeName} />
//           <Info label="Date" value={audit.date} />
//         </CardContent>
//       </Card> */}

//       {/* Sections */}
//       <div className="mt-8 flex flex-col gap-8">
//         {sections.map(
//           (section: any, sectionIndex: number) => {
//             const sectionFields = section.fields || [];

//             return (
//               <section
//                 key={
//                   section.id ||
//                   `${section.name}-${sectionIndex}`
//                 }
//               >
//                 {/* Section Header */}
//                 <div className="mb-3 flex items-center justify-between">
//                   <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
//                     {section.name || section.title}
//                   </h2>

//                   <span className="text-sm text-muted-foreground">
//                     {sectionFields.length}{" "}
//                     {sectionFields.length === 1
//                       ? "field"
//                       : "fields"}
//                   </span>
//                 </div>

//                 <div className="flex flex-col gap-3">
//                   {sectionFields.map(
//                     (field: any, fieldIndex: number) => {
//                       const answer =
//                         audit.answers?.[field.id] || {};

//                       const value = answer.value;

//                       /*
//                        * CAMERA PHOTO / VIDEO
//                        */
//                       if (
//                         field.type === "camera-photo" ||
//                         field.type === "camera-video"
//                       ) {
//                         return (
//                           <Card
//                             key={field.id}
//                             className="shadow-sm"
//                           >
//                             <CardContent className="p-5">
//                               <div className="flex items-start gap-4">
//                                 <FieldNumber
//                                   number={fieldIndex + 1}
//                                 />

//                                 <div className="min-w-0 flex-1">
//                                   <h3 className="font-bold">
//                                     {field.label}
//                                   </h3>

//                                   <Evidence
//                                     evidence={
//                                       answer.evidence
//                                     }
//                                   />
//                                 </div>
//                               </div>
//                             </CardContent>
//                           </Card>
//                         );
//                       }

//                       /*
//                        * SIGNATURE
//                        */
//                       if (field.type === "signature") {
//                         const signature =
//                           typeof answer.signature ===
//                           "object"
//                             ? answer.signature
//                             : undefined;

//                         return (
//                           <Card
//                             key={field.id}
//                             className="shadow-sm"
//                           >
//                             <CardContent className="p-5">
//                               <div className="flex items-start gap-4">
//                                 <FieldNumber
//                                   number={fieldIndex + 1}
//                                 />

//                                 <div className="min-w-0 flex-1">
//                                   <h3 className="font-bold">
//                                     {field.label}

//                                     {field.required && (
//                                       <span className="ml-1 text-red-500">
//                                         *
//                                       </span>
//                                     )}
//                                   </h3>

//                                   {signature?.signature ? (
//                                     <>
//                                       <div className="mt-4 inline-block rounded-lg border bg-white p-3">
//                                         <img
//                                           src={
//                                             signature.signature
//                                           }
//                                           alt={field.label}
//                                           className="max-h-40 w-auto"
//                                         />
//                                       </div>

//                                       {signature.signedAt && (
//                                         <p className="mt-2 text-xs text-muted-foreground">
//                                           Signed:{" "}
//                                           {new Date(
//                                             signature.signedAt,
//                                           ).toLocaleString(
//                                             "en-IN",
//                                             {
//                                               timeZone:
//                                                 "Asia/Kolkata",
//                                               dateStyle:
//                                                 "medium",
//                                               timeStyle:
//                                                 "short",
//                                             },
//                                           )}
//                                         </p>
//                                       )}
//                                     </>
//                                   ) : (
//                                     <p className="mt-3 text-sm text-muted-foreground">
//                                       No signature provided
//                                     </p>
//                                   )}
//                                 </div>
//                               </div>
//                             </CardContent>
//                           </Card>
//                         );
//                       }

//                       /*
//                        * NORMAL FIELD
//                        */
//                       return (
//                         <Card
//                           key={field.id}
//                           className="shadow-sm"
//                         >
//                           <CardContent className="p-5">
//                             <div className="flex items-start gap-4">
//                               <FieldNumber
//                                 number={fieldIndex + 1}
//                               />

//                               <div className="min-w-0 flex-1">
//                                 <div className="flex flex-wrap items-center justify-between gap-2">
//                                   <h3 className="font-bold">
//                                     {field.label}

//                                     {field.required && (
//                                       <span className="ml-1 text-red-500">
//                                         *
//                                       </span>
//                                     )}
//                                   </h3>
//                                 </div>

//                                 {/* Dynamic single-choice options */}
//                                 {field.type ===
//                                   "single-choice" &&
//                                   Array.isArray(
//                                     field.options,
//                                   ) && (
//                                     <div className="mt-3 flex flex-wrap gap-2">
//                                       {field.options.map(
//                                         (
//                                           option: string,
//                                         ) => {
//                                           const selected =
//                                             value ===
//                                             option;

//                                           return (
//                                             <Badge
//                                               key={
//                                                 option
//                                               }
//                                               variant={
//                                                 selected
//                                                   ? "default"
//                                                   : "secondary"
//                                               }
//                                               className={
//                                                 selected
//                                                   ? ""
//                                                   : "opacity-50"
//                                               }
//                                             >
//                                               {option}
//                                             </Badge>
//                                           );
//                                         },
//                                       )}
//                                     </div>
//                                   )}

//                                 {/* String value */}
//                                 {value &&
//                                   typeof value ===
//                                     "string" &&
//                                   field.type !==
//                                     "single-choice" && (
//                                     <p className="mt-3 text-sm font-medium">
//                                       {value}
//                                     </p>
//                                   )}

//                                 {/* Multiple choice */}
//                                 {Array.isArray(value) &&
//                                   value.length > 0 && (
//                                     <div className="mt-3 flex flex-wrap gap-2">
//                                       {value.map(
//                                         (
//                                           item: string,
//                                         ) => (
//                                           <Badge
//                                             key={item}
//                                             variant="secondary"
//                                           >
//                                             {item}
//                                           </Badge>
//                                         ),
//                                       )}
//                                     </div>
//                                   )}

//                                 {/* Remarks */}
//                                 {answer.remarks && (
//                                   <div className="mt-4">
//                                     <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
//                                       Remarks
//                                     </p>

//                                     <p className="mt-1 text-sm leading-6 text-muted-foreground">
//                                       {answer.remarks}
//                                     </p>
//                                   </div>
//                                 )}

//                                 {/* Evidence */}
//                                 <Evidence
//                                   evidence={
//                                     answer.evidence
//                                   }
//                                 />
//                               </div>
//                             </div>
//                           </CardContent>
//                         </Card>
//                       );
//                     },
//                   )}
//                 </div>
//               </section>
//             );
//           },
//         )}
//       </div>
//     </main>
//   );
// }

// /* ---------------------------------- */
// /* Field Number                       */
// /* ---------------------------------- */

// function FieldNumber({
//   number,
// }: {
//   number: number;
// }) {
//   return (
//     <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold">
//       {String(number).padStart(2, "0")}
//     </span>
//   );
// }

// /* ---------------------------------- */
// /* Evidence                           */
// /* ---------------------------------- */

// function Evidence({
//   evidence,
// }: {
//   evidence?: any[];
// }) {
//   return (
//     <div className="mt-4">
//       <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
//         Evidence
//       </p>

//       {evidence?.length > 0 ? (
//         <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
//           {evidence.map(
//             (item: any, evidenceIndex: number) => {
//               const url = item.url;

//               if (!url) return null;

//               if (item.type === "video") {
//                 return (
//                   <div
//                     key={`${url}-${evidenceIndex}`}
//                     className="overflow-hidden rounded-lg border bg-muted"
//                   >
//                     <video
//                       src={url}
//                       controls
//                       playsInline
//                       className="h-40 w-full object-cover"
//                     />
//                   </div>
//                 );
//               }

//               return (
//                 <a
//                   key={`${url}-${evidenceIndex}`}
//                   href={url}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="block overflow-hidden rounded-lg border bg-muted"
//                 >
//                   <img
//                     src={url}
//                     alt={`Evidence ${
//                       evidenceIndex + 1
//                     }`}
//                     className="h-40 w-full object-cover transition-transform hover:scale-105"
//                   />
//                 </a>
//               );
//             },
//           )}
//         </div>
//       ) : (
//         <p className="mt-1 text-sm text-muted-foreground">
//           No evidence attached
//         </p>
//       )}
//     </div>
//   );
// }

// /* ---------------------------------- */
// /* Info                               */
// /* ---------------------------------- */

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

// /* ---------------------------------- */
// /* Metric                             */
// /* ---------------------------------- */

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

//         <p className={`mt-1 text-2xl font-bold ${tone}`}>
//           {value}
//         </p>
//       </CardContent>
//     </Card>
//   );
// }

import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AuditReport({
  audit,
  admin = false,
}: {
  audit: any;
  admin?: boolean;
}) {
  /*
   * Existing audits should use the saved template snapshot.
   */
  const template = audit.templateSnapshot || audit.template || null;

  const sections = template?.sections || [];

  const fields = sections.flatMap((section: any) => section.fields || []);
  // console.log("audit", audit);

  /*
   * Fields that actually contain normal answers.
   *
   * Evidence and signatures are stored separately:
   *
   * audit.formData
   * audit.evidence
   * audit.signatures
   */
  const answerFields = fields.filter(
    (field: any) =>
      field.type !== "camera-photo" &&
      field.type !== "camera-video" &&
      field.type !== "signature",
  );

  /*
   * Count selected options dynamically.
   *
   * Example:
   *
   * PASS -> 5
   * FAIL -> 2
   * N/A  -> 1
   *
   * It does not assume that the options are
   * PASS / FAIL / N/A.
   */
  const optionCounts: Record<string, number> = {};

  answerFields.forEach((field: any) => {
    if (field.type !== "single-choice") {
      return;
    }

    const value = audit.formData?.[field.id];

    if (!value || typeof value !== "string") {
      return;
    }

    optionCounts[value] = (optionCounts[value] || 0) + 1;
  });

  /*
   * Get all unique options from
   * the saved template.
   */
  const allOptions = Array.from(
    new Set(
      answerFields
        .filter((field: any) => field.type === "single-choice")
        .flatMap((field: any) =>
          Array.isArray(field.options) ? field.options : [],
        ),
    ),
  );

  /*
   * Only display options that were
   * actually selected.
   */
  const selectedOptions = allOptions.filter(
    (option: string) => optionCounts[option] !== undefined,
  );

  /*
   * Use static Tailwind classes instead
   * of dynamically generated classes.
   */
  const metricGridClass =
    selectedOptions.length === 0
      ? "grid-cols-2 lg:grid-cols-3"
      : selectedOptions.length === 1
        ? "grid-cols-2 lg:grid-cols-3"
        : selectedOptions.length === 2
          ? "grid-cols-2 lg:grid-cols-4"
          : selectedOptions.length === 3
            ? "grid-cols-2 lg:grid-cols-5"
            : "grid-cols-2 lg:grid-cols-5";

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
              {template?.title || template?.name || "AUDIT REPORT"}
            </h1>

            <p className="mt-2 font-mono text-sm text-muted-foreground">
              {audit.id}
            </p>
          </div>

          <Badge
            variant={
              String(audit.status).toUpperCase() === "COMPLETED"
                ? "default"
                : "secondary"
            }
          >
            {String(audit.status || "DRAFT").toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Dynamic Metrics */}

      <div className={`mt-6 grid gap-4 ${metricGridClass}`}>
        <Metric icon={ShieldCheck} label="Fields" value={answerFields.length} />

        {selectedOptions.map((option: string) => (
          <Metric
            key={option}
            icon={ShieldCheck}
            label={option}
            value={optionCounts[option]}
          />
        ))}

        <Metric
          icon={ShieldCheck}
          label="Score"
          value={audit.score != null ? `${audit.score}%` : "—"}
          tone="text-primary"
        />
      </div>
      {/* Inspection Details */}
      <Card className="mt-6 shadow-sm">
        <CardHeader>
          <CardTitle>Inspection details</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-5 sm:grid-cols-4">
          <Info label="Customer" value={audit.customerName} />
          <Info label="Location" value={audit.customerAddress} />
          <Info label="Auditor" value={audit.employeeName} />
          <Info label="Date" value={audit.updatedAt} />
        </CardContent>
      </Card>

      {/* Sections */}

      <div className="mt-8 flex flex-col gap-8">
        {sections.map((section: any, sectionIndex: number) => {
          const sectionFields = section.fields || [];

          return (
            <section
              key={
                section.id || `${section.name || section.title}-${sectionIndex}`
              }
            >
              {/* Section Header */}

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
                {sectionFields.map((field: any, fieldIndex: number) => {
                  /*
                   * Current audit schema:
                   *
                   * Normal values:
                   * audit.formData[field.id]
                   *
                   * Evidence:
                   * audit.evidence[field.id]
                   *
                   * Signatures:
                   * audit.signatures[field.id]
                   */

                  const value = audit.formData?.[field.id];

                  /*
                   * CAMERA PHOTO / VIDEO
                   */

                  if (
                    field.type === "camera-photo" ||
                    field.type === "camera-video"
                  ) {
                    return (
                      <Card key={field.id} className="shadow-sm">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <FieldNumber number={fieldIndex + 1} />

                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold">
                                {field.label}

                                {field.required && (
                                  <span className="ml-1 text-red-500">*</span>
                                )}
                              </h3>

                              <Evidence evidence={audit.evidence?.[field.id]} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  /*
                   * SIGNATURE
                   */

                  if (field.type === "signature") {
                    const signature = audit.signatures?.[field.id];

                    return (
                      <Card key={field.id} className="shadow-sm">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <FieldNumber number={fieldIndex + 1} />

                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold">
                                {field.label}

                                {field.required && (
                                  <span className="ml-1 text-red-500">*</span>
                                )}
                              </h3>

                              {signature?.signature ? (
                                <>
                                  <div className="mt-4 inline-block rounded-lg border bg-white p-3">
                                    <img
                                      src={signature.signature}
                                      alt={field.label}
                                      className="max-h-40 w-auto"
                                    />
                                  </div>

                                  {signature.signedAt && (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                      Signed:{" "}
                                      {new Date(
                                        signature.signedAt,
                                      ).toLocaleString("en-IN", {
                                        timeZone: "Asia/Kolkata",
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                      })}{" "}
                                      IST
                                    </p>
                                  )}
                                </>
                              ) : (
                                <p className="mt-3 text-sm text-muted-foreground">
                                  No signature provided
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  /*
                   * NORMAL FIELD
                   */

                  return (
                    <Card key={field.id} className="shadow-sm">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <FieldNumber number={fieldIndex + 1} />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h3 className="font-bold">
                                {field.label}

                                {field.required && (
                                  <span className="ml-1 text-red-500">*</span>
                                )}
                              </h3>
                            </div>

                            {/* Single Choice */}

                            {field.type === "single-choice" &&
                              Array.isArray(field.options) && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {field.options.map((option: string) => {
                                    const selected = value === option;

                                    return (
                                      <Badge
                                        key={option}
                                        variant={
                                          selected ? "default" : "secondary"
                                        }
                                        className={selected ? "" : "opacity-50"}
                                      >
                                        {option}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              )}

                            {/* String Value */}

                            {value &&
                              typeof value === "string" &&
                              field.type !== "single-choice" && (
                                <p className="mt-3 whitespace-pre-wrap text-sm font-medium">
                                  {value}
                                </p>
                              )}

                            {/* Multiple Choice */}

                            {Array.isArray(value) && value.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {value.map(
                                  (item: string, itemIndex: number) => (
                                    <Badge
                                      key={`${item}-${itemIndex}`}
                                      variant="secondary"
                                    >
                                      {item}
                                    </Badge>
                                  ),
                                )}
                              </div>
                            )}

                            {/* Evidence */}

                            <Evidence evidence={audit.evidence?.[field.id]} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}

/* ---------------------------------- */
/* Field Number                       */
/* ---------------------------------- */

function FieldNumber({ number }: { number: number }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold">
      {String(number).padStart(2, "0")}
    </span>
  );
}

/* ---------------------------------- */
/* Evidence                           */
/* ---------------------------------- */

function Evidence({ evidence }: { evidence?: any[] }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Evidence
      </p>

      {evidence && evidence.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {evidence.map((item: any, evidenceIndex: number) => {
            const url = item?.url;

            if (!url) {
              return null;
            }

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

/* ---------------------------------- */
/* Info                               */
/* ---------------------------------- */

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 font-semibold">{value || "—"}</p>
    </div>
  );
}

/* ---------------------------------- */
/* Metric                             */
/* ---------------------------------- */

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

        <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
