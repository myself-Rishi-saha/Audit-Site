
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";

import { AppShell } from "@/components/app-shell";
import { DailyAccentReportReport } from "@/components/daily-accent-report-report";
import { DailyAccentReportDraft } from "@/components/daily-accent-report-draft";

export default async function Report({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();

  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const url =
    process.env.NEXT_PUBLIC_FRONTEND_URL ||
    "http://localhost:3000";

  const response = await fetch(
    `${url}/api/daily-accent-report/${encodeURIComponent(id)}`,
    {
      cache: "no-store",
      headers: {
        Cookie: cookieHeader,
      },
    },
  );

  if (response.status === 401) {
    redirect("/login");
  }

  if (response.status === 403) {
    redirect("/employee");
  }

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error(
      `Failed to load Daily Accent Report (${response.status})`,
    );
  }

  const report = await response.json();

  return (
    <AppShell>
      {report.status === "DRAFT" ? (
        <DailyAccentReportDraft report={report} />
      ) : (
        <DailyAccentReportReport report={report} />
      )}
    </AppShell>
  );
}
