import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AdminServiceEditor } from "@/components/admin-service-editor";
export default async function AdminServiceReport({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const url = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
  const response = await fetch(
    `${url}/api/service-reports/${id}`,
    { cache: "no-store" },
  );
  if (!response.ok) return notFound();
  return (
    <AppShell user="A. Sen · Admin">
      <AdminServiceEditor report={await response.json()} />
    </AppShell>
  );
}
