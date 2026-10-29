"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Plus,
  Save,
  Send,
  Trash2,
  Video,
  LoaderCircle,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CameraCapture } from "@/components/camera-capture";

type FieldType =
  | "text"
  | "textarea"
  | "date"
  | "time"
  | "single-choice"
  | "multiple-choice"
  | "camera-photo"
  | "camera-video"
  | "number"
  | "signature";

type Field = {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  multiple?: boolean;
};

type Section = {
  id: string;
  name: string;
  title?: string;
  fields: Field[];
};

type Template = {
  id: string;
  type: string;
  name: string;
  title?: string;
  sections: Section[];
};

type EvidenceItem = {
  id?: string;
  reportId?: string;
  type: "image" | "video";
  url: string;
  fileName?: string;
  capturedAt?: string;
};

type SignatureData = {
  signature: string;
  signedAt: string;
};

type Customer = {
  id: string;
  name: string;
  address: string;
  gstNo: string | null;
  contactNumber: string;
};

type FormState = {
  templateId: string;
  templateSnapshot: Template;
  formData: Record<string, unknown>;
  evidence: Record<string, EvidenceItem[]>;
  signatures: Record<string, SignatureData>;
};

export default function DailyAccentReportForm() {
  const router = useRouter();

  const [template, setTemplate] = useState<Template | null>(null);
  const [dailyAccentReportId, setDailyAccentReportId] = useState("");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  const [customersLoading, setCustomersLoading] = useState(true);
  const [customerLoadError, setCustomerLoadError] = useState(false);
  const [templateLoadError, setTemplateLoadError] = useState(false);
  const [processingAction, setProcessingAction] = useState<
    "save" | "submit" | null
  >(null);

  const isSavingRef = useRef(false);

  const [data, setData] = useState<FormState>({
    templateId: "daily-accent-report",
    templateSnapshot: {
      id: "daily-accent-report",
      type: "DAILY_ACCENT_REPORT",
      name: "Daily Accent Report",
      title: "Daily Accent Report",
      sections: [],
    },
    formData: {},
    evidence: {},
    signatures: {},
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const [camera, setCamera] = useState<{
    mode: "photo" | "video";
    field: Field;
  } | null>(null);

  const [signatureField, setSignatureField] = useState<Field | null>(null);

  // --------------------------------------------------
  // LOAD TEMPLATE
  // --------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadTemplate() {
      try {
        setTemplateLoadError(false);

        const response = await fetch("/api/templates/daily-accent-report", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load Daily Accent Report template");
        }

        const templateData: Template = await response.json();

        if (
          templateData.id !== "daily-accent-report" ||
          !Array.isArray(templateData.sections)
        ) {
          throw new Error(
            "Invalid Daily Accent Report template returned by API",
          );
        }

        const initialFormData: Record<string, unknown> = {};

        templateData.sections.forEach((section) => {
          section.fields.forEach((field) => {
            if (field.type === "multiple-choice") {
              initialFormData[field.id] = [];
            } else if (field.multiple) {
              initialFormData[field.id] = [""];
            } else {
              initialFormData[field.id] = "";
            }
          });
        });

        if (cancelled) return;

        setTemplate(templateData);

        setData({
          templateId: "daily-accent-report",
          templateSnapshot: {
            ...templateData,
            id: "daily-accent-report",
            type: "DAILY_ACCENT_REPORT",
          },
          formData: initialFormData,
          evidence: {},
          signatures: {},
        });
      } catch (error) {
        console.error("Failed to load Daily Accent Report template:", error);

        if (!cancelled) {
          setTemplateLoadError(true);
        }
      }
    }

    loadTemplate();

    return () => {
      cancelled = true;
    };
  }, []);

  // --------------------------------------------------
  // LOAD CUSTOMERS
  // --------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadCustomers() {
      try {
        setCustomersLoading(true);
        setCustomerLoadError(false);

        const response = await fetch("/employee/customers", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load customers");
        }

        const customerData: Customer[] = await response.json();

        if (!cancelled) {
          setCustomers(customerData);
        }
      } catch (error) {
        console.error("Failed to load customers:", error);

        if (!cancelled) {
          setCustomerLoadError(true);
        }
      } finally {
        if (!cancelled) {
          setCustomersLoading(false);
        }
      }
    }

    loadCustomers();

    return () => {
      cancelled = true;
    };
  }, []);

  // --------------------------------------------------
  // CUSTOMER CHANGE
  // --------------------------------------------------

  function handleCustomerChange(customerId: string) {
    setSelectedCustomerId(customerId);

    const customer = customers.find((item) => item.id === customerId) || null;

    setSelectedCustomer(customer);

    setErrors((current) => {
      const updated = { ...current };
      delete updated.customer;
      return updated;
    });
  }

  // --------------------------------------------------
  // GET VALUE
  // --------------------------------------------------

  function getValue(field: Field): unknown {
    return data.formData?.[field.id] ?? "";
  }

  // --------------------------------------------------
  // SET VALUE
  // --------------------------------------------------

  function setValue(field: Field, value: unknown) {
    setData((current) => ({
      ...current,
      formData: {
        ...current.formData,
        [field.id]: value,
      },
    }));

    setErrors((current) => {
      if (!current[field.id]) return current;

      const updated = { ...current };
      delete updated[field.id];
      return updated;
    });
  }

  // --------------------------------------------------
  // VALIDATE REQUIRED FIELDS
  // --------------------------------------------------

  function validateRequiredFields() {
    if (!template) return false;

    const newErrors: Record<string, boolean> = {};

    if (!selectedCustomerId || !selectedCustomer) {
      newErrors.customer = true;
    }

    for (const section of template.sections) {
      for (const field of section.fields) {
        if (!field.required) continue;

        if (field.type === "signature") {
          if (!data.signatures?.[field.id]?.signature) {
            newErrors[field.id] = true;
          }

          continue;
        }

        if (field.type === "camera-photo" || field.type === "camera-video") {
          if (
            !data.evidence?.[field.id] ||
            data.evidence[field.id].length === 0
          ) {
            newErrors[field.id] = true;
          }

          continue;
        }

        const value = getValue(field);

        if (Array.isArray(value)) {
          const empty =
            value.length === 0 ||
            value.every((item) => !String(item ?? "").trim());

          if (empty) newErrors[field.id] = true;
        } else if (!String(value ?? "").trim()) {
          newErrors[field.id] = true;
        }
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      return true;
    }

    const firstMissingId = Object.keys(newErrors)[0];

    if (firstMissingId === "customer") {
      document.getElementById("customer-selector")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      return false;
    }

    document
      .querySelector(`[data-field-id="${firstMissingId}"]`)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

    return false;
  }

  // --------------------------------------------------
  // CAMERA FIELD
  // --------------------------------------------------

  function renderCameraField(field: Field) {
    const evidence = data.evidence?.[field.id] || [];
    const hasError = !!errors[field.id];

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

          {field.type === "camera-video" ? "Capture Video" : "Capture Photo"}
        </Button>

        {evidence.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {evidence.map((item, index) => (
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

                <button
                  type="button"
                  onClick={() => {
                    setData((current) => ({
                      ...current,
                      evidence: {
                        ...current.evidence,
                        [field.id]: (current.evidence[field.id] || []).filter(
                          (_, i) => i !== index,
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
  }

  // --------------------------------------------------
  // SIGNATURE FIELD
  // --------------------------------------------------

  function renderSignatureField(field: Field) {
    const signature = data.signatures?.[field.id];
    const hasError = !!errors[field.id];

    return (
      <div
        className={
          hasError
            ? "space-y-3 rounded-lg border border-red-500 p-3 ring-1 ring-red-500"
            : "space-y-3"
        }
      >
        {signature?.signature ? (
          <>
            <div className="overflow-hidden rounded-xl border bg-white">
              <img
                src={signature.signature}
                alt={field.label}
                className="h-40 w-full object-contain"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Signed on{" "}
                {new Date(signature.signedAt).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  dateStyle: "medium",
                  timeStyle: "short",
                })}{" "}
                IST
              </p>

              <Button
                type="button"
                variant="outline"
                onClick={() => setSignatureField(field)}
              >
                Re-sign
              </Button>
            </div>
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="h-24 w-full border-dashed"
            onClick={() => setSignatureField(field)}
          >
            Sign on Touch Pad
          </Button>
        )}
      </div>
    );
  }

  // --------------------------------------------------
  // NORMAL FIELD CONTROL
  // --------------------------------------------------

  function fieldControl(field: Field) {
    const value = getValue(field);
    const hasError = !!errors[field.id];

    if (field.type === "textarea") {
      return (
        <Textarea
          value={
            Array.isArray(value) ? String(value[0] || "") : String(value || "")
          }
          onChange={(event) => setValue(field, event.target.value)}
          className={
            hasError
              ? "border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500"
              : ""
          }
        />
      );
    }

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
        </div>
      );
    }

    if (field.type === "multiple-choice") {
      const selected = Array.isArray(value) ? value.map(String) : [];

      return (
        <div
          className={
            hasError
              ? "rounded-lg border border-red-500 p-3 ring-1 ring-red-500"
              : ""
          }
        >
          <div className="grid gap-2">
            {(field.options || []).map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={(event) => {
                    setValue(
                      field,
                      event.target.checked
                        ? [...selected, option]
                        : selected.filter((item) => item !== option),
                    );
                  }}
                />

                {option}
              </label>
            ))}
          </div>
        </div>
      );
    }

    if (field.type === "camera-photo" || field.type === "camera-video") {
      return renderCameraField(field);
    }

    if (field.type === "signature") {
      return renderSignatureField(field);
    }

    return (
      <Input
        type={field.type === "number" ? "number" : field.type}
        value={
          Array.isArray(value) ? String(value[0] || "") : String(value || "")
        }
        onChange={(event) => setValue(field, event.target.value)}
        className={
          hasError
            ? "border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500"
            : ""
        }
      />
    );
  }

  // --------------------------------------------------
  // MULTIPLE FIELD
  // --------------------------------------------------

  function renderMultipleField(field: Field) {
    const value = getValue(field);
    const values = Array.isArray(value) ? value.map(String) : [""];
    const hasError = !!errors[field.id];

    return (
      <div
        className={
          hasError
            ? "rounded-lg border border-red-500 p-3 ring-1 ring-red-500"
            : "flex flex-col gap-2"
        }
      >
        {values.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Textarea
              value={item}
              onChange={(event) => {
                const updated = [...values];
                updated[index] = event.target.value;
                setValue(field, updated);
              }}
            />

            {index > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setValue(
                    field,
                    values.filter((_, i) => i !== index),
                  );
                }}
                aria-label="Remove entry"
              >
                <Trash2 />
              </Button>
            )}
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={() => setValue(field, [...values, ""])}
        >
          <Plus data-icon="inline-start" />
          Add
        </Button>
      </div>
    );
  }



  async function save(submit = false) {
    // Prevent rapid clicks before React re-renders.
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    setProcessingAction(submit ? "submit" : "save");

    try {
      if (!selectedCustomerId || !selectedCustomer) {
        setErrors((current) => ({
          ...current,
          customer: true,
        }));

        document.getElementById("customer-selector")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        return;
      }

      if (submit) {
        if (!validateRequiredFields()) return;

        if (
          !window.confirm(
            "Submit this Daily Accent Report? You will not be able to edit the completed report.",
          )
        ) {
          return;
        }
      }

      const payload = {
        templateId: "daily-accent-report",
        templateSnapshot: {
          ...data.templateSnapshot,
          id: "daily-accent-report",
          type: "DAILY_ACCENT_REPORT",
        },
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerAddress: selectedCustomer.address,
         customerGstNo: selectedCustomer.gstNo ?? "",
  customerContactNumber: selectedCustomer.contactNumber ?? "",
        formData: data.formData,
        evidence: data.evidence,
        signatures: data.signatures,
        status: "DRAFT",
      };

      let id = dailyAccentReportId;

      // CREATE DRAFT
      if (!id) {
        const response = await fetch("/api/daily-accent-report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const message = await response.text();
          console.error("Create Daily Accent Report failed:", message);

          throw new Error(message || "Failed to create Daily Accent Report.");
        }

        const created = await response.json();

        if (!created.id) {
          throw new Error("The API did not return the created report ID.");
        }

        id = String(created.id);
        setDailyAccentReportId(id);
      } else {
        // UPDATE DRAFT
        const response = await fetch(
          `/api/daily-accent-report/${encodeURIComponent(id)}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(payload),
          },
        );

        if (!response.ok) {
          const message = await response.text();
          console.error("Update Daily Accent Report failed:", message);

          throw new Error(message || "Failed to save Daily Accent Report.");
        }
      }

      // SUBMIT REPORT
      if (submit) {
        const response = await fetch(
          `/api/daily-accent-report/${encodeURIComponent(id)}/submit`,
          {
            method: "POST",
            credentials: "include",
          },
        );

        if (!response.ok) {
          const message = await response.text();
          console.error("Submit Daily Accent Report failed:", message);

          throw new Error(message || "Failed to submit Daily Accent Report.");
        }

        router.push(`/employee/daily-accent-report/${id}`);
        router.refresh();
      } else {
        window.alert("Daily Accent Report draft saved.");
      }
    } catch (error) {
      console.error("SAVE DAILY ACCENT REPORT ERROR:", error);

      window.alert(
        error instanceof Error
          ? error.message
          : "Failed to save Daily Accent Report.",
      );
    } finally {
      isSavingRef.current = false;
      setProcessingAction(null);
    }
  }

  // --------------------------------------------------
  // TEMPLATE LOADING / ERROR
  // --------------------------------------------------

  if (templateLoadError) {
    return (
      <main className="mx-auto max-w-6xl p-8">
        <Button variant="ghost" onClick={() => router.push("/employee")}>
          <ArrowLeft data-icon="inline-start" />
          Back to Dashboard
        </Button>

        <Card className="mt-5">
          <CardContent className="space-y-3 p-6">
            <h1 className="text-lg font-semibold">
              Unable to load Daily Accent Report
            </h1>

            <p className="text-sm text-muted-foreground">
              Check that the template API exists and returns a valid template
              with a sections array.
            </p>

            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!template) {
    return (
      <main className="p-8 text-muted-foreground">
        Loading Daily Accent Report template…
      </main>
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <main className="mobile-safe-bottom mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <Button variant="ghost" onClick={() => router.push("/employee")}>
        <ArrowLeft data-icon="inline-start" />
        Back to Dashboard
      </Button>

      <Card className="teal-wash mt-5 overflow-hidden shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-primary">
                New Daily Accent Report
              </p>

              <h1 className="mt-2 max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl">
                {template.title || template.name || "Daily Accent Report"}
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Record daily service activities, system checks, findings,
                corrective actions, and supporting evidence.
              </p>
            </div>

            <Badge variant="secondary">Draft</Badge>
          </div>
        </CardContent>
      </Card>

      {/* CUSTOMER */}

      <Card id="customer-selector" className="mt-6 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="font-semibold">Customer Information</h2>

            <p className="text-sm text-muted-foreground">
              Select the customer for this Daily Accent Report.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="customer-select" className="text-sm font-medium">
              Customer <span className="ml-1 text-red-500">*</span>
            </label>

            <select
              id="customer-select"
              value={selectedCustomerId}
              onChange={(event) => handleCustomerChange(event.target.value)}
              disabled={customersLoading}
              className={`w-full rounded-lg border bg-background px-3 py-2 text-sm ${
                errors.customer ? "border-red-500 ring-1 ring-red-500" : ""
              }`}
            >
              <option value="">
                {customersLoading ? "Loading customers..." : "Select customer"}
              </option>

              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>

            {errors.customer && (
              <p className="text-xs font-medium text-red-500">
                Please select a customer.
              </p>
            )}

            {customerLoadError && (
              <p className="text-xs font-medium text-red-500">
                Failed to load customers. Check the customer API.
              </p>
            )}

            {!customersLoading &&
              !customerLoadError &&
              customers.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No customers are available.
                </p>
              )}
          </div>

          {selectedCustomer && (
            <div className="mt-4 rounded-xl border bg-muted/30 p-4">
              <p className="font-medium">{selectedCustomer.name}</p>

              <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                {selectedCustomer.address}
              </p>

              {selectedCustomer.gstNo && (
                <p className="mt-2 text-sm">
                  <span className="font-medium">GST:</span>{" "}
                  {selectedCustomer.gstNo}
                </p>
              )}

              {selectedCustomer.contactNumber && (
                <p className="mt-1 text-sm">
                  <span className="font-medium">Contact:</span>{" "}
                  {selectedCustomer.contactNumber}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* TEMPLATE SECTIONS */}

      <div className="mt-6 flex flex-col gap-6">
        {template.sections.map((section) => (
          <section key={section.id}>
            <div className="mb-3 flex items-center justify-between rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
              <div>
                <h2 className="font-semibold">
                  {section.name || section.title || "Section"}
                </h2>

                <p className="text-xs text-muted-foreground">
                  Complete the information below.
                </p>
              </div>

              <Badge variant="secondary">
                {section.fields.length}{" "}
                {section.fields.length === 1 ? "field" : "fields"}
              </Badge>
            </div>

            <Card className="shadow-sm">
              <CardContent className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                {section.fields.map((field) => {
                  const fullWidth =
                    field.type === "textarea" ||
                    field.type === "multiple-choice" ||
                    field.type === "single-choice" ||
                    field.type === "camera-photo" ||
                    field.type === "camera-video" ||
                    field.type === "signature" ||
                    field.multiple;

                  return (
                    <div
                      key={field.id}
                      data-field-id={field.id}
                      className={fullWidth ? "sm:col-span-2" : ""}
                    >
                      <label className="flex flex-col gap-2 text-sm font-medium">
                        <span>
                          {field.label}

                          {field.required && (
                            <span className="ml-1 text-red-500">*</span>
                          )}
                        </span>

                        {field.multiple
                          ? renderMultipleField(field)
                          : fieldControl(field)}
                      </label>

                      {errors[field.id] && (
                        <p className="mt-1 text-xs font-medium text-red-500">
                          This field is required.
                        </p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </section>
        ))}
      </div>

      {/* ACTIONS */}

      {/* <div className="mt-6 flex flex-col-reverse justify-end gap-3 border-t pt-4 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          disabled={saving}
          onClick={() => save(false)}
        >
          <Save data-icon="inline-start" />
          {saving ? "Saving..." : "Save Draft"}
        </Button>

        <Button type="button" disabled={saving} onClick={() => save(true)}>
          <Send data-icon="inline-start" />
          {saving ? "Processing..." : "Submit Report"}
        </Button>
      </div> */}
      {/* ACTIONS */}

      <div className="mt-6 flex flex-col-reverse justify-end gap-3 border-t pt-4 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          disabled={processingAction !== null}
          onClick={() => save(false)}
        >
          {processingAction === "save" ? (
            <LoaderCircle className="animate-spin" data-icon="inline-start" />
          ) : (
            <Save data-icon="inline-start" />
          )}

          {processingAction === "save" ? "Saving Draft..." : "Save Draft"}
        </Button>

        <Button
          type="button"
          disabled={processingAction !== null}
          onClick={() => save(true)}
        >
          {processingAction === "submit" ? (
            <LoaderCircle className="animate-spin" data-icon="inline-start" />
          ) : (
            <Send data-icon="inline-start" />
          )}

          {processingAction === "submit"
            ? "Submitting Report..."
            : "Submit Report"}
        </Button>
      </div>
      {/* CAMERA */}

      {camera && (
        <CameraCapture
          mode={camera.mode}
          reportId={dailyAccentReportId || "new-daily-accent-report"}
          onCancel={() => setCamera(null)}
          onUse={(item: EvidenceItem) => {
            const fieldId = camera.field.id;

            setData((current) => ({
              ...current,
              evidence: {
                ...current.evidence,
                [fieldId]: [...(current.evidence[fieldId] || []), item],
              },
            }));

            setErrors((current) => {
              const updated = { ...current };
              delete updated[fieldId];
              return updated;
            });

            setCamera(null);
          }}
        />
      )}

      {/* SIGNATURE */}

      {signatureField && (
        <SignaturePad
          field={signatureField}
          onCancel={() => setSignatureField(null)}
          onSave={(signature) => {
            setData((current) => ({
              ...current,
              signatures: {
                ...current.signatures,
                [signatureField.id]: {
                  signature,
                  signedAt: new Date().toISOString(),
                },
              },
            }));

            setErrors((current) => {
              const updated = { ...current };
              delete updated[signatureField.id];
              return updated;
            });

            setSignatureField(null);
          }}
        />
      )}
    </main>
  );
}

// --------------------------------------------------
// SIGNATURE PAD
// --------------------------------------------------

function SignaturePad({
  field,
  onCancel,
  onSave,
}: {
  field: Field;
  onCancel: () => void;
  onSave: (signature: string) => void;
}) {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.lineWidth = 2;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#000000";

    setHasInk(false);
  }, [canvas]);

  function getPosition(
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) {
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ("touches" in event) {
      const touch = event.touches[0];
      if (!touch) return { x: 0, y: 0 };

      return {
        x: ((touch.clientX - rect.left) / rect.width) * canvas.width,
        y: ((touch.clientY - rect.top) / rect.height) * canvas.height,
      };
    }

    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function startDrawing(
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) {
    event.preventDefault();

    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const position = getPosition(event);

    context.beginPath();
    context.moveTo(position.x, position.y);

    setDrawing(true);
    setHasInk(true);
  }

  function draw(
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) {
    event.preventDefault();

    if (!drawing || !canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const position = getPosition(event);

    context.lineTo(position.x, position.y);
    context.stroke();
  }

  function stopDrawing() {
    setDrawing(false);
  }

  function clearSignature() {
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = "#000000";
    context.lineWidth = 2;
    setHasInk(false);
  }

  function saveSignature() {
    if (!canvas || !hasInk) {
      window.alert("Please provide a signature first.");
      return;
    }

    onSave(canvas.toDataURL("image/png"));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-background p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{field.label}</h2>

            <p className="text-sm text-muted-foreground">
              Sign using touch, mouse, or trackpad.
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCancel}
            aria-label="Close signature pad"
          >
            <X />
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border bg-white">
          <canvas
            ref={setCanvas}
            width={1000}
            height={400}
            className="h-64 w-full touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        <div className="mt-4 flex justify-between gap-3">
          <Button type="button" variant="outline" onClick={clearSignature}>
            Clear
          </Button>

          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>

            <Button type="button" onClick={saveSignature}>
              Save Signature
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
