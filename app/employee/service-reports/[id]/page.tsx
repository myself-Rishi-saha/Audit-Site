// "use client";

// import { useEffect, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { ArrowLeft } from "lucide-react";

// import { AppShell } from "@/components/app-shell";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";

// export default function Page() {
//   const { id } = useParams();
//   const router = useRouter();

//   const [r, setR] = useState<any>();
//   const [error, setError] = useState("");

//   useEffect(() => {
//     if (!id) return;

//     fetch(`/api/service-reports/${id}`)
//       .then(async (response) => {
//         if (!response.ok) {
//           throw new Error("Failed to load service report");
//         }

//         return response.json();
//       })
//       .then(setR)
//       .catch((error) => {
//         console.error(error);
//         setError("Failed to load service report.");
//       });
//   }, [id]);

//   if (error) {
//     return (
//       <AppShell user="S. Roy">
//         <main className="mx-auto max-w-4xl p-8">
//           <p className="text-destructive">{error}</p>
//         </main>
//       </AppShell>
//     );
//   }

//   if (!r) {
//     return (
//       <AppShell user="S. Roy">
//         <main className="p-8">Loading report…</main>
//       </AppShell>
//     );
//   }

//   /*
//    * Evidence is now stored like:
//    *
//    * evidence: {
//    *   "equipment-photo": [...],
//    *   "equipment-video": [...],
//    *   "customer-photo": [...]
//    * }
//    *
//    * Flatten it so we can easily display all evidence on
//    * the report page.
//    */
//   const evidence = Object.values(r.evidence || {}).flat() as any[];

//   const customerEvidence = evidence.filter(
//     (e: any) => e.type === "customer",
//   );

//   const otherEvidence = evidence.filter(
//     (e: any) => e.type !== "customer",
//   );

//   return (
//     <AppShell user="S. Roy">
//       <main className="mx-auto flex max-w-4xl flex-col gap-6 px-5 py-8">
//         {/* Back button */}
//         <Button
//           variant="ghost"
//           className="self-start"
//           onClick={() => router.push("/employee")}
//         >
//           <ArrowLeft data-icon="inline-start" />
//           Back to Dashboard
//         </Button>

//         {/* Header */}
//         <div>
//           <p className="text-sm font-semibold text-primary">{r.id}</p>

//           <h1 className="mt-2 text-3xl font-bold">
//             EQUIPMENT SERVICE & MAINTENANCE REPORT
//           </h1>

//           <Badge className="mt-3">{r.status}</Badge>
//         </div>

//         {/* JOB INFORMATION */}
//         <Card>
//           <CardHeader>
//             <CardTitle>JOB INFORMATION</CardTitle>
//           </CardHeader>

//           <CardContent className="grid gap-4 sm:grid-cols-2">
//             {[
//               ["Customer", r.customer],
//               ["Address", r.address],
//               ["Engineer", r.engineer],
//               ["Date", r.date],
//               ["Time", r.time],
//               ["Equipment", r.equipment],
//               ["Serial Number", r.serial],
//             ].map(([k, v]) => (
//               <div key={k}>
//                 <p className="text-xs font-semibold uppercase text-muted-foreground">
//                   {k}
//                 </p>

//                 <p className="mt-1">{v || "—"}</p>
//               </div>
//             ))}
//           </CardContent>
//         </Card>

//         {/* SERVICE TYPE */}
//         <Card>
//           <CardHeader>
//             <CardTitle>SERVICE TYPE</CardTitle>
//           </CardHeader>

//           <CardContent>
//             {r.serviceType || "—"}
//           </CardContent>
//         </Card>

//         {/* INSTALLED SYSTEMS */}
//         <Card>
//           <CardHeader>
//             <CardTitle>INSTALLED SYSTEM CHECKED</CardTitle>
//           </CardHeader>

//           <CardContent>
//             {r.systems?.length > 0
//               ? r.systems.join(", ")
//               : "—"}
//           </CardContent>
//         </Card>

//         {/* FAULT + ACTIONS */}
//         <Card>
//           <CardHeader>
//             <CardTitle>FAULT DIAGNOSIS & ACTION LOG</CardTitle>
//           </CardHeader>

