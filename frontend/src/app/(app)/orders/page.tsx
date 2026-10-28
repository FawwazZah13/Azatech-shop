"use client";

import Link from "next/link";
import { useState } from "react";
import { Pagination } from "@/components/pagination";
import { useCustomers } from "@/lib/customers";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { useOrders } from "@/lib/orders";

const PER_PAGE = 10;
const inputClass = "rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900";

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [customerId, setCustomerId] = useState("");

  const customers = useCustomers({ page: 1, perPage: 100, search: "" });

  const rangeInvalid = Boolean(from && to && to < from);
  const orders = useOrders({ page, perPage: PER_PAGE, from, to, customerId }, !rangeInvalid);

  const items = orders.data?.data ?? [];
  const meta = orders.data?.meta;
  const hasFilter = Boolean(from || to || customerId);

  function changeFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  function resetFilter() {
    setFrom("");
    setTo("");
    setCustomerId("");
    setPage(1);
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Riwayat Order</h1>
        <Link
          href="/orders/new"
          className="rounded bg-gray-900 px-4 py-2 text-center text-sm font-medium text-white"
        >
          Buat Order
        </Link>
      </div>

      <div className="mt-4 grid gap-3 rounded-lg bg-white p-4 shadow sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr_auto] lg:items-end">
        <div>
          <label htmlFor="from" className="mb-1 block text-xs font-medium text-gray-600">
            Dari tanggal
          </label>
          <input
            id="from"
            type="date"
            value={from}
            onChange={(e) => changeFilter(setFrom, e.target.value)}
            className={`${inputClass} w-full`}
          />
        </div>
        <div>
          <label htmlFor="to" className="mb-1 block text-xs font-medium text-gray-600">
            Sampai tanggal
          </label>
          <input
            id="to"
            type="date"
            min={from || undefined}
            value={to}
            onChange={(e) => changeFilter(setTo, e.target.value)}
            className={`${inputClass} w-full`}
          />
        </div>
        <div>
          <label htmlFor="customer" className="mb-1 block text-xs font-medium text-gray-600">
            Pelanggan
          </label>
          <select
            id="customer"
            value={customerId}
            onChange={(e) => changeFilter(setCustomerId, e.target.value)}
            className={`${inputClass} w-full`}
          >
            <option value="">Semua pelanggan</option>
            {customers.data?.data.map((c) => (
              <option key={c.id} value={c.id}>
                {c.customer_name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={resetFilter}
          disabled={!hasFilter}
          className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        >
          Reset
        </button>
      </div>

      {rangeInvalid && (
        <p role="alert" className="mt-3 rounded bg-amber-50 p-3 text-sm text-amber-800">
          Tanggal akhir tidak boleh sebelum tanggal awal.
        </p>
      )}

      <div className="mt-4">
        {rangeInvalid ? null : orders.isPending ? (
          <p className="rounded bg-white p-8 text-center text-gray-500">Memuat order...</p>
        ) : orders.isError ? (
          <div role="alert" className="rounded bg-red-50 p-6 text-center">
            <p className="text-red-700">Gagal memuat order: {orders.error.message}</p>
            <button
              onClick={() => orders.refetch()}
              className="mt-3 rounded bg-gray-900 px-4 py-2 text-sm text-white"
            >
              Coba lagi
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="rounded bg-white p-8 text-center text-gray-500">
            {hasFilter ? "Tidak ada order yang cocok dengan filter." : "Belum ada order."}
          </p>
        ) : (
          <div className={orders.isPlaceholderData ? "opacity-60" : ""}>
            {/* Desktop: tabel */}
            <div className="hidden overflow-hidden rounded-lg bg-white shadow md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3">No. Order</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Pelanggan</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((o) => (
                    <tr key={o.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{o.order_number}</td>
                      <td className="px-4 py-3 text-gray-700">{formatDateTime(o.order_date)}</td>
                      <td className="px-4 py-3 text-gray-700">{o.customer?.customer_name ?? "-"}</td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {formatRupiah(o.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/orders/${o.id}`}
                          className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: kartu */}
            <ul className="space-y-3 md:hidden">
              {items.map((o) => (
                <li key={o.id} className="rounded-lg bg-white p-4 shadow">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-gray-900">{o.order_number}</p>
                    <p className="font-medium text-gray-900">{formatRupiah(o.total_amount)}</p>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{o.customer?.customer_name ?? "-"}</p>
                  <p className="text-sm text-gray-500">{formatDateTime(o.order_date)}</p>
                  <Link
                    href={`/orders/${o.id}`}
                    className="mt-3 inline-block rounded border border-gray-300 px-3 py-1 text-xs text-gray-700"
                  >
                    Detail
                  </Link>
                </li>
              ))}
            </ul>

            {meta && <Pagination meta={meta} onChange={setPage} />}
          </div>
        )}
      </div>
    </div>
  );
}