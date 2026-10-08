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
//   const [serviceReports, setServiceReports] = useState<any[]>([]);
//   const router = useRouter();

//   useEffect(() => {
//     async function loadData() {
//       try {
//         const [auditResponse, serviceResponse] = await Promise.all([
//           fetch("/api/audits"),
//           fetch("/api/service-reports"),
//         ]);

//         if (auditResponse.ok) {
//           const auditData = await auditResponse.json();
//           console.log("Loaded audits:", auditData);
//           setAudits(Array.isArray(auditData) ? auditData : []);
//         }

//         if (serviceResponse.ok) {
//           const serviceData = await serviceResponse.json();

//           setServiceReports(Array.isArray(serviceData) ? serviceData : []);
//         }
//       } catch (error) {
//         console.error("Failed to load dashboard data:", error);
//       }
//     }

//     loadData();
//   }, []);

//   // For now your login/user system uses EMP001.
//   const employeeId = "EMP001";

//   // const mine = audits.filter(
//   //   (audit) =>
//   //     audit.employeeId === employeeId,
//   // );
//   const mine = audits;
//   // const myServiceReports =
//   //   serviceReports.filter(
//   //     (report) =>
//   //       report.employeeId ===
//   //       employeeId,
//   //   );
//   const myServiceReports = serviceReports;

//   const completed = mine.filter(
//     (audit) => String(audit.status || "").toUpperCase() === "COMPLETED",
//   );

//   const completedServiceReports = myServiceReports.filter(
//     (report) => String(report.status || "").toUpperCase() === "COMPLETED",
//   );

//   const average = completed.length
//     ? Math.round(
//         completed.reduce((sum, audit) => sum + Number(audit.score || 0), 0) /
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
//       label: "Service reports",
//       value: myServiceReports.length,
//       icon: Wrench,
//       tone: "bg-sky-50 text-sky-700",
//     },
//     {
//       label: "Avg. score",
//       value: `${average}%`,
//       icon: ArrowUpRight,
//       tone: "bg-violet-50 text-violet-700",
//     },
//   ];

//   return (
//     <AppShell user="S. Roy">
//       <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
//         {/* Header */}

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

//         {/* Quick actions */}

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
//               Start audit
//               <ArrowUpRight className="ml-1" />
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
//               Start service report
//               <ArrowUpRight className="ml-1" />
//             </span>
//           </button>
//         </div>

//         {/* Stats */}

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

//         {/* Recent Audits */}

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
//             {mine.length === 0 ? (
//               <div className="py-10 text-center text-sm text-muted-foreground">
//                 No audits submitted yet.
//               </div>
//             ) : (
//               <div className="overflow-x-auto">
//                 <table className="w-full min-w-[720px] text-left text-sm">
//                   <thead>
//                     <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
//                       {[
//                         "Audit ID",
//                         "Customer",
//                         "Location",
//                         "Date",
//                         "Status",
//                         "Score",
//                         "",
//                       ].map((head) => (
//                         <th key={head} className="px-3 py-3 font-medium">
//                           {head}
//                         </th>
//                       ))}
//                     </tr>
//                   </thead>

//                   <tbody>
//                     {mine.map((audit) => {
//                       /*
//                        * Current audit schema:
//                        *
//                        * audit.formData.customer
//                        * audit.formData.location
//                        * audit.formData.date
//                        */

//                       const customer = audit.formData?.customer || "—";

//                       const location = audit.formData?.location || "—";

//                       const date = audit.formData?.date || "—";

//                       const status = String(
//                         audit.status || "DRAFT",
//                       ).toUpperCase();

//                       return (
//                         <tr
//                           key={audit.id}
//                           className="border-b transition last:border-0 hover:bg-muted/40"
//                         >
//                           <td className="px-3 py-4 font-semibold text-primary">
//                             {audit.id}
//                           </td>

//                           <td className="px-3 py-4 font-medium">{customer}</td>

//                           <td className="px-3 py-4 text-muted-foreground">
//                             {location}
//                           </td>