//           <CardContent className="flex flex-col gap-4">
//             {/* Reported fault */}
//             <div>
//               <p className="text-sm font-semibold">
//                 Reported Fault
//               </p>

//               <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
//                 {r.reportedFault || "—"}
//               </p>
//             </div>

//             {/* Actions */}
//             {r.actions?.map((a: string, i: number) => (
//               <div key={i}>
//                 <p className="text-sm font-semibold">
//                   Action {i + 1}
//                 </p>

//                 <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
//                   {a || "—"}
//                 </p>
//               </div>
//             ))}
//           </CardContent>
//         </Card>

//         {/* CUSTOMER EVIDENCE */}
//         <Card>
//           <CardHeader>
//             <CardTitle>CUSTOMER EVIDENCE</CardTitle>
//           </CardHeader>

//           <CardContent className="flex flex-col gap-4">
//             {r.customerRemarks && (
//               <div>
//                 <p className="text-sm font-semibold">
//                   Customer Remarks
//                 </p>

//                 <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
//                   {r.customerRemarks}
//                 </p>
//               </div>
//             )}

//             {customerEvidence.length > 0 ? (
//               <div className="grid gap-4 sm:grid-cols-2">
//                 {customerEvidence.map(
//                   (e: any, index: number) => (
//                     <div
//                       key={`${e.url}-${index}`}
//                       className="overflow-hidden rounded-xl border bg-muted"
//                     >
//                       {e.type === "video" ? (
//                         <video
//                           src={e.url}
//                           controls
//                           playsInline
//                           className="max-h-72 w-full object-cover"
//                         />
//                       ) : (
//                         <img
//                           src={e.url}
//                           alt={`Customer evidence ${index + 1}`}
//                           className="max-h-72 w-full object-cover"
//                         />
//                       )}
//                     </div>
//                   ),
//                 )}
//               </div>
//             ) : (
//               <p className="text-sm text-muted-foreground">
//                 No customer evidence attached.
//               </p>
//             )}
//           </CardContent>
//         </Card>

//         {/* GENERAL EVIDENCE */}
//         <Card>
//           <CardHeader>
//             <CardTitle>EVIDENCE</CardTitle>
//           </CardHeader>

//           <CardContent>
//             {otherEvidence.length > 0 ? (
//               <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
//                 {otherEvidence.map(
//                   (e: any, index: number) => (
//                     <a
//                       key={`${e.url}-${index}`}
//                       href={e.url}
//                       target="_blank"
//                       rel="noreferrer"
//                       className="group overflow-hidden rounded-xl border bg-background p-2 transition hover:shadow-md"
//                     >
//                       <div className="overflow-hidden rounded-lg">
//                         {e.type === "video" ? (
//                           <video
//                             src={e.url}
//                             controls
//                             playsInline
//                             className="aspect-square w-full object-cover"
//                           />
//                         ) : (
//                           <img
//                             src={e.url}
//                             alt={`Evidence ${index + 1}`}
//                             className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
//                           />
//                         )}
//                       </div>

//                       <span className="mt-2 block text-sm capitalize text-muted-foreground">
//                         {e.type === "video"
//                           ? "Video"
//                           : "Photo"}
//                       </span>
//                     </a>
//                   ),
//                 )}
//               </div>
//             ) : (
//               <p className="text-sm text-muted-foreground">
//                 No evidence attached.
//               </p>
//             )}
//           </CardContent>
//         </Card>
//       </main>
//     </AppShell>
//   );
// }

import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ServiceReportReport } from "@/components/service-report-report";
import { ServiceReportDraft } from "@/components/service-report-draft";

export default async function Report({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const url =
    process.env.NEXT_PUBLIC_FRONTEND_URL ||
    "http://localhost:3000";

  const r = await fetch(
    `${url}/api/service-reports/${id}`,
    {
      cache: "no-store",
    },
  );

  if (!r.ok) {
    return notFound();
  }

  const report = await r.json();

  return (
    <AppShell user="S. Roy">
      {report.status === "DRAFT" ? (
        < ServiceReportDraft report={report} />
      ) : (
        <ServiceReportReport report={report} />
      )}
    </AppShell>
  );
}