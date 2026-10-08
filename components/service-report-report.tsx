

// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { ArrowLeft } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";

// type Evidence = {
//   url: string;
//   type: string;
//   fileName?: string;
// };

// type SignatureData = {
//   signature: string;
//   signedAt: string;
// };

// type Field = {
//   id: string;
//   label: string;
//   type: string;
//   required?: boolean;
//   options?: string[];
//   multiple?: boolean;
// };

// type Section = {
//   id?: string;
//   name: string;
//   title?: string;
//   fields: Field[];
// };

// type ServiceTemplate = {
//   id: string;
//   name?: string;
//   title?: string;
//   type?: string;
//   sections: Section[];
// };

// type ServiceReport = {
//   id: string;
//   status?: string;

//   templateId?: string;

//   formData?: Record<
//     string,
//     unknown
//   >;

//   evidence?: Record<
//     string,
//     Evidence[]
//   >;

//   signatures?: Record<
//     string,
//     SignatureData
//   >;

//   /*
//    * Old fields are kept optional only
//    * for compatibility with existing reports.
//    */
//   customer?: string;
//   address?: string;
//   engineer?: string;
//   date?: string;
//   time?: string;
//   equipment?: string;
//   serial?: string;

//   serviceType?: string;
//   systems?: string[];

//   reportedFault?: string;
//   actions?: string[];

//   customerName?: string;
//   customerRemarks?: string;
// };

// function getValue(
//   report: ServiceReport,
//   fieldId: string,
// ) {
//   /*
//    * New dynamic structure.
//    */
//   if (
//     report.formData &&
//     Object.prototype.hasOwnProperty.call(
//       report.formData,
//       fieldId,
//     )
//   ) {
//     return report.formData[
//       fieldId
//     ];
//   }

//   /*
//    * Old structure fallback.
//    */
//   const legacyMap: Record<
//     string,
//     keyof ServiceReport
//   > = {
//     "customer-name":
//       "customer",

//     "customer-address":
//       "address",

//     "engineer-name":
//       "engineer",

//     "service-call-date":
//       "date",

//     "service-call-time":
//       "time",

//     equipment:
//       "equipment",

//     "serial-number":
//       "serial",

//     "service-type":
//       "serviceType",

//     "installed-systems":
//       "systems",

//     "reported-fault":
//       "reportedFault",

//     actions:
//       "actions",

//     "customer-name-evidence":
//       "customerName",

//     "customer-remarks":
//       "customerRemarks",
//   };

//   const legacyKey =
//     legacyMap[fieldId];

//   if (!legacyKey) {
//     return "";
//   }

//   return report[
//     legacyKey
//   ];
// }

// function formatValue(
//   value: unknown,
// ) {
//   if (
//     value === null ||
//     value === undefined ||
//     value === ""
//   ) {
//     return "—";
//   }

//   if (Array.isArray(value)) {
//     if (value.length === 0) {
//       return "—";
//     }

//     return value
//       .filter(
//         (item) =>
//           String(
//             item ?? "",
//           ).trim(),
//       )
//       .join(", ");
//   }

//   return String(value);
// }

// export function ServiceReportReport({
//   report,
// }: {
//   report: ServiceReport;
// }) {
//   const router = useRouter();

//   const [template, setTemplate] =
//     useState<ServiceTemplate | null>(
//       null,
//     );

//   const [loadingTemplate, setLoadingTemplate] =
//     useState(true);

//   // --------------------------------------------------
//   // LOAD TEMPLATE
//   // --------------------------------------------------

//   useEffect(() => {
//     async function loadTemplate() {
//       try {
//         setLoadingTemplate(true);

//         /*
//          * If the API eventually supports:
//          *
//          * /api/templates/:id
//          *
//          * you can change this later.
//          *
//          * For now your service report uses
//          * /api/templates/service-report.
//          */
//         const response =
//           await fetch(
//             "/api/templates/service-report",
//           );

//         if (!response.ok) {
//           throw new Error(
//             "Failed to load service report template.",
//           );
//         }

//         const result =
//           await response.json();

