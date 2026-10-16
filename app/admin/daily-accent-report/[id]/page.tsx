


import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { AdminDailyAccentEditor } from "@/components/admin-daily-accent-editor";

export default async function AdminDailyAccentReport({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const url =
    process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

  const cookieStore = await cookies();

  const response = await fetch(
    `${url}/api/daily-accent-report/${encodeURIComponent(id)}`,
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
      `Failed to load daily accent report ${id}: HTTP ${response.status} - ${await response.text()}`,
    );
  }

  const report = await response.json();

  return (
    <AppShell>
      <AdminDailyAccentEditor report={report} />
    </AppShell>
  );
}
