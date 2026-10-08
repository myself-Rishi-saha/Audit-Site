

// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   ArrowUpRight,
//   ClipboardCheck,
//   FileText,
//   LayoutTemplate,
//   Wrench,
// } from "lucide-react";

// import { AppShell } from "@/components/app-shell";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";

// export default function Admin() {
//   const [audits, setAudits] = useState<any[]>([]);
//   const [services, setServices] = useState<any[]>([]);
//   const router = useRouter();

//   useEffect(() => {
//     Promise.all([
//       fetch("/api/audits").then((r) => r.json()),
//       fetch("/api/service-reports").then((r) => r.json()),
//     ]).then(([auditData, serviceData]) => {
//       setAudits(Array.isArray(auditData) ? auditData : []);
//       setServices(Array.isArray(serviceData) ? serviceData : []);
//     });
//   }, []);

//   // Only completed audits
//   const completed = audits.filter(
//     (a) => a.status === "COMPLETED",
//   );

//   // Only completed service reports
//   const completedServices = services.filter(
//     (report) => report.status === "COMPLETED",
//   );

//   const average = completed.length
//     ? Math.round(
//         completed.reduce(
//           (sum, a) => sum + (a.score || 0),
//           0,
//         ) / completed.length,
//       )
//     : 0;

//   const stats = [
//     {
//       label: "Total audits",
//       value: audits.length,
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
//       value: audits.filter(
//         (a) => a.status === "DRAFT",
//       ).length,
//       icon: Wrench,
//       tone: "bg-amber-50 text-amber-700",
//     },
//     {
//       label: "Avg. compliance",
//       value: `${average}%`,
//       icon: ArrowUpRight,
//       tone: "bg-sky-50 text-sky-700",
//     },
//   ];

//   return (
//     <AppShell user="A. Sen · Admin">
//       <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
//         <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
//           <div>
//             <p className="text-sm font-semibold text-primary">
//               Administration
//             </p>

//             <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
//               Good morning, Admin
//             </h1>

//             <p className="mt-2 text-muted-foreground">
//               Overview of inspections and service activity.
//             </p>
//           </div>

//           <Button
//             variant="outline"
//             onClick={() =>
//               router.push("/admin/form-templates")
//             }
//           >
//             <LayoutTemplate data-icon="inline-start" />
//             Manage templates
//           </Button>
//         </div>

//         {/* Statistics */}
//         <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
//           {stats.map(({ label, value, icon: Icon, tone }) => (
//             <Card key={label} className="shadow-sm">
//               <CardContent className="p-5">
//                 <span
//                   className={`flex size-9 items-center justify-center rounded-lg ${tone}`}
//                 >
//                   <Icon />
//                 </span>

//                 <p className="mt-4 text-sm text-muted-foreground">
//                   {label}
//                 </p>

//                 <p className="mt-1 text-2xl font-bold">
//                   {value}
//                 </p>
//               </CardContent>
//             </Card>
//           ))}
//         </div>

//         {/* Completed Audits */}
//         <DataCard
//           className="mt-8"
//           title="Completed audits"
//           subtitle="Review completed inspection reports across the organization"
//           headers={[
//             "Audit ID",
//             "Employee",
//             "Customer",
//             "Location",
//             "Date",
//             "Status",
//             "Score",
//             "",
//           ]}
//         >
//           <>
//             {completed.map((audit) => (
//               <tr
//                 key={audit.id}
//                 className="border-b transition last:border-0 hover:bg-muted/40"
//               >
//                 <td className="px-3 py-4 font-semibold text-primary">
//                   {audit.id}
//                 </td>

//                 <td className="px-3 py-4">
//                   {audit.employee_name ||
//                     audit.employeeName ||
//                     "—"}
//                 </td>

//                 <td className="px-3 py-4 font-medium">
//                   {audit.customer || "—"}
//                 </td>

//                 <td className="px-3 py-4 text-muted-foreground">
//                   {audit.location || "—"}
//                 </td>

//                 <td className="px-3 py-4 text-muted-foreground">
//                   {audit.date || "—"}
//                 </td>

//                 <td className="px-3 py-4">
//                   <Badge variant="default">
//                     {audit.status}
//                   </Badge>
//                 </td>

//                 <td className="px-3 py-4 font-semibold">
//                   {audit.score != null
//                     ? `${audit.score}%`
//                     : "—"}
//                 </td>

//                 <td className="px-3 py-4 text-right">
//                   <Button
//                     size="sm"
//                     variant="ghost"
//                     onClick={() =>
//                       router.push(
//                         `/admin/audits/${audit.id}`,
//                       )
//                     }
//                   >
//                     View{" "}
//                     <ArrowUpRight data-icon="inline-end" />
//                   </Button>
//                 </td>
//               </tr>
//             ))}
//           </>
//         </DataCard>