//         setTemplate(result);
//       } catch (error) {
//         console.error(
//           "SERVICE TEMPLATE ERROR:",
//           error,
//         );
//       } finally {
//         setLoadingTemplate(false);
//       }
//     }

//     loadTemplate();
//   }, []);

//   // --------------------------------------------------
//   // EVIDENCE
//   // --------------------------------------------------

//   const evidence = Object.values(
//     report.evidence || {},
//   ).flat();

//   /*
//    * Customer evidence is identified by
//    * the template field ID.
//    *
//    * This is more reliable than checking
//    * item.type === "customer", because
//    * item.type is normally "image"/"video".
//    */
//   const customerEvidenceIds =
//     new Set(
//       template?.sections
//         ?.flatMap(
//           (section) =>
//             section.fields,
//         )
//         .filter(
//           (field) =>
//             field.id
//               .toLowerCase()
//               .includes(
//                 "customer",
//               ) &&
//             (
//               field.type ===
//                 "camera-photo" ||
//               field.type ===
//                 "camera-video"
//             ),
//         )
//         .map(
//           (field) =>
//             field.id,
//         ) || [],
//     );

//   const customerEvidence =
//     Object.entries(
//       report.evidence || {},
//     )
//       .filter(
//         ([fieldId]) =>
//           customerEvidenceIds.has(
//             fieldId,
//           ),
//       )
//       .flatMap(
//         ([, items]) =>
//           items || [],
//       );

//   /*
//    * Everything not belonging to a customer
//    * evidence field is shown under EVIDENCE.
//    */
//   const otherEvidence =
//     Object.entries(
//       report.evidence || {},
//     )
//       .filter(
//         ([fieldId]) =>
//           !customerEvidenceIds.has(
//             fieldId,
//           ),
//       )
//       .flatMap(
//         ([, items]) =>
//           items || [],
//       );

//   // --------------------------------------------------
//   // SIGNATURES
//   // --------------------------------------------------

//   const signatures =
//     Object.entries(
//       report.signatures || {},
//     );

//   // --------------------------------------------------
//   // LOADING
//   // --------------------------------------------------

//   if (loadingTemplate) {
//     return (
//       <main className="mx-auto max-w-4xl px-5 py-8">
//         <Card>
//           <CardContent className="p-8 text-center">
//             <p className="text-sm text-muted-foreground">
//               Loading service
//               report...
//             </p>
//           </CardContent>
//         </Card>
//       </main>
//     );
//   }

//   // --------------------------------------------------
//   // UI
//   // --------------------------------------------------

//   return (
//     <main className="mx-auto flex max-w-4xl flex-col gap-6 px-5 py-8">
//       {/* BACK BUTTON */}

//       <Button
//         variant="ghost"
//         className="self-start"
//         onClick={() =>
//           router.push(
//             "/employee",
//           )
//         }
//       >
//         <ArrowLeft data-icon="inline-start" />
//         Back to Dashboard
//       </Button>

//       {/* HEADER */}

//       <div>
//         <p className="text-sm font-semibold text-primary">
//           {report.id}
//         </p>

//         <h1 className="mt-2 text-3xl font-bold">
//           {(
//             template?.title ||
//             template?.name ||
//             "EQUIPMENT SERVICE & MAINTENANCE REPORT"
//           ).toUpperCase()}
//         </h1>

//         {report.status && (
//           <Badge className="mt-3">
//             {report.status}
//           </Badge>
//         )}
//       </div>

//       {/* DYNAMIC TEMPLATE SECTIONS */}

//       {template?.sections?.map(
//         (
//           section,
//           sectionIndex,
//         ) => (
//           <Card
//             key={`${
//               section.id ||
//               section.name
//             }-${sectionIndex}`}
//           >
//             <CardHeader>
//               <CardTitle>
//                 {(
//                   section.name ||
//                   section.title ||
//                   ""
//                 ).toUpperCase()}
//               </CardTitle>
//             </CardHeader>

//             <CardContent className="grid gap-5 sm:grid-cols-2">
//               {section.fields.map(
//                 (field) => {
//                   const value =
//                     getValue(
//                       report,
//                       field.id,
//                     );

//                   // --------------------------------
//                   // CAMERA FIELD
//                   // --------------------------------

