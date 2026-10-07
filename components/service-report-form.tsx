// // "use client";

// // import { useRouter } from "next/navigation";
// // import { ArrowLeft } from "lucide-react";

// // import { Button } from "@/components/ui/button";
// // import {
// //   Card,
// //   CardContent,
// //   CardHeader,
// //   CardTitle,
// // } from "@/components/ui/card";
// // import { Badge } from "@/components/ui/badge";

// // type Evidence = {
// //   url: string;
// //   type: string;
// //   fileName?: string;
// // };

// // type ServiceReport = {
// //   id: string;
// //   status?: string;

// //   customer?: string;
// //   address?: string;
// //   engineer?: string;
// //   date?: string;
// //   time?: string;
// //   equipment?: string;
// //   serial?: string;

// //   serviceType?: string;
// //   systems?: string[];

// //   reportedFault?: string;
// //   actions?: string[];

// //   customerRemarks?: string;

// //   evidence?: Record<string, Evidence[]>;
// // };

// // export function ServiceReportForm({
// //   report,
// // }: {
// //   report: ServiceReport;
// // }) {
// //   const router = useRouter();

// //   const evidence = Object.values(
// //     report.evidence || {},
// //   ).flat();

// //   const customerEvidence = evidence.filter(
// //     (item) => item.type === "customer",
// //   );

// //   const otherEvidence = evidence.filter(
// //     (item) => item.type !== "customer",
// //   );

// //   return (
// //     <main className="mx-auto flex max-w-4xl flex-col gap-6 px-5 py-8">
// //       {/* BACK BUTTON */}

// //       <Button
// //         variant="ghost"
// //         className="self-start"
// //         onClick={() => router.push("/employee")}
// //       >
// //         <ArrowLeft data-icon="inline-start" />
// //         Back to Dashboard
// //       </Button>

// //       {/* HEADER */}

// //       <div>
// //         <p className="text-sm font-semibold text-primary">
// //           {report.id}
// //         </p>

// //         <h1 className="mt-2 text-3xl font-bold">
// //           EQUIPMENT SERVICE & MAINTENANCE REPORT
// //         </h1>

// //         {report.status && (
// //           <Badge className="mt-3">
// //             {report.status}
// //           </Badge>
// //         )}
// //       </div>

// //       {/* JOB INFORMATION */}

// //       <Card>
// //         <CardHeader>
// //           <CardTitle>JOB INFORMATION</CardTitle>
// //         </CardHeader>

// //         <CardContent className="grid gap-4 sm:grid-cols-2">
// //           {[
// //             ["Customer", report.customer],
// //             ["Address", report.address],
// //             ["Engineer", report.engineer],
// //             ["Date", report.date],
// //             ["Time", report.time],
// //             ["Equipment", report.equipment],
// //             ["Serial Number", report.serial],
// //           ].map(([key, value]) => (
// //             <div key={key}>
// //               <p className="text-xs font-semibold uppercase text-muted-foreground">
// //                 {key}
// //               </p>

// //               <p className="mt-1">
// //                 {value || "—"}
// //               </p>
// //             </div>
// //           ))}
// //         </CardContent>
// //       </Card>

// //       {/* SERVICE TYPE */}

// //       <Card>
// //         <CardHeader>
// //           <CardTitle>SERVICE TYPE</CardTitle>
// //         </CardHeader>

// //         <CardContent>
// //           {report.serviceType || "—"}
// //         </CardContent>
// //       </Card>

// //       {/* INSTALLED SYSTEMS */}

// //       <Card>
// //         <CardHeader>
// //           <CardTitle>INSTALLED SYSTEM CHECKED</CardTitle>
// //         </CardHeader>

// //         <CardContent>
// //           {report.systems && report.systems.length > 0
// //             ? report.systems.join(", ")
// //             : "—"}
// //         </CardContent>
// //       </Card>

// //       {/* FAULT + ACTIONS */}

// //       <Card>
// //         <CardHeader>
// //           <CardTitle>
// //             FAULT DIAGNOSIS & ACTION LOG
// //           </CardTitle>
// //         </CardHeader>

// //         <CardContent className="flex flex-col gap-5">
// //           <div>
// //             <p className="text-sm font-semibold">
// //               Reported Fault
// //             </p>

// //             <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
// //               {report.reportedFault || "—"}
// //             </p>
// //           </div>

// //           {report.actions && report.actions.length > 0 ? (
// //             report.actions.map((action, index) => (
// //               <div key={index}>
// //                 <p className="text-sm font-semibold">
// //                   Action {index + 1}
// //                 </p>

