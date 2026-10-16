// import { notFound } from "next/navigation";
// import { AppShell } from "@/components/app-shell";
// import { AdminAuditEditor } from "@/components/admin-audit-editor";
// export default async function AdminAudit({
//   params,
// }: {
//   params: Promise<{ id: string }>;
// }) {
//   const url = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
//   const id = (await params).id;
//   const response = await fetch(`${url}/api/audits/${id}`, {
//     cache: "no-store",
//   });
//   if (!response.ok) return notFound();
//   return (
//     <AppShell >
//       <AdminAuditEditor audit={await response.json()} />
//     </AppShell>
//   );
// }

import { AppShell } from "@/components/app-shell";
import { AdminAuditEditor } from "@/components/admin-audit-editor";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

export default async function AdminAudit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const url =
    process.env.NEXT_PUBLIC_FRONTEND_URL ||
    "http://localhost:3000";

  const { id } = await params;
  const cookieStore = await cookies();

  const response = await fetch(
    `${url}/api/audits/${encodeURIComponent(id)}`,
    {
      cache: "no-store",
      headers: {
        Cookie: cookieStore.toString(),
      },
    },
  );

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error(
      `Failed to load audit ${id}: HTTP ${response.status} - ${await response.text()}`,
    );
  }

  const audit = await response.json();

  return (
    <AppShell>
      <AdminAuditEditor audit={audit} />
    </AppShell>
  );
}