//                   if (
//                     field.type ===
//                       "camera-photo" ||
//                     field.type ===
//                       "camera-video"
//                   ) {
//                     const items =
//                       report
//                         .evidence?.[
//                         field.id
//                       ] || [];

//                     return (
//                       <div
//                         key={
//                           field.id
//                         }
//                         className="sm:col-span-2"
//                       >
//                         <p className="text-xs font-semibold uppercase text-muted-foreground">
//                           {
//                             field.label
//                           }
//                         </p>

//                         {items.length >
//                         0 ? (
//                           <div className="mt-3 grid gap-4 sm:grid-cols-2">
//                             {items.map(
//                               (
//                                 item,
//                                 index,
//                               ) => (
//                                 <div
//                                   key={`${item.url}-${index}`}
//                                   className="overflow-hidden rounded-xl border bg-muted"
//                                 >
//                                   {item.type ===
//                                   "video" ? (
//                                     <video
//                                       src={
//                                         item.url
//                                       }
//                                       controls
//                                       playsInline
//                                       className="max-h-80 w-full object-cover"
//                                     />
//                                   ) : (
//                                     <img
//                                       src={
//                                         item.url
//                                       }
//                                       alt={`${field.label} ${
//                                         index +
//                                         1
//                                       }`}
//                                       className="max-h-80 w-full object-cover"
//                                     />
//                                   )}
//                                 </div>
//                               ),
//                             )}
//                           </div>
//                         ) : (
//                           <p className="mt-1 text-sm text-muted-foreground">
//                             No evidence
//                             attached.
//                           </p>
//                         )}
//                       </div>
//                     );
//                   }

//                   // --------------------------------
//                   // SIGNATURE
//                   // --------------------------------

//                   if (
//                     field.type ===
//                     "signature"
//                   ) {
//                     const signature =
//                       report
//                         .signatures?.[
//                         field.id
//                       ];

//                     return (
//                       <div
//                         key={
//                           field.id
//                         }
//                         className="sm:col-span-2"
//                       >
//                         <p className="text-xs font-semibold uppercase text-muted-foreground">
//                           {
//                             field.label
//                           }
//                         </p>

//                         {signature?.signature ? (
//                           <div className="mt-3 overflow-hidden rounded-xl border bg-white">
//                             <img
//                               src={
//                                 signature.signature
//                               }
//                               alt={
//                                 field.label
//                               }
//                               className="h-40 w-full object-contain"
//                             />

//                             {signature.signedAt && (
//                               <p className="border-t px-3 py-2 text-xs text-muted-foreground">
//                                 Signed on{" "}
//                                 {new Date(
//                                   signature.signedAt,
//                                 ).toLocaleString(
//                                   "en-IN",
//                                   {
//                                     timeZone:
//                                       "Asia/Kolkata",
//                                     dateStyle:
//                                       "medium",
//                                     timeStyle:
//                                       "short",
//                                   },
//                                 )}{" "}
//                                 IST
//                               </p>
//                             )}
//                           </div>
//                         ) : (
//                           <p className="mt-1 text-sm text-muted-foreground">
//                             No signature.
//                           </p>
//                         )}
//                       </div>
//                     );
//                   }

//                   // --------------------------------
//                   // NORMAL FIELD
//                   // --------------------------------

//                   return (
//                     <div
//                       key={
//                         field.id
//                       }
//                       className={
//                         field.type ===
//                           "textarea" ||
//                         field.multiple
//                           ? "sm:col-span-2"
//                           : ""
//                       }
//                     >
//                       <p className="text-xs font-semibold uppercase text-muted-foreground">
//                         {
//                           field.label
//                         }
//                       </p>

