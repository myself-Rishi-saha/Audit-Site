// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
// ArrowUpRight,
// ClipboardCheck,
// FileText,
// LayoutTemplate,
// Wrench,
// } from "lucide-react";

// import { AppShell } from "@/components/app-shell";
// import {
// Card,
// CardContent,
// CardHeader,
// CardTitle,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";

// export default function Admin() {
// const [audits, setAudits] = useState<any[]>([]);
// const [services, setServices] = useState<any[]>([]);
// const router = useRouter();

// useEffect(() => {
// Promise.all([
// fetch("/api/audits").then((r) => r.json()),
// fetch("/api/service-reports").then((r) => r.json()),
// ]).then(([auditData, serviceData]) => {
// setAudits(auditData);
// setServices(serviceData);
// });
// }, []);

// // Only completed audits
// const completed = audits.filter((a) => a.status === "COMPLETED");

// const average = completed.length
// ? Math.round(
// completed.reduce((sum, a) => sum + (a.score || 0), 0) /
// completed.length,
// )
// : 0;

// const stats = [
// {
// label: "Total audits",
// value: audits.length,
// icon: ClipboardCheck,
// tone: "bg-teal-50 text-teal-700",
// },
// {
// label: "Completed",
// value: completed.length,
// icon: FileText,
// tone: "bg-emerald-50 text-emerald-700",
// },
// {
// label: "Drafts",
// value: audits.filter((a) => a.status === "DRAFT").length,
// icon: Wrench,
// tone: "bg-amber-50 text-amber-700",
// },
// {
// label: "Avg. compliance",
// value: `${average}%`,
// icon: ArrowUpRight,
// tone: "bg-sky-50 text-sky-700",
// },
// ];

// return ( <AppShell user="A. Sen · Admin"> <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8"> <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"> <div> <p className="text-sm font-semibold text-primary">
// Administration </p>
//         <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
//           Good morning, Admin
//         </h1>

//         <p className="mt-2 text-muted-foreground">
//           Overview of inspections and service activity.
//         </p>
//       </div>

//       <Button
//         variant="outline"
//         onClick={() => router.push("/admin/form-templates")}
//       >
//         <LayoutTemplate data-icon="inline-start" />
//         Manage templates
//       </Button>
//     </div>

//     {/* Statistics */}
//     <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
//       {stats.map(({ label, value, icon: Icon, tone }) => (
//         <Card key={label} className="shadow-sm">
//           <CardContent className="p-5">
//             <span
//               className={`flex size-9 items-center justify-center rounded-lg ${tone}`}
//             >
//               <Icon />
//             </span>

//             <p className="mt-4 text-sm text-muted-foreground">
//               {label}
//             </p>

//             <p className="mt-1 text-2xl font-bold">
//               {value}
//             </p>
//           </CardContent>
//         </Card>
//       ))}
//     </div>

//     {/* Completed Audits */}
//     <DataCard
//       className="mt-8"
//       title="Completed audits"
//       subtitle="Review completed inspection reports across the organization"
//       headers={[
//         "Audit ID",
//         "Employee",
//         "Customer",
//         "Location",
//         "Date",
//         "Status",
//         "Score",
//         "",
//       ]}
//     >
//       <>
//         {completed.map((audit) => (
//           <tr
//             key={audit.id}
//             className="border-b transition last:border-0 hover:bg-muted/40"
//           >
//             <td className="px-3 py-4 font-semibold text-primary">
//               {audit.id}
//             </td>

//             <td className="px-3 py-4">
//               {audit.employee_name || audit.employeeName}
//             </td>

//             <td className="px-3 py-4 font-medium">
//               {audit.customer}
//             </td>

//             <td className="px-3 py-4 text-muted-foreground">
//               {audit.location || "—"}
//             </td>

//             <td className="px-3 py-4 text-muted-foreground">
//               {audit.date}
//             </td>

//             <td className="px-3 py-4">
//               <Badge variant="default">
//                 {audit.status}
//               </Badge>
//             </td>

//             <td className="px-3 py-4 font-semibold">
//               {audit.score != null
//                 ? `${audit.score}%`
//                 : "—"}
//             </td>

//             <td className="px-3 py-4 text-right">
//               <Button
//                 size="sm"
//                 variant="ghost"
//                 onClick={() =>
//                   router.push(`/admin/audits/${audit.id}`)
//                 }
//               >
//                 View{" "}
//                 <ArrowUpRight data-icon="inline-end" />
//               </Button>
//             </td>
//           </tr>
//         ))}
//       </>
//     </DataCard>

//     {/* Service Reports */}
//     <DataCard
//       className="mt-6"
//       title="Recent service reports"
//       subtitle="Review and edit field service records"
//       headers={[
//         "Report ID",
//         "Customer",
//         "Engineer",
//         "Equipment",
//         "Date",
//         "Status",
//         "",
//       ]}
//     >
//       <>
//         {services.map((report) => (
//           <tr
//             key={report.id}
//             className="border-b transition last:border-0 hover:bg-muted/40"
//           >
//             <td className="px-3 py-4 font-semibold text-primary">
//               {report.id}
//             </td>

//             <td className="px-3 py-4 font-medium">
//               {report.customer}
//             </td>

//             <td className="px-3 py-4">
//               {report.engineer}
//             </td>

