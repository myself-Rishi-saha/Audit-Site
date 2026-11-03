import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";

import { AppShell } from "@/components/app-shell";
import { HandoverCertificateReport } from "@/components/handover-certificate-report";
import { HandoverCertificateDraft } from "@/components/handover-certificate-draft";

export default async function HandoverCertificatePage({
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
    `${url}/api/handover-certificates/${encodeURIComponent(id)}`,
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

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error(
      `Failed to load handover certificate (${response.status})`,
    );
  }

  const report = await response.json();

  return (
    <AppShell>
      {report.status === "DRAFT" ? (
        <HandoverCertificateDraft report={report} />
      ) : (
        <HandoverCertificateReport report={report} />
      )}
    </AppShell>
  );
}