"use client";

import Link from "next/link";
import { useState } from "react";
import { ApiError } from "@/lib/api";
import type { ProductInput } from "@/lib/products";
import type { Product } from "@/lib/types";

type Props = {
  initial?: Product;
  submitLabel: string;
  isPending: boolean;
  error: unknown;
  onSubmit: (values: ProductInput) => void;
};

type FieldName = keyof ProductInput;
type FormValues = Record<FieldName, string>;
type FieldErrors = Partial<Record<FieldName, string>>;

const inputClass =
  "w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900";

function validate(v: FormValues, codeRequired: boolean): FieldErrors {
  const errors: FieldErrors = {};

  if (codeRequired && !v.product_code.trim()) errors.product_code = "Kode produk wajib diisi";
  else if (v.product_code.trim().length > 20) errors.product_code = "Maksimal 20 karakter";

  if (!v.product_name.trim()) errors.product_name = "Nama produk wajib diisi";
  else if (v.product_name.trim().length > 150) errors.product_name = "Maksimal 150 karakter";

  if (v.stock.trim() === "") errors.stock = "Stok wajib diisi";
  else if (!/^\d+$/.test(v.stock.trim())) errors.stock = "Stok harus bilangan bulat 0 atau lebih";

  if (v.price.trim() === "") errors.price = "Harga wajib diisi";
  else if (Number.isNaN(Number(v.price)) || Number(v.price) <= 0)
    errors.price = "Harga harus lebih dari 0";

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
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function ProductForm({ initial, submitLabel, isPending, error, onSubmit }: Props) {
  const [values, setValues] = useState<FormValues>({
    product_code: initial?.product_code ?? "",
    product_name: initial?.product_name ?? "",
    stock: initial ? String(initial.stock) : "",
    price: initial ? String(Number(initial.price)) : "",
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
    const errors = validate(values, Boolean(initial));
    setClientErrors(errors);
    if (Object.keys(errors).length > 0) return;

    onSubmit({
      product_code: values.product_code.trim() || undefined,
      product_name: values.product_name.trim(),
      stock: Number(values.stock),
      price: Number(values.price),
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

      {/* <Field id="product_code" label={initial ? "Kode Produk" : "Kode Produk (opsional)"} error={fieldError("product_code")}>
        <input
          id="product_code"
          value={values.product_code}
          onChange={(e) => setField("product_code", e.target.value)}
          maxLength={20}
          placeholder={initial ? undefined : "Kosongkan untuk dibuatkan otomatis"}
          className={inputClass}
        />
      </Field> */}

      <Field id="product_name" label="Nama Produk" error={fieldError("product_name")}>
        <input
          id="product_name"
          value={values.product_name}
          onChange={(e) => setField("product_name", e.target.value)}
          maxLength={150}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="stock" label="Stok" error={fieldError("stock")}>
          <input
            id="stock"
            type="number"
            min={0}
            step={1}
            value={values.stock}
            onChange={(e) => setField("stock", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field id="price" label="Harga (Rp)" error={fieldError("price")}>
          <input
            id="price"
            type="number"
            min={0}
            step="any"
            value={values.price}
            onChange={(e) => setField("price", e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isPending ? "Menyimpan..." : submitLabel}
        </button>
        <Link
          href="/products"
          className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}