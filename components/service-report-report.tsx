"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Evidence = {
  url: string;
  type: string;
  fileName?: string;
};

type ServiceReport = {
  id: string;
  status?: string;

  customer?: string;
  address?: string;
  engineer?: string;
  date?: string;
  time?: string;
  equipment?: string;
  serial?: string;

  serviceType?: string;
  systems?: string[];

  reportedFault?: string;
  actions?: string[];

  customerRemarks?: string;

  evidence?: Record<string, Evidence[]>;
};

export function ServiceReportReport({
  report,
}: {
  report: ServiceReport;
}) {
  const router = useRouter();

  const evidence = Object.values(
    report.evidence || {},
  ).flat();

  const customerEvidence = evidence.filter(
    (item) => item.type === "customer",
  );

  const otherEvidence = evidence.filter(
    (item) => item.type !== "customer",
  );

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-5 py-8">
      {/* BACK BUTTON */}

      <Button
        variant="ghost"
        className="self-start"
        onClick={() => router.push("/employee")}
      >
        <ArrowLeft data-icon="inline-start" />
        Back to Dashboard
      </Button>

      {/* HEADER */}

      <div>
        <p className="text-sm font-semibold text-primary">
          {report.id}
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          EQUIPMENT SERVICE & MAINTENANCE REPORT
        </h1>

        {report.status && (
          <Badge className="mt-3">
            {report.status}
          </Badge>
        )}
      </div>

      {/* JOB INFORMATION */}

      <Card>
        <CardHeader>
          <CardTitle>JOB INFORMATION</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-2">
          {[
            ["Customer", report.customer],
            ["Address", report.address],
            ["Engineer", report.engineer],
            ["Date", report.date],
            ["Time", report.time],
            ["Equipment", report.equipment],
            ["Serial Number", report.serial],
          ].map(([key, value]) => (
            <div key={key}>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                {key}
              </p>

              <p className="mt-1">
                {value || "—"}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* SERVICE TYPE */}

      <Card>
        <CardHeader>
          <CardTitle>SERVICE TYPE</CardTitle>
        </CardHeader>

        <CardContent>
          {report.serviceType || "—"}
        </CardContent>
      </Card>

      {/* INSTALLED SYSTEMS */}

      <Card>
        <CardHeader>
          <CardTitle>INSTALLED SYSTEM CHECKED</CardTitle>
        </CardHeader>

        <CardContent>
          {report.systems && report.systems.length > 0
            ? report.systems.join(", ")
            : "—"}
        </CardContent>
      </Card>

      {/* FAULT + ACTIONS */}

      <Card>
        <CardHeader>
          <CardTitle>
            FAULT DIAGNOSIS & ACTION LOG
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          <div>
            <p className="text-sm font-semibold">
              Reported Fault
            </p>

            <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
              {report.reportedFault || "—"}
            </p>
          </div>

          {report.actions && report.actions.length > 0 ? (
            report.actions.map((action, index) => (
              <div key={index}>
                <p className="text-sm font-semibold">
                  Action {index + 1}
                </p>

                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                  {action || "—"}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No actions recorded.
            </p>
          )}
        </CardContent>
      </Card>

      {/* CUSTOMER EVIDENCE */}

      <Card>
        <CardHeader>
          <CardTitle>CUSTOMER EVIDENCE</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {report.customerRemarks && (
            <div>
              <p className="text-sm font-semibold">
                Customer Remarks
              </p>

              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                {report.customerRemarks}
              </p>
            </div>
          )}

          {customerEvidence.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {customerEvidence.map((item, index) => (
                <div
                  key={`${item.url}-${index}`}
                  className="overflow-hidden rounded-xl border bg-muted"
                >
                  {item.type === "video" ? (
                    <video
                      src={item.url}
                      controls
                      playsInline
                      className="max-h-72 w-full object-cover"
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={`Customer evidence ${index + 1}`}
                      className="max-h-72 w-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No customer evidence attached.
            </p>
          )}
        </CardContent>
      </Card>

      {/* GENERAL EVIDENCE */}

      <Card>
        <CardHeader>
          <CardTitle>EVIDENCE</CardTitle>
        </CardHeader>

        <CardContent>
          {otherEvidence.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {otherEvidence.map((item, index) => (
                <a
                  key={`${item.url}-${index}`}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group overflow-hidden rounded-xl border bg-background p-2 transition hover:shadow-md"
                >
                  <div className="overflow-hidden rounded-lg">
                    {item.type === "video" ? (
                      <video
                        src={item.url}
                        controls
                        playsInline
                        className="aspect-square w-full object-cover"
                      />
                    ) : (
                      <img
                        src={item.url}
                        alt={`Evidence ${index + 1}`}
                        className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                      />
                    )}
                  </div>

                  <span className="mt-2 block text-sm capitalize text-muted-foreground">
                    {item.type === "video"
                      ? "Video"
                      : "Photo"}
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No evidence attached.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}