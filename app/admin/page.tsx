"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CalendarDays,
  ClipboardCheck,
  FileText,
  LayoutTemplate,
  Plus,
  Search,
  UserRound,
  Wrench,
  X,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getFormData(report: any): Record<string, any> {
  const value = report?.formData ?? report?.form_data;

  if (value && typeof value === "object") {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  return {};
}

function getEmployeeName(report: any): string {
  const formData = getFormData(report);

  return (
    report.employeeName ||
    report.employee_name ||
    report.engineerName ||
    report.engineer_name ||
    report.employee ||
    formData["engineer-name"] ||
    "—"
  );
}

function getCustomerName(report: any): string {
  const formData = getFormData(report);

  return (
    report.customerName ||
    report.customer_name ||
    (typeof report.customer === "string" ? report.customer : "") ||
    formData["customer-name"] ||
    formData["customer"] ||
    "—"
  );
}

// function getAuditDate(audit: any): unknown {
//   return (
//     audit.auditDate ??
//     audit.audit_date ??
//     audit.date ??
//     audit.createdAt ??
//     audit.created_at ??
//     audit.submittedAt ??
//     audit.submitted_at
//   );
// }
function getAuditDate(audit: any): unknown {
  return audit.submittedAt ?? audit.submitted_at;
}
// function getServiceDate(report: any): unknown {
//   const formData = getFormData(report);

//   return (
//     formData["service-call-date"] ??
//     report.serviceCallDate ??
//     report.service_call_date ??
//     report.date ??
//     report.createdAt ??
//     report.created_at ??
//     report.submittedAt ??
//     report.submitted_at
//   );
// }
function getServiceDate(report: any): unknown {
  return report.submittedAt ?? report.submitted_at;
}
// function formatDate(value: unknown): string {
//   if (!value) return "—";

//   if (typeof value === "string") {
//     const raw = value.trim();

//     // Preserve date-only ISO values without timezone conversion.
//     const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

//     if (isoMatch) {
//       return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
//     }

//     // Interpret slash-separated dates as DD/MM/YYYY.
//     const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

//     if (slashMatch) {
//       return `${slashMatch[1].padStart(2, "0")}/${slashMatch[2].padStart(2, "0")}/${slashMatch[3]}`;
//     }
//   }

//   const date = value instanceof Date ? value : new Date(value as string | number);

//   if (Number.isNaN(date.getTime())) return "—";

//   return date.toLocaleDateString("en-GB");
// }

function formatDate(value: unknown): string {
  if (!value) return "—";

  const date = new Date(value as string | number);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function Admin() {
  const [audits, setAudits] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  // Shared filters displayed in both report card headers.
  const [selectedDate, setSelectedDate] = useState("");
  const [search, setSearch] = useState("");

  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState("");

  const router = useRouter();

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Default date: today in the browser's local timezone.
  useEffect(() => {
    setSelectedDate(getLocalDateKey(new Date()));
  }, []);

  // Fetch reports whenever the date or search changes.
  useEffect(() => {
    if (!selectedDate) return;

    let cancelled = false;

    async function loadData() {
      setReportsLoading(true);
      setReportsError("");

      try {
        const params = new URLSearchParams({
          date: selectedDate,
        });

        if (search.trim()) {
          params.set("search", search.trim());
        }

        const query = params.toString();

        const [auditResponse, serviceResponse] = await Promise.all([
          fetch(`/api/audits?${query}`, {
            cache: "no-store",
          }),
          fetch(`/api/service-reports?${query}`, {
            cache: "no-store",
          }),
        ]);

        if (!auditResponse.ok || !serviceResponse.ok) {
          throw new Error("Failed to fetch reports.");
        }

        const [auditData, serviceData] = await Promise.all([
          auditResponse.json(),
          serviceResponse.json(),
        ]);
        //console.log("Audit API response:", auditData);
        //console.log("Service API response:", serviceData);

        if (!cancelled) {
          setAudits(Array.isArray(auditData) ? auditData : []);
          setServices(Array.isArray(serviceData) ? serviceData : []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load admin reports:", error);
          setReportsError("Unable to load reports. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setReportsLoading(false);
        }
      }
    }

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Debounce search requests; date changes trigger an immediate request.
    searchTimeout.current = setTimeout(
      () => void loadData(),
      search.trim() ? 300 : 0,
    );

    return () => {
      cancelled = true;

      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [selectedDate, search]);

  // Only completed reports appear in the tables.
  const completed = audits.filter(
    (audit) => String(audit.status || "").toUpperCase() === "COMPLETED",
  );

  const completedServices = services.filter(
    (report) => String(report.status || "").toUpperCase() === "COMPLETED",
  );

  // These statistics reflect the currently returned audit results.
  // For organization-wide statistics independent of filters, use a
  // separate summary endpoint or unfiltered statistics request.
  const average = completed.length
    ? Math.round(
        completed.reduce((sum, audit) => sum + Number(audit.score || 0), 0) /
          completed.length,
      )
    : 0;

  const stats = [
    {
      label: "Total audits",
      value: audits.length,
      icon: ClipboardCheck,
      tone: "bg-teal-50 text-teal-700",
    },
    {
      label: "Total completed",
      value: completed.length + completedServices.length,
      icon: FileText,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Total service reports",
      value: services.length,
      icon: Wrench,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Avg. compliance",
      value: `${average}%`,
      icon: ArrowUpRight,
      tone: "bg-sky-50 text-sky-700",
    },
  ];

  function resetFilters() {
    setSelectedDate(getLocalDateKey(new Date()));
    setSearch("");
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {/* HEADER */}
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold text-primary">Administration</p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Good morning, Admin
            </h1>

            <p className="mt-2 text-muted-foreground">
              Overview of inspections and service activity.
            </p>
          </div>

          {/* ADMIN QUICK ACTIONS */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="h-11"
              onClick={() => router.push("/admin/add-employee")}
            >
              <UserRound data-icon="inline-start" />
              Add Employee
            </Button>

            <Button
              variant="outline"
              className="h-11"
              onClick={() => router.push("/admin/add-customer")}
            >
              <Plus data-icon="inline-start" />
              Add Customer
            </Button>

            <Button
              variant="outline"
              className="h-11"
              onClick={() => router.push("/admin/form-templates")}
            >
              <LayoutTemplate data-icon="inline-start" />
              Manage Templates
            </Button>
          </div>
        </div>

        {/* STATISTICS */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, tone }) => (
            <Card key={label} className="shadow-sm">
              <CardContent className="p-5">
                <span
                  className={`flex size-9 items-center justify-center rounded-lg ${tone}`}
                >
                  <Icon />
                </span>

                <p className="mt-4 text-sm text-muted-foreground">{label}</p>

                <p className="mt-1 text-2xl font-bold">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* COMMON DATE AND SEARCH FILTERS */}
        <Card className="mt-8 shadow-sm">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
              <input
                aria-label="Filter reports by date"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>

            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <input
                aria-label="Search audits and service reports"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by audit ID, service ID, employee or customer..."
                className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />

              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={resetFilters}
            >
              Reset
            </Button>
          </CardContent>
        </Card>

        {/* COMPLETED AUDITS */}
        <DataCard
          className="mt-8"
          title="Completed audits"
          subtitle="Review completed inspection reports across the organization"
          headers={[
            "Audit ID",
            "Employee",
            "Customer",
            "Location",
            "Date",
            "Status",
            "",
          ]}
          // selectedDate={selectedDate}
          // search={search}
          // onDateChange={setSelectedDate}
          // onSearchChange={setSearch}
          // onReset={resetFilters}
        >
          <>
            {completed.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-10 text-center text-sm text-muted-foreground"
                >
                  {reportsLoading
                    ? "Loading audit reports..."
                    : reportsError
                      ? "Audit reports could not be loaded."
                      : "No completed audits for the selected date and search."}
                </td>
              </tr>
            ) : (
              completed.map((audit) => {
                const employee = getEmployeeName(audit);
                const customer = getCustomerName(audit);

                const location =
                  audit.customerAddress ||
                  audit.customer_address ||
                  audit.address ||
                  "—";

                const date = formatDate(getAuditDate(audit));

                const status = String(
                  audit.status || "COMPLETED",
                ).toUpperCase();

                return (
                  <tr
                    key={audit.id}
                    className="border-b transition last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-3 py-4 font-semibold text-primary">
                      {audit.id}
                    </td>

                    <td className="px-3 py-4">{employee}</td>

                    <td className="px-3 py-4 font-medium">{customer}</td>

                    <td className="px-3 py-4 text-muted-foreground">
                      {location}
                    </td>

                    <td className="px-3 py-4 text-muted-foreground">{date}</td>

                    <td className="px-3 py-4">
                      <Badge variant="default">{status}</Badge>
                    </td>

                    <td className="px-3 py-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/admin/audits/${audit.id}`)}
                      >
                        View
                        <ArrowUpRight data-icon="inline-end" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </>
        </DataCard>

        {/* COMPLETED SERVICE REPORTS */}
        <DataCard
          className="mt-6"
          title="Completed service reports"
          subtitle="Review completed field service records"
          headers={["Report ID", "Customer", "Engineer", "Date", "Status", ""]}
          selectedDate={selectedDate}
          search={search}
          onDateChange={setSelectedDate}
          onSearchChange={setSearch}
          onReset={resetFilters}
        >
          <>
            {completedServices.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-10 text-center text-sm text-muted-foreground"
                >
                  {reportsLoading
                    ? "Loading service reports..."
                    : reportsError
                      ? "Service reports could not be loaded."
                      : "No completed service reports for the selected date and search."}
                </td>
              </tr>
            ) : (
              completedServices.map((report) => {
                const formData = getFormData(report);

                const customer = getCustomerName(report);
                const engineer = getEmployeeName(report);

                const equipment =
                  formData["equipment"] || report.equipment || "—";

                const date = formatDate(getServiceDate(report));

                const status = String(
                  report.status || "COMPLETED",
                ).toUpperCase();

                return (
                  <tr
                    key={report.id}
                    className="border-b transition last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-3 py-4 font-semibold text-primary">
                      {report.id}
                    </td>

                    <td className="px-3 py-4 font-medium">{customer}</td>

                    <td className="px-3 py-4">{engineer}</td>

                    {/* <td className="px-3 py-4 text-muted-foreground">
                      {equipment}
                    </td> */}

                    <td className="px-3 py-4 text-muted-foreground">{date}</td>

                    <td className="px-3 py-4">
                      <Badge variant="default">{status}</Badge>
                    </td>

                    <td className="px-3 py-4 text-right">
                      <Button
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/service-reports/${report.id}`)
                        }
                      >
                        View &amp; Edit
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </>
        </DataCard>
      </main>
    </AppShell>
  );
}

function DataCard({
  title,
  subtitle,
  headers,
  children,
  className = "",
  selectedDate,
  search,
  onDateChange,
  onSearchChange,
  onReset,
}: {
  title: string;
  subtitle: string;
  headers: string[];
  children: React.ReactNode;
  className?: string;
  selectedDate: string;
  search: string;
  onDateChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onReset: () => void;
}) {
  return (
    <Card className={`shadow-sm ${className}`}>
      <CardHeader>
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div>
            <CardTitle>{title}</CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {/* FILTERS INLINE WITH THE EXISTING CARD HEADER */}
          {/* <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <input
                aria-label="Filter reports by date"
                type="date"
                value={selectedDate}
                onChange={(event) => onDateChange(event.target.value)}
                className="h-9 w-[155px] rounded-md border border-input bg-background pl-9 pr-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <input
                aria-label="Search employee or customer"
                type="search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Employee or customer"
                className="h-9 w-[190px] rounded-md border border-input bg-background pl-9 pr-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />

              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => onSearchChange("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-9 px-2"
            >
              Reset
            </Button>
          </div> */}
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                {headers.map((head, index) => (
                  <th
                    className="px-3 py-3 font-medium"
                    key={`${head}-${index}`}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>{children}</tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
