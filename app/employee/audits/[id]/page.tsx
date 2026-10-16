
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { AuditReport } from "@/components/audit-report";
import { AuditDraft } from "@/components/audit-draft";

export default async function Report({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cookieStore = await cookies();
  const employeeToken = cookieStore.get("auditdesk_session")?.value;

  // Require an employee session.
  if (!employeeToken) {
    redirect("/login");
  }

  const url =
    process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

  const r = await fetch(
    `${url}/api/audits/${encodeURIComponent(id)}`,
    {
      cache: "no-store",
      headers: {
        Cookie: `auditdesk_session=${employeeToken}`,
      },
    },
  );

  if (r.status === 401) {
    redirect("/login");
  }

  if (r.status === 404) {
    notFound();
  }

  if (r.status === 403) {
    return (
      <AppShell >
        <div className="p-6 text-center">
          <h2 className="text-lg font-semibold">Access denied</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You do not have permission to view this audit.
          </p>
        </div>
      </AppShell>
    );
  }

  if (!r.ok) {
    throw new Error(
      `Failed to load audit ${id}: HTTP ${r.status} - ${await r.text()}`,
    );
  }

  const audit = await r.json();

  return (
    <AppShell >
      {String(audit.status).toUpperCase() === "DRAFT" ? (
        <AuditDraft audit={audit} />
      ) : (
        <AuditReport audit={audit} />
      )}
    </AppShell>
  );
}


// import { notFound } from "next/navigation";
// import { AppShell } from "@/components/app-shell";
// import { AuditReport } from "@/components/audit-report";
// import { AuditDraft } from "@/components/audit-draft";

// export default async function Report({
//   params,
// }: {
//   params: Promise<{ id: string }>;
// }) {
//   const { id } = await params;

//   const url =
//     process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

//   const r = await fetch(`${url}/api/audits/${id}`, {
//     cache: "no-store",
//   });

//   if (!r.ok) {
//     return notFound();
//   }

//   const audit = await r.json();
//   //console.log("Audit data:", audit); // Log the audit data for debugging
//   return (
//     <AppShell user="S. Roy">
//       {audit.status === "DRAFT" ? (
//         <AuditDraft audit={audit} />
//       ) : (
//         <AuditReport audit={audit} />
//       )}
//     </AppShell>
//   );
// }

