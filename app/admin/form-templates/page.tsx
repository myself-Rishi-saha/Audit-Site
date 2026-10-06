"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileCheck2, Wrench } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FormTemplates() {
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then(setTemplates);
  }, []);
  const audit = templates.find(
    (template) => !template.type || template.type === "AUDIT",
  );
  const service = templates.find(
    (template) => template.id === "service-report",
  );
  return (
    <AppShell user="A. Sen · Admin">
      <main className="mx-auto max-w-6xl px-5 py-8">
        <p className="text-sm font-medium text-primary">Administration</p>
        <h1 className="mt-1 text-3xl font-bold">Form Templates</h1>
        <p className="mt-2 text-muted-foreground">
          Manage the forms used by your field team.
        </p>
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {audit && (
            <Card className="border-teal-100">
              <CardHeader>
                <FileCheck2 className="text-primary" />
                <CardTitle>Audit Form</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{audit.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {audit.sections?.length || 0} Sections ·{" "}
                  {audit.sections?.reduce(
                    (sum: number, s: any) => sum + (s.questions?.length || 0),
                    0,
                  )}{" "}
                  Questions
                </p>
                <Button
                  className="mt-5"
                  onClick={() => router.push("/admin/form-templates/audit")}
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
                <p className="font-medium">{service.name}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {service.sections?.length || 0} Sections ·{" "}
                  {service.sections?.reduce(
                    (sum: number, s: any) => sum + (s.fields?.length || 0),
                    0,
                  )}{" "}
                  Fields
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
        </div>
      </main>
    </AppShell>
  );
}
