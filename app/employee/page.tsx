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
//   CalendarDays,
//   X,
// } from "lucide-react";

// import { AppShell } from "@/components/app-shell";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// type CurrentUser = {
//   id: string;
//   name: string;
//   username: string;
//   role: "auditor";
//   canAccessAudit: boolean;
//   canAccessServiceReport: boolean;
//   canAccessDailyAccentReport: boolean;
// };

// type Report = {
//   id: string;
//   status?: string;
//   score?: number | null;
//   customerName?: string;
//   customerAddress?: string;
//   createdAt?: string;
//   formData?: Record<string, unknown>;
// };

// function getTodayLocalDate() {
//   const today = new Date();
//   const year = today.getFullYear();
//   const month = String(today.getMonth() + 1).padStart(2, "0");
//   const day = String(today.getDate()).padStart(2, "0");

//   return `${year}-${month}-${day}`;
// }

// function normalizeStatus(report: Report) {
//   return String(report.status ?? "DRAFT").toUpperCase();
// }

// export default function Employee() {
//   const router = useRouter();

//   const [audits, setAudits] = useState<Report[]>([]);
//   const [serviceReports, setServiceReports] = useState<Report[]>([]);
//   const [dailyAccentReports, setDailyAccentReports] = useState<Report[]>([]);
//   const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

//   const [loading, setLoading] = useState(true);
//   const [loadError, setLoadError] = useState("");

//   // Search input and applied search are deliberately separate.
//   const [search, setSearch] = useState("");
//   const [appliedSearch, setAppliedSearch] = useState("");

//   const [selectedDate, setSelectedDate] = useState(getTodayLocalDate);

//   const canAccessAudit = currentUser?.canAccessAudit ?? false;
//   const canAccessServiceReport = currentUser?.canAccessServiceReport ?? false;
//   const canAccessDailyAccentReport =
//     currentUser?.canAccessDailyAccentReport ?? false;

//   const isSearching = appliedSearch.trim().length > 0;

//   // Effect 1: Fetch the employee profile only once.
//   useEffect(() => {
//     let cancelled = false;

//     async function loadCurrentUser() {
//       try {
//         const response = await fetch("/api/auth/me", {
//           cache: "no-store",
//         });

//         if (!response.ok) {
//           if (!cancelled) router.replace("/login");
//           return;
//         }

//         const data = await response.json();

//         const user: CurrentUser = {
//           id: String(data.id ?? ""),
//           name: String(data.name ?? "Employee"),
//           username: String(data.username ?? ""),
//           role: "auditor",
//           canAccessAudit: data.canAccessAudit === true,
//           canAccessServiceReport: data.canAccessServiceReport === true,
//           canAccessDailyAccentReport: data.canAccessDailyAccentReport === true,
//         };

//         if (!cancelled) {
//           setCurrentUser(user);
//         }
//       } catch (error) {
//         console.error("Failed to load employee profile:", error);

//         if (!cancelled) {
//           setLoadError("Failed to load your employee profile.");
//         }
//       } finally {
//         if (!cancelled) {
//           setLoading(false);
//         }
//       }
//     }

//     void loadCurrentUser();

//     return () => {
//       cancelled = true;
//     };
//   }, [router]);

//   // Effect 2: Fetch filtered reports without hiding the dashboard.
//   useEffect(() => {
//     if (!currentUser) return;

//     let cancelled = false;

//     async function loadReports() {
//       setLoadError("");

//       try {
//         const params = new URLSearchParams();

//         if (appliedSearch.trim()) {
//           params.set("search", appliedSearch.trim());
//         }

//         if (selectedDate) {
//           params.set("date", selectedDate);
//         }

//         const suffix = params.toString() ? `?${params.toString()}` : "";

//         const [auditResponse, serviceResponse, dailyResponse] =
//           await Promise.all([
//             currentUser.canAccessAudit
//               ? fetch(`/api/audits${suffix}`, {
//                   cache: "no-store",
//                 })
//               : Promise.resolve(null),

//             currentUser.canAccessServiceReport
//               ? fetch(`/api/service-reports${suffix}`, {
//                   cache: "no-store",
//                 })
//               : Promise.resolve(null),

//             currentUser.canAccessDailyAccentReport
//               ? fetch(`/api/daily-accent-report${suffix}`, {
//                   cache: "no-store",
//                 })
//               : Promise.resolve(null),
//           ]);

//         const responses = [auditResponse, serviceResponse, dailyResponse];

//         if (responses.some((response) => response?.status === 401)) {
//           if (!cancelled) router.replace("/login");
//           return;
//         }

//         if (auditResponse && !auditResponse.ok) {
//           throw new Error("Failed to load audits.");
//         }

//         if (serviceResponse && !serviceResponse.ok) {
//           throw new Error("Failed to load service reports.");
//         }

//         if (dailyResponse && !dailyResponse.ok) {
//           throw new Error("Failed to load Daily Accent Reports.");
//         }

//         const [auditData, serviceData, dailyData] = await Promise.all([
//           auditResponse ? auditResponse.json() : Promise.resolve([]),

//           serviceResponse ? serviceResponse.json() : Promise.resolve([]),

//           dailyResponse ? dailyResponse.json() : Promise.resolve([]),
//         ]);

//         if (cancelled) return;

//         setAudits(Array.isArray(auditData) ? auditData : []);
//         setServiceReports(Array.isArray(serviceData) ? serviceData : []);
//         setDailyAccentReports(Array.isArray(dailyData) ? dailyData : []);
//       } catch (error) {
//         console.error("Failed to load reports:", error);

//         if (!cancelled) {
//           setLoadError(
//             error instanceof Error ? error.message : "Failed to load reports.",
//           );
//         }
//       }
//     }

//     // No full-page loading state or artificial delay during search.
//     void loadReports();

//     return () => {
//       cancelled = true;
//     };
//   }, [currentUser, appliedSearch, selectedDate]);


//   const completedAudits = audits.filter(
//     (report) => normalizeStatus(report) === "COMPLETED",
//   );

//   const completedServiceReports = serviceReports.filter(
//     (report) => normalizeStatus(report) === "COMPLETED",
//   );

//   const completedDailyAccentReports = dailyAccentReports.filter(
//     (report) => normalizeStatus(report) === "COMPLETED",
//   );

//   const totalFormsCompleted =
//     (canAccessAudit ? completedAudits.length : 0) +
//     (canAccessServiceReport ? completedServiceReports.length : 0) +
//     (canAccessDailyAccentReport ? completedDailyAccentReports.length : 0);

//   const averageScore = completedAudits.length
//     ? Math.round(
//         completedAudits.reduce(
//           (sum, report) => sum + Number(report.score ?? 0),
//           0,
//         ) / completedAudits.length,
//       )
//     : 0;

//   const stats = [
//     ...(canAccessAudit || canAccessServiceReport || canAccessDailyAccentReport
//       ? [
//           {
//             label: "Total Forms Completed",
//             value: totalFormsCompleted,
//             icon: ClipboardCheck,
//             tone: "bg-teal-50 text-teal-700",
//           },
//         ]
//       : []),

//     ...(canAccessAudit
//       ? [
//           {
//             label: "Completed audits",
//             value: completedAudits.length,
//             icon: FileText,
//             tone: "bg-emerald-50 text-emerald-700",
//           },
//           {
//             label: "Average audit score",
//             value: `${averageScore}%`,
//             icon: ArrowUpRight,
//             tone: "bg-violet-50 text-violet-700",
//           },
//         ]
//       : []),

//     ...(canAccessServiceReport
//       ? [
//           {
//             label: "Service reports",
//             value: serviceReports.length,
//             icon: Wrench,
//             tone: "bg-sky-50 text-sky-700",
//           },
//         ]
//       : []),

//     ...(canAccessDailyAccentReport
//       ? [
//           {
//             label: "Daily Accent Reports",
//             value: dailyAccentReports.length,
//             icon: FileText,
//             tone: "bg-violet-50 text-violet-700",
//           },
//         ]
//       : []),
//   ];

