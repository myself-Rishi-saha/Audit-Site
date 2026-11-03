// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { FileCheck2, Wrench, ClipboardList } from "lucide-react";

// import { AppShell } from "@/components/app-shell";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";

// type FormTemplate = {
//   id: string;
//   type?: string;
//   title?: string;
//   name?: string;
//   sections?: {
//     questions?: unknown[];
//     fields?: unknown[];
//   }[];
// };

// export default function FormTemplates() {
//   const router = useRouter();
//   const [templates, setTemplates] = useState<FormTemplate[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     async function loadTemplates() {
//       try {
//         const response = await fetch("/api/templates");

//         if (!response.ok) {
//           throw new Error("Failed to load templates");
//         }

//         const data = await response.json();
//         setTemplates(Array.isArray(data) ? data : []);
//       } catch (error) {
//         console.error("Failed to load form templates:", error);
//       } finally {
//         setLoading(false);
//       }
//     }

//     loadTemplates();
//   }, []);

//   const audit = templates.find(
//     (template) => !template.type || template.type === "AUDIT",
//   );

//   const service = templates.find(
//     (template) => template.id === "service-report",
//   );

//   const dailyAccent = templates.find(
//     (template) =>
//       template.id === "daily-accent-report" ||
//       template.type === "DAILY_ACCENT_REPORT",
//   );

//   const countItems = (template?: FormTemplate) =>
//     template?.sections?.reduce(
//       (total, section) =>
//         total + (section.fields?.length ?? section.questions?.length ?? 0),
//       0,
//     ) ?? 0;

//   return (
//     <AppShell >
//       <main className="mx-auto max-w-6xl px-5 py-8">
//         <p className="text-sm font-medium text-primary">Administration</p>

//         <h1 className="mt-1 text-3xl font-bold">Form Templates</h1>

//         <p className="mt-2 text-muted-foreground">
//           Manage the forms used by your field team.
//         </p>

//         {loading ? (
//           <p className="mt-8 text-sm text-muted-foreground">
//             Loading templates...
//           </p>
//         ) : (
//           <div className="mt-8 grid gap-5 lg:grid-cols-2">
//             {audit && (
//               <Card className="border-teal-100">
//                 <CardHeader>
//                   <FileCheck2 className="text-primary" />
//                   <CardTitle>Audit Form</CardTitle>
//                 </CardHeader>

//                 <CardContent>
//                   <p className="font-medium">{audit.title ?? audit.name}</p>

//                   <p className="mt-2 text-sm text-muted-foreground">
//                     {audit.sections?.length ?? 0} Sections ·{" "}
//                     {countItems(audit)} Questions / Fields
//                   </p>

//                   <Button
//                     className="mt-5"
//                     onClick={() =>
//                       router.push("/admin/form-templates/audit")
//                     }
//                   >
//                     Edit Audit Template
//                   </Button>
//                 </CardContent>
//               </Card>
//             )}

//             {service && (
//               <Card className="border-teal-100">
//                 <CardHeader>
//                   <Wrench className="text-primary" />
//                   <CardTitle>Service Report Form</CardTitle>
//                 </CardHeader>

//                 <CardContent>
//                   <p className="font-medium">
//                     {service.name ?? service.title}
//                   </p>

//                   <p className="mt-2 text-sm text-muted-foreground">
//                     {service.sections?.length ?? 0} Sections ·{" "}
//                     {countItems(service)} Fields
//                   </p>

//                   <Button
//                     className="mt-5"
//                     onClick={() =>
//                       router.push("/admin/form-templates/service-report")
//                     }
//                   >
//                     Edit Service Report Template
//                   </Button>
//                 </CardContent>
//               </Card>
//             )}

//             {dailyAccent && (
//               <Card className="border-teal-100">
//                 <CardHeader>
//                   <ClipboardList className="text-primary" />
//                   <CardTitle>Daily Accent Report Form</CardTitle>
//                 </CardHeader>

//                 <CardContent>
//                   <p className="font-medium">
//                     {dailyAccent.name ?? dailyAccent.title ?? "Daily Accent Report"}
//                   </p>

//                   <p className="mt-2 text-sm text-muted-foreground">
//                     {dailyAccent.sections?.length ?? 0} Sections ·{" "}
//                     {countItems(dailyAccent)} Fields
//                   </p>

