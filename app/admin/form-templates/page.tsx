// "use client";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { FileCheck2, Wrench } from "lucide-react";
// import { AppShell } from "@/components/app-shell";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// export default function FormTemplates() {
//   const router = useRouter();
//   const [templates, setTemplates] = useState<any[]>([]);
//   useEffect(() => {
//     fetch("/api/templates")
//       .then((r) => r.json())
//       .then(setTemplates);
//   }, []);
//   const audit = templates.find(
//     (template) => !template.type || template.type === "AUDIT",
//   );
//   const service = templates.find(
//     (template) => template.id === "service-report",
//   );
//   return (
//     <AppShell user="A. Sen · Admin">
//       <main className="mx-auto max-w-6xl px-5 py-8">
//         <p className="text-sm font-medium text-primary">Administration</p>
//         <h1 className="mt-1 text-3xl font-bold">Form Templates</h1>
//         <p className="mt-2 text-muted-foreground">
//           Manage the forms used by your field team.
//         </p>
//         <div className="mt-8 grid gap-5 lg:grid-cols-2">
//           {audit && (
//             <Card className="border-teal-100">
//               <CardHeader>
//                 <FileCheck2 className="text-primary" />
//                 <CardTitle>Audit Form</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <p className="font-medium">{audit.title}</p>
//                 <p className="mt-2 text-sm text-muted-foreground">
//                   {audit.sections?.length || 0} Sections ·{" "}
//                   {audit.sections?.reduce(
//                     (sum: number, s: any) => sum + (s.questions?.length || 0),
//                     0,
//                   )}{" "}
//                   Questions
//                 </p>
//                 <Button
//                   className="mt-5"
//                   onClick={() => router.push("/admin/form-templates/audit")}
//                 >
//                   Edit Audit Template
//                 </Button>
//               </CardContent>
//             </Card>
//           )}
//           {service && (
//             <Card className="border-teal-100">
//               <CardHeader>
//                 <Wrench className="text-primary" />
//                 <CardTitle>Service Report Form</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <p className="font-medium">{service.name}</p>
//                 <p className="mt-2 text-sm text-muted-foreground">
//                   {service.sections?.length || 0} Sections ·{" "}
//                   {service.sections?.reduce(
//                     (sum: number, s: any) => sum + (s.fields?.length || 0),
//                     0,
//                   )}{" "}
//                   Fields
//                 </p>
//                 <Button
//                   className="mt-5"
//                   onClick={() =>
//                     router.push("/admin/form-templates/service-report")
//                   }
//                 >
//                   Edit Service Report Template
//                 </Button>
//               </CardContent>
//             </Card>
//           )}
//         </div>
//       </main>
//     </AppShell>
//   );
// }
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileCheck2, Wrench, ClipboardList } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type FormTemplate = {
  id: string;
  type?: string;
  title?: string;
  name?: string;
  sections?: {
    questions?: unknown[];
    fields?: unknown[];
  }[];
};

export default function FormTemplates() {
  const router = useRouter();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTemplates() {
      try {
        const response = await fetch("/api/templates");

        if (!response.ok) {
          throw new Error("Failed to load templates");
        }

        const data = await response.json();
        setTemplates(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load form templates:", error);
      } finally {
        setLoading(false);
      }
    }

    loadTemplates();
  }, []);

  const audit = templates.find(
    (template) => !template.type || template.type === "AUDIT",
  );

  const service = templates.find(
    (template) => template.id === "service-report",
  );

  const dailyAccent = templates.find(
    (template) =>
      template.id === "daily-accent-report" ||
      template.type === "DAILY_ACCENT_REPORT",
  );

  const countItems = (template?: FormTemplate) =>
    template?.sections?.reduce(
      (total, section) =>
        total + (section.fields?.length ?? section.questions?.length ?? 0),
      0,
    ) ?? 0;

  return (
    <AppShell user="A. Sen · Admin">
      <main className="mx-auto max-w-6xl px-5 py-8">
        <p className="text-sm font-medium text-primary">Administration</p>

        <h1 className="mt-1 text-3xl font-bold">Form Templates</h1>

        <p className="mt-2 text-muted-foreground">
          Manage the forms used by your field team.
        </p>

        {loading ? (
          <p className="mt-8 text-sm text-muted-foreground">
            Loading templates...
          </p>
        ) : (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {audit && (
              <Card className="border-teal-100">
                <CardHeader>
                  <FileCheck2 className="text-primary" />
                  <CardTitle>Audit Form</CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="font-medium">{audit.title ?? audit.name}</p>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {audit.sections?.length ?? 0} Sections ·{" "}
                    {countItems(audit)} Questions / Fields
                  </p>

                  <Button
                    className="mt-5"
                    onClick={() =>
                      router.push("/admin/form-templates/audit")
                    }
                  >
                    Edit Audit Template
                  </Button>
                </CardContent>
              </Card>
            )}

            {service && (
              <Card className="border-teal-100">
                <CardHeader>
                  <Wrench className="text-primary" />
                  <CardTitle>Service Report Form</CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="font-medium">
                    {service.name ?? service.title}
                  </p>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {service.sections?.length ?? 0} Sections ·{" "}
                    {countItems(service)} Fields
                  </p>

                  <Button
                    className="mt-5"
                    onClick={() =>
                      router.push("/admin/form-templates/service-report")
                    }
                  >
                    Edit Service Report Template
                  </Button>
                </CardContent>
              </Card>
            )}

            {dailyAccent && (
              <Card className="border-teal-100">
                <CardHeader>
                  <ClipboardList className="text-primary" />
                  <CardTitle>Daily Accent Report Form</CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="font-medium">
                    {dailyAccent.name ?? dailyAccent.title ?? "Daily Accent Report"}
                  </p>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {dailyAccent.sections?.length ?? 0} Sections ·{" "}
                    {countItems(dailyAccent)} Fields
                  </p>

                  <Button
                    className="mt-5"
                    onClick={() =>
                      router.push(
                        "/admin/form-templates/daily-accent-report",
                      )
                    }
                  >
                    Edit Daily Accent Report Template
                  </Button>
                </CardContent>
              </Card>
            )}

            {!audit && !service && !dailyAccent && (
              <Card>
                <CardContent className="py-8 text-sm text-muted-foreground">
                  No form templates were found.
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </AppShell>
  );
}