// //                 <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
// //                   {action || "—"}
// //                 </p>
// //               </div>
// //             ))
// //           ) : (
// //             <p className="text-sm text-muted-foreground">
// //               No actions recorded.
// //             </p>
// //           )}
// //         </CardContent>
// //       </Card>

// //       {/* CUSTOMER EVIDENCE */}

// //       <Card>
// //         <CardHeader>
// //           <CardTitle>CUSTOMER EVIDENCE</CardTitle>
// //         </CardHeader>

// //         <CardContent className="flex flex-col gap-4">
// //           {report.customerRemarks && (
// //             <div>
// //               <p className="text-sm font-semibold">
// //                 Customer Remarks
// //               </p>

// //               <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
// //                 {report.customerRemarks}
// //               </p>
// //             </div>
// //           )}

// //           {customerEvidence.length > 0 ? (
// //             <div className="grid gap-4 sm:grid-cols-2">
// //               {customerEvidence.map((item, index) => (
// //                 <div
// //                   key={`${item.url}-${index}`}
// //                   className="overflow-hidden rounded-xl border bg-muted"
// //                 >
// //                   {item.type === "video" ? (
// //                     <video
// //                       src={item.url}
// //                       controls
// //                       playsInline
// //                       className="max-h-72 w-full object-cover"
// //                     />
// //                   ) : (
// //                     <img
// //                       src={item.url}
// //                       alt={`Customer evidence ${index + 1}`}
// //                       className="max-h-72 w-full object-cover"
// //                     />
// //                   )}
// //                 </div>
// //               ))}
// //             </div>
// //           ) : (
// //             <p className="text-sm text-muted-foreground">
// //               No customer evidence attached.
// //             </p>
// //           )}
// //         </CardContent>
// //       </Card>

// //       {/* GENERAL EVIDENCE */}

// //       <Card>
// //         <CardHeader>
// //           <CardTitle>EVIDENCE</CardTitle>
// //         </CardHeader>

// //         <CardContent>
// //           {otherEvidence.length > 0 ? (
// //             <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
// //               {otherEvidence.map((item, index) => (
// //                 <a
// //                   key={`${item.url}-${index}`}
// //                   href={item.url}
// //                   target="_blank"
// //                   rel="noreferrer"
// //                   className="group overflow-hidden rounded-xl border bg-background p-2 transition hover:shadow-md"
// //                 >
// //                   <div className="overflow-hidden rounded-lg">
// //                     {item.type === "video" ? (
// //                       <video
// //                         src={item.url}
// //                         controls
// //                         playsInline
// //                         className="aspect-square w-full object-cover"
// //                       />
// //                     ) : (
// //                       <img
// //                         src={item.url}
// //                         alt={`Evidence ${index + 1}`}
// //                         className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
// //                       />
// //                     )}
// //                   </div>

// //                   <span className="mt-2 block text-sm capitalize text-muted-foreground">
// //                     {item.type === "video"
// //                       ? "Video"
// //                       : "Photo"}
// //                   </span>
// //                 </a>
// //               ))}
// //             </div>
// //           ) : (
// //             <p className="text-sm text-muted-foreground">
// //               No evidence attached.
// //             </p>
// //           )}
// //         </CardContent>
// //       </Card>
// //     </main>
// //   );
// // }

// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { useRouter } from "next/navigation";
// import { ArrowLeft, Camera, Plus, Trash2, Video, X } from "lucide-react";
// import { AppShell } from "@/components/app-shell";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { CameraCapture } from "@/components/camera-capture";

// type Field = {
//   id: string;
//   label: string;
//   type: string;
//   required?: boolean;
//   options?: string[];
//   multiple?: boolean;
// };
// const today = "10/05/2026";
// const keyMap: Record<string, string> = {
//   "customer-name": "customer",
//   "customer-address": "address",
//   "engineer-name": "engineer",
//   "service-call-date": "date",
//   "service-call-time": "time",
//   equipment: "equipment",
//   "serial-number": "serial",
//   "service-type": "serviceType",
//   "installed-systems": "systems",
//   "reported-fault": "reportedFault",
//   actions: "actions",
//   "customer-name-evidence": "customerName",
//   "customer-remarks": "customerRemarks",
// };