//                       {Array.isArray(
//                         value,
//                       ) ? (
//                         value.length >
//                         0 ? (
//                           <div className="mt-2 space-y-2">
//                             {value.map(
//                               (
//                                 item,
//                                 index,
//                               ) => (
//                                 <div
//                                   key={
//                                     index
//                                   }
//                                   className="rounded-lg border bg-muted/30 p-3"
//                                 >
//                                   <p className="whitespace-pre-wrap text-sm">
//                                     {
//                                       String(
//                                         item ||
//                                           "—",
//                                       )
//                                     }
//                                   </p>
//                                 </div>
//                               ),
//                             )}
//                           </div>
//                         ) : (
//                           <p className="mt-1 text-sm text-muted-foreground">
//                             —
//                           </p>
//                         )
//                       ) : (
//                         <p className="mt-1 whitespace-pre-wrap text-sm">
//                           {formatValue(
//                             value,
//                           )}
//                         </p>
//                       )}
//                     </div>
//                   );
//                 },
//               )}
//             </CardContent>
//           </Card>
//         ),
//       )}

//       {/* CUSTOMER EVIDENCE */}

//       {customerEvidence.length >
//         0 && (
//         <Card>
//           <CardHeader>
//             <CardTitle>
//               CUSTOMER EVIDENCE
//             </CardTitle>
//           </CardHeader>

//           <CardContent>
//             <div className="grid gap-4 sm:grid-cols-2">
//               {customerEvidence.map(
//                 (
//                   item,
//                   index,
//                 ) => (
//                   <div
//                     key={`${item.url}-${index}`}
//                     className="overflow-hidden rounded-xl border bg-muted"
//                   >
//                     {item.type ===
//                     "video" ? (
//                       <video
//                         src={
//                           item.url
//                         }
//                         controls
//                         playsInline
//                         className="max-h-80 w-full object-cover"
//                       />
//                     ) : (
//                       <img
//                         src={
//                           item.url
//                         }
//                         alt={`Customer evidence ${
//                           index + 1
//                         }`}
//                         className="max-h-80 w-full object-cover"
//                       />
//                     )}
//                   </div>
//                 ),
//               )}
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       {/* GENERAL EVIDENCE */}

//       {otherEvidence.length >
//         0 && (
//         <Card>
//           <CardHeader>
//             <CardTitle>
//               EVIDENCE
//             </CardTitle>
//           </CardHeader>

//           <CardContent>
//             <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
//               {otherEvidence.map(
//                 (
//                   item,
//                   index,
//                 ) => (
//                   <a
//                     key={`${item.url}-${index}`}
//                     href={
//                       item.url
//                     }
//                     target="_blank"
//                     rel="noreferrer"
//                     className="group overflow-hidden rounded-xl border bg-background p-2 transition hover:shadow-md"
//                   >
//                     <div className="overflow-hidden rounded-lg">
//                       {item.type ===
//                       "video" ? (
//                         <video
//                           src={
//                             item.url
//                           }
//                           controls
//                           playsInline
//                           className="aspect-square w-full object-cover"
//                         />
//                       ) : (
//                         <img
//                           src={
//                             item.url
//                           }
//                           alt={`Evidence ${
//                             index + 1
//                           }`}
//                           className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
//                         />
//                       )}
//                     </div>

//                     <span className="mt-2 block text-sm capitalize text-muted-foreground">
//                       {item.type ===
//                       "video"
//                         ? "Video"
//                         : "Photo"}
//                     </span>
//                   </a>
//                 ),
//               )}
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       {/* SIGNATURES */}

//       {signatures.length >
//         0 && (
//         <Card>
//           <CardHeader>
//             <CardTitle>
//               SIGNATURES
//             </CardTitle>
//           </CardHeader>

//           <CardContent className="grid gap-5 sm:grid-cols-2">
//             {signatures.map(
//               ([
//                 fieldId,
//                 signature,
//               ]) => {
//                 /*
//                  * Get the human-readable
//                  * field label from template.
//                  */
//                 const field =
//                   template?.sections
//                     ?.flatMap(
//                       (
//                         section,
//                       ) =>
//                         section.fields,
//                     )
//                     .find(
//                       (item) =>
//                         item.id ===
//                         fieldId,
//                     );

//                 return (
//                   <div
//                     key={
//                       fieldId
//                     }
//                   >
//                     <p className="text-xs font-semibold uppercase text-muted-foreground">
//                       {field?.label ||
//                         fieldId}
//                     </p>

