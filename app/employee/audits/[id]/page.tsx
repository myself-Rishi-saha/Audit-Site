// import { notFound } from "next/navigation";
// import { AppShell } from "@/components/app-shell";
// import { AuditReport } from "@/components/audit-report";
// import { AuditDraft } from "@/components/audit-draft";
// export default async function Report({
//   params,
// }: {
//   params: Promise<{ id: string }>;
// }) {
//   const url = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
//   const r = await fetch(
//     `${url}/api/audits/${(await params).id}`,
//     { cache: "no-store" },
//   );
//   if (!r.ok) return notFound();
//   return (
//     <AppShell user="S. Roy">
//       <AuditReport audit={await r.json()} />
//     </AppShell>
//   );
// }

import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AuditReport } from "@/components/audit-report";
import { AuditDraft } from "@/components/audit-draft";

export default async function Report({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const url =
    process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

  const r = await fetch(`${url}/api/audits/${id}`, {
    cache: "no-store",
  });

  if (!r.ok) {
    return notFound();
  }

  const audit = await r.json();
  //console.log("Audit data:", audit); // Log the audit data for debugging
  return (
    <AppShell user="S. Roy">
      {audit.status === "DRAFT" ? (
        <AuditDraft audit={audit} />
      ) : (
        <AuditReport audit={audit} />
      )}
    </AppShell>
  );
}

