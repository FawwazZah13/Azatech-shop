"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import { useCustomers } from "@/lib/customers";
import { formatRupiah } from "@/lib/format";
import { useCreateOrder } from "@/lib/orders";
import { useProducts } from "@/lib/products";

type Row = { key: number; productId: string; quantity: string };

const inputClass =
  "w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900";

export default function NewOrderPage() {
  const router = useRouter();
  const create = useCreateOrder();
  const nextKey = useRef(1);

  const customers = useCustomers({ page: 1, perPage: 100, search: "" });
  const products = useProducts({ page: 1, perPage: 100, search: "", sort: "name" });

  const [customerId, setCustomerId] = useState("");
  const [rows, setRows] = useState<Row[]>([{ key: 0, productId: "", quantity: "1" }]);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  const productList = products.data?.data ?? [];
  const productMap = new Map(productList.map((p) => [String(p.id), p]));

  const apiError = create.error instanceof ApiError ? create.error : null;
  const serverErrors = apiError?.errors ?? {};

  // Error dari browser diprioritaskan, lalu error dari server (kunci sama, mis. "items.1.quantity")
  function errorFor(key: string): string | undefined {
    return clientErrors[key] ?? serverErrors[key]?.[0];
  }

  // Setiap perubahan isian menghapus error lama (indeks baris bisa bergeser)
  function touched() {
    setClientErrors({});
    create.reset();
  }

  function updateRow(key: number, patch: Partial<Row>) {
    touched();
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addRow() {
    touched();
    setRows((prev) => [...prev, { key: nextKey.current++, productId: "", quantity: "1" }]);
  }

  function removeRow(key: number) {
    touched();
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
  }

  // Hitung dalam sen (bilangan bulat) agar tidak kena masalah pembulatan desimal
  function lineCents(row: Row): number {
    const product = productMap.get(row.productId);
    const qty = Number(row.quantity);
    if (!product || !Number.isInteger(qty) || qty < 1) return 0;
    return Math.round(Number(product.price) * 100) * qty;
  }

  const totalCents = rows.reduce((sum, row) => sum + lineCents(row), 0);

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!customerId) errors.customer_id = "Pilih pelanggan";

    const seen = new Set<string>();
    rows.forEach((row, i) => {
      if (!row.productId) errors[`items.${i}.product_id`] = "Pilih produk";
      else if (seen.has(row.productId))
        errors[`items.${i}.product_id`] = "Produk sudah dipilih di baris lain";
      else seen.add(row.productId);

      const qty = Number(row.quantity);
      if (row.quantity.trim() === "" || !Number.isInteger(qty) || qty < 1)
        errors[`items.${i}.quantity`] = "Jumlah minimal 1";
    });
    return errors;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate();
    setClientErrors(errors);
    if (Object.keys(errors).length > 0) return;

    create.mutate(
      {
        customer_id: customerId,
        items: rows.map((row) => ({
          product_id: Number(row.productId),
          quantity: Number(row.quantity),
        })),
      },
      { onSuccess: (res) => router.push(`/orders/${res.data.id}`) }
    );
  }

  if (customers.isPending || products.isPending) {
    return <p className="rounded bg-white p-8 text-center text-gray-500">Memuat data...</p>;
  }

  if (customers.isError || products.isError) {
    const message = customers.error?.message ?? products.error?.message;
    return (
      <div role="alert" className="rounded bg-red-50 p-6 text-center">
        <p className="text-red-700">Gagal memuat data: {message}</p>
        <button
          onClick={() => {
            customers.refetch();
            products.refetch();
          }}
          className="mt-3 rounded bg-gray-900 px-4 py-2 text-sm text-white"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  const customerList = customers.data.data;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Buat Order</h1>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {create.isError && (
          <div role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">
            {create.error.message}
          </div>
        )}

        <div className="rounded-lg bg-white p-4 shadow">
          <label htmlFor="customer" className="mb-1 block text-sm font-medium text-gray-700">
            Pelanggan
          </label>
          <select
            id="customer"
            value={customerId}
            onChange={(e) => {
              touched();
              setCustomerId(e.target.value);
            }}
            className={`${inputClass} sm:max-w-sm`}
          >
            <option value="">Pilih pelanggan...</option>
            {customerList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.customer_name}
              </option>
            ))}
          </select>
          {errorFor("customer_id") && (
            <p className="mt-1 text-sm text-red-600">{errorFor("customer_id")}</p>
          )}
        </div>

        <div className="space-y-3">
          {rows.map((row, i) => {
            const product = productMap.get(row.productId);
            const qty = Number(row.quantity);
            const overStock = product !== undefined && qty > product.stock;
            const productError = errorFor(`items.${i}.product_id`);
            const qtyError = errorFor(`items.${i}.quantity`);
            const hasError = Boolean(productError || qtyError);

            return (
              <div
                key={row.key}
                className={`rounded-lg bg-white p-4 shadow ${
                  hasError ? "ring-2 ring-red-300" : ""
                }`}
              >
                <div className="grid gap-3 md:grid-cols-[1fr_8rem_9rem_9rem_auto] md:items-start">
                  <div>
                    <label htmlFor={`product-${row.key}`} className="mb-1 block text-xs font-medium text-gray-600">
                      Produk
                    </label>
                    <select
                      id={`product-${row.key}`}
                      value={row.productId}
                      onChange={(e) => updateRow(row.key, { productId: e.target.value })}
                      className={inputClass}
                    >
                      <option value="">Pilih produk...</option>
                      {productList.map((p) => (
                        <option
                          key={p.id}
                          value={String(p.id)}
                          disabled={rows.some(
                            (other) => other.key !== row.key && other.productId === String(p.id)
                          )}
                        >
                          {p.product_name} (stok {p.stock})
                        </option>
                      ))}
                    </select>
                    {productError && <p className="mt-1 text-sm text-red-600">{productError}</p>}
                  </div>

                  <div>
                    <label htmlFor={`qty-${row.key}`} className="mb-1 block text-xs font-medium text-gray-600">
                      Jumlah
                    </label>
                    <input
                      id={`qty-${row.key}`}
                      type="number"
                      min={1}
                      step={1}
                      value={row.quantity}
                      onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                      className={inputClass}
                    />
                    {product && overStock && !qtyError && (
                      <p className="mt-1 text-xs text-amber-600">Melebihi stok ({product.stock})</p>
                    )}
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-medium text-gray-600">Harga</p>
                    <p className="py-2 text-sm text-gray-900">
                      {product ? formatRupiah(product.price) : "-"}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-medium text-gray-600">Subtotal</p>
                    <p className="py-2 text-sm font-medium text-gray-900">
                      {formatRupiah(lineCents(row) / 100)}
                    </p>
                  </div>

                  <div className="md:pt-5">
                    <button
                      type="button"
                      onClick={() => removeRow(row.key)}
                      disabled={rows.length === 1}
                      className="rounded border border-red-200 px-3 py-2 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                {qtyError && (
                  <p role="alert" className="mt-2 rounded bg-red-50 p-2 text-sm text-red-700">
                    {qtyError}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {errorFor("items") && <p className="text-sm text-red-600">{errorFor("items")}</p>}

        <button
          type="button"
          onClick={addRow}
          className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          + Tambah Produk
        </button>

        <div className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-600">Total (perkiraan)</p>
            <p className="text-2xl font-semibold text-gray-900">{formatRupiah(totalCents / 100)}</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/orders"
              className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={create.isPending}
              className="rounded bg-gray-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {create.isPending ? "Menyimpan..." : "Simpan Order"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}