//                     <div className="mt-2 overflow-hidden rounded-xl border bg-white">
//                       <img
//                         src={
//                           signature.signature
//                         }
//                         alt={
//                           field?.label ||
//                           fieldId
//                         }
//                         className="h-40 w-full object-contain"
//                       />
//                     </div>

//                     {signature.signedAt && (
//                       <p className="mt-2 text-xs text-muted-foreground">
//                         Signed on{" "}
//                         {new Date(
//                           signature.signedAt,
//                         ).toLocaleString(
//                           "en-IN",
//                           {
//                             timeZone:
//                               "Asia/Kolkata",
//                             dateStyle:
//                               "medium",
//                             timeStyle:
//                               "short",
//                           },
//                         )}{" "}
//                         IST
//                       </p>
//                     )}
//                   </div>
//                 );
//               },
//             )}
//           </CardContent>
//         </Card>
//       )}
//     </main>
//   );
// }


"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Evidence = {
  url: string;
  type: string;
  fileName?: string;
};

type SignatureData = {
  signature: string;
  signedAt: string;
};

type Field = {
  id: string;
  label: string;
  type: string;
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

type ServiceTemplate = {
  id: string;
  name?: string;
  title?: string;
  type?: string;
  sections: Section[];
};

type ServiceReport = {
  id: string;
  status?: string;

  templateId?: string;

  /*
   * IMPORTANT:
   * This is the exact template that existed
   * when this report was created.
   */
  templateSnapshot?: ServiceTemplate;

  formData?: Record<string, unknown>;

  evidence?: Record<string, Evidence[]>;

  signatures?: Record<string, SignatureData>;

  /*
   * Old fields are kept optional only
   * for compatibility with existing reports.
   */
  customer?: string;
  address?: string;
  engineer?: string;
  date?: string;
  time?: string;
  equipment?: string;
  serial?: string;

  serviceType?: string;
  systems?: string[];

  reportedFault?: string;
  actions?: string[];

  customerName?: string;
  customerRemarks?: string;
};

function getValue(
  report: ServiceReport,
  fieldId: string,
) {
  /*
   * New dynamic structure.
   */
  if (
    report.formData &&
    Object.prototype.hasOwnProperty.call(
      report.formData,
      fieldId,
    )
  ) {
    return report.formData[fieldId];
  }

  /*
   * Old structure fallback.
   */
  const legacyMap: Record<
    string,
    keyof ServiceReport
  > = {
    "customer-name": "customer",
    "customer-address": "address",
    "engineer-name": "engineer",
    "service-call-date": "date",
    "service-call-time": "time",
    equipment: "equipment",
    "serial-number": "serial",
    "service-type": "serviceType",
    "installed-systems": "systems",
    "reported-fault": "reportedFault",
    actions: "actions",
    "customer-name-evidence": "customerName",
    "customer-remarks": "customerRemarks",
  };

  const legacyKey = legacyMap[fieldId];

  if (!legacyKey) {
    return "";
  }

  return report[legacyKey];
}

function formatValue(value: unknown) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "—";
    }

    return value
      .filter(
        (item) =>
          String(item ?? "").trim(),
      )
      .join(", ");
  }

  return String(value);
}