//                           <td className="px-3 py-4 text-muted-foreground">
//                             {date}
//                           </td>

//                           <td className="px-3 py-4">
//                             <Badge
//                               variant={
//                                 status === "COMPLETED" ? "default" : "secondary"
//                               }
//                             >
//                               {status}
//                             </Badge>
//                           </td>

//                           <td className="px-3 py-4 font-semibold">
//                             {audit.score != null ? `${audit.score}%` : "—"}
//                           </td>

//                           <td className="px-3 py-4 text-right">
//                             <Button
//                               variant="ghost"
//                               size="sm"
//                               onClick={() =>
//                                 router.push(`/employee/audits/${audit.id}`)
//                               }
//                             >
//                               View
//                               <ArrowUpRight data-icon="inline-end" />
//                             </Button>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         {/* Recent Service Reports */}

//         <Card className="mt-8 shadow-sm">
//           <CardHeader className="flex flex-row items-center justify-between">
//             <div>
//               <CardTitle>Recent service reports</CardTitle>

//               <p className="mt-1 text-sm text-muted-foreground">
//                 Your latest equipment service activity
//               </p>
//             </div>

//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => router.push("/employee/service-reports/new")}
//             >
//               <Plus data-icon="inline-start" />
//               New Report
//             </Button>
//           </CardHeader>

//           <CardContent>
//             {myServiceReports.length === 0 ? (
//               <div className="rounded-xl border border-dashed py-10 text-center">
//                 <Wrench className="mx-auto size-8 text-muted-foreground/50" />

//                 <p className="mt-3 text-sm font-medium">
//                   No service reports yet
//                 </p>

//                 <p className="mt-1 text-sm text-muted-foreground">
//                   Your submitted service reports will appear here.
//                 </p>
//               </div>
//             ) : (
//               <div className="overflow-x-auto">
//                 <table className="w-full min-w-[850px] text-left text-sm">
//                   <thead>
//                     <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
//                       {[
//                         "Report ID",
//                         "Customer",
//                         "Equipment",
//                         "Service Type",
//                         "Date",
//                         "Status",
//                         "",
//                       ].map((head) => (
//                         <th key={head} className="px-3 py-3 font-medium">
//                           {head}
//                         </th>
//                       ))}
//                     </tr>
//                   </thead>

//                   <tbody>
//                     {myServiceReports.map((report) => {
//                       const reportStatus = String(
//                         report.status || "DRAFT",
//                       ).toUpperCase();

//                       return (
//                         <tr
//                           key={report.id}
//                           className="border-b transition last:border-0 hover:bg-muted/40"
//                         >
//                           <td className="px-3 py-4 font-semibold text-sky-700">
//                             {report.id}
//                           </td>

//                           <td className="px-3 py-4 font-medium">
//                             {report.formData?.["customer-name"] || "—"}
//                           </td>

//                           <td className="px-3 py-4">
//                             {report.formData?.["equipment"] || "—"}
//                           </td>

//                           <td className="px-3 py-4 text-muted-foreground">
//                             {report.formData?.["service-type"] || "—"}
//                           </td>

//                           <td className="px-3 py-4 text-muted-foreground">
//                             {report.formData?.["service-call-date"] || "—"}
//                           </td>

//                           <td className="px-3 py-4">
//                             <Badge
//                               variant={
//                                 reportStatus === "COMPLETED"
//                                   ? "default"
//                                   : "secondary"
//                               }
//                             >
//                               {reportStatus}
//                             </Badge>
//                           </td>

//                           <td className="px-3 py-4 text-right">
//                             <Button
//                               variant="ghost"
//                               size="sm"
//                               onClick={() =>
//                                 router.push(
//                                   `/employee/service-reports/${report.id}`,
//                                 )
//                               }
//                             >
//                               View
//                               <ArrowUpRight data-icon="inline-end" />
//                             </Button>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             )}
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CurrentUser = {
  id: string;
  name: string;
  username: string;
  role: "auditor";
};