//                   <Button
//                     className="mt-5"
//                     onClick={() =>
//                       router.push(
//                         "/admin/form-templates/daily-accent-report",
//                       )
//                     }
//                   >
//                     Edit Daily Accent Report Template
//                   </Button>
//                 </CardContent>
//               </Card>
//             )}

//             {!audit && !service && !dailyAccent && (
//               <Card>
//                 <CardContent className="py-8 text-sm text-muted-foreground">
//                   No form templates were found.
//                 </CardContent>
//               </Card>
//             )}
//           </div>
//         )}
//       </main>
//     </AppShell>
//   );
// }
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileCheck2,
  Wrench,
  ClipboardList,
  FileBadge,
} from "lucide-react";

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
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTemplates() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/templates");

        if (!response.ok) {
          throw new Error("Failed to load templates");
        }

        const data = await response.json();

        setTemplates(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load form templates:", error);
        setError("Unable to load form templates. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadTemplates();
  }, []);

  // Find individual templates
  const audit = templates.find(
    (template) =>
      !template.type ||
      template.type === "AUDIT" ||
      template.id === "audit-report",
  );

  const service = templates.find(
    (template) => template.id === "service-report",
  );

  const dailyAccent = templates.find(
    (template) =>
      template.id === "daily-accent-report" ||
      template.type === "DAILY_ACCENT_REPORT",
  );

  const handoverCertificate = templates.find(
    (template) =>
      template.id === "handover-certificate" ||
      template.type === "HANDOVER_CERTIFICATE",
  );

  // Count fields/questions in a template
  const countItems = (template?: FormTemplate) =>
    template?.sections?.reduce(
      (total, section) =>
        total +
        (section.fields?.length ?? section.questions?.length ?? 0),
      0,
    ) ?? 0;

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-5 py-8">
        {/* Page heading */}
        <div>
          <p className="text-sm font-medium text-primary">
            Administration
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            Form Templates
          </h1>

          <p className="mt-2 text-muted-foreground">
            Manage the forms used by your field team.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <p className="mt-8 text-sm text-muted-foreground">
            Loading templates...
          </p>
        )}

        {/* Error */}
        {!loading && error && (
          <Card className="mt-8 border-red-200">
            <CardContent className="py-6">
              <p className="text-sm text-red-600">{error}</p>

              <Button
                className="mt-4"
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Template cards */}
        {!loading && !error && (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {/* Audit Form */}
            {audit && (
              <Card className="border-teal-100">
                <CardHeader>
                  <FileCheck2 className="text-primary" />

                  <CardTitle>Audit Form</CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="font-medium">
                    {audit.title ?? audit.name ?? "Audit Form"}
                  </p>

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

            {/* Service Report */}
            {service && (
              <Card className="border-teal-100">
                <CardHeader>
                  <Wrench className="text-primary" />

                  <CardTitle>Service Report Form</CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="font-medium">
                    {service.name ?? service.title ?? "Service Report"}
                  </p>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {service.sections?.length ?? 0} Sections ·{" "}
                    {countItems(service)} Fields
                  </p>

                  <Button
                    className="mt-5"
                    onClick={() =>
                      router.push(
                        "/admin/form-templates/service-report",
                      )
                    }
                  >
                    Edit Service Report Template
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Daily Accent Report */}
            {dailyAccent && (
              <Card className="border-teal-100">
                <CardHeader>
                  <ClipboardList className="text-primary" />

                  <CardTitle>Daily Accent Report Form</CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="font-medium">
                    {dailyAccent.name ??
                      dailyAccent.title ??
                      "Daily Accent Report"}
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

            {/* Handover Certificate */}
            {handoverCertificate && (
              <Card className="border-teal-100">
                <CardHeader>
                  <FileBadge className="text-primary" />

                  <CardTitle>Handover Certificate Form</CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="font-medium">
                    {handoverCertificate.name ??
                      handoverCertificate.title ??
                      "Handover Certificate"}
                  </p>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {handoverCertificate.sections?.length ?? 0} Sections ·{" "}
                    {countItems(handoverCertificate)} Fields
                  </p>

                  <Button
                    className="mt-5"
                    onClick={() =>
                      router.push(
                        "/admin/form-templates/handover-certificate",
                      )
                    }
                  >
                    Edit Handover Certificate Template
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Empty state */}
            {!audit &&
              !service &&
              !dailyAccent &&
              !handoverCertificate && (
                <Card className="lg:col-span-2">
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
