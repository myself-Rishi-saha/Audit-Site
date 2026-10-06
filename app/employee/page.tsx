// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   ArrowUpRight,
//   ClipboardCheck,
//   FileText,
//   Plus,
//   Search,
//   Wrench,
// } from "lucide-react";
// import { AppShell } from "@/components/app-shell";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// export default function Employee() {
//   const [audits, setAudits] = useState<any[]>([]);
//   const router = useRouter();
//   useEffect(() => {
//     fetch("/api/audits")
//       .then((r) => r.json())
//       .then(setAudits);
//   }, []);
//   const mine = audits.filter((audit) => audit.employeeId === "EMP001");
//   const completed = mine.filter((audit) => audit.status === "COMPLETED");
//   const average = completed.length
//     ? Math.round(
//         completed.reduce((sum, audit) => sum + (audit.score || 0), 0) /
//           completed.length,
//       )
//     : 0;
//   const stats = [
//     {
//       label: "Total audits",
//       value: mine.length,
//       icon: ClipboardCheck,
//       tone: "bg-teal-50 text-teal-700",
//     },
//     {
//       label: "Completed",
//       value: completed.length,
//       icon: FileText,
//       tone: "bg-emerald-50 text-emerald-700",
//     },
//     {
//       label: "Drafts",
//       value: mine.filter((a) => a.status === "DRAFT").length,
//       icon: Search,
//       tone: "bg-amber-50 text-amber-700",
//     },
//     {
//       label: "Avg. score",
//       value: `${average}%`,
//       icon: ArrowUpRight,
//       tone: "bg-sky-50 text-sky-700",
//     },
//   ];
//   return (
//     <AppShell user="S. Roy">
//       <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
//         <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
//           <div>
//             <p className="text-sm font-semibold text-primary">
//               Employee workspace
//             </p>
//             <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
//               Good morning, S. Roy
//             </h1>
//             <p className="mt-2 max-w-xl text-muted-foreground">
//               Manage inspections, audits and service reports from one place.
//             </p>
//           </div>
//           <div className="flex flex-wrap gap-3">
//             <Button
//               variant="outline"
//               className="h-11 border-primary/25 bg-card"
//               onClick={() => router.push("/employee/service-reports/new")}
//             >
//               <Wrench data-icon="inline-start" />
//               New Service Report
//             </Button>
//             <Button
//               className="h-11 shadow-sm"
//               onClick={() => router.push("/employee/audits/new")}
//             >
//               <Plus data-icon="inline-start" />
//               New Audit
//             </Button>
//           </div>
//         </div>
//         <div className="mt-8 grid gap-4 md:grid-cols-2">
//           <button
//             onClick={() => router.push("/employee/audits/new")}
//             className="teal-wash app-surface group rounded-xl p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
//           >
//             <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
//               <ClipboardCheck />
//             </span>
//             <p className="mt-5 text-lg font-semibold">Start a new audit</p>
//             <p className="mt-1 text-sm text-muted-foreground">
//               Create a safety inspection checklist for a customer site.
//             </p>
//             <span className="mt-5 inline-flex items-center text-sm font-semibold text-primary">
//               Start audit <ArrowUpRight className="ml-1" />
//             </span>
//           </button>
//           <button
//             onClick={() => router.push("/employee/service-reports/new")}
//             className="app-surface rounded-xl border-sky-200 bg-sky-50/70 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
//           >
//             <span className="flex size-11 items-center justify-center rounded-xl bg-sky-600 text-white">
//               <Wrench />
//             </span>
//             <p className="mt-5 text-lg font-semibold">New service report</p>
//             <p className="mt-1 text-sm text-muted-foreground">
//               Record equipment service and maintenance activity.
//             </p>
//             <span className="mt-5 inline-flex items-center text-sm font-semibold text-sky-700">
//               Start service report <ArrowUpRight className="ml-1" />
//             </span>
//           </button>
//         </div>
//         <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
//           {stats.map(({ label, value, icon: Icon, tone }) => (
//             <Card key={label} className="shadow-sm">
//               <CardContent className="p-5">
//                 <span
//                   className={`flex size-9 items-center justify-center rounded-lg ${tone}`}
//                 >
//                   <Icon />
//                 </span>
//                 <p className="mt-4 text-sm text-muted-foreground">{label}</p>
//                 <p className="mt-1 text-2xl font-bold">{value}</p>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//         <Card className="mt-8 shadow-sm">
//           <CardHeader className="flex flex-row items-center justify-between">
//             <div>
//               <CardTitle>Recent audits</CardTitle>
//               <p className="mt-1 text-sm text-muted-foreground">
//                 Your latest inspection activity
//               </p>
//             </div>
//             <Button variant="ghost" size="sm">
//               <Search data-icon="inline-start" />
//               Search
//             </Button>
//           </CardHeader>
//           <CardContent>
//             <div className="overflow-x-auto">
//               <table className="w-full min-w-[720px] text-left text-sm">
//                 <thead>
//                   <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
//                     {[
//                       "Audit ID",
//                       "Customer",
//                       "Location",
//                       "Date",
//                       "Status",
//                       "Score",
//                       "",
//                     ].map((head) => (
//                       <th key={head} className="px-3 py-3 font-medium">
//                         {head}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {mine.map((audit) => (
//                     <tr
//                       key={audit.id}
//                       className="border-b transition last:border-0 hover:bg-muted/40"
//                     >
//                       <td className="px-3 py-4 font-semibold text-primary">
//                         {audit.id}
//                       </td>
//                       <td className="px-3 py-4 font-medium">
//                         {audit.customer}
//                       </td>
//                       <td className="px-3 py-4 text-muted-foreground">
//                         {audit.location}
//                       </td>
//                       <td className="px-3 py-4 text-muted-foreground">
//                         {audit.date}
//                       </td>
//                       <td className="px-3 py-4">
//                         <Badge
//                           variant={
//                             audit.status === "COMPLETED"
//                               ? "default"
//                               : "secondary"
//                           }
//                         >
//                           {audit.status}
//                         </Badge>
//                       </td>
//                       <td className="px-3 py-4 font-semibold">
//                         {audit.score != null ? `${audit.score}%` : "—"}
//                       </td>
//                       <td className="px-3 py-4 text-right">
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={() =>
//                             router.push(`/employee/audits/${audit.id}`)
//                           }
//                         >
//                           View <ArrowUpRight data-icon="inline-end" />
//                         </Button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </CardContent>
//         </Card>
//       </main>
//     </AppShell>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ClipboardCheck,
  FileText,
  Plus,
  Search,
  Wrench,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Employee() {
  const [audits, setAudits] = useState<any[]>([]);
  const [serviceReports, setServiceReports] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        const [auditResponse, serviceResponse] = await Promise.all([
          fetch("/api/audits"),
          fetch("/api/service-reports"),
        ]);

        if (auditResponse.ok) {
          const auditData = await auditResponse.json();
          setAudits(Array.isArray(auditData) ? auditData : []);
        }

        if (serviceResponse.ok) {
          const serviceData = await serviceResponse.json();
          setServiceReports(
            Array.isArray(serviceData) ? serviceData : [],
          );
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      }
    }

    loadData();
  }, []);

  // For now your login/user system uses EMP001.
  const employeeId = "EMP001";

  const mine = audits.filter(
    (audit) => audit.employeeId === employeeId,
  );

  const myServiceReports = serviceReports.filter(
    (report) => report.employeeId === employeeId,
  );

  const completed = mine.filter(
    (audit) => audit.status === "COMPLETED",
  );

  const completedServiceReports = myServiceReports.filter(
    (report) => report.status === "COMPLETED",
  );

  const average = completed.length
    ? Math.round(
        completed.reduce(
          (sum, audit) => sum + (audit.score || 0),
          0,
        ) / completed.length,
      )
    : 0;

  const stats = [
    {
      label: "Total audits",
      value: mine.length,
      icon: ClipboardCheck,
      tone: "bg-teal-50 text-teal-700",
    },
    {
      label: "Completed",
      value: completed.length,
      icon: FileText,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Service reports",
      value: myServiceReports.length,
      icon: Wrench,
      tone: "bg-sky-50 text-sky-700",
    },
    {
      label: "Avg. score",
      value: `${average}%`,
      icon: ArrowUpRight,
      tone: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <AppShell user="S. Roy">
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold text-primary">
              Employee workspace
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Good morning, S. Roy
            </h1>

            <p className="mt-2 max-w-xl text-muted-foreground">
              Manage inspections, audits and service reports from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="h-11 border-primary/25 bg-card"
              onClick={() =>
                router.push("/employee/service-reports/new")
              }
            >
              <Wrench data-icon="inline-start" />
              New Service Report
            </Button>

            <Button
              className="h-11 shadow-sm"
              onClick={() =>
                router.push("/employee/audits/new")
              }
            >
              <Plus data-icon="inline-start" />
              New Audit
            </Button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <button
            onClick={() =>
              router.push("/employee/audits/new")
            }
            className="teal-wash app-surface group rounded-xl p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ClipboardCheck />
            </span>

            <p className="mt-5 text-lg font-semibold">
              Start a new audit
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Create a safety inspection checklist for a customer site.
            </p>

            <span className="mt-5 inline-flex items-center text-sm font-semibold text-primary">
              Start audit
              <ArrowUpRight className="ml-1" />
            </span>
          </button>

          <button
            onClick={() =>
              router.push("/employee/service-reports/new")
            }
            className="app-surface rounded-xl border-sky-200 bg-sky-50/70 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-sky-600 text-white">
              <Wrench />
            </span>

            <p className="mt-5 text-lg font-semibold">
              New service report
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Record equipment service and maintenance activity.
            </p>

            <span className="mt-5 inline-flex items-center text-sm font-semibold text-sky-700">
              Start service report
              <ArrowUpRight className="ml-1" />
            </span>
          </button>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, tone }) => (
            <Card key={label} className="shadow-sm">
              <CardContent className="p-5">
                <span
                  className={`flex size-9 items-center justify-center rounded-lg ${tone}`}
                >
                  <Icon />
                </span>

                <p className="mt-4 text-sm text-muted-foreground">
                  {label}
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Audits */}
        <Card className="mt-8 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent audits</CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Your latest inspection activity
              </p>
            </div>

            <Button variant="ghost" size="sm">
              <Search data-icon="inline-start" />
              Search
            </Button>
          </CardHeader>

          <CardContent>
            {mine.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No audits submitted yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                      {[
                        "Audit ID",
                        "Customer",
                        "Location",
                        "Date",
                        "Status",
                        "Score",
                        "",
                      ].map((head) => (
                        <th
                          key={head}
                          className="px-3 py-3 font-medium"
                        >
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {mine.map((audit) => (
                      <tr
                        key={audit.id}
                        className="border-b transition last:border-0 hover:bg-muted/40"
                      >
                        <td className="px-3 py-4 font-semibold text-primary">
                          {audit.id}
                        </td>

                        <td className="px-3 py-4 font-medium">
                          {audit.customer}
                        </td>

                        <td className="px-3 py-4 text-muted-foreground">
                          {audit.location}
                        </td>

                        <td className="px-3 py-4 text-muted-foreground">
                          {audit.date}
                        </td>

                        <td className="px-3 py-4">
                          <Badge
                            variant={
                              audit.status === "COMPLETED"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {audit.status}
                          </Badge>
                        </td>

                        <td className="px-3 py-4 font-semibold">
                          {audit.score != null
                            ? `${audit.score}%`
                            : "—"}
                        </td>

                        <td className="px-3 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/employee/audits/${audit.id}`,
                              )
                            }
                          >
                            View
                            <ArrowUpRight data-icon="inline-end" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Service Reports */}
        <Card className="mt-8 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent service reports</CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Your latest equipment service activity
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push("/employee/service-reports/new")
              }
            >
              <Plus data-icon="inline-start" />
              New Report
            </Button>
          </CardHeader>

          <CardContent>
            {myServiceReports.length === 0 ? (
              <div className="rounded-xl border border-dashed py-10 text-center">
                <Wrench className="mx-auto size-8 text-muted-foreground/50" />

                <p className="mt-3 text-sm font-medium">
                  No service reports yet
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Your submitted service reports will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                      {[
                        "Report ID",
                        "Customer",
                        "Equipment",
                        "Service Type",
                        "Date",
                        "Status",
                        "",
                      ].map((head) => (
                        <th
                          key={head}
                          className="px-3 py-3 font-medium"
                        >
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {myServiceReports.map((report) => (
                      <tr
                        key={report.id}
                        className="border-b transition last:border-0 hover:bg-muted/40"
                      >
                        <td className="px-3 py-4 font-semibold text-sky-700">
                          {report.id}
                        </td>

                        <td className="px-3 py-4 font-medium">
                          {report.customer || "—"}
                        </td>

                        <td className="px-3 py-4">
                          {report.equipment || "—"}
                        </td>

                        <td className="px-3 py-4 text-muted-foreground">
                          {report.serviceType || "—"}
                        </td>

                        <td className="px-3 py-4 text-muted-foreground">
                          {report.date || "—"}
                        </td>

                        <td className="px-3 py-4">
                          <Badge
                            variant={
                              report.status === "COMPLETED"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {report.status || "DRAFT"}
                          </Badge>
                        </td>

                        <td className="px-3 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/employee/service-reports/${report.id}`,
                              )
                            }
                          >
                            View
                            <ArrowUpRight data-icon="inline-end" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}