//   const employeeName = currentUser?.name || "Employee";

//   function formatDate(value?: string) {
//     if (!value) return "—";

//     const date = new Date(value);

//     return Number.isNaN(date.getTime())
//       ? "—"
//       : date.toLocaleDateString("en-GB");
//   }

//   function renderReportsTable(
//     reports: Report[],
//     type: "audit" | "service" | "daily-accent",
//   ) {
//     const isAudit = type === "audit";
//     const isDailyAccent = type === "daily-accent";

//     return (
//       <div className="overflow-x-auto">
//         <table className="w-full min-w-[650px] text-left text-sm">
//           <thead>
//             <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
//               <th className="px-3 py-3 font-medium">
//                 {isAudit
//                   ? "Audit ID"
//                   : isDailyAccent
//                     ? "Daily Accent ID"
//                     : "Report ID"}
//               </th>
//               <th className="px-3 py-3 font-medium">Customer</th>
//               <th className="px-3 py-3 font-medium">Location</th>
//               <th className="px-3 py-3 font-medium">Date</th>
//               <th className="px-3 py-3 font-medium">Status</th>
//               <th className="px-3 py-3 font-medium" />
//             </tr>
//           </thead>

//           <tbody>
//             {reports.map((report) => {
//               const status = normalizeStatus(report);

//               return (
//                 <tr
//                   key={report.id}
//                   className="border-b transition last:border-0 hover:bg-muted/40"
//                 >
//                   <td className="px-3 py-4 font-semibold text-primary">
//                     {report.id}
//                   </td>

//                   <td className="px-3 py-4 font-medium">
//                     {report.customerName ||
//                       String(report.formData?.["customer-name"] ?? "—")}
//                   </td>

//                   <td className="px-3 py-4 text-muted-foreground">
//                     {report.customerAddress ||
//                       String(report.formData?.["customer-address"] ?? "—")}
//                   </td>

//                   <td className="px-3 py-4 text-muted-foreground">
//                     {formatDate(
//                       report.createdAt ||
//                         String(report.formData?.["service-call-date"] ?? ""),
//                     )}
//                   </td>

//                   <td className="px-3 py-4">
//                     <Badge
//                       variant={status === "COMPLETED" ? "default" : "secondary"}
//                     >
//                       {status}
//                     </Badge>
//                   </td>

//                   <td className="px-3 py-4 text-right">
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => {
//                         if (isAudit) {
//                           router.push(`/employee/audits/${report.id}`);
//                         } else if (isDailyAccent) {
//                           router.push(
//                             `/employee/daily-accent-report/${report.id}`,
//                           );
//                         } else {
//                           router.push(`/employee/service-reports/${report.id}`);
//                         }
//                       }}
//                     >
//                       View
//                       <ArrowUpRight data-icon="inline-end" />
//                     </Button>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     );
//   }

//   function resetFilters() {
//     setSearch("");
//     setAppliedSearch("");
//     setSelectedDate(getTodayLocalDate());
//   }

//   const filtersAreAtDefault =
//     !search && !appliedSearch && selectedDate === getTodayLocalDate();

//   return (
//     <AppShell>
//       <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
//         {/* Header */}
//         <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
//           <div>
//             <p className="text-sm font-semibold text-primary">
//               Employee workspace
//             </p>

//             <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
//               Welcome, {employeeName}
//             </h1>

//             <p className="mt-2 max-w-xl text-muted-foreground">
//               Manage your permitted inspections, audits, and service reports.
//             </p>
//           </div>

//           <div className="flex flex-wrap gap-3">
//             {canAccessServiceReport && (
//               <Button
//                 variant="outline"
//                 className="h-11 border-primary/25 bg-card"
//                 onClick={() => router.push("/employee/service-reports/new")}
//               >
//                 <Wrench data-icon="inline-start" />
//                 New Service Report
//               </Button>
//             )}

//             {canAccessAudit && (
//               <Button
//                 variant="outline"
//                 className="h-11 border-primary/25 bg-card"
//                 onClick={() => router.push("/employee/audits/new")}
//               >
//                 <Plus data-icon="inline-start" />
//                 New Audit
//               </Button>
//             )}

//             {canAccessDailyAccentReport && (
//               <Button
//                 variant="outline"
//                 className="h-11 border-primary/25 bg-card"
//                 onClick={() => router.push("/employee/daily-accent-report/new")}
//               >
//                 <FileText data-icon="inline-start" />
//                 New Daily Accent Report
//               </Button>
//             )}
//           </div>
//         </div>

//         {/* Loading and error states */}
//         {loading && (
//           <div className="mt-8 rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
//             Loading your workspace...
//           </div>
//         )}

//         {!loading && loadError && (
//           <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
//             <p className="font-medium text-destructive">{loadError}</p>
//             <Button
//               className="mt-3"
//               variant="outline"
//               onClick={() => window.location.reload()}
//             >
//               Try again
//             </Button>
//           </div>
//         )}

//         {!loading && !loadError && currentUser && (
//           <>
//             {/* Quick actions */}
//             {(canAccessAudit ||
//               canAccessServiceReport ||
//               canAccessDailyAccentReport) && (
//               <div
//                 className={`mt-8 grid gap-4 ${
//                   Number(canAccessAudit) +
//                     Number(canAccessServiceReport) +
//                     Number(canAccessDailyAccentReport) >=
//                   2
//                     ? "md:grid-cols-2 lg:grid-cols-3"
//                     : "md:grid-cols-1"
//                 }`}
//               >
//                 {canAccessAudit && (
//                   <button
//                     onClick={() => router.push("/employee/audits/new")}
//                     className="teal-wash app-surface group rounded-xl p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
//                   >
//                     <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
//                       <ClipboardCheck />
//                     </span>

//                     <p className="mt-5 text-lg font-semibold">
//                       Start a new audit
//                     </p>

//                     <p className="mt-1 text-sm text-muted-foreground">
//                       Create a safety inspection checklist for a customer site.
//                     </p>

//                     <span className="mt-5 inline-flex items-center text-sm font-semibold text-primary">
//                       Start audit
//                       <ArrowUpRight className="ml-1" />
//                     </span>
//                   </button>
//                 )}

//                 {canAccessServiceReport && (
//                   <button
//                     onClick={() => router.push("/employee/service-reports/new")}
//                     className="app-surface rounded-xl border border-sky-200 bg-sky-50/70 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
//                   >
//                     <span className="flex size-11 items-center justify-center rounded-xl bg-sky-600 text-white">
//                       <Wrench />
//                     </span>

//                     <p className="mt-5 text-lg font-semibold">
//                       New service report
//                     </p>

//                     <p className="mt-1 text-sm text-muted-foreground">
//                       Record equipment service and maintenance activity.
//                     </p>

//                     <span className="mt-5 inline-flex items-center text-sm font-semibold text-sky-700">
//                       Start service report
//                       <ArrowUpRight className="ml-1" />
//                     </span>
//                   </button>
//                 )}

//                 {canAccessDailyAccentReport && (
//                   <button
//                     onClick={() =>
//                       router.push("/employee/daily-accent-report/new")
//                     }
//                     className="app-surface rounded-xl border border-violet-200 bg-violet-50/70 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
//                   >
//                     <span className="flex size-11 items-center justify-center rounded-xl bg-violet-600 text-white">
//                       <FileText />
//                     </span>

//                     <p className="mt-5 text-lg font-semibold">
//                       Daily Accent Report
//                     </p>

//                     <p className="mt-1 text-sm text-muted-foreground">
//                       Record and submit your daily accent report.
//                     </p>

//                     <span className="mt-5 inline-flex items-center text-sm font-semibold text-violet-700">
//                       Create daily report
//                       <ArrowUpRight className="ml-1" />
//                     </span>
//                   </button>
//                 )}
//               </div>
//             )}

//             {/* Statistics */}
//             {stats.length > 0 && (
//               <div
//                 className={`mt-6 grid grid-cols-2 gap-4 ${
//                   stats.length === 1
//                     ? "lg:grid-cols-1"
//                     : stats.length === 2
//                       ? "lg:grid-cols-2"
//                       : stats.length === 3
//                         ? "lg:grid-cols-3"
//                         : "lg:grid-cols-4"
//                 }`}
//               >
//                 {stats.map(({ label, value, icon: Icon, tone }) => (
//                   <Card key={label} className="shadow-sm">
//                     <CardContent className="p-5">
//                       <span
//                         className={`flex size-9 items-center justify-center rounded-lg ${tone}`}
//                       >
//                         <Icon className="size-5" />
//                       </span>

//                       <p className="mt-4 text-sm text-muted-foreground">
//                         {label}
//                       </p>

//                       <p className="mt-1 text-2xl font-bold">{value}</p>
//                     </CardContent>
//                   </Card>
//                 ))}
//               </div>
//             )}

//             {/* Search and date filters */}
//             {(canAccessAudit ||
//               canAccessServiceReport ||
//               canAccessDailyAccentReport) && (
//               <Card className="mt-8 shadow-sm">
//                 <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
//                   {/* Date filter */}
//                   <div className="relative w-full sm:w-52">
//                     <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

//                     <input
//                       type="date"
//                       value={selectedDate}
//                       onChange={(event) => setSelectedDate(event.target.value)}
//                       aria-label="Filter reports by date"
//                       className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
//                     />
//                   </div>

//                   {/* Search input */}
//                   <div className="relative flex-1">
//                     <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

//                     <input
//                       type="search"
//                       value={search}
//                       onChange={(event) => setSearch(event.target.value)}
//                       onKeyDown={(event) => {
//                         if (event.key === "Enter") {
//                           event.preventDefault();
//                           setAppliedSearch(search.trim());
//                         }
//                       }}
//                       placeholder="Search by report ID or customer name..."
//                       aria-label="Search reports by ID or customer name"
//                       className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
//                     />

//                     {search && (
//                       <button
//                         type="button"
//                         onClick={() => {
//                           setSearch("");
//                           setAppliedSearch("");
//                         }}
//                         aria-label="Clear search"
//                         className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
//                       >
//                         <X className="size-4" />
//                       </button>
//                     )}
//                   </div>

//                   {/* Search button */}
//                   <Button
//                     type="button"
//                     onClick={() => setAppliedSearch(search.trim())}
//                   >
//                     <Search className="mr-2 size-4" />
//                   </Button>

//                   {/* Reset filters */}
//                   <Button
//                     type="button"
//                     variant="outline"
//                     onClick={resetFilters}
//                     disabled={filtersAreAtDefault}
//                   >
//                     Reset filters
//                   </Button>
//                 </CardContent>
//               </Card>
//             )}

//             {/* Recent audits */}
//             {canAccessAudit && (!isSearching || audits.length > 0) && (
//               <Card className="mt-8 shadow-sm">
//                 <CardHeader className="flex flex-row items-center justify-between">
//                   <div>
//                     <CardTitle>Recent audits</CardTitle>
//                     <p className="mt-1 text-sm text-muted-foreground">
//                       Your latest inspection activity
//                     </p>
//                   </div>

//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => router.push("/employee/audits/new")}
//                   >
//                     <Plus data-icon="inline-start" />
//                     New audit
//                   </Button>
//                 </CardHeader>

//                 <CardContent>
//                   {audits.length === 0 ? (
//                     <div className="py-10 text-center text-sm text-muted-foreground">
//                       {isSearching
//                         ? "No audits match your search."
//                         : "No audits found for the selected date."}
//                     </div>
//                   ) : (
//                     renderReportsTable(audits, "audit")
//                   )}
//                 </CardContent>
//               </Card>
//             )}

//             {/* Recent service reports */}
//             {canAccessServiceReport &&
//               (!isSearching || serviceReports.length > 0) && (
//                 <Card className="mt-8 shadow-sm">
//                   <CardHeader className="flex flex-row items-center justify-between">
//                     <div>
//                       <CardTitle>Recent service reports</CardTitle>
//                       <p className="mt-1 text-sm text-muted-foreground">
//                         Your latest equipment service activity
//                       </p>
//                     </div>

//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() =>
//                         router.push("/employee/service-reports/new")
//                       }
//                     >
//                       <Plus data-icon="inline-start" />
//                       New Report
//                     </Button>
//                   </CardHeader>

//                   <CardContent>
//                     {serviceReports.length === 0 ? (
//                       <div className="py-10 text-center text-sm text-muted-foreground">
//                         {isSearching
//                           ? "No service reports match your search."
//                           : "No service reports found for the selected date."}
//                       </div>
//                     ) : (
//                       renderReportsTable(serviceReports, "service")
//                     )}
//                   </CardContent>
//                 </Card>
//               )}

//             {/* Recent Daily Accent Reports */}
//             {canAccessDailyAccentReport &&
//               (!isSearching || dailyAccentReports.length > 0) && (
//                 <Card className="mt-8 shadow-sm">
//                   <CardHeader className="flex flex-row items-center justify-between">
//                     <div>
//                       <CardTitle>Recent Daily Accent Reports</CardTitle>
//                       <p className="mt-1 text-sm text-muted-foreground">
//                         Your latest daily report activity
//                       </p>
//                     </div>

//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() =>
//                         router.push("/employee/daily-accent-report/new")
//                       }
//                     >
//                       <Plus data-icon="inline-start" />
//                       New Report
//                     </Button>
//                   </CardHeader>

//                   <CardContent>
//                     {dailyAccentReports.length === 0 ? (
//                       <div className="py-10 text-center text-sm text-muted-foreground">
//                         {isSearching
//                           ? "No Daily Accent Reports match your search."
//                           : "No Daily Accent Reports found for the selected date."}
//                       </div>
//                     ) : (
//                       renderReportsTable(dailyAccentReports, "daily-accent")
//                     )}
//                   </CardContent>
//                 </Card>
//               )}

//             {/* No permissions */}
//             {!canAccessAudit &&
//               !canAccessServiceReport &&
//               !canAccessDailyAccentReport && (
//                 <Card className="mt-8 shadow-sm">
//                   <CardContent className="py-12 text-center">
//                     <ClipboardCheck className="mx-auto size-10 text-muted-foreground" />

//                     <h2 className="mt-4 text-lg font-semibold">
//                       No report access assigned
//                     </h2>

//                     <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
//                       Your account does not currently have permission to use
//                       Audit Reports, Service Reports, or Daily Accent Reports.
//                       Please contact your administrator.
//                     </p>
//                   </CardContent>
//                 </Card>
//               )}
//           </>
//         )}
//       </main>
//     </AppShell>
//   );
// }

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
//   CalendarDays,
//   X,
// } from "lucide-react";

// import { AppShell } from "@/components/app-shell";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// type CurrentUser = {
//   id: string;
//   name: string;
//   username: string;
//   role: "auditor";
//   canAccessAudit: boolean;
//   canAccessServiceReport: boolean;
//   canAccessDailyAccentReport: boolean;
// };

// type Report = {
//   id: string;
//   status?: string;
//   score?: number | null;
//   customerName?: string;
//   customerAddress?: string;
//   createdAt?: string;
//   updatedAt?: string;
//   submittedAt?: string | null;
//   formData?: Record<string, unknown>;
// };

// function getTodayLocalDate() {
//   const today = new Date();
//   const year = today.getFullYear();
//   const month = String(today.getMonth() + 1).padStart(2, "0");
//   const day = String(today.getDate()).padStart(2, "0");

//   return `${year}-${month}-${day}`;
// }

// function normalizeStatus(report: Report) {
//   return String(report.status ?? "DRAFT").toUpperCase();
// }

// export default function Employee() {
//   const router = useRouter();

//   const [audits, setAudits] = useState<Report[]>([]);
//   const [serviceReports, setServiceReports] = useState<Report[]>([]);
//   const [dailyAccentReports, setDailyAccentReports] = useState<Report[]>([]);
//   const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

//   // Profile loading and report loading are separate.
//   const [loading, setLoading] = useState(true);
//   const [reportsLoading, setReportsLoading] = useState(false);
//   const [loadError, setLoadError] = useState("");

//   // Search input and applied search are deliberately separate.
//   const [search, setSearch] = useState("");
//   const [appliedSearch, setAppliedSearch] = useState("");

//   const [selectedDate, setSelectedDate] = useState(getTodayLocalDate);

//   const canAccessAudit = currentUser?.canAccessAudit ?? false;
//   const canAccessServiceReport =
//     currentUser?.canAccessServiceReport ?? false;
//   const canAccessDailyAccentReport =
//     currentUser?.canAccessDailyAccentReport ?? false;

//   const isSearching = appliedSearch.trim().length > 0;

//   // Effect 1: Fetch the employee profile only once.
//   useEffect(() => {
//     let cancelled = false;

//     async function loadCurrentUser() {
//       try {
//         const response = await fetch("/api/auth/me", {
//           cache: "no-store",
//         });

//         if (!response.ok) {
//           if (!cancelled) router.replace("/login");
//           return;
//         }

//         const data = await response.json();

//         const user: CurrentUser = {
//           id: String(data.id ?? ""),
//           name: String(data.name ?? "Employee"),
//           username: String(data.username ?? ""),
//           role: "auditor",
//           canAccessAudit: data.canAccessAudit === true,
//           canAccessServiceReport:
//             data.canAccessServiceReport === true,
//           canAccessDailyAccentReport:
//             data.canAccessDailyAccentReport === true,
//         };

//         if (!cancelled) {
//           setCurrentUser(user);
//         }
//       } catch (error) {
//         console.error("Failed to load employee profile:", error);

//         if (!cancelled) {
//           setLoadError("Failed to load your employee profile.");
//         }
//       } finally {
//         if (!cancelled) {
//           setLoading(false);
//         }
//       }
//     }

//     void loadCurrentUser();

//     return () => {
//       cancelled = true;
//     };
//   }, [router]);

//   // Effect 2: Fetch reports whenever the applied filters change.
//   // The dashboard sections remain mounted while reports load.
//   useEffect(() => {
//     if (!currentUser) return;

//     let cancelled = false;

//     async function loadReports() {
//       setReportsLoading(true);
//       setLoadError("");

//       try {
//         const params = new URLSearchParams();

//         if (appliedSearch.trim()) {
//           params.set("search", appliedSearch.trim());
//         }

//         if (selectedDate) {
//           params.set("date", selectedDate);
//         }

//         const suffix = params.toString()
//           ? `?${params.toString()}`
//           : "";

//         const [auditResponse, serviceResponse, dailyResponse] =
//           await Promise.all([
//             currentUser.canAccessAudit
//               ? fetch(`/api/audits${suffix}`, {
//                   cache: "no-store",
//                 })
//               : Promise.resolve(null),

//             currentUser.canAccessServiceReport
//               ? fetch(`/api/service-reports${suffix}`, {
//                   cache: "no-store",
//                 })
//               : Promise.resolve(null),

//             currentUser.canAccessDailyAccentReport
//               ? fetch(`/api/daily-accent-report${suffix}`, {
//                   cache: "no-store",
//                 })
//               : Promise.resolve(null),
//           ]);

//         const responses = [
//           auditResponse,
//           serviceResponse,
//           dailyResponse,
//         ];

//         if (responses.some((response) => response?.status === 401)) {
//           if (!cancelled) router.replace("/login");
//           return;
//         }

//         if (auditResponse && !auditResponse.ok) {
//           throw new Error("Failed to load audits.");
//         }

//         if (serviceResponse && !serviceResponse.ok) {
//           throw new Error("Failed to load service reports.");
//         }

//         if (dailyResponse && !dailyResponse.ok) {
//           throw new Error("Failed to load Daily Accent Reports.");
//         }

//         const [auditData, serviceData, dailyData] =
//           await Promise.all([
//             auditResponse
//               ? auditResponse.json()
//               : Promise.resolve([]),

//             serviceResponse
//               ? serviceResponse.json()
//               : Promise.resolve([]),

//             dailyResponse
//               ? dailyResponse.json()
//               : Promise.resolve([]),
//           ]);

//         if (cancelled) return;

//         setAudits(Array.isArray(auditData) ? auditData : []);
//         setServiceReports(
//           Array.isArray(serviceData) ? serviceData : [],
//         );
//         setDailyAccentReports(
//           Array.isArray(dailyData) ? dailyData : [],
//         );
//       } catch (error) {
//         console.error("Failed to load reports:", error);

//         if (!cancelled) {
//           setLoadError(
//             error instanceof Error
//               ? error.message
//               : "Failed to load reports.",
//           );
//         }
//       } finally {
//         if (!cancelled) {
//           setReportsLoading(false);
//         }
//       }
//     }

//     void loadReports();

//     return () => {
//       cancelled = true;
//     };
//   }, [currentUser, appliedSearch, selectedDate, router]);

//   const completedAudits = audits.filter(
//     (report) => normalizeStatus(report) === "COMPLETED",
//   );

//   const completedServiceReports = serviceReports.filter(
//     (report) => normalizeStatus(report) === "COMPLETED",
//   );

//   const completedDailyAccentReports = dailyAccentReports.filter(
//     (report) => normalizeStatus(report) === "COMPLETED",
//   );

//   const totalFormsCompleted =
//     (canAccessAudit ? completedAudits.length : 0) +
//     (canAccessServiceReport ? completedServiceReports.length : 0) +
//     (canAccessDailyAccentReport
//       ? completedDailyAccentReports.length
//       : 0);

//   const averageScore = completedAudits.length
//     ? Math.round(
//         completedAudits.reduce(
//           (sum, report) => sum + Number(report.score ?? 0),
//           0,
//         ) / completedAudits.length,
//       )
//     : 0;

//   const stats = [
//     ...(canAccessAudit ||
//     canAccessServiceReport ||
//     canAccessDailyAccentReport
//       ? [
//           {
//             label: "Total Forms Completed",
//             value: totalFormsCompleted,
//             icon: ClipboardCheck,
//             tone: "bg-teal-50 text-teal-700",
//           },
//         ]
//       : []),

//     ...(canAccessAudit
//       ? [
//           {
//             label: "Completed audits",
//             value: completedAudits.length,
//             icon: FileText,
//             tone: "bg-emerald-50 text-emerald-700",
//           },
//         ]
//       : []),

//     ...(canAccessServiceReport
//       ? [
//           {
//             label: "Service reports",
//             value: serviceReports.length,
//             icon: Wrench,
//             tone: "bg-sky-50 text-sky-700",
//           },
//         ]
//       : []),

//     ...(canAccessDailyAccentReport
//       ? [
//           {
//             label: "Daily Accent Reports",
//             value: dailyAccentReports.length,
//             icon: FileText,
//             tone: "bg-violet-50 text-violet-700",
//           },
//         ]
//       : []),
//   ];

//   const employeeName = currentUser?.name || "Employee";

//   function formatDate(value?: string) {
//     if (!value) return "—";

//     const date = new Date(value);

//     return Number.isNaN(date.getTime())
//       ? "—"
//       : date.toLocaleDateString("en-GB");
//   }

//   function renderReportsTable(
//     reports: Report[],
//     type: "audit" | "service" | "daily-accent",
//   ) {
//     const isAudit = type === "audit";
//     const isDailyAccent = type === "daily-accent";

//     return (
//       <div className="overflow-x-auto">
//         <table className="w-full min-w-[650px] text-left text-sm">
//           <thead>
//             <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
//               <th className="px-3 py-3 font-medium">
//                 {isAudit
//                   ? "Audit ID"
//                   : isDailyAccent
//                     ? "Daily Accent ID"
//                     : "Report ID"}
//               </th>
//               <th className="px-3 py-3 font-medium">Customer</th>
//               <th className="px-3 py-3 font-medium">Location</th>
//               <th className="px-3 py-3 font-medium">Date</th>
//               <th className="px-3 py-3 font-medium">Status</th>
//               <th className="px-3 py-3 font-medium" />
//             </tr>
//           </thead>

//           <tbody>
//             {reports.map((report) => {
//               const status = normalizeStatus(report);

//               // Drafts use their creation date; completed reports
//               // use their submission date when available.
//               const reportDate =
//                 status === "DRAFT"
//                   ? report.createdAt
//                   : report.submittedAt || report.createdAt;

//               return (
//                 <tr
//                   key={report.id}
//                   className="border-b transition last:border-0 hover:bg-muted/40"
//                 >
//                   <td className="px-3 py-4 font-semibold text-primary">
//                     {report.id}
//                   </td>

//                   <td className="px-3 py-4 font-medium">
//                     {report.customerName ||
//                       String(
//                         report.formData?.["customer-name"] ?? "—",
//                       )}
//                   </td>

//                   <td className="px-3 py-4 text-muted-foreground">
//                     {report.customerAddress ||
//                       String(
//                         report.formData?.["customer-address"] ?? "—",
//                       )}
//                   </td>

//                   <td className="px-3 py-4 text-muted-foreground">
//                     {formatDate(
//                       reportDate ||
//                         String(
//                           report.formData?.["service-call-date"] ?? "",
//                         ),
//                     )}
//                   </td>

//                   <td className="px-3 py-4">
//                     <Badge
//                       variant={
//                         status === "COMPLETED"
//                           ? "default"
//                           : "secondary"
//                       }
//                     >
//                       {status}
//                     </Badge>
//                   </td>

//                   <td className="px-3 py-4 text-right">
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => {
//                         if (isAudit) {
//                           router.push(`/employee/audits/${report.id}`);
//                         } else if (isDailyAccent) {
//                           router.push(
//                             `/employee/daily-accent-report/${report.id}`,
//                           );
//                         } else {
//                           router.push(
//                             `/employee/service-reports/${report.id}`,
//                           );
//                         }
//                       }}
//                     >
//                       View
//                       <ArrowUpRight data-icon="inline-end" />
//                     </Button>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     );
//   }

//   function renderEmptyState(
//     reportType: "audits" | "service reports" | "Daily Accent Reports",
//   ) {
//     const message = isSearching
//       ? `No ${reportType} match your search.`
//       : `No ${reportType} found for the selected date.`;

//     return (
//       <div className="py-10 text-center">
//         <FileText className="mx-auto size-8 text-muted-foreground/60" />

//         <p className="mt-3 font-medium">No reports found</p>

//         <p className="mt-1 text-sm text-muted-foreground">
//           {message}
//         </p>
//       </div>
//     );
//   }

//   function resetFilters() {
//     setSearch("");
//     setAppliedSearch("");
//     setSelectedDate(getTodayLocalDate());
//   }

//   const filtersAreAtDefault =
//     !search &&
//     !appliedSearch &&
//     selectedDate === getTodayLocalDate();

//   return (
//     <AppShell>
//       <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
//         {/* Header */}
//         <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
//           <div>
//             <p className="text-sm font-semibold text-primary">
//               Employee workspace
//             </p>

//             <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
//               Welcome, {employeeName}
//             </h1>

//             <p className="mt-2 max-w-xl text-muted-foreground">
//               Manage your permitted inspections, audits, and service reports.
//             </p>
//           </div>

//           <div className="flex flex-wrap gap-3">
//             {canAccessServiceReport && (
//               <Button
//                 variant="outline"
//                 className="h-11 border-primary/25 bg-card"
//                 onClick={() =>
//                   router.push("/employee/service-reports/new")
//                 }
//               >
//                 <Wrench data-icon="inline-start" />
//                 New Service Report
//               </Button>
//             )}

//             {canAccessAudit && (
//               <Button
//                 variant="outline"
//                 className="h-11 border-primary/25 bg-card"
//                 onClick={() => router.push("/employee/audits/new")}
//               >
//                 <Plus data-icon="inline-start" />
//                 New Audit
//               </Button>
//             )}

//             {canAccessDailyAccentReport && (
//               <Button
//                 variant="outline"
//                 className="h-11 border-primary/25 bg-card"
//                 onClick={() =>
//                   router.push("/employee/daily-accent-report/new")
//                 }
//               >
//                 <FileText data-icon="inline-start" />
//                 New Daily Accent Report
//               </Button>
//             )}
//           </div>
//         </div>

//         {/* Initial profile loading */}
//         {loading && (
//           <div
//             role="status"
//             className="mt-8 flex items-center justify-center gap-3 rounded-xl border bg-card p-8 text-sm text-muted-foreground"
//           >
//             <span className="size-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
//             Loading your workspace...
//           </div>
//         )}

//         {/* Profile error */}
//         {!loading && loadError && !currentUser && (
//           <div
//             role="alert"
//             className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-5"
//           >
//             <p className="font-medium text-destructive">{loadError}</p>

//             <Button
//               className="mt-3"
//               variant="outline"
//               onClick={() => window.location.reload()}
//             >
//               Try again
//             </Button>
//           </div>
//         )}

//         {!loading && currentUser && (
//           <>
//             {/* Report-loading indicator: doesn't hide any section */}
//             {reportsLoading && (
//               <div
//                 role="status"
//                 className="mt-6 flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground"
//               >
//                 <span className="size-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
//                 Updating reports...
//               </div>
//             )}

//             {/* Report loading error: preserve the dashboard */}
//             {loadError && (
//               <div
//                 role="alert"
//                 className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
//               >
//                 <p className="text-sm text-destructive">{loadError}</p>

//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => window.location.reload()}
//                 >
//                   Try again
//                 </Button>
//               </div>
//             )}

//             {/* Quick actions */}
//             {(canAccessAudit ||
//               canAccessServiceReport ||
//               canAccessDailyAccentReport) && (
//               <div
//                 className={`mt-8 grid gap-4 ${
//                   Number(canAccessAudit) +
//                     Number(canAccessServiceReport) +
//                     Number(canAccessDailyAccentReport) >=
//                   2
//                     ? "md:grid-cols-2 lg:grid-cols-3"
//                     : "md:grid-cols-1"
//                 }`}
//               >
//                 {canAccessAudit && (
//                   <button
//                     onClick={() => router.push("/employee/audits/new")}
//                     className="teal-wash app-surface group rounded-xl p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
//                   >
//                     <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
//                       <ClipboardCheck />
//                     </span>

//                     <p className="mt-5 text-lg font-semibold">
//                       Start a new audit
//                     </p>

//                     <p className="mt-1 text-sm text-muted-foreground">
//                       Create a safety inspection checklist for a customer site.
//                     </p>

//                     <span className="mt-5 inline-flex items-center text-sm font-semibold text-primary">
//                       Start audit
//                       <ArrowUpRight className="ml-1" />
//                     </span>
//                   </button>
//                 )}

//                 {canAccessServiceReport && (
//                   <button
//                     onClick={() =>
//                       router.push("/employee/service-reports/new")
//                     }
//                     className="app-surface rounded-xl border border-sky-200 bg-sky-50/70 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
//                   >
//                     <span className="flex size-11 items-center justify-center rounded-xl bg-sky-600 text-white">
//                       <Wrench />
//                     </span>

//                     <p className="mt-5 text-lg font-semibold">
//                       New service report
//                     </p>

//                     <p className="mt-1 text-sm text-muted-foreground">
//                       Record equipment service and maintenance activity.
//                     </p>

//                     <span className="mt-5 inline-flex items-center text-sm font-semibold text-sky-700">
//                       Start service report
//                       <ArrowUpRight className="ml-1" />
//                     </span>
//                   </button>
//                 )}

//                 {canAccessDailyAccentReport && (
//                   <button
//                     onClick={() =>
//                       router.push("/employee/daily-accent-report/new")
//                     }
//                     className="app-surface rounded-xl border border-violet-200 bg-violet-50/70 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
//                   >
//                     <span className="flex size-11 items-center justify-center rounded-xl bg-violet-600 text-white">
//                       <FileText />
//                     </span>

//                     <p className="mt-5 text-lg font-semibold">
//                       Daily Accent Report
//                     </p>

//                     <p className="mt-1 text-sm text-muted-foreground">
//                       Record and submit your daily accent report.
//                     </p>

//                     <span className="mt-5 inline-flex items-center text-sm font-semibold text-violet-700">
//                       Create daily report
//                       <ArrowUpRight className="ml-1" />
//                     </span>
//                   </button>
//                 )}
//               </div>
//             )}

//             {/* Statistics */}
//             {stats.length > 0 && (
//               <div
//                 className={`mt-6 grid grid-cols-2 gap-4 ${
//                   stats.length === 1
//                     ? "lg:grid-cols-1"
//                     : stats.length === 2
//                       ? "lg:grid-cols-2"
//                       : stats.length === 3
//                         ? "lg:grid-cols-3"
//                         : "lg:grid-cols-4"
//                 }`}
//               >
//                 {stats.map(({ label, value, icon: Icon, tone }) => (
//                   <Card key={label} className="shadow-sm">
//                     <CardContent className="p-5">
//                       <span
//                         className={`flex size-9 items-center justify-center rounded-lg ${tone}`}
//                       >
//                         <Icon className="size-5" />
//                       </span>

//                       <p className="mt-4 text-sm text-muted-foreground">
//                         {label}
//                       </p>

//                       <p className="mt-1 text-2xl font-bold">{value}</p>
//                     </CardContent>
//                   </Card>
//                 ))}
//               </div>
//             )}

//             {/* Search and date filters */}
//             {(canAccessAudit ||
//               canAccessServiceReport ||
//               canAccessDailyAccentReport) && (
//               <Card className="mt-8 shadow-sm">
//                 <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
//                   <div className="relative w-full sm:w-52">
//                     <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

//                     <input
//                       type="date"
//                       value={selectedDate}
//                       onChange={(event) =>
//                         setSelectedDate(event.target.value)
//                       }
//                       aria-label="Filter reports by date"
//                       className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
//                     />
//                   </div>

//                   <div className="relative flex-1">
//                     <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

//                     <input
//                       type="search"
//                       value={search}
//                       onChange={(event) => setSearch(event.target.value)}
//                       onKeyDown={(event) => {
//                         if (event.key === "Enter") {
//                           event.preventDefault();
//                           setAppliedSearch(search.trim());
//                         }
//                       }}
//                       placeholder="Search by report ID or customer name..."
//                       aria-label="Search reports by ID or customer name"
//                       className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
//                     />

//                     {search && (
//                       <button
//                         type="button"
//                         onClick={() => {
//                           setSearch("");
//                           setAppliedSearch("");
//                         }}
//                         aria-label="Clear search"
//                         className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
//                       >
//                         <X className="size-4" />
//                       </button>
//                     )}
//                   </div>

//                   <Button
//                     type="button"
//                     onClick={() => setAppliedSearch(search.trim())}
//                     aria-label="Search reports"
//                   >
//                     <Search className="mr-2 size-4" />
//                     Search
//                   </Button>

//                   <Button
//                     type="button"
//                     variant="outline"
//                     onClick={resetFilters}
//                     disabled={filtersAreAtDefault}
//                   >
//                     Reset filters
//                   </Button>
//                 </CardContent>
//               </Card>
//             )}

//             {/* Recent audits: always visible when permitted */}
//             {canAccessAudit && (
//               <Card className="mt-8 shadow-sm">
//                 <CardHeader className="flex flex-row items-center justify-between">
//                   <div>
//                     <CardTitle>Recent audits</CardTitle>
//                     <p className="mt-1 text-sm text-muted-foreground">
//                       Your latest inspection activity
//                     </p>
//                   </div>

//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => router.push("/employee/audits/new")}
//                   >
//                     <Plus data-icon="inline-start" />
//                     New audit
//                   </Button>
//                 </CardHeader>

//                 <CardContent>
//                   {audits.length === 0
//                     ? renderEmptyState("audits")
//                     : renderReportsTable(audits, "audit")}
//                 </CardContent>
//               </Card>
//             )}

//             {/* Recent service reports: always visible when permitted */}
//             {canAccessServiceReport && (
//               <Card className="mt-8 shadow-sm">
//                 <CardHeader className="flex flex-row items-center justify-between">
//                   <div>
//                     <CardTitle>Recent service reports</CardTitle>
//                     <p className="mt-1 text-sm text-muted-foreground">
//                       Your latest equipment service activity
//                     </p>
//                   </div>

//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() =>
//                       router.push("/employee/service-reports/new")
//                     }
//                   >
//                     <Plus data-icon="inline-start" />
//                     New Report
//                   </Button>
//                 </CardHeader>

//                 <CardContent>
//                   {serviceReports.length === 0
//                     ? renderEmptyState("service reports")
//                     : renderReportsTable(serviceReports, "service")}
//                 </CardContent>
//               </Card>
//             )}

//             {/* Recent Daily Accent Reports: always visible when permitted */}
//             {canAccessDailyAccentReport && (
//               <Card className="mt-8 shadow-sm">
//                 <CardHeader className="flex flex-row items-center justify-between">
//                   <div>
//                     <CardTitle>Recent Daily Accent Reports</CardTitle>
//                     <p className="mt-1 text-sm text-muted-foreground">
//                       Your latest daily report activity
//                     </p>
//                   </div>

//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() =>
//                       router.push("/employee/daily-accent-report/new")
//                     }
//                   >
//                     <Plus data-icon="inline-start" />
//                     New Report
//                   </Button>
//                 </CardHeader>

//                 <CardContent>
//                   {dailyAccentReports.length === 0
//                     ? renderEmptyState("Daily Accent Reports")
//                     : renderReportsTable(
//                         dailyAccentReports,
//                         "daily-accent",
//                       )}
//                 </CardContent>
//               </Card>
//             )}

//             {/* No permissions */}
//             {!canAccessAudit &&
//               !canAccessServiceReport &&
//               !canAccessDailyAccentReport && (
//                 <Card className="mt-8 shadow-sm">
//                   <CardContent className="py-12 text-center">
//                     <ClipboardCheck className="mx-auto size-10 text-muted-foreground" />

//                     <h2 className="mt-4 text-lg font-semibold">
//                       No report access assigned
//                     </h2>

//                     <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
//                       Your account does not currently have permission to use
//                       Audit Reports, Service Reports, or Daily Accent Reports.
//                       Please contact your administrator.
//                     </p>
//                   </CardContent>
//                 </Card>
//               )}
//           </>
//         )}
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
  CalendarDays,
  X,
  Loader2,
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

type CurrentUser = {
  id: string;
  name: string;
  username: string;
  role: "auditor";
  canAccessAudit: boolean;
  canAccessServiceReport: boolean;
  canAccessDailyAccentReport: boolean;
};

type Report = {
  id: string;
  status?: string;
  score?: number | null;
  customerName?: string;
  customerAddress?: string;
  createdAt?: string;
  updatedAt?: string;
  submittedAt?: string | null;
  formData?: Record<string, unknown>;
};

function getTodayLocalDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeStatus(report: Report) {
  return String(report.status ?? "DRAFT").toUpperCase();
}

export default function Employee() {
  const router = useRouter();

  const [audits, setAudits] = useState<Report[]>([]);
  const [serviceReports, setServiceReports] = useState<Report[]>([]);
  const [dailyAccentReports, setDailyAccentReports] = useState<Report[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [selectedDate, setSelectedDate] = useState(getTodayLocalDate);

  const canAccessAudit = currentUser?.canAccessAudit ?? false;
  const canAccessServiceReport =
    currentUser?.canAccessServiceReport ?? false;
  const canAccessDailyAccentReport =
    currentUser?.canAccessDailyAccentReport ?? false;

  const isSearching = appliedSearch.trim().length > 0;

  // Load employee profile once.
  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (!cancelled) router.replace("/login");
          return;
        }

        const data = await response.json();

        const user: CurrentUser = {
          id: String(data.id ?? ""),
          name: String(data.name ?? "Employee"),
          username: String(data.username ?? ""),
          role: "auditor",
          canAccessAudit: data.canAccessAudit === true,
          canAccessServiceReport:
            data.canAccessServiceReport === true,
          canAccessDailyAccentReport:
            data.canAccessDailyAccentReport === true,
        };

        if (!cancelled) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Failed to load employee profile:", error);

        if (!cancelled) {
          setLoadError("Failed to load your employee profile.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Load reports whenever the applied search or selected date changes.
  useEffect(() => {
    if (!currentUser) return;

    let cancelled = false;

    async function loadReports() {
      setReportsLoading(true);
      setLoadError("");

      try {
        const params = new URLSearchParams();

        if (appliedSearch.trim()) {
          params.set("search", appliedSearch.trim());
        }

        if (selectedDate) {
          params.set("date", selectedDate);
        }

        const suffix = params.toString()
          ? `?${params.toString()}`
          : "";

        const [auditResponse, serviceResponse, dailyResponse] =
          await Promise.all([
            currentUser.canAccessAudit
              ? fetch(`/api/audits${suffix}`, {
                  cache: "no-store",
                })
              : Promise.resolve(null),

            currentUser.canAccessServiceReport
              ? fetch(`/api/service-reports${suffix}`, {
                  cache: "no-store",
                })
              : Promise.resolve(null),

            currentUser.canAccessDailyAccentReport
              ? fetch(`/api/daily-accent-report${suffix}`, {
                  cache: "no-store",
                })
              : Promise.resolve(null),
          ]);

        const responses = [
          auditResponse,
          serviceResponse,
          dailyResponse,
        ];

        if (responses.some((response) => response?.status === 401)) {
          if (!cancelled) router.replace("/login");
          return;
        }

        if (auditResponse && !auditResponse.ok) {
          throw new Error("Failed to load audits.");
        }

        if (serviceResponse && !serviceResponse.ok) {
          throw new Error("Failed to load service reports.");
        }

        if (dailyResponse && !dailyResponse.ok) {
          throw new Error("Failed to load Daily Accent Reports.");
        }

        const [auditData, serviceData, dailyData] =
          await Promise.all([
            auditResponse
              ? auditResponse.json()
              : Promise.resolve([]),

            serviceResponse
              ? serviceResponse.json()
              : Promise.resolve([]),

            dailyResponse
              ? dailyResponse.json()
              : Promise.resolve([]),
          ]);

        if (cancelled) return;

        setAudits(Array.isArray(auditData) ? auditData : []);
        setServiceReports(
          Array.isArray(serviceData) ? serviceData : [],
        );
        setDailyAccentReports(
          Array.isArray(dailyData) ? dailyData : [],
        );
      } catch (error) {
        console.error("Failed to load reports:", error);

        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Failed to load reports.",
          );
        }
      } finally {
        if (!cancelled) {
          setReportsLoading(false);
        }
      }
    }

    void loadReports();

    return () => {
      cancelled = true;
    };
  }, [currentUser, appliedSearch, selectedDate, router]);

  const completedAudits = audits.filter(
    (report) => normalizeStatus(report) === "COMPLETED",
  );

  const completedServiceReports = serviceReports.filter(
    (report) => normalizeStatus(report) === "COMPLETED",
  );

  const completedDailyAccentReports = dailyAccentReports.filter(
    (report) => normalizeStatus(report) === "COMPLETED",
  );

  const totalFormsCompleted =
    (canAccessAudit ? completedAudits.length : 0) +
    (canAccessServiceReport ? completedServiceReports.length : 0) +
    (canAccessDailyAccentReport
      ? completedDailyAccentReports.length
      : 0);

  const averageScore = completedAudits.length
    ? Math.round(
        completedAudits.reduce(
          (sum, report) => sum + Number(report.score ?? 0),
          0,
        ) / completedAudits.length,
      )
    : 0;

  const stats = [
    ...(canAccessAudit ||
    canAccessServiceReport ||
    canAccessDailyAccentReport
      ? [
          {
            label: "Total Forms Completed",
            value: totalFormsCompleted,
            icon: ClipboardCheck,
            tone: "bg-teal-50 text-teal-700",
          },
        ]
      : []),

    ...(canAccessAudit
      ? [
          {
            label: "Completed audits",
            value: completedAudits.length,
            icon: FileText,
            tone: "bg-emerald-50 text-emerald-700",
          },
        ]
      : []),

    ...(canAccessServiceReport
      ? [
          {
            label: "Service reports",
            value: serviceReports.length,
            icon: Wrench,
            tone: "bg-sky-50 text-sky-700",
          },
        ]
      : []),

    ...(canAccessDailyAccentReport
      ? [
          {
            label: "Daily Accent Reports",
            value: dailyAccentReports.length,
            icon: FileText,
            tone: "bg-violet-50 text-violet-700",
          },
        ]
      : []),
  ];

  const employeeName = currentUser?.name || "Employee";

  function formatDate(value?: string) {
    if (!value) return "—";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleDateString("en-GB");
  }

  function renderReportsTable(
    reports: Report[],
    type: "audit" | "service" | "daily-accent",
  ) {
    const isAudit = type === "audit";
    const isDailyAccent = type === "daily-accent";

    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-3 font-medium">
                {isAudit
                  ? "Audit ID"
                  : isDailyAccent
                    ? "Daily Accent ID"
                    : "Report ID"}
              </th>
              <th className="px-3 py-3 font-medium">Customer</th>
              <th className="px-3 py-3 font-medium">Location</th>
              <th className="px-3 py-3 font-medium">Date</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium" />
            </tr>
          </thead>

          <tbody>
            {reports.map((report) => {
              const status = normalizeStatus(report);

              const reportDate =
                status === "DRAFT"
                  ? report.createdAt
                  : report.submittedAt || report.createdAt;

              return (
                <tr
                  key={report.id}
                  className="border-b transition last:border-0 hover:bg-muted/40"
                >
                  <td className="px-3 py-4 font-semibold text-primary">
                    {report.id}
                  </td>

                  <td className="px-3 py-4 font-medium">
                    {report.customerName ||
                      String(
                        report.formData?.["customer-name"] ?? "—",
                      )}
                  </td>

                  <td className="px-3 py-4 text-muted-foreground">
                    {report.customerAddress ||
                      String(
                        report.formData?.["customer-address"] ?? "—",
                      )}
                  </td>

                  <td className="px-3 py-4 text-muted-foreground">
                    {formatDate(
                      reportDate ||
                        String(
                          report.formData?.["service-call-date"] ?? "",
                        ),
                    )}
                  </td>

                  <td className="px-3 py-4">
                    <Badge
                      variant={
                        status === "COMPLETED"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {status}
                    </Badge>
                  </td>

                  <td className="px-3 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (isAudit) {
                          router.push(`/employee/audits/${report.id}`);
                        } else if (isDailyAccent) {
                          router.push(
                            `/employee/daily-accent-report/${report.id}`,
                          );
                        } else {
                          router.push(
                            `/employee/service-reports/${report.id}`,
                          );
                        }
                      }}
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
    );
  }

  function renderEmptyState(
    reportType: "audits" | "service reports" | "Daily Accent Reports",
  ) {
    const message = isSearching
      ? `No ${reportType} match your search.`
      : `No ${reportType} found for the selected date.`;

    return (
      <div className="py-10 text-center">
        <FileText className="mx-auto size-8 text-muted-foreground/60" />

        <p className="mt-3 font-medium">No reports found</p>

        <p className="mt-1 text-sm text-muted-foreground">
          {message}
        </p>
      </div>
    );
  }

  // Shared loading display for all report tables.
  function renderTableLoading(label: string) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-40 flex-col items-center justify-center gap-3 text-sm text-muted-foreground"
      >
        <Loader2
          className="size-7 animate-spin text-primary"
          aria-hidden="true"
        />
        <span>{label}</span>
      </div>
    );
  }

  function resetFilters() {
    setSearch("");
    setAppliedSearch("");
    setSelectedDate(getTodayLocalDate());
  }

  const filtersAreAtDefault =
    !search &&
    !appliedSearch &&
    selectedDate === getTodayLocalDate();

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold text-primary">
              Employee workspace
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome, {employeeName}
            </h1>

            <p className="mt-2 max-w-xl text-muted-foreground">
              Manage your permitted inspections, audits, and service reports.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {canAccessServiceReport && (
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
            )}

            {canAccessAudit && (
              <Button
                variant="outline"
                className="h-11 border-primary/25 bg-card"
                onClick={() => router.push("/employee/audits/new")}
              >
                <Plus data-icon="inline-start" />
                New Audit
              </Button>
            )}

            {canAccessDailyAccentReport && (
              <Button
                variant="outline"
                className="h-11 border-primary/25 bg-card"
                onClick={() =>
                  router.push("/employee/daily-accent-report/new")
                }
              >
                <FileText data-icon="inline-start" />
                New Daily Accent Report
              </Button>
            )}
          </div>
        </div>

        {/* Initial profile loading */}
        {loading && (
          <div
            role="status"
            className="mt-8 flex items-center justify-center gap-3 rounded-xl border bg-card p-8 text-sm text-muted-foreground"
          >
            <Loader2 className="size-5 animate-spin text-primary" />
            Loading your workspace...
          </div>
        )}

        {/* Profile error */}
        {!loading && loadError && !currentUser && (
          <div
            role="alert"
            className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-5"
          >
            <p className="font-medium text-destructive">{loadError}</p>

            <Button
              className="mt-3"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Try again
            </Button>
          </div>
        )}

        {!loading && currentUser && (
          <>
            {/* Report-loading indicator */}
            {reportsLoading && (
              <div
                role="status"
                aria-live="polite"
                className="mt-6 flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground"
              >
                <Loader2 className="size-4 animate-spin text-primary" />
                Updating reports...
              </div>
            )}

            {/* Report loading error */}
            {loadError && (
              <div
                role="alert"
                className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
              >
                <p className="text-sm text-destructive">{loadError}</p>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  Try again
                </Button>
              </div>
            )}

            {/* Quick actions */}
            {(canAccessAudit ||
              canAccessServiceReport ||
              canAccessDailyAccentReport) && (
              <div
                className={`mt-8 grid gap-4 ${
                  Number(canAccessAudit) +
                    Number(canAccessServiceReport) +
                    Number(canAccessDailyAccentReport) >=
                  2
                    ? "md:grid-cols-2 lg:grid-cols-3"
                    : "md:grid-cols-1"
                }`}
              >
                {canAccessAudit && (
                  <button
                    onClick={() => router.push("/employee/audits/new")}
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
                )}

                {canAccessServiceReport && (
                  <button
                    onClick={() =>
                      router.push("/employee/service-reports/new")
                    }
                    className="app-surface rounded-xl border border-sky-200 bg-sky-50/70 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
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
                )}

                {canAccessDailyAccentReport && (
                  <button
                    onClick={() =>
                      router.push("/employee/daily-accent-report/new")
                    }
                    className="app-surface rounded-xl border border-violet-200 bg-violet-50/70 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span className="flex size-11 items-center justify-center rounded-xl bg-violet-600 text-white">
                      <FileText />
                    </span>

                    <p className="mt-5 text-lg font-semibold">
                      Daily Accent Report
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Record and submit your daily accent report.
                    </p>

                    <span className="mt-5 inline-flex items-center text-sm font-semibold text-violet-700">
                      Create daily report
                      <ArrowUpRight className="ml-1" />
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Statistics */}
            {stats.length > 0 && (
              <div
                className={`mt-6 grid grid-cols-2 gap-4 ${
                  stats.length === 1
                    ? "lg:grid-cols-1"
                    : stats.length === 2
                      ? "lg:grid-cols-2"
                      : stats.length === 3
                        ? "lg:grid-cols-3"
                        : "lg:grid-cols-4"
                }`}
              >
                {stats.map(({ label, value, icon: Icon, tone }) => (
                  <Card key={label} className="shadow-sm">
                    <CardContent className="p-5">
                      <span
                        className={`flex size-9 items-center justify-center rounded-lg ${tone}`}
                      >
                        <Icon className="size-5" />
                      </span>

                      <p className="mt-4 text-sm text-muted-foreground">
                        {label}
                      </p>

                      <p className="mt-1 text-2xl font-bold">{value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Search and date filters */}
            {(canAccessAudit ||
              canAccessServiceReport ||
              canAccessDailyAccentReport) && (
              <Card className="mt-8 shadow-sm">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="relative w-full sm:w-52">
                    <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(event) =>
                        setSelectedDate(event.target.value)
                      }
                      aria-label="Filter reports by date"
                      className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          setAppliedSearch(search.trim());
                        }
                      }}
                      placeholder="Search by report ID or customer name..."
                      aria-label="Search reports by ID or customer name"
                      className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />

                    {search && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearch("");
                          setAppliedSearch("");
                        }}
                        aria-label="Clear search"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={() => setAppliedSearch(search.trim())}
                    disabled={reportsLoading}
                    aria-label="Search reports"
                  >
                    {reportsLoading ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Search className="mr-2 size-4" />
                    )}
                    {reportsLoading ? "Searching..." : "Search"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetFilters}
                    disabled={filtersAreAtDefault}
                  >
                    Reset filters
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Recent audits */}
            {canAccessAudit && (
              <Card className="mt-8 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent audits</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your latest inspection activity
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/employee/audits/new")}
                  >
                    <Plus data-icon="inline-start" />
                    New audit
                  </Button>
                </CardHeader>

                <CardContent aria-busy={reportsLoading}>
                  {reportsLoading
                    ? renderTableLoading("Loading audits...")
                    : audits.length === 0
                      ? renderEmptyState("audits")
                      : renderReportsTable(audits, "audit")}
                </CardContent>
              </Card>
            )}

            {/* Recent service reports */}
            {canAccessServiceReport && (
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

                <CardContent aria-busy={reportsLoading}>
                  {reportsLoading
                    ? renderTableLoading("Loading service reports...")
                    : serviceReports.length === 0
                      ? renderEmptyState("service reports")
                      : renderReportsTable(serviceReports, "service")}
                </CardContent>
              </Card>
            )}

            {/* Recent Daily Accent Reports */}
            {canAccessDailyAccentReport && (
              <Card className="mt-8 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Daily Accent Reports</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your latest daily report activity
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push("/employee/daily-accent-report/new")
                    }
                  >
                    <Plus data-icon="inline-start" />
                    New Report
                  </Button>
                </CardHeader>

                <CardContent aria-busy={reportsLoading}>
                  {reportsLoading
                    ? renderTableLoading(
                        "Loading Daily Accent Reports...",
                      )
                    : dailyAccentReports.length === 0
                      ? renderEmptyState("Daily Accent Reports")
                      : renderReportsTable(
                          dailyAccentReports,
                          "daily-accent",
                        )}
                </CardContent>
              </Card>
            )}

            {/* No permissions */}
            {!canAccessAudit &&
              !canAccessServiceReport &&
              !canAccessDailyAccentReport && (
                <Card className="mt-8 shadow-sm">
                  <CardContent className="py-12 text-center">
                    <ClipboardCheck className="mx-auto size-10 text-muted-foreground" />

                    <h2 className="mt-4 text-lg font-semibold">
                      No report access assigned
                    </h2>

                    <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                      Your account does not currently have permission to use
                      Audit Reports, Service Reports, or Daily Accent Reports.
                      Please contact your administrator.
                    </p>
                  </CardContent>
                </Card>
              )}
          </>
        )}
      </main>
    </AppShell>
  );
}