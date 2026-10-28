"use client";

import Link from "next/link";
import { useState } from "react";
import { ApiError } from "@/lib/api";
import type { CustomerInput } from "@/lib/customers";
import type { Customer, Gender } from "@/lib/types";

type Props = {
  initial?: Customer;
  submitLabel: string;
  isPending: boolean;
  error: unknown;
  onSubmit: (values: CustomerInput) => void;
};

type FieldName = keyof CustomerInput;
type FormValues = Record<FieldName, string>;
type FieldErrors = Partial<Record<FieldName, string>>;

const inputClass =
  "w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900";

// Tanggal lahir harus sebelum hari ini (sama dengan aturan backend: before:today)
function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function validate(v: FormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!v.customer_name.trim()) errors.customer_name = "Nama wajib diisi";
  else if (v.customer_name.trim().length > 150) errors.customer_name = "Maksimal 150 karakter";

  if (!v.customer_address.trim()) errors.customer_address = "Alamat wajib diisi";
  else if (v.customer_address.trim().length > 255) errors.customer_address = "Maksimal 255 karakter";

  if (v.gender !== "Pria" && v.gender !== "Wanita") errors.gender = "Pilih jenis kelamin";

  if (!v.birth_date) errors.birth_date = "Tanggal lahir wajib diisi";
  else if (v.birth_date > yesterday()) errors.birth_date = "Tanggal lahir harus sebelum hari ini";

  const phone = v.phone.trim();
  if (phone) {
    if (phone.length > 20) errors.phone = "Maksimal 20 karakter";
    else if (!/^[0-9+\-\s]+$/.test(phone)) errors.phone = "Hanya angka, spasi, + dan -";
  }

  return errors;
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function CustomerForm({ initial, submitLabel, isPending, error, onSubmit }: Props) {
  const [values, setValues] = useState<FormValues>({
    customer_name: initial?.customer_name ?? "",
    customer_address: initial?.customer_address ?? "",
    gender: initial?.gender ?? "",
    birth_date: initial?.birth_date ?? "",
    phone: initial?.phone ?? "",
  });
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});

  const apiError = error instanceof ApiError ? error : null;
  const serverErrors = apiError?.errors ?? {};
  const hasFieldErrors = Object.keys(serverErrors).length > 0;
  const generalError = !hasFieldErrors && error instanceof Error ? error.message : null;

  function fieldError(name: FieldName): string | undefined {
    return clientErrors[name] ?? serverErrors[name]?.[0];
  }

  function setField(name: FieldName, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setClientErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate(values);
    setClientErrors(errors);
    if (Object.keys(errors).length > 0) return;

    onSubmit({
      customer_name: values.customer_name.trim(),
      customer_address: values.customer_address.trim(),
      gender: values.gender as Gender,
      birth_date: values.birth_date,
      phone: values.phone.trim() || null,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="max-w-lg space-y-4 rounded-lg bg-white p-6 shadow"
    >
      {generalError && (
        <div role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">
          {generalError}
        </div>
      )}

      <Field id="customer_name" label="Nama" error={fieldError("customer_name")}>
        <input
          id="customer_name"
          value={values.customer_name}
          onChange={(e) => setField("customer_name", e.target.value)}
          maxLength={150}
          className={inputClass}
        />
      </Field>

      <Field id="customer_address" label="Alamat" error={fieldError("customer_address")}>
        <textarea
          id="customer_address"
          value={values.customer_address}
          onChange={(e) => setField("customer_address", e.target.value)}
          maxLength={255}
          rows={3}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="gender" label="Jenis Kelamin" error={fieldError("gender")}>
          <select
            id="gender"
            value={values.gender}
            onChange={(e) => setField("gender", e.target.value)}
            className={inputClass}
          >
            <option value="">Pilih...</option>
            <option value="Pria">Pria</option>
            <option value="Wanita">Wanita</option>
          </select>
        </Field>

        <Field id="birth_date" label="Tanggal Lahir" error={fieldError("birth_date")}>
          <input
            id="birth_date"
            type="date"
            max={yesterday()}
            value={values.birth_date}
            onChange={(e) => setField("birth_date", e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field id="phone" label="No. HP (opsional)" error={fieldError("phone")}>
        <input
          id="phone"
          type="tel"
          value={values.phone}
          onChange={(e) => setField("phone", e.target.value)}
          maxLength={20}
          placeholder="081234567890"
          className={inputClass}
        />
      </Field>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isPending ? "Menyimpan..." : submitLabel}
        </button>
        <Link
          href="/customers"
          className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}