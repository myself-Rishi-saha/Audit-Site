import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AdminAuditEditor } from "@/components/admin-audit-editor";
export default async function AdminAudit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const url = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
  const id = (await params).id;
  const response = await fetch(`${url}/api/audits/${id}`, {
    cache: "no-store",
  });
  if (!response.ok) return notFound();
  return (
    <AppShell user="A. Sen · Admin">
      <AdminAuditEditor audit={await response.json()} />
    </AppShell>
  );
}