//             <td className="px-3 py-4 text-muted-foreground">
//               {report.equipment}
//             </td>

//             <td className="px-3 py-4 text-muted-foreground">
//               {report.date}
//             </td>

//             <td className="px-3 py-4">
//               <Badge
//                 variant={
//                   report.status === "COMPLETED"
//                     ? "default"
//                     : "secondary"
//                 }
//               >
//                 {report.status || "DRAFT"}
//               </Badge>
//             </td>

//             <td className="px-3 py-4 text-right">
//               <Button
//                 size="sm"
//                 onClick={() =>
//                   router.push(
//                     `/admin/service-reports/${report.id}`,
//                   )
//                 }
//               >
//                 View &amp; Edit
//               </Button>
//             </td>
//           </tr>
//         ))}
//       </>
//     </DataCard>
//   </main>
// </AppShell>

// );
// }

// function DataCard({
// title,
// subtitle,
// headers,
// children,
// className = "",
// }: any) {
// return (
// <Card className={`shadow-sm ${className}`}> <CardHeader> <CardTitle>{title}</CardTitle>

// ```
//     <p className="text-sm text-muted-foreground">
//       {subtitle}
//     </p>
//   </CardHeader>

//   <CardContent>
//     <div className="overflow-x-auto">
//       <table className="w-full min-w-[760px] text-left text-sm">
//         <thead>
//           <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
//             {headers.map((head: string) => (
//               <th
//                 className="px-3 py-3 font-medium"
//                 key={head}
//               >
//                 {head}
//               </th>
//             ))}
//           </tr>
//         </thead>

//         <tbody>{children}</tbody>
//       </table>
//     </div>
//   </CardContent>
// </Card>


// );
// }
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
ArrowUpRight,
ClipboardCheck,
FileText,
LayoutTemplate,
Wrench,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import {
Card,
CardContent,
CardHeader,
CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Admin() {
const [audits, setAudits] = useState<any[]>([]);
const [services, setServices] = useState<any[]>([]);
const router = useRouter();

useEffect(() => {
Promise.all([
fetch("/api/audits").then((r) => r.json()),
fetch("/api/service-reports").then((r) => r.json()),
]).then(([auditData, serviceData]) => {
setAudits(auditData);
setServices(serviceData);
});
}, []);

// Only completed audits
const completed = audits.filter((a) => a.status === "COMPLETED");

// Only completed service reports
const completedServices = services.filter(
(report) => report.status === "COMPLETED",
);

const average = completed.length
? Math.round(
completed.reduce((sum, a) => sum + (a.score || 0), 0) /
completed.length,
)
: 0;

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
value: audits.filter((a) => a.status === "DRAFT").length,
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

return ( <AppShell user="A. Sen · Admin"> <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8"> <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"> <div> <p className="text-sm font-semibold text-primary">
Administration </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Good morning, Admin
        </h1>

        <p className="mt-2 text-muted-foreground">
          Overview of inspections and service activity.
        </p>
      </div>

      <Button
        variant="outline"
        onClick={() => router.push("/admin/form-templates")}
      >
        <LayoutTemplate data-icon="inline-start" />
        Manage templates
      </Button>
    </div>

    {/* Statistics */}
    <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
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

    {/* Completed Audits */}
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
        "Score",
        "",
      ]}
    >
      <>
        {completed.map((audit) => (
          <tr
            key={audit.id}
            className="border-b transition last:border-0 hover:bg-muted/40"
          >
            <td className="px-3 py-4 font-semibold text-primary">
              {audit.id}
            </td>

            <td className="px-3 py-4">
              {audit.employee_name || audit.employeeName}
            </td>

            <td className="px-3 py-4 font-medium">
              {audit.customer}
            </td>

            <td className="px-3 py-4 text-muted-foreground">
              {audit.location || "—"}
            </td>

            <td className="px-3 py-4 text-muted-foreground">
              {audit.date}
            </td>

            <td className="px-3 py-4">
              <Badge variant="default">
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
                size="sm"
                variant="ghost"
                onClick={() =>
                  router.push(`/admin/audits/${audit.id}`)
                }
              >
                View{" "}
                <ArrowUpRight data-icon="inline-end" />
              </Button>
            </td>
          </tr>
        ))}
      </>
    </DataCard>

    {/* Completed Service Reports */}
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
        {completedServices.map((report) => (
          <tr
            key={report.id}
            className="border-b transition last:border-0 hover:bg-muted/40"
          >
            <td className="px-3 py-4 font-semibold text-primary">
              {report.id}
            </td>

            <td className="px-3 py-4 font-medium">
              {report.customer || "—"}
            </td>

            <td className="px-3 py-4">
              {report.engineer || "—"}
            </td>

            <td className="px-3 py-4 text-muted-foreground">
              {report.equipment || "—"}
            </td>

            <td className="px-3 py-4 text-muted-foreground">
              {report.date}
            </td>

            <td className="px-3 py-4">
              <Badge variant="default">
                {report.status}
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
        ))}
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
}: any) {
return (
<Card className={`shadow-sm ${className}`}> <CardHeader> <CardTitle>{title}</CardTitle>


    <p className="text-sm text-muted-foreground">
      {subtitle}
    </p>
  </CardHeader>

  <CardContent>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
            {headers.map((head: string) => (
              <th
                className="px-3 py-3 font-medium"
                key={head}
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
