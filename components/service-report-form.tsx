"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Plus, Trash2, Video, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CameraCapture } from "@/components/camera-capture";

type Field = {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  multiple?: boolean;
};
const today = "10/05/2026";
const keyMap: Record<string, string> = {
  "customer-name": "customer",
  "customer-address": "address",
  "engineer-name": "engineer",
  "service-call-date": "date",
  "service-call-time": "time",
  equipment: "equipment",
  "serial-number": "serial",
  "service-type": "serviceType",
  "installed-systems": "systems",
  "reported-fault": "reportedFault",
  actions: "actions",
  "customer-name-evidence": "customerName",
  "customer-remarks": "customerRemarks",
};

export default function ServiceReportForm() {
  const router = useRouter();
  const [template, setTemplate] = useState<any>();
  const [camera, setCamera] = useState<any>();
  const [data, setData] = useState<any>({
    date: today,
    time: "11:30 AM",
    serviceType: "",
    systems: [],
    actions: [""],
    evidence: {},
  });
  useEffect(() => {
    fetch("/api/templates/service-report")
      .then((r) => r.json())
      .then((t) => {
        setTemplate(t);
        const service = t.sections.find((s: any) => s.id === "service-type");
        setData((d: any) => ({
          ...d,
          serviceType: service?.fields?.[0]?.options?.[0] || "",
        }));
      });
  }, []);
  const sections = template?.sections || [];
  const setValue = (field: Field, value: any) =>
    setData((d: any) => ({ ...d, [keyMap[field.id] || field.id]: value }));
  const valueFor = (field: Field) =>
    data[keyMap[field.id] || field.id] ??
    (field.type === "multiple-choice" ? [] : "");
  const fieldControl = (field: Field) => {
    const value = valueFor(field);
    if (field.type === "textarea")
      return (
        <Textarea
          value={Array.isArray(value) ? value[0] || "" : value}
          onChange={(e) => setValue(field, e.target.value)}
        />
      );
    if (field.type === "single-choice")
      return (
        <div className="flex flex-wrap gap-2">
          {(field.options || []).map((option) => (
            <Button
              key={option}
              type="button"
              variant={value === option ? "default" : "outline"}
              onClick={() => setValue(field, option)}
            >
              {option}
            </Button>
          ))}
        </div>
      );
    if (field.type === "multiple-choice")
      return (
        <div className="grid gap-2">
          {(field.options || []).map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={(value || []).includes(option)}
                onChange={(e) =>
                  setValue(
                    field,
                    e.target.checked
                      ? [...value, option]
                      : value.filter((x: string) => x !== option),
                  )
                }
              />
              {option}
            </label>
          ))}
        </div>
      );
    if (field.type === "camera-photo" || field.type === "camera-video")
      return (
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setCamera({
                mode: field.type === "camera-video" ? "video" : "photo",
                field,
              })
            }
          >
            {field.type === "camera-video" ? (
              <Video data-icon="inline-start" />
            ) : (
              <Camera data-icon="inline-start" />
            )}

            {field.label}
          </Button>

          {/* Evidence for THIS field only */}
          {data.evidence?.[field.id]?.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {data.evidence[field.id].map((item: any, index: number) => (
                <div
                  key={`${item.url}-${index}`}
                  className="group relative overflow-hidden rounded-xl border bg-muted"
                >
                  {item.type === "video" ? (
                    <video
                      src={item.url}
                      controls
                      playsInline
                      className="aspect-video w-full object-cover"
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={`Evidence ${index + 1}`}
                      className="aspect-video w-full object-cover"
                    />
                  )}

                  {/* Remove THIS evidence only */}
                  <button
                    type="button"
                    onClick={() => {
                      setData((current: any) => ({
                        ...current,
                        evidence: {
                          ...current.evidence,
                          [field.id]: current.evidence[field.id].filter(
                            (_: any, i: number) => i !== index,
                          ),
                        },
                      }));
                    }}
                    className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600"
                    aria-label="Remove evidence"
                  >
                    <X className="size-4" />
                  </button>

                  <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white">
                    {item.type === "video" ? "VIDEO" : "PHOTO"}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Add supporting photo or video evidence when available.
          </p>
        </div>
      );
    // if (field.type === "camera-photo" || field.type === "camera-video")
    //   return (
    //     <div className="space-y-3">
    //       <Button
    //         type="button"
    //         variant="outline"
    //         onClick={() =>
    //           setCamera({
    //             mode: field.type === "camera-video" ? "video" : "photo",
    //             field,
    //           })
    //         }
    //       >
    //         {field.type === "camera-video" ? (
    //           <Video data-icon="inline-start" />
    //         ) : (
    //           <Camera data-icon="inline-start" />
    //         )}
    //         {field.label}
    //       </Button>

    //       {/* Evidence preview */}
    //       {data.evidence?.length > 0 && (
    //         <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
    //           {data.evidence.map((item: any, index: number) => (
    //             <div
    //               key={`${item.url}-${index}`}
    //               className="group relative overflow-hidden rounded-xl border bg-muted"
    //             >
    //               {item.type === "video" ? (
    //                 <video
    //                   src={item.url}
    //                   controls
    //                   playsInline
    //                   className="aspect-video w-full object-cover"
    //                 />
    //               ) : (
    //                 <img
    //                   src={item.url}
    //                   alt={`Evidence ${index + 1}`}
    //                   className="aspect-video w-full object-cover"
    //                 />
    //               )}

    //               {/* Remove button */}
    //               <button
    //                 type="button"
    //                 onClick={() => {
    //                   setData((current: any) => ({
    //                     ...current,
    //                     evidence: current.evidence.filter(
    //                       (_: any, i: number) => i !== index,
    //                     ),
    //                   }));
    //                 }}
    //                 className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600"
    //                 aria-label="Remove evidence"
    //               >
    //                 <X className="size-4" />
    //               </button>

    //               {/* Type badge */}
    //               <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white">
    //                 {item.type === "video" ? "VIDEO" : "PHOTO"}
    //               </div>
    //             </div>
    //           ))}
    //         </div>
    //       )}

    //       <p className="text-xs text-muted-foreground">
    //         Add supporting photo or video evidence when available.
    //       </p>
    //     </div>
    //   );
    // if (field.type === "camera-photo" || field.type === "camera-video")
    //   return (
    //     <Button
    //       type="button"
    //       variant="outline"
    //       onClick={() =>
    //         setCamera({
    //           mode: field.type === "camera-video" ? "video" : "photo",
    //           field,
    //         })
    //       }
    //     >
    //       {field.type === "camera-video" ? (
    //         <Video data-icon="inline-start" />
    //       ) : (
    //         <Camera data-icon="inline-start" />
    //       )}
    //       {field.label}
    //     </Button>
    //   );
    return (
      <Input
        type={field.type === "number" ? "number" : field.type}
        value={value}
        onChange={(e) => setValue(field, e.target.value)}
      />
    );
  };
  async function save(submit = false) {
    const r = await fetch("/api/service-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const item = await r.json();
    if (Object.keys(data.evidence || {}).length > 0)
      await fetch(`/api/service-reports/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    if (submit) {
      await fetch(`/api/service-reports/${item.id}/submit`, { method: "POST" });
      router.push(`/employee/service-reports/${item.id}`);
    } else alert("Service report saved as draft.");
  }
  if (!template)
    return (
      <AppShell user="S. Roy">
        <main className="p-8 text-muted-foreground">
          Loading service report template…
        </main>
      </AppShell>
    );
  return (
    <AppShell user="S. Roy">
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-8">
        <Button
          variant="ghost"
          className="self-start"
          onClick={() => router.push("/employee")}
        >
          <ArrowLeft data-icon="inline-start" />
          Back to Dashboard
        </Button>
        <header>
          <p className="text-sm font-semibold text-primary">
            Service Report · {today}
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            {template.name.toUpperCase()}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Record service calls, reported faults, and corrective actions taken.
          </p>
        </header>
        {sections.map((section: any) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle>{section.name}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              {section.fields.map((field: Field) => (
                <label
                  key={field.id}
                  className={`flex flex-col gap-2 text-sm font-medium ${field.type === "textarea" || field.type.includes("choice") || field.type.includes("camera") ? "sm:col-span-2" : ""}`}
                >
                  {field.label}
                  {field.required && (
                    <span className="text-xs text-muted-foreground">
                      Required
                    </span>
                  )}
                  {field.multiple && (
                    <div className="flex flex-col gap-2">
                      {(valueFor(field) || [""]).map(
                        (action: string, index: number) => (
                          <div key={index} className="flex gap-2">
                            <Textarea
                              value={action}
                              onChange={(e) =>
                                setValue(
                                  field,
                                  (valueFor(field) || []).map(
                                    (x: string, i: number) =>
                                      i === index ? e.target.value : x,
                                  ),
                                )
                              }
                            />
                            {index > 0 && (
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() =>
                                  setValue(
                                    field,
                                    valueFor(field).filter(
                                      (_: string, i: number) => i !== index,
                                    ),
                                  )
                                }
                              >
                                <Trash2 />
                              </Button>
                            )}
                          </div>
                        ),
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        className="self-start"
                        onClick={() =>
                          setValue(field, [...(valueFor(field) || []), ""])
                        }
                      >
                        <Plus data-icon="inline-start" />
                        Add Action
                      </Button>
                    </div>
                  )}
                  {!field.multiple && fieldControl(field)}
                </label>
              ))}
            </CardContent>
          </Card>
        ))}
        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={() => save(false)}>
            Save Draft
          </Button>
          <Button
            onClick={() => {
              if (confirm("Submit this service report?")) save(true);
            }}
          >
            Submit Report
          </Button>
        </div>
        {camera && (
          <CameraCapture
            mode={camera.mode}
            reportId="new"
            onCancel={() => setCamera(null)}
            // onUse={(item: any) => {
            //   setData((d: any) => ({
            //     ...d,
            //     evidence: [...(d.evidence || []), item],
            //   }));
            //   setCamera(null);
            // }}
            onUse={(item: any) => {
              const fieldId = camera.field.id;

              setData((d: any) => ({
                ...d,
                evidence: {
                  ...(d.evidence || {}),
                  [fieldId]: [...(d.evidence?.[fieldId] || []), item],
                },
              }));

              setCamera(null);
            }}
          />
        )}
      </main>
    </AppShell>
  );
}