// export default function ServiceReportForm() {
//   const router = useRouter();
//   const [template, setTemplate] = useState<any>();
//   const [camera, setCamera] = useState<any>();
//   // const [data, setData] = useState<any>({
//   //   date: today,
//   //   time: "11:30 AM",
//   //   serviceType: "",
//   //   systems: [],
//   //   actions: [""],
//   //   evidence: {},
//   // });
//   const [data, setData] = useState<any>({
//     customer: "",
//     address: "",
//     engineer: "",
//     date: today,
//     time: "11:30 AM",
//     equipment: "",
//     serial: "",
//     serviceType: "",
//     systems: [],
//     reportedFault: "",
//     actions: [""],
//     customerName: "",
//     customerRemarks: "",
//     evidence: {},
//   });
//   useEffect(() => {
//     fetch("/api/templates/service-report")
//       .then((r) => r.json())
//       .then((t) => {
//         setTemplate(t);
//         const service = t.sections.find((s: any) => s.id === "service-type");
//         setData((d: any) => ({
//           ...d,
//           serviceType: service?.fields?.[0]?.options?.[0] || "",
//         }));
//       });
//   }, []);
//   const sections = template?.sections || [];
//   const setValue = (field: Field, value: any) =>
//     setData((d: any) => ({ ...d, [keyMap[field.id] || field.id]: value }));
//   const valueFor = (field: Field) =>
//     data[keyMap[field.id] || field.id] ??
//     (field.type === "multiple-choice" ? [] : "");
//   const fieldControl = (field: Field) => {
//     const value = valueFor(field);
//     if (field.type === "textarea")
//       return (
//         <Textarea
//           value={Array.isArray(value) ? value[0] || "" : value}
//           onChange={(e) => setValue(field, e.target.value)}
//         />
//       );
//     if (field.type === "single-choice")
//       return (
//         <div className="flex flex-wrap gap-2">
//           {(field.options || []).map((option) => (
//             <Button
//               key={option}
//               type="button"
//               variant={value === option ? "default" : "outline"}
//               onClick={() => setValue(field, option)}
//             >
//               {option}
//             </Button>
//           ))}
//         </div>
//       );
//     if (field.type === "multiple-choice")
//       return (
//         <div className="grid gap-2">
//           {(field.options || []).map((option) => (
//             <label key={option} className="flex items-center gap-2 text-sm">
//               <input
//                 type="checkbox"
//                 checked={(value || []).includes(option)}
//                 onChange={(e) =>
//                   setValue(
//                     field,
//                     e.target.checked
//                       ? [...value, option]
//                       : value.filter((x: string) => x !== option),
//                   )
//                 }
//               />
//               {option}
//             </label>
//           ))}
//         </div>
//       );
//     if (field.type === "camera-photo" || field.type === "camera-video")
//       return (
//         <div className="space-y-3">
//           <Button
//             type="button"
//             variant="outline"
//             onClick={() =>
//               setCamera({
//                 mode: field.type === "camera-video" ? "video" : "photo",
//                 field,
//               })
//             }
//           >
//             {field.type === "camera-video" ? (
//               <Video data-icon="inline-start" />
//             ) : (
//               <Camera data-icon="inline-start" />
//             )}

//             {field.label}
//           </Button>

//           {/* Evidence for THIS field only */}
//           {data.evidence?.[field.id]?.length > 0 && (
//             <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
//               {data.evidence[field.id].map((item: any, index: number) => (
//                 <div
//                   key={`${item.url}-${index}`}
//                   className="group relative overflow-hidden rounded-xl border bg-muted"
//                 >
//                   {item.type === "video" ? (
//                     <video
//                       src={item.url}
//                       controls
//                       playsInline
//                       className="aspect-video w-full object-cover"
//                     />
//                   ) : (
//                     <img
//                       src={item.url}
//                       alt={`Evidence ${index + 1}`}
//                       className="aspect-video w-full object-cover"
//                     />
//                   )}

//                   {/* Remove THIS evidence only */}
//                   <button
//                     type="button"
//                     onClick={() => {
//                       setData((current: any) => ({
//                         ...current,
//                         evidence: {
//                           ...current.evidence,
//                           [field.id]: current.evidence[field.id].filter(
//                             (_: any, i: number) => i !== index,
//                           ),
//                         },
//                       }));
//                     }}
//                     className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600"
//                     aria-label="Remove evidence"
//                   >
//                     <X className="size-4" />
//                   </button>

//                   <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white">
//                     {item.type === "video" ? "VIDEO" : "PHOTO"}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}

//           <p className="text-xs text-muted-foreground">
//             Add supporting photo or video evidence when available.
//           </p>
//         </div>
//       );
//     // if (field.type === "camera-photo" || field.type === "camera-video")
//     //   return (
//     //     <div className="space-y-3">
//     //       <Button
//     //         type="button"
//     //         variant="outline"
//     //         onClick={() =>
//     //           setCamera({
//     //             mode: field.type === "camera-video" ? "video" : "photo",
//     //             field,
//     //           })
//     //         }
//     //       >
//     //         {field.type === "camera-video" ? (
//     //           <Video data-icon="inline-start" />
//     //         ) : (
//     //           <Camera data-icon="inline-start" />
//     //         )}
//     //         {field.label}
//     //       </Button>

