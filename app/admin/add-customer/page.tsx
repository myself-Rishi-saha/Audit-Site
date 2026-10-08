"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Edit,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Customer = {
  id: string;
  name: string;
  address: string;
  gstNo: string | null;
  contactNumber: string;
  createdAt: string;
  updatedAt: string;
};

type FormData = {
  name: string;
  address: string;
  gstNo: string;
  contactNumber: string;
};

const emptyForm: FormData = {
  name: "",
  address: "",
  gstNo: "",
  contactNumber: "",
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState<FormData>(emptyForm);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof FormData, boolean>>
  >({});

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/customers",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load customers.",
        );
      }

      setCustomers(data);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load customers.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFieldErrors({});
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(customer: Customer) {
    setEditingId(customer.id);

    setForm({
      name: customer.name,
      address: customer.address,
      gstNo: customer.gstNo || "",
      contactNumber: customer.contactNumber,
    });

    setFieldErrors({});
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFieldErrors({});
  }

  function updateField(
    field: keyof FormData,
    value: string,
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      [field]: false,
    }));
  }

  function validateForm() {
    const errors: Partial<
      Record<keyof FormData, boolean>
    > = {};

    if (!form.name.trim()) {
      errors.name = true;
    }

    if (!form.address.trim()) {
      errors.address = true;
    }

    if (!form.contactNumber.trim()) {
      errors.contactNumber = true;
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const isEditing = Boolean(editingId);

      const response = await fetch(
        isEditing
          ? `/api/admin/customers/${editingId}`
          : "/api/admin/customers",
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: form.name.trim(),
            address: form.address.trim(),
            gstNo: form.gstNo.trim() || null,
            contactNumber: form.contactNumber.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            (isEditing
              ? "Failed to update customer."
              : "Failed to create customer."),
        );
      }

      if (isEditing) {
        setCustomers((previous) =>
          previous.map((customer) =>
            customer.id === data.id
              ? data
              : customer,
          ),
        );

        setSuccess(
          "Customer updated successfully.",
        );
      } else {
        setCustomers((previous) => [
          data,
          ...previous,
        ]);

        setSuccess(
          "Customer added successfully.",
        );
      }

      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(customer: Customer) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${customer.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(customer.id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/admin/customers/${customer.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to delete customer.",
        );
      }

      setCustomers((previous) =>
        previous.filter(
          (item) => item.id !== customer.id,
        ),
      );

      setSuccess(
        "Customer deleted successfully.",
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete customer.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppShell user="Administrator">
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                <Building2 className="h-4 w-4" />
                Administration
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Customers
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage customers used in audits and
                service reports.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={loadCustomers}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    loading ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </Button>

              <Button
                type="button"
                onClick={openAddForm}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Customer
              </Button>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          {/* Add / Edit Form */}
          {showForm && (
            <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    {editingId
                      ? "Edit Customer"
                      : "Add Customer"}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Enter the customer's basic details.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="p-5"
              >
                <div className="grid gap-5 md:grid-cols-2">
                  {/* Customer Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Customer Name
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <Input
                      value={form.name}
                      onChange={(event) =>
                        updateField(
                          "name",
                          event.target.value,
                        )
                      }
                      placeholder="Enter customer name"
                      className={
                        fieldErrors.name
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    />

                    {fieldErrors.name && (
                      <p className="text-xs text-red-500">
                        Customer name is required.
                      </p>
                    )}
                  </div>

                  {/* Contact Number */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Contact Number
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <Input
                      value={form.contactNumber}
                      onChange={(event) =>
                        updateField(
                          "contactNumber",
                          event.target.value,
                        )
                      }
                      placeholder="Enter contact number"
                      inputMode="tel"
                      className={
                        fieldErrors.contactNumber
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    />

                    {fieldErrors.contactNumber && (
                      <p className="text-xs text-red-500">
                        Contact number is required.
                      </p>
                    )}
                  </div>

                  {/* GST */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      GST Number
                      <span className="ml-2 text-xs font-normal text-slate-400">
                        Optional
                      </span>
                    </label>

                    <Input
                      value={form.gstNo}
                      onChange={(event) =>
                        updateField(
                          "gstNo",
                          event.target.value,
                        )
                      }
                      placeholder="Enter GST number"
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">
                      Address
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <Textarea
                      value={form.address}
                      onChange={(event) =>
                        updateField(
                          "address",
                          event.target.value,
                        )
                      }
                      placeholder="Enter complete customer address"
                      rows={3}
                      className={
                        fieldErrors.address
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    />

                    {fieldErrors.address && (
                      <p className="text-xs text-red-500">
                        Address is required.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeForm}
                    disabled={saving}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    disabled={saving}
                    className="min-w-[130px]"
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Update Customer"
                        : "Add Customer"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Customer Count */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">
                All Customers
              </p>

              <p className="text-xs text-slate-500">
                {customers.length}{" "}
                {customers.length === 1
                  ? "customer"
                  : "customers"}
              </p>
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <RefreshCw className="mx-auto h-6 w-6 animate-spin text-slate-400" />

              <p className="mt-3 text-sm text-slate-500">
                Loading customers...
              </p>
            </div>
          ) : customers.length === 0 ? (
            /* Empty State */
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                <Building2 className="h-6 w-6 text-slate-500" />
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No customers yet
              </h3>

              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                Add your first customer to start using
                customers in audits and service reports.
              </p>

              <Button
                type="button"
                onClick={openAddForm}
                className="mt-5 gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Customer
              </Button>
            </div>
          ) : (
            /* Customer Table */
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Customer
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Contact
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        GST Number
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Address
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {customers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        {/* Customer */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                              <Building2 className="h-5 w-5 text-slate-600" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900">
                                {customer.name}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                {customer.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                            {customer.contactNumber}
                          </div>
                        </td>

                        {/* GST */}
                        <td className="px-5 py-4">
                          {customer.gstNo ? (
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                              {customer.gstNo}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">
                              —
                            </span>
                          )}
                        </td>

                        {/* Address */}
                        <td className="max-w-xs px-5 py-4">
                          <div className="flex gap-2 text-sm text-slate-600">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                            <span className="line-clamp-2">
                              {customer.address}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                openEditForm(
                                  customer,
                                )
                              }
                              disabled={
                                deletingId ===
                                customer.id
                              }
                              className="gap-1.5"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              Edit
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDelete(
                                  customer,
                                )
                              }
                              disabled={
                                deletingId ===
                                customer.id
                              }
                              className="gap-1.5 text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />

                              {deletingId ===
                              customer.id
                                ? "Deleting..."
                                : "Delete"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}