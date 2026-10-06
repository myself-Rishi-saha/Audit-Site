// "use client";
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Button } from "@/components/ui/button";

// export function AdminServiceEditor({ report }: { report: any }) {
//   const router = useRouter();
//   const [value, setValue] = useState(report);
//   const [editing, setEditing] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const patch = (p: any) => setValue({ ...value, ...p });
//   async function save() {
//     setSaving(true);
//     await fetch(`/api/service-reports/${value.id}`, {
//       method: "PUT",
//       headers: { "content-type": "application/json" },
//       body: JSON.stringify({
//         ...value,
//         lastUpdatedBy: "ADMIN001",
//         lastUpdatedAt: new Date().toISOString(),
//       }),
//     });
//     setSaving(false);
//     setEditing(false);
//     router.refresh();
//   }
//   return (
//     <main className="mx-auto max-w-5xl px-5 py-8">
//       <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
//         <div>
//           <p className="text-sm font-medium text-primary">Admin review</p>
//           <h1 className="mt-1 text-3xl font-semibold">
//             EQUIPMENT SERVICE &amp; MAINTENANCE REPORT
//           </h1>
//         </div>
//         <div className="flex gap-2">
//           <Button variant="outline" onClick={() => window.print()}>
//             Generate PDF
//           </Button>
//           <Button
//             onClick={() => (editing ? save() : setEditing(true))}
//             disabled={saving}
//           >
//             {saving ? "Saving…" : editing ? "Save Changes" : "Edit Report"}
//           </Button>
//         </div>
//       </div>
//       <Card>
//         <CardHeader>
//           <CardTitle>Job information</CardTitle>
//         </CardHeader>
//         <CardContent className="grid gap-4 sm:grid-cols-2">
//           {[
//             ["customer", "Customer"],
//             ["address", "Customer Address"],
//             ["engineer", "Engineer"],
//             ["date", "Date"],
//             ["time", "Time"],
//             ["equipment", "Equipment"],
//             ["serial", "Serial Number"],
//           ].map(([key, label]) => (
//             <label key={key} className="text-sm font-medium">
//               {label}
//               <Input
//                 className="mt-2"
//                 disabled={!editing}
//                 value={value[key] || ""}
//                 onChange={(e) => patch({ [key]: e.target.value })}
//               />
//             </label>
//           ))}
//         </CardContent>
//       </Card>
//       <Card className="mt-6">
//         <CardHeader>
//           <CardTitle>Service details</CardTitle>
//         </CardHeader>
//         <CardContent className="flex flex-col gap-5">
//           <label className="text-sm font-medium">
//             Service Type
//             <Input
//               className="mt-2"
//               disabled={!editing}
//               value={value.serviceType || ""}
//               onChange={(e) => patch({ serviceType: e.target.value })}
//             />
//           </label>
//           <label className="text-sm font-medium">
//             Installed Systems
//             <Input
//               className="mt-2"
//               disabled={!editing}
//               value={(value.systems || []).join(", ")}
//               onChange={(e) =>
//                 patch({
//                   systems: e.target.value
//                     .split(",")
//                     .map((x: string) => x.trim())
//                     .filter(Boolean),
//                 })
//               }
//             />
//           </label>
//           <label className="text-sm font-medium">
//             Reported Fault
//             <Textarea
//               className="mt-2 min-h-24"
//               disabled={!editing}
//               value={value.reportedFault || ""}
//               onChange={(e) => patch({ reportedFault: e.target.value })}
//             />
//           </label>
//           <label className="text-sm font-medium">
//             Actions
//             <Textarea
//               className="mt-2 min-h-24"
//               disabled={!editing}
//               value={(value.actions || []).join("\n")}
//               onChange={(e) => patch({ actions: e.target.value.split("\n") })}
//             />
//           </label>
//           <label className="text-sm font-medium">
//             Customer Remarks
//             <Textarea
//               className="mt-2 min-h-24"
//               disabled={!editing}
//               value={value.customerRemarks || ""}
//               onChange={(e) => patch({ customerRemarks: e.target.value })}
//             />
//           </label>
//         </CardContent>
//       </Card>
//       <Card className="mt-6">
//         <CardHeader>
//           <CardTitle>Evidence</CardTitle>
//         </CardHeader>
//         <CardContent className="grid gap-4 sm:grid-cols-3">
//           {(value.evidence || []).map((item: any) => (
//             <div key={item.url} className="overflow-hidden rounded-xl border">
//               <img
//                 src={item.url}
//                 alt={item.type}
//                 className="aspect-video w-full object-cover"
//               />
//               <p className="p-3 text-sm font-medium">{item.type}</p>
//             </div>
//           ))}
//         </CardContent>
//       </Card>
//     </main>
//   );
// }
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function AdminServiceEditor({ report }: { report: any }) {
  const router = useRouter();

  const [value, setValue] = useState({
    ...report,
    evidence: report?.evidence || {},
  });

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const patch = (p: any) => {
    setValue((current: any) => ({
      ...current,
      ...p,
    }));
  };

  /*
   * Evidence is stored as:
   *
   * evidence: {
   *   "photo-field-id": [...],
   *   "video-field-id": [...]
   * }
   *
   * Flatten it only for displaying the admin evidence gallery.
   */
  const evidence = Object.values(value.evidence || {}).flat() as any[];

  async function save() {
    setSaving(true);

    try {
      const response = await fetch(`/api/service-reports/${value.id}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ...value,
          lastUpdatedBy: "ADMIN001",
          lastUpdatedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        console.error("Failed to save service report:", errorText);

        alert("Failed to save service report.");
        return;
      }

      setEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save service report.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      {/* HEADER */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">
            Admin review
          </p>

          <h1 className="mt-1 text-3xl font-semibold">
            EQUIPMENT SERVICE &amp; MAINTENANCE REPORT
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Report ID: {value.id}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.print()}
          >
            Generate PDF
          </Button>

          <Button
            onClick={() =>
              editing ? save() : setEditing(true)
            }
            disabled={saving}
          >
            {saving
              ? "Saving…"
              : editing
                ? "Save Changes"
                : "Edit Report"}
          </Button>
        </div>
      </div>

      {/* JOB INFORMATION */}
      <Card>
        <CardHeader>
          <CardTitle>Job Information</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-2">
          {[
            ["customer", "Customer"],
            ["address", "Customer Address"],
            ["engineer", "Engineer"],
            ["date", "Date"],
            ["time", "Time"],
            ["equipment", "Equipment"],
            ["serial", "Serial Number"],
          ].map(([key, label]) => (
            <label
              key={key}
              className="text-sm font-medium"
            >
              {label}

              <Input
                className="mt-2"
                disabled={!editing}
                value={value[key] || ""}
                onChange={(e) =>
                  patch({
                    [key]: e.target.value,
                  })
                }
              />
            </label>
          ))}
        </CardContent>
      </Card>

      {/* SERVICE DETAILS */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Service Details</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          {/* SERVICE TYPE */}
          <label className="text-sm font-medium">
            Service Type

            <Input
              className="mt-2"
              disabled={!editing}
              value={value.serviceType || ""}
              onChange={(e) =>
                patch({
                  serviceType: e.target.value,
                })
              }
            />
          </label>

          {/* INSTALLED SYSTEMS */}
          <label className="text-sm font-medium">
            Installed Systems

            <Input
              className="mt-2"
              disabled={!editing}
              value={(value.systems || []).join(", ")}
              onChange={(e) =>
                patch({
                  systems: e.target.value
                    .split(",")
                    .map((x: string) => x.trim())
                    .filter(Boolean),
                })
              }
            />
          </label>

          {/* REPORTED FAULT */}
          <label className="text-sm font-medium">
            Reported Fault

            <Textarea
              className="mt-2 min-h-24"
              disabled={!editing}
              value={value.reportedFault || ""}
              onChange={(e) =>
                patch({
                  reportedFault: e.target.value,
                })
              }
            />
          </label>

          {/* ACTIONS */}
          <label className="text-sm font-medium">
            Actions

            <Textarea
              className="mt-2 min-h-24"
              disabled={!editing}
              value={(value.actions || []).join("\n")}
              onChange={(e) =>
                patch({
                  actions: e.target.value.split("\n"),
                })
              }
            />
          </label>

          {/* CUSTOMER REMARKS */}
          <label className="text-sm font-medium">
            Customer Remarks

            <Textarea
              className="mt-2 min-h-24"
              disabled={!editing}
              value={value.customerRemarks || ""}
              onChange={(e) =>
                patch({
                  customerRemarks: e.target.value,
                })
              }
            />
          </label>
        </CardContent>
      </Card>

      {/* EVIDENCE */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Evidence</CardTitle>
        </CardHeader>

        <CardContent>
          {evidence.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {evidence.map(
                (item: any, index: number) => (
                  <div
                    key={`${item.url}-${index}`}
                    className="overflow-hidden rounded-xl border bg-muted"
                  >
                    {/* VIDEO */}
                    {item.type === "video" ? (
                      <video
                        src={item.url}
                        controls
                        playsInline
                        className="aspect-video w-full object-cover"
                      />
                    ) : (
                      /* IMAGE */
                      <img
                        src={item.url}
                        alt={`Evidence ${index + 1}`}
                        className="aspect-video w-full object-cover"
                      />
                    )}

                    <div className="flex items-center justify-between p-3">
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {item.type === "video"
                            ? "Video"
                            : "Photo"}
                        </p>

                        {item.fileName && (
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {item.fileName}
                          </p>
                        )}
                      </div>

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Open
                      </a>
                    </div>
                  </div>
                ),
              )}
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