//     //       {/* Evidence preview */}
//     //       {data.evidence?.length > 0 && (
//     //         <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
//     //           {data.evidence.map((item: any, index: number) => (
//     //             <div
//     //               key={`${item.url}-${index}`}
//     //               className="group relative overflow-hidden rounded-xl border bg-muted"
//     //             >
//     //               {item.type === "video" ? (
//     //                 <video
//     //                   src={item.url}
//     //                   controls
//     //                   playsInline
//     //                   className="aspect-video w-full object-cover"
//     //                 />
//     //               ) : (
//     //                 <img
//     //                   src={item.url}
//     //                   alt={`Evidence ${index + 1}`}
//     //                   className="aspect-video w-full object-cover"
//     //                 />
//     //               )}

//     //               {/* Remove button */}
//     //               <button
//     //                 type="button"
//     //                 onClick={() => {
//     //                   setData((current: any) => ({
//     //                     ...current,
//     //                     evidence: current.evidence.filter(
//     //                       (_: any, i: number) => i !== index,
//     //                     ),
//     //                   }));
//     //                 }}
//     //                 className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600"
//     //                 aria-label="Remove evidence"
//     //               >
//     //                 <X className="size-4" />
//     //               </button>

//     //               {/* Type badge */}
//     //               <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white">
//     //                 {item.type === "video" ? "VIDEO" : "PHOTO"}
//     //               </div>
//     //             </div>
//     //           ))}
//     //         </div>
//     //       )}

//     //       <p className="text-xs text-muted-foreground">
//     //         Add supporting photo or video evidence when available.
//     //       </p>
//     //     </div>
//     //   );
//     // if (field.type === "camera-photo" || field.type === "camera-video")
//     //   return (
//     //     <Button
//     //       type="button"
//     //       variant="outline"
//     //       onClick={() =>
//     //         setCamera({
//     //           mode: field.type === "camera-video" ? "video" : "photo",
//     //           field,
//     //         })
//     //       }
//     //     >
//     //       {field.type === "camera-video" ? (
//     //         <Video data-icon="inline-start" />
//     //       ) : (
//     //         <Camera data-icon="inline-start" />
//     //       )}
//     //       {field.label}
//     //     </Button>
//     //   );
//     return (
//       <Input
//         type={field.type === "number" ? "number" : field.type}
//         value={value}
//         onChange={(e) => setValue(field, e.target.value)}
//       />
//     );
//   };
//   // async function save(submit = false) {
//   //   const r = await fetch("/api/service-reports", {
//   //     method: "POST",
//   //     headers: { "Content-Type": "application/json" },
//   //     body: JSON.stringify(data),
//   //   });
//   //   const item = await r.json();
//   //   if (Object.keys(data.evidence || {}).length > 0)
//   //     await fetch(`/api/service-reports/${item.id}`, {
//   //       method: "PUT",
//   //       headers: { "Content-Type": "application/json" },
//   //       body: JSON.stringify(data),
//   //     });
//   //   if (submit) {
//   //     await fetch(`/api/service-reports/${item.id}/submit`, { method: "POST" });
//   //     router.push(`/employee/service-reports/${item.id}`);
//   //   } else alert("Service report saved as draft.");
//   // }
//   async function save(submit = false) {
//     // Validate only when submitting
//     if (submit) {
//       const requiredFields = sections.flatMap((section: any) =>
//         section.fields.filter((field: Field) => field.required),
//       );

//       const missingFields = requiredFields.filter((field: Field) => {
//         const value = valueFor(field);

//         if (Array.isArray(value)) {
//           return value.length === 0 || value.every((v) => !String(v).trim());
//         }

//         return !String(value ?? "").trim();
//       });

//       if (missingFields.length > 0) {
//         alert(
//           `Please fill the required fields:\n\n${missingFields
//             .map((field: Field) => `• ${field.label}`)
//             .join("\n")}`,
//         );
//         return;
//       }
//     }

//     // Create the service report
//     const r = await fetch("/api/service-reports", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(data),
//     });

//     if (!r.ok) {
//       const error = await r.text();
//       console.error("Save service report failed:", error);
//       alert("Failed to save service report.");
//       return;
//     }

//     const item = await r.json();

//     // Save evidence
//     if (Object.keys(data.evidence || {}).length > 0) {
//       const updateResponse = await fetch(`/api/service-reports/${item.id}`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(data),
//       });

//       if (!updateResponse.ok) {
//         alert("Report saved, but evidence could not be saved.");
//         return;
//       }
//     }

//     // Submit
//     if (submit) {
//       const submitResponse = await fetch(
//         `/api/service-reports/${item.id}/submit`,
//         {
//           method: "POST",
//         },
//       );

