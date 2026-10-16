// import { notFound } from "next/navigation";
// import { AppShell } from "@/components/app-shell";
// import { AdminServiceEditor } from "@/components/admin-service-editor";
// export default async function AdminServiceReport({
//   params,
// }: {
//   params: Promise<{ id: string }>;
// }) {
//   const id = (await params).id;
//   const url = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
//   const response = await fetch(
//     `${url}/api/service-reports/${id}`,
//     { cache: "no-store" },
//   );
//   if (!response.ok) return notFound();
//   return (
//     <AppShell>
//       <AdminServiceEditor report={await response.json()} />
//     </AppShell>
//   );
// }

import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { AdminServiceEditor } from "@/components/admin-service-editor";

export default async function AdminServiceReport({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const url =
    process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

  const cookieStore = await cookies();

  const response = await fetch(
    `${url}/api/service-reports/${encodeURIComponent(id)}`,
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
      `Failed to load service report ${id}: HTTP ${response.status} - ${await response.text()}`,
    );
  }

  const report = await response.json();

  return (
    <AppShell>
      <AdminServiceEditor report={report} />
    </AppShell>
  );
}