export function ServiceReportReport({
  report,
}: {
  report: ServiceReport;
}) {
  const router = useRouter();

  /*
   * IMPORTANT:
   *
   * DO NOT fetch /api/templates/service-report.
   *
   * The report contains the exact template
   * that was used when it was created.
   */
  const template =
    report.templateSnapshot || null;

  // --------------------------------------------------
  // EVIDENCE
  // --------------------------------------------------

  const evidence = Object.values(
    report.evidence || {},
  ).flat();

  const customerEvidenceIds =
    new Set(
      template?.sections
        ?.flatMap(
          (section) =>
            section.fields,
        )
        .filter(
          (field) =>
            field.id
              .toLowerCase()
              .includes("customer") &&
            (
              field.type ===
                "camera-photo" ||
              field.type ===
                "camera-video"
            ),
        )
        .map(
          (field) =>
            field.id,
        ) || [],
    );

  const customerEvidence =
    Object.entries(
      report.evidence || {},
    )
      .filter(
        ([fieldId]) =>
          customerEvidenceIds.has(
            fieldId,
          ),
      )
      .flatMap(
        ([, items]) =>
          items || [],
      );

  const otherEvidence =
    Object.entries(
      report.evidence || {},
    )
      .filter(
        ([fieldId]) =>
          !customerEvidenceIds.has(
            fieldId,
          ),
      )
      .flatMap(
        ([, items]) =>
          items || [],
      );

  // --------------------------------------------------
  // SIGNATURES
  // --------------------------------------------------

  const signatures =
    Object.entries(
      report.signatures || {},
    );

  // --------------------------------------------------
  // SAFETY FALLBACK
  // --------------------------------------------------

  if (
    !template ||
    !template.sections
  ) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="font-medium">
              Saved report template
              could not be loaded.
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Report ID: {report.id}
            </p>

            <Button
              className="mt-4"
              variant="outline"
              onClick={() =>
                router.push("/employee")
              }
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-5 py-8">
      <Button
        variant="ghost"
        className="self-start"
        onClick={() =>
          router.push("/employee")
        }
      >
        <ArrowLeft data-icon="inline-start" />
        Back to Dashboard
      </Button>

      <div>
        <p className="text-sm font-semibold text-primary">
          {report.id}
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          {(
            template.title ||
            template.name ||
            "EQUIPMENT SERVICE & MAINTENANCE REPORT"
          ).toUpperCase()}
        </h1>

        {report.status && (
          <Badge className="mt-3">
            {report.status}
          </Badge>
        )}
      </div>

      {template.sections.map(
        (
          section,
          sectionIndex,
        ) => (
          <Card
            key={`${
              section.id ||
              section.name
            }-${sectionIndex}`}
          >
            <CardHeader>
              <CardTitle>
                {(
                  section.name ||
                  section.title ||
                  ""
                ).toUpperCase()}
              </CardTitle>
            </CardHeader>

            <CardContent className="grid gap-5 sm:grid-cols-2">
              {section.fields.map(
                (field) => {
                  const value =
                    getValue(
                      report,
                      field.id,
                    );

                  if (
                    field.type ===
                      "camera-photo" ||
                    field.type ===
                      "camera-video"
                  ) {
                    const items =
                      report
                        .evidence?.[
                        field.id
                      ] || [];

                    return (
                      <div
                        key={
                          field.id
                        }
                        className="sm:col-span-2"
                      >
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          {
                            field.label
                          }
                        </p>

                        {items.length >
                        0 ? (
                          <div className="mt-3 grid gap-4 sm:grid-cols-2">
                            {items.map(
                              (
                                item,
                                index,
                              ) => (
                                <div
                                  key={`${item.url}-${index}`}
                                  className="overflow-hidden rounded-xl border bg-muted"
                                >
                                  {item.type ===
                                  "video" ? (
                                    <video
                                      src={
                                        item.url
                                      }
                                      controls
                                      playsInline
                                      className="max-h-80 w-full object-cover"
                                    />
                                  ) : (
                                    <img
                                      src={
                                        item.url
                                      }
                                      alt={`${field.label} ${
                                        index +
                                        1
                                      }`}
                                      className="max-h-80 w-full object-cover"
                                    />
                                  )}
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-muted-foreground">
                            No evidence
                            attached.
                          </p>
                        )}
                      </div>
                    );
                  }

                  if (
                    field.type ===
                    "signature"
                  ) {
                    const signature =
                      report
                        .signatures?.[
                        field.id
                      ];

                    return (
                      <div
                        key={
                          field.id
                        }
                        className="sm:col-span-2"
                      >
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          {
                            field.label
                          }
                        </p>

                        {signature?.signature ? (
                          <div className="mt-3 overflow-hidden rounded-xl border bg-white">
                            <img
                              src={
                                signature.signature
                              }
                              alt={
                                field.label
                              }
                              className="h-40 w-full object-contain"
                            />

                            {signature.signedAt && (
                              <p className="border-t px-3 py-2 text-xs text-muted-foreground">
                                Signed on{" "}
                                {new Date(
                                  signature.signedAt,
                                ).toLocaleString(
                                  "en-IN",
                                  {
                                    timeZone:
                                      "Asia/Kolkata",
                                    dateStyle:
                                      "medium",
                                    timeStyle:
                                      "short",
                                  },
                                )}{" "}
                                IST
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-muted-foreground">
                            No signature.
                          </p>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={
                        field.id
                      }
                      className={
                        field.type ===
                          "textarea" ||
                        field.multiple
                          ? "sm:col-span-2"
                          : ""
                      }
                    >
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        {
                          field.label
                        }
                      </p>

                      {Array.isArray(
                        value,
                      ) ? (
                        value.length >
                        0 ? (
                          <div className="mt-2 space-y-2">
                            {value.map(
                              (
                                item,
                                index,
                              ) => (
                                <div
                                  key={
                                    index
                                  }
                                  className="rounded-lg border bg-muted/30 p-3"
                                >
                                  <p className="whitespace-pre-wrap text-sm">
                                    {String(
                                      item ||
                                        "—",
                                    )}
                                  </p>
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-muted-foreground">
                            —
                          </p>
                        )
                      ) : (
                        <p className="mt-1 whitespace-pre-wrap text-sm">
                          {formatValue(
                            value,
                          )}
                        </p>
                      )}
                    </div>
                  );
                },
              )}
            </CardContent>
          </Card>
        ),
      )}

      {/* {customerEvidence.length >
        0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              CUSTOMER EVIDENCE
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {customerEvidence.map(
                (
                  item,
                  index,
                ) => (
                  <div
                    key={`${item.url}-${index}`}
                    className="overflow-hidden rounded-xl border bg-muted"
                  >
                    {item.type ===
                    "video" ? (
                      <video
                        src={
                          item.url
                        }
                        controls
                        playsInline
                        className="max-h-80 w-full object-cover"
                      />
                    ) : (
                      <img
                        src={
                          item.url
                        }
                        alt={`Customer evidence ${
                          index + 1
                        }`}
                        className="max-h-80 w-full object-cover"
                      />
                    )}
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      )} */}

      {/* {otherEvidence.length >
        0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              EVIDENCE
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {otherEvidence.map(
                (
                  item,
                  index,
                ) => (
                  <a
                    key={`${item.url}-${index}`}
                    href={
                      item.url
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="group overflow-hidden rounded-xl border bg-background p-2 transition hover:shadow-md"
                  >
                    <div className="overflow-hidden rounded-lg">
                      {item.type ===
                      "video" ? (
                        <video
                          src={
                            item.url
                          }
                          controls
                          playsInline
                          className="aspect-square w-full object-cover"
                        />
                      ) : (
                        <img
                          src={
                            item.url
                          }
                          alt={`Evidence ${
                            index + 1
                          }`}
                          className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                        />
                      )}
                    </div>

                    <span className="mt-2 block text-sm capitalize text-muted-foreground">
                      {item.type ===
                      "video"
                        ? "Video"
                        : "Photo"}
                    </span>
                  </a>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      )} */}

      {/* {signatures.length >
        0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              SIGNATURES
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-5 sm:grid-cols-2">
            {signatures.map(
              ([
                fieldId,
                signature,
              ]) => {
                const field =
                  template.sections
                    .flatMap(
                      (
                        section,
                      ) =>
                        section.fields,
                    )
                    .find(
                      (item) =>
                        item.id ===
                        fieldId,
                    );

                return (
                  <div
                    key={
                      fieldId
                    }
                  >
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {field?.label ||
                        fieldId}
                    </p>

                    <div className="mt-2 overflow-hidden rounded-xl border bg-white">
                      <img
                        src={
                          signature.signature
                        }
                        alt={
                          field?.label ||
                          fieldId
                        }
                        className="h-40 w-full object-contain"
                      />
                    </div>

                    {signature.signedAt && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Signed on{" "}
                        {new Date(
                          signature.signedAt,
                        ).toLocaleString(
                          "en-IN",
                          {
                            timeZone:
                              "Asia/Kolkata",
                            dateStyle:
                              "medium",
                            timeStyle:
                              "short",
                          },
                        )}{" "}
                        IST
                      </p>
                    )}
                  </div>
                );
              },
            )}
          </CardContent>
        </Card>
      )} */}
    </main>
  );
}