//       if (!submitResponse.ok) {
//         const error = await submitResponse.text();
//         console.error("Submit failed:", error);
//         alert("Failed to submit service report.");
//         return;
//       }

//       router.push(`/employee/service-reports/${item.id}`);
//     } else {
//       alert("Service report saved as draft.");
//     }
//   }
//   if (!template)
//     return (
//       <AppShell user="S. Roy">
//         <main className="p-8 text-muted-foreground">
//           Loading service report template…
//         </main>
//       </AppShell>
//     );
//   return (
//     <AppShell user="S. Roy">
//       <main className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-8">
//         <Button
//           variant="ghost"
//           className="self-start"
//           onClick={() => router.push("/employee")}
//         >
//           <ArrowLeft data-icon="inline-start" />
//           Back to Dashboard
//         </Button>
//         <header>
//           <p className="text-sm font-semibold text-primary">
//             Service Report · {today}
//           </p>
//           <h1 className="mt-2 text-3xl font-bold">
//             {template.name.toUpperCase()}
//           </h1>
//           <p className="mt-2 text-muted-foreground">
//             Record service calls, reported faults, and corrective actions taken.
//           </p>
//         </header>
//         {sections.map((section: any) => (
//           <Card key={section.id}>
//             <CardHeader>
//               <CardTitle>{section.name}</CardTitle>
//             </CardHeader>
//             <CardContent className="grid gap-5 sm:grid-cols-2">
//               {section.fields.map((field: Field) => (
//                 <label
//                   key={field.id}
//                   className={`flex flex-col gap-2 text-sm font-medium ${field.type === "textarea" || field.type.includes("choice") || field.type.includes("camera") ? "sm:col-span-2" : ""}`}
//                 >
//                   {field.label}
//                   {field.required && (
//                     <span className="text-xs text-muted-foreground">
//                       Required
//                     </span>
//                   )}
//                   {field.multiple && (
//                     <div className="flex flex-col gap-2">
//                       {(valueFor(field) || [""]).map(
//                         (action: string, index: number) => (
//                           <div key={index} className="flex gap-2">
//                             <Textarea
//                               value={action}
//                               onChange={(e) =>
//                                 setValue(
//                                   field,
//                                   (valueFor(field) || []).map(
//                                     (x: string, i: number) =>
//                                       i === index ? e.target.value : x,
//                                   ),
//                                 )
//                               }
//                             />
//                             {index > 0 && (
//                               <Button
//                                 type="button"
//                                 variant="ghost"
//                                 onClick={() =>
//                                   setValue(
//                                     field,
//                                     valueFor(field).filter(
//                                       (_: string, i: number) => i !== index,
//                                     ),
//                                   )
//                                 }
//                               >
//                                 <Trash2 />
//                               </Button>
//                             )}
//                           </div>
//                         ),
//                       )}
//                       <Button
//                         type="button"
//                         variant="outline"
//                         className="self-start"
//                         onClick={() =>
//                           setValue(field, [...(valueFor(field) || []), ""])
//                         }
//                       >
//                         <Plus data-icon="inline-start" />
//                         Add Action
//                       </Button>
//                     </div>
//                   )}
//                   {!field.multiple && fieldControl(field)}
//                 </label>
//               ))}
//             </CardContent>
//           </Card>
//         ))}
//         <div className="flex justify-end gap-3 border-t pt-4">
//           <Button variant="outline" onClick={() => save(false)}>
//             Save Draft
//           </Button>
//           <Button
//             onClick={() => {
//               if (confirm("Submit this service report?")) save(true);
//             }}
//           >
//             Submit Report
//           </Button>
//         </div>
//         {camera && (
//           <CameraCapture
//             mode={camera.mode}
//             reportId="new"
//             onCancel={() => setCamera(null)}
//             // onUse={(item: any) => {
//             //   setData((d: any) => ({
//             //     ...d,
//             //     evidence: [...(d.evidence || []), item],
//             //   }));
//             //   setCamera(null);
//             // }}
//             onUse={(item: any) => {
//               const fieldId = camera.field.id;

//               setData((d: any) => ({
//                 ...d,
//                 evidence: {
//                   ...(d.evidence || {}),
//                   [fieldId]: [...(d.evidence?.[fieldId] || []), item],
//                 },
//               }));

//               setCamera(null);
//             }}
//           />
//         )}
//       </main>
//     </AppShell>
//   );
// }
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Plus,
  Save,
  Send,
  Trash2,
  Video,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CameraCapture } from "@/components/camera-capture";

type Field = {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  multiple?: boolean;
};

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

  const [template, setTemplate] = useState<any>(null);
  const [serviceReportId, setServiceReportId] = useState("");

  const [data, setData] = useState<Record<string, any>>({
    customer: "",
    address: "",
    engineer: "",
    date: "",
    time: "",
    equipment: "",
    serial: "",
    serviceType: "",
    systems: [],
    reportedFault: "",
    actions: [""],
    customerName: "",
    customerRemarks: "",
    evidence: {},
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const [camera, setCamera] = useState<{
    mode: "photo" | "video";
    field: Field;
  } | null>(null);

  // --------------------------------------------------
  // LOAD TEMPLATE
  // --------------------------------------------------

  useEffect(() => {
    fetch("/api/templates/service-report")
      .then((r) => r.json())
      .then((d) => {
        setTemplate(d);

        // Set default date/time from current browser date/time
        setData((current) => ({
          ...current,
          date:
            current.date ||
            new Date().toISOString().split("T")[0],
          time:
            current.time ||
            new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
        }));
      })
      .catch((err) => {
        console.error(
          "Failed to load service report template:",
          err,
        );
      });
  }, []);

  // --------------------------------------------------
  // FIELD VALUE
  // --------------------------------------------------

  function getKey(field: Field) {
    return keyMap[field.id] || field.id;
  }

  function valueFor(field: Field) {
    const key = getKey(field);

    return (
      data[key] ??
      (field.type === "multiple-choice" ? [] : "")
    );
  }

  // --------------------------------------------------
  // UPDATE FIELD
  // --------------------------------------------------

  function setValue(field: Field, value: any) {
    const key = getKey(field);

    setData((current) => ({
      ...current,
      [key]: value,
    }));

    // Remove error as soon as the user fills the field
    setErrors((current) => {
      if (!current[field.id]) {
        return current;
      }

      const updated = { ...current };
      delete updated[field.id];

      return updated;
    });
  }

  // --------------------------------------------------
  // VALIDATE REQUIRED FIELDS
  // --------------------------------------------------

  function validateRequiredFields() {
    const requiredFields: Field[] =
      template?.sections?.flatMap((section: any) =>
        section.fields.filter(
          (field: Field) => field.required,
        ),
      ) || [];

    const newErrors: Record<string, boolean> = {};

    for (const field of requiredFields) {
      const value = valueFor(field);

      if (Array.isArray(value)) {
        const empty =
          value.length === 0 ||
          value.every(
            (item) =>
              !String(item ?? "").trim(),
          );

        if (empty) {
          newErrors[field.id] = true;
        }
      } else if (
        !String(value ?? "").trim()
      ) {
        newErrors[field.id] = true;
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      return true;
    }

    // Scroll to first missing field
    const firstMissingId =
      Object.keys(newErrors)[0];

    const firstField =
      document.querySelector(
        `[data-field-id="${firstMissingId}"]`,
      );

    firstField?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    return false;
  }

  // --------------------------------------------------
  // FIELD CONTROL
  // --------------------------------------------------

  function fieldControl(field: Field) {
    const value = valueFor(field);
    const hasError = !!errors[field.id];

    // TEXTAREA
    if (field.type === "textarea") {
      return (
        <Textarea
          value={
            Array.isArray(value)
              ? value[0] || ""
              : value
          }
          onChange={(e) =>
            setValue(
              field,
              e.target.value,
            )
          }
          className={
            hasError
              ? "border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500"
              : ""
          }
        />
      );
    }

    // SINGLE CHOICE
    if (field.type === "single-choice") {
      return (
        <div
          className={
            hasError
              ? "rounded-lg border border-red-500 p-2 ring-1 ring-red-500"
              : ""
          }
        >
          <div className="flex flex-wrap gap-2">
            {(field.options || []).map(
              (option) => (
                <Button
                  key={option}
                  type="button"
                  variant={
                    value === option
                      ? "default"
                      : "outline"
                  }
                  onClick={() =>
                    setValue(
                      field,
                      option,
                    )
                  }
                >
                  {option}
                </Button>
              ),
            )}
          </div>
        </div>
      );
    }

    // MULTIPLE CHOICE
    if (field.type === "multiple-choice") {
      return (
        <div
          className={
            hasError
              ? "rounded-lg border border-red-500 p-3 ring-1 ring-red-500"
              : ""
          }
        >
          <div className="grid gap-2">
            {(field.options || []).map(
              (option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={(
                      value || []
                    ).includes(option)}
                    onChange={(e) => {
                      const current =
                        value || [];

                      setValue(
                        field,
                        e.target.checked
                          ? [
                              ...current,
                              option,
                            ]
                          : current.filter(
                              (item: string) =>
                                item !==
                                option,
                            ),
                      );
                    }}
                  />

                  {option}
                </label>
              ),
            )}
          </div>
        </div>
      );
    }

    // CAMERA PHOTO / VIDEO
    if (
      field.type === "camera-photo" ||
      field.type === "camera-video"
    ) {
      const evidence =
        data.evidence?.[field.id] || [];

      return (
        <div
          className={
            hasError
              ? "space-y-3 rounded-lg border border-red-500 p-3 ring-1 ring-red-500"
              : "space-y-3"
          }
        >
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setCamera({
                mode:
                  field.type ===
                  "camera-video"
                    ? "video"
                    : "photo",
                field,
              })
            }
          >
            {field.type ===
            "camera-video" ? (
              <Video data-icon="inline-start" />
            ) : (
              <Camera data-icon="inline-start" />
            )}

            {field.label}
          </Button>

          {evidence.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {evidence.map(
                (
                  item: any,
                  index: number,
                ) => (
                  <div
                    key={`${item.url}-${index}`}
                    className="group relative overflow-hidden rounded-xl border bg-muted"
                  >
                    {item.type ===
                    "video" ? (
                      <video
                        src={item.url}
                        controls
                        playsInline
                        className="aspect-video w-full object-cover"
                      />
                    ) : (
                      <img
                        src={item.url}
                        alt={`Evidence ${
                          index + 1
                        }`}
                        className="aspect-video w-full object-cover"
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setData(
                          (current) => ({
                            ...current,
                            evidence: {
                              ...current.evidence,
                              [field.id]:
                                current
                                  .evidence?.[
                                  field.id
                                ]?.filter(
                                  (
                                    _: any,
                                    i: number,
                                  ) =>
                                    i !==
                                    index,
                                ) || [],
                            },
                          }),
                        );
                      }}
                      className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600"
                      aria-label="Remove evidence"
                    >
                      <X className="size-4" />
                    </button>

                    <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white">
                      {item.type ===
                      "video"
                        ? "VIDEO"
                        : "PHOTO"}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Add supporting photo or
            video evidence when
            available.
          </p>
        </div>
      );
    }

    // NORMAL INPUT
    return (
      <Input
        type={
          field.type === "number"
            ? "number"
            : field.type
        }
        value={value}
        onChange={(e) =>
          setValue(
            field,
            e.target.value,
          )
        }
        className={
          hasError
            ? "border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500"
            : ""
        }
      />
    );
  }

  // --------------------------------------------------
  // SAVE / SUBMIT
  // --------------------------------------------------

  async function save(submit = false) {
    // Validate only on final submit
    if (submit) {
      if (!validateRequiredFields()) {
        return;
      }

      if (
        !confirm(
          "Submit this service report? You will not be able to edit the completed report.",
        )
      ) {
        return;
      }
    }

    let id = serviceReportId;

    try {
      // --------------------------------------------------
      // CREATE
      // --------------------------------------------------

      if (!id) {
        const response = await fetch(
          "/api/service-reports",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(data),
          },
        );

        if (!response.ok) {
          const error =
            await response.text();

          console.error(
            "Create service report failed:",
            error,
          );

          throw new Error(
            "Failed to create service report",
          );
        }

        const created =
          await response.json();

        id = created.id;

        setServiceReportId(id);
      }

      // --------------------------------------------------
      // UPDATE
      // --------------------------------------------------

      else {
        const response = await fetch(
          `/api/service-reports/${id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(data),
          },
        );

        if (!response.ok) {
          const error =
            await response.text();

          console.error(
            "Update service report failed:",
            error,
          );

          throw new Error(
            "Failed to save service report",
          );
        }
      }

      // --------------------------------------------------
      // SUBMIT
      // --------------------------------------------------

      if (submit) {
        const response = await fetch(
          `/api/service-reports/${id}/submit`,
          {
            method: "POST",
          },
        );

        if (!response.ok) {
          const error =
            await response.text();

          console.error(
            "Submit service report failed:",
            error,
          );

          throw new Error(
            "Failed to submit service report",
          );
        }

        router.push(
          `/employee/service-reports/${id}`,
        );
      } else {
        alert("Draft saved.");
      }
    } catch (error) {
      console.error(
        "SAVE SERVICE REPORT ERROR:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save service report.",
      );
    }
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (!template) {
    return (
      <main className="p-8 text-muted-foreground">
        Loading service report
        template…
      </main>
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <main className="mobile-safe-bottom mx-auto max-w-6xl px-5 py-8 sm:px-8">
      {/* BACK */}

      <Button
        variant="ghost"
        onClick={() =>
          router.push("/employee")
        }
      >
        <ArrowLeft data-icon="inline-start" />
        Back to Service Reports
      </Button>

      {/* HEADER */}

      <Card className="teal-wash mt-5 overflow-hidden shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-primary">
                New Service Report
              </p>

              <h1 className="mt-2 max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl">
                {template.title ||
                  template.name}
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Record service calls,
                reported faults, and
                corrective actions taken.
              </p>
            </div>

            <Badge variant="secondary">
              Draft
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* SECTIONS */}

      <div className="mt-6 flex flex-col gap-6">
        {template.sections.map(
          (section: any) => (
            <section key={section.id}>
              {/* SECTION HEADER */}

              <div className="mb-3 flex items-center justify-between rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
                <div>
                  <h2 className="font-semibold">
                    {section.name ||
                      section.title}
                  </h2>

                  <p className="text-xs text-muted-foreground">
                    Complete the
                    information below.
                  </p>
                </div>

                <Badge variant="secondary">
                  {
                    section.fields
                      .length
                  }{" "}
                  fields
                </Badge>
              </div>

              {/* FIELDS */}

              <Card className="shadow-sm">
                <CardContent className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                  {section.fields.map(
                    (
                      field: Field,
                    ) => {
                      const value =
                        valueFor(
                          field,
                        );

                      return (
                        <div
                          key={field.id}
                          data-field-id={
                            field.id
                          }
                          className={
                            field.type ===
                              "textarea" ||
                            field.type.includes(
                              "choice",
                            ) ||
                            field.type.includes(
                              "camera",
                            )
                              ? "sm:col-span-2"
                              : ""
                          }
                        >
                          <label className="flex flex-col gap-2 text-sm font-medium">
                            <span>
                              {
                                field.label
                              }

                              {field.required && (
                                <span className="ml-1 text-red-500">
                                  *
                                </span>
                              )}
                            </span>

                            {/* MULTIPLE ACTION FIELD */}

                            {field.multiple ? (
                              <div
                                className={
                                  errors[
                                    field
                                      .id
                                  ]
                                    ? "rounded-lg border border-red-500 p-3 ring-1 ring-red-500"
                                    : "flex flex-col gap-2"
                                }
                              >
                                {(
                                  value || [
                                    "",
                                  ]
                                ).map(
                                  (
                                    action: string,
                                    index: number,
                                  ) => (
                                    <div
                                      key={
                                        index
                                      }
                                      className="flex gap-2"
                                    >
                                      <Textarea
                                        value={
                                          action
                                        }
                                        onChange={(
                                          e,
                                        ) =>
                                          setValue(
                                            field,
                                            (
                                              value ||
                                              []
                                            ).map(
                                              (
                                                item: string,
                                                i: number,
                                              ) =>
                                                i ===
                                                index
                                                  ? e
                                                      .target
                                                      .value
                                                  : item,
                                            ),
                                          )
                                        }
                                      />

                                      {index >
                                        0 && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          onClick={() =>
                                            setValue(
                                              field,
                                              (
                                                value ||
                                                []
                                              ).filter(
                                                (
                                                  _: string,
                                                  i: number,
                                                ) =>
                                                  i !==
                                                  index,
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
                                    setValue(
                                      field,
                                      [
                                        ...(value ||
                                          []),
                                        "",
                                      ],
                                    )
                                  }
                                >
                                  <Plus data-icon="inline-start" />
                                  Add Action
                                </Button>
                              </div>
                            ) : (
                              fieldControl(
                                field,
                              )
                            )}
                          </label>

                          {errors[
                            field.id
                          ] && (
                            <p className="mt-1 text-xs font-medium text-red-500">
                              This field is
                              required.
                            </p>
                          )}
                        </div>
                      );
                    },
                  )}
                </CardContent>
              </Card>
            </section>
          ),
        )}
      </div>

      {/* ACTIONS */}

      <div className="mt-6 flex justify-end gap-3 border-t pt-4">
        <Button
          variant="outline"
          onClick={() => save(false)}
        >
          <Save data-icon="inline-start" />
          Save Draft
        </Button>

        <Button
          onClick={() => save(true)}
        >
          <Send data-icon="inline-start" />
          Submit Report
        </Button>
      </div>

      {/* CAMERA */}

      {camera && (
        <CameraCapture
          mode={camera.mode}
          reportId={
            serviceReportId ||
            "new-service-report"
          }
          onCancel={() =>
            setCamera(null)
          }
          onUse={(item: any) => {
            const fieldId =
              camera.field.id;

            setData((current) => ({
              ...current,
              evidence: {
                ...(current.evidence ||
                  {}),
                [fieldId]: [
                  ...(current.evidence?.[
                    fieldId
                  ] || []),
                  item,
                ],
              },
            }));

            setErrors((current) => {
              const updated = {
                ...current,
              };

              delete updated[fieldId];

              return updated;
            });

            setCamera(null);
          }}
        />
      )}
    </main>
  );
}