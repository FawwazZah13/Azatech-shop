"use client";

import Link from "next/link";
import { formatRupiah } from "@/lib/format";
import { useDashboardSummary } from "@/lib/dashboard";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-5 shadow">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const summary = useDashboardSummary();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

      {summary.isPending ? (
        <p className="mt-4 rounded bg-white p-8 text-center text-gray-500">Memuat ringkasan...</p>
      ) : summary.isError ? (
        <div role="alert" className="mt-4 rounded bg-red-50 p-6 text-center">
          <p className="text-red-700">Gagal memuat dashboard: {summary.error.message}</p>
          <button
            onClick={() => summary.refetch()}
            className="mt-3 rounded bg-gray-900 px-4 py-2 text-sm text-white"
          >
            Coba lagi
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <StatCard
              label="Total Transaksi"
              value={new Intl.NumberFormat("id-ID").format(summary.data.data.total_orders)}
            />
            <StatCard label="Total Penjualan" value={formatRupiah(summary.data.data.total_sales)} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-lg bg-white p-5 shadow">
              <h2 className="font-semibold text-gray-900">5 Produk Terlaris</h2>
              {summary.data.data.top_products.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">Belum ada penjualan.</p>
              ) : (
                <ol className="mt-3 divide-y">
                  {summary.data.data.top_products.map((p, i) => (
                    <li key={p.id} className="flex items-center gap-3 py-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-700">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900">{p.product_name}</p>
                        <p className="text-xs text-gray-500">{p.product_code}</p>
                      </div>
                      <p className="shrink-0 text-sm text-gray-700">{p.total_sold} terjual</p>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="rounded-lg bg-white p-5 shadow">
              <h2 className="font-semibold text-gray-900">Stok Menipis (di bawah 5)</h2>
              {summary.data.data.low_stock_products.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">Semua stok aman.</p>
              ) : (
                <ul className="mt-3 divide-y">
                  {summary.data.data.low_stock_products.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900">{p.product_name}</p>
                        <p className="text-xs text-gray-500">{p.product_code}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          p.stock === 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {p.stock === 0 ? "Habis" : `Sisa ${p.stock}`}
                      </span>
                      <Link
                        href={`/products/${p.id}/edit`}
                        className="shrink-0 text-xs text-gray-600 underline"
                      >
                        Edit
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}