//         {/* Completed Service Reports */}
//         <DataCard
//           className="mt-6"
//           title="Completed service reports"
//           subtitle="Review completed field service records"
//           headers={[
//             "Report ID",
//             "Customer",
//             "Engineer",
//             "Equipment",
//             "Date",
//             "Status",
//             "",
//           ]}
//         >
//           <>
//             {completedServices.map((report) => (
//               <tr
//                 key={report.id}
//                 className="border-b transition last:border-0 hover:bg-muted/40"
//               >
//                 <td className="px-3 py-4 font-semibold text-primary">
//                   {report.id}
//                 </td>

//                 <td className="px-3 py-4 font-medium">
//                   {report.formData?.["customer-name"] || "—"}
//                 </td>

//                 <td className="px-3 py-4">
//                   {report.formData?.["engineer-name"] || "—"}
//                 </td>

//                 <td className="px-3 py-4 text-muted-foreground">
//                   {report.formData?.["equipment"] || "—"}
//                 </td>

//                 <td className="px-3 py-4 text-muted-foreground">
//                   {report.formData?.["service-call-date"] || "—"}
//                 </td>

//                 <td className="px-3 py-4">
//                   <Badge variant="default">
//                     {report.status}
//                   </Badge>
//                 </td>

//                 <td className="px-3 py-4 text-right">
//                   <Button
//                     size="sm"
//                     onClick={() =>
//                       router.push(
//                         `/admin/service-reports/${report.id}`,
//                       )
//                     }
//                   >
//                     View &amp; Edit
//                   </Button>
//                 </td>
//               </tr>
//             ))}
//           </>
//         </DataCard>
//       </main>
//     </AppShell>
//   );
// }

// function DataCard({
//   title,
//   subtitle,
//   headers,
//   children,
//   className = "",
// }: any) {
//   return (
//     <Card className={`shadow-sm ${className}`}>
//       <CardHeader>
//         <CardTitle>{title}</CardTitle>

//         <p className="text-sm text-muted-foreground">
//           {subtitle}
//         </p>
//       </CardHeader>

//       <CardContent>
//         <div className="overflow-x-auto">
//           <table className="w-full min-w-[760px] text-left text-sm">
//             <thead>
//               <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
//                 {headers.map((head: string) => (
//                   <th
//                     className="px-3 py-3 font-medium"
//                     key={head}
//                   >
//                     {head}
//                   </th>
//                 ))}
//               </tr>
//             </thead>

//             <tbody>{children}</tbody>
//           </table>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ClipboardCheck,
  FileText,
  LayoutTemplate,
  Plus,
  UserRound,
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

export default function Admin() {
  const [audits, setAudits] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        const [auditResponse, serviceResponse] =
          await Promise.all([
            fetch("/api/audits", {
              cache: "no-store",
            }),
            fetch("/api/service-reports", {
              cache: "no-store",
            }),
          ]);

        if (auditResponse.ok) {
          const auditData = await auditResponse.json();

          setAudits(
            Array.isArray(auditData)
              ? auditData
              : [],
          );
        }

        if (serviceResponse.ok) {
          const serviceData =
            await serviceResponse.json();

          setServices(
            Array.isArray(serviceData)
              ? serviceData
              : [],
          );
        }
      } catch (error) {
        console.error(
          "Failed to load admin dashboard data:",
          error,
        );
      }
    }

    loadData();
  }, []);

  // ---------------------------------------
  // COMPLETED AUDITS
  // ---------------------------------------

  const completed = audits.filter(
    (audit) =>
      String(audit.status || "").toUpperCase() ===
      "COMPLETED",
  );

  // ---------------------------------------
  // COMPLETED SERVICE REPORTS
  // ---------------------------------------

  const completedServices = services.filter(
    (report) =>
      String(report.status || "").toUpperCase() ===
      "COMPLETED",
  );

  // ---------------------------------------
  // AVERAGE AUDIT SCORE
  // ---------------------------------------

  const average = completed.length
    ? Math.round(
        completed.reduce(
          (sum, audit) =>
            sum + Number(audit.score || 0),
          0,
        ) / completed.length,
      )
    : 0;

  // ---------------------------------------
  // STATISTICS
  // ---------------------------------------

  const stats = [
    {
      label: "Total audits",
      value: audits.length,
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
      label: "Drafts",
      value: audits.filter(
        (audit) =>
          String(audit.status || "").toUpperCase() ===
          "DRAFT",
      ).length,
      icon: Wrench,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Avg. compliance",
      value: `${average}%`,
      icon: ArrowUpRight,
      tone: "bg-sky-50 text-sky-700",
    },
  ];

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {/* ---------------------------------- */}
        {/* HEADER */}
        {/* ---------------------------------- */}

        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold text-primary">
              Administration
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Good morning, Admin
            </h1>

            <p className="mt-2 text-muted-foreground">
              Overview of inspections and service
              activity.
            </p>
          </div>

          {/* ADMIN QUICK ACTIONS */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="h-11"
              onClick={() =>
                router.push("/admin/add-employee")
              }
            >
              <UserRound data-icon="inline-start" />
              Add Employee
            </Button>

            <Button
              variant="outline"
              className="h-11"
              onClick={() =>
                router.push("/admin/add-customer")
              }
            >
              <Plus data-icon="inline-start" />
              Add Customer
            </Button>

            <Button
              variant="outline"
              className="h-11"
              onClick={() =>
                router.push("/admin/form-templates")
              }
            >
              <LayoutTemplate data-icon="inline-start" />
              Manage Templates
            </Button>
          </div>
        </div>

        {/* ---------------------------------- */}
        {/* STATISTICS */}
        {/* ---------------------------------- */}

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map(
            ({
              label,
              value,
              icon: Icon,
              tone,
            }) => (
              <Card
                key={label}
                className="shadow-sm"
              >
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
            ),
          )}
        </div>

        {/* ---------------------------------- */}
        {/* COMPLETED AUDITS */}
        {/* ---------------------------------- */}

        <DataCard
          className="mt-8"
          title="Completed audits"
          subtitle="Review completed inspection reports across the organization"
          headers={[
            "Audit ID",
            "Employee",
            "Customer",
            "Location",
            "Date",
            "Status",
            "",
          ]}
        >
          <>
            {completed.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-10 text-center text-sm text-muted-foreground"
                >
                  No completed audits yet.
                </td>
              </tr>
            ) : (
              completed.map((audit) => {
                const employee =
                  audit.employeeName ||
                  audit.employee_name ||
                  "—";

                const customer =
                  audit.customerName || "—";

                const location =
                  audit.customerAddress || "—";

                const date = audit?.createdAt
                  ? new Date(
                      audit.createdAt,
                    ).toLocaleDateString("en-GB")
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

                    <td className="px-3 py-4">
                      {employee}
                    </td>

                    <td className="px-3 py-4 font-medium">
                      {customer}
                    </td>

                    <td className="px-3 py-4 text-muted-foreground">
                      {location}
                    </td>

                    <td className="px-3 py-4 text-muted-foreground">
                      {date}
                    </td>

                    <td className="px-3 py-4">
                      <Badge variant="default">
                        {status}
                      </Badge>
                    </td>

                    {/* <td className="px-3 py-4 font-semibold">
                      {audit.score != null
                        ? `${audit.score}%`
                        : "—"}
                    </td> */}

                    <td className="px-3 py-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          router.push(
                            `/admin/audits/${audit.id}`,
                          )
                        }
                      >
                        View
                        <ArrowUpRight data-icon="inline-end" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </>
        </DataCard>

        {/* ---------------------------------- */}
        {/* COMPLETED SERVICE REPORTS */}
        {/* ---------------------------------- */}

        <DataCard
          className="mt-6"
          title="Completed service reports"
          subtitle="Review completed field service records"
          headers={[
            "Report ID",
            "Customer",
            "Engineer",
            "Equipment",
            "Date",
            "Status",
            "",
          ]}
        >
          <>
            {completedServices.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-10 text-center text-sm text-muted-foreground"
                >
                  No completed service reports yet.
                </td>
              </tr>
            ) : (
              completedServices.map((report) => {
                const customer =
                  report.customerName || "—";

                const engineer =
                  report.formData?.[
                    "engineer-name"
                  ] || "—";

                const equipment =
                  report.formData?.[
                    "equipment"
                  ] || "—";

                const date = report?.createdAt
                  ? new Date(
                      report.createdAt,
                    ).toLocaleDateString("en-GB")
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

                    <td className="px-3 py-4 font-medium">
                      {customer}
                    </td>

                    <td className="px-3 py-4">
                      {engineer}
                    </td>

                    <td className="px-3 py-4 text-muted-foreground">
                      {equipment}
                    </td>

                    <td className="px-3 py-4 text-muted-foreground">
                      {date}
                    </td>

                    <td className="px-3 py-4">
                      <Badge variant="default">
                        {status}
                      </Badge>
                    </td>

                    <td className="px-3 py-4 text-right">
                      <Button
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/admin/service-reports/${report.id}`,
                          )
                        }
                      >
                        View &amp; Edit
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </>
        </DataCard>
      </main>
    </AppShell>
  );
}

function DataCard({
  title,
  subtitle,
  headers,
  children,
  className = "",
}: {
  title: string;
  subtitle: string;
  headers: string[];
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`shadow-sm ${className}`}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>

        <p className="text-sm text-muted-foreground">
          {subtitle}
        </p>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                {headers.map((head, index) => (
                  <th
                    className="px-3 py-3 font-medium"
                    key={`${head}-${index}`}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>{children}</tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}