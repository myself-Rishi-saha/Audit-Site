import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AuditReport } from "@/components/audit-report";
export default async function Report({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const url = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
  const r = await fetch(
    `${url}/api/audits/${(await params).id}`,
    { cache: "no-store" },
  );
  if (!r.ok) return notFound();
  return (
    <AppShell user="S. Roy">
      <AuditReport audit={await r.json()} />
    </AppShell>
  );
}
