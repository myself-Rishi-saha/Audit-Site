

import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";

import { AppShell } from "@/components/app-shell";
import { ServiceReportReport } from "@/components/service-report-report";
import { ServiceReportDraft } from "@/components/service-report-draft";

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

  const r = await fetch(
    `${url}/api/service-reports/${encodeURIComponent(id)}`,
    {
      cache: "no-store",
      headers: {
        Cookie: cookieHeader,
      },
    },
  );

  if (r.status === 401) {
    redirect("/login");
  }

  if (r.status === 404) {
    notFound();
  }

  if (!r.ok) {
    throw new Error(
      `Failed to load service report (${r.status})`,
    );
  }

  const report = await r.json();
  console.log("Service Report Data:", report);
  return (
    <AppShell >
      {report.status === "DRAFT" ? (
        <ServiceReportDraft report={report} />
      ) : (
        <ServiceReportReport report={report} />
      )}
    </AppShell>
  );
}