export default function Employee() {
  const [audits, setAudits] = useState<any[]>([]);
  const [serviceReports, setServiceReports] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        const [userResponse, auditResponse, serviceResponse] =
          await Promise.all([
            fetch("/api/auth/me"),
            fetch("/api/audits"),
            fetch("/api/service-reports"),
          ]);

        // -----------------------------
        // CURRENT LOGGED-IN EMPLOYEE
        // -----------------------------
        if (userResponse.ok) {
          const userData = await userResponse.json();

          setCurrentUser({
            id: userData.id,
            name: userData.name,
            username: userData.username,
            role: userData.role,
          });
        } else {
          router.push("/employee/login");
          return;
        }

        // -----------------------------
        // AUDITS
        // -----------------------------
        if (auditResponse.ok) {
          const auditData = await auditResponse.json();

          //console.log("Loaded audits:", auditData);

          setAudits(Array.isArray(auditData) ? auditData : []);
        } else if (auditResponse.status === 401) {
          router.push("/employee/login");
          return;
        }

        // -----------------------------
        // SERVICE REPORTS
        // -----------------------------
        if (serviceResponse.ok) {
          const serviceData = await serviceResponse.json();
          //console.log("Loaded service reports:", serviceData);
          setServiceReports(Array.isArray(serviceData) ? serviceData : []);
        } else if (serviceResponse.status === 401) {
          router.push("/employee/login");
          return;
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      }
    }

    loadData();
  }, [router]);

  /*
   * IMPORTANT:
   *
   * Do NOT filter using:
   *
   * const employeeId = "EMP001";
   *
   * The API already filters records using the
   * authenticated employee's JWT.
   */
  const mine = audits;
  const myServiceReports = serviceReports;

  const completed = mine.filter(
    (audit) => String(audit.status || "").toUpperCase() === "COMPLETED",
  );

  const average = completed.length
    ? Math.round(
        completed.reduce((sum, audit) => sum + Number(audit.score || 0), 0) /
          completed.length,
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

  const employeeName = currentUser?.name || "Employee";

  return (
    <AppShell user={employeeName}>
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {/* Header */}

        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold text-primary">
              Employee workspace
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Good morning, {employeeName}
            </h1>

            <p className="mt-2 max-w-xl text-muted-foreground">
              Manage inspections, audits and service reports from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="h-11 border-primary/25 bg-card"
              onClick={() => router.push("/employee/service-reports/new")}
            >
              <Wrench data-icon="inline-start" />
              New Service Report
            </Button>

            <Button
              className="h-11 shadow-sm"
              onClick={() => router.push("/employee/audits/new")}
            >
              <Plus data-icon="inline-start" />
              New Audit
            </Button>
          </div>
        </div>

        {/* Quick actions */}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <button
            onClick={() => router.push("/employee/audits/new")}
            className="teal-wash app-surface group rounded-xl p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ClipboardCheck />
            </span>

            <p className="mt-5 text-lg font-semibold">Start a new audit</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Create a safety inspection checklist for a customer site.
            </p>

            <span className="mt-5 inline-flex items-center text-sm font-semibold text-primary">
              Start audit
              <ArrowUpRight className="ml-1" />
            </span>
          </button>

          <button
            onClick={() => router.push("/employee/service-reports/new")}
            className="app-surface rounded-xl border-sky-200 bg-sky-50/70 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-sky-600 text-white">
              <Wrench />
            </span>

            <p className="mt-5 text-lg font-semibold">New service report</p>

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

                <p className="mt-4 text-sm text-muted-foreground">{label}</p>

                <p className="mt-1 text-2xl font-bold">{value}</p>
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
                        "customerName",
                        "Location",
                        "Date",
                        "Status",
                        // "Score",
                        "",
                      ].map((head) => (
                        <th key={head} className="px-3 py-3 font-medium">
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {mine.map((audit) => {
                      const customer = audit?.customerName || "—";

                      const location = audit.customerAddress || "—";

                      const date = audit?.createdAt
                        ? new Date(audit.createdAt).toLocaleDateString("en-GB")
                        : "—";
                      const status = String(
                        audit.status || "DRAFT",
                      ).toUpperCase();

                      return (
                        <tr
                          key={audit.id}
                          className="border-b transition last:border-0 hover:bg-muted/40"
                        >
                          <td className="px-3 py-4 font-semibold text-primary">
                            {audit.id}
                          </td>

                          <td className="px-3 py-4 font-medium">{customer}</td>

                          <td className="px-3 py-4 text-muted-foreground">
                            {location}
                          </td>

                          <td className="px-3 py-4 text-muted-foreground">
                            {date}
                          </td>

                          <td className="px-3 py-4">
                            <Badge
                              variant={
                                status === "COMPLETED" ? "default" : "secondary"
                              }
                            >
                              {status}
                            </Badge>
                          </td>

                          {/* <td className="px-3 py-4 font-semibold">
                            {audit.score != null ? `${audit.score}%` : "—"}
                          </td> */}

                          <td className="px-3 py-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(`/employee/audits/${audit.id}`)
                              }
                            >
                              View
                              <ArrowUpRight data-icon="inline-end" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
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
              onClick={() => router.push("/employee/service-reports/new")}
            >
              <Plus data-icon="inline-start" />
              New Report
            </Button>
          </CardHeader>

          <CardContent>
            {myServiceReports.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No service reports submitted yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                      {[
                        "Report ID",
                        "customerName",
                        "Location",
                        "Date",
                        "Status",
                        // "Score",
                        "",
                      ].map((head) => (
                        <th key={head} className="px-3 py-3 font-medium">
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {myServiceReports.map((report) => {
                      const customer = report?.customerName || "—";

                      const location = report.customerAddress || "—";

                      const date = report?.createdAt
                        ? new Date(report.createdAt).toLocaleDateString("en-GB")
                        : "—";
                      const status = String(
                        report.status || "DRAFT",
                      ).toUpperCase();

                      return (
                        <tr
                          key={report.id}
                          className="border-b transition last:border-0 hover:bg-muted/40"
                        >
                          <td className="px-3 py-4 font-semibold text-primary">
                            {report.id}
                          </td>

                          <td className="px-3 py-4 font-medium">{customer}</td>

                          <td className="px-3 py-4 text-muted-foreground">
                            {location}
                          </td>

                          <td className="px-3 py-4 text-muted-foreground">
                            {date}
                          </td>

                          <td className="px-3 py-4">
                            <Badge
                              variant={
                                status === "COMPLETED" ? "default" : "secondary"
                              }
                            >
                              {status}
                            </Badge>
                          </td>

                          {/* <td className="px-3 py-4 font-semibold">
                            {report.score != null ? `${report.score}%` : "—"}
                          </td> */}

                          <td className="px-3 py-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(`/employee/audits/${report.id}`)
                              }
                            >
                              View
                              <ArrowUpRight data-icon="inline-end" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>

          {/* <CardContent>
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
                        <th key={head} className="px-3 py-3 font-medium">
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {myServiceReports.map((report) => {
                      const reportStatus = String(
                        report.status || "DRAFT",
                      ).toUpperCase();

                      return (
                        <tr
                          key={report.id}
                          className="border-b transition last:border-0 hover:bg-muted/40"
                        >
                          <td className="px-3 py-4 font-semibold text-sky-700">
                            {report.id}
                          </td>

                          <td className="px-3 py-4 font-medium">
                            {report.formData?.["customer-name"] || "—"}
                          </td>

                          <td className="px-3 py-4">
                            {report.formData?.["equipment"] || "—"}
                          </td>

                          <td className="px-3 py-4 text-muted-foreground">
                            {report.formData?.["service-type"] || "—"}
                          </td>

                          <td className="px-3 py-4 text-muted-foreground">
                            {report.formData?.["service-call-date"] || "—"}
                          </td>

                          <td className="px-3 py-4">
                            <Badge
                              variant={
                                reportStatus === "COMPLETED"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {reportStatus}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent> */}
        </Card>
      </main>
    </AppShell>
  );
}
