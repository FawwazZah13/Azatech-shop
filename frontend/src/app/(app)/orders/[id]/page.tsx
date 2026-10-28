"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ApiError } from "@/lib/api";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { useOrder } from "@/lib/orders";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const order = useOrder(id);

  if (order.isPending) {
    return <p className="rounded bg-white p-8 text-center text-gray-500">Memuat order...</p>;
  }

  if (order.isError) {
    const notFound = order.error instanceof ApiError && order.error.status === 404;
    return (
      <div role="alert" className="rounded bg-red-50 p-6 text-center">
        <p className="text-red-700">
          {notFound ? "Order tidak ditemukan." : `Gagal memuat order: ${order.error.message}`}
        </p>
        <div className="mt-3 flex justify-center gap-4 text-sm">
          {!notFound && (
            <button onClick={() => order.refetch()} className="text-gray-700 underline">
              Coba lagi
            </button>
          )}
          <Link href="/orders" className="text-gray-700 underline">
            Kembali ke riwayat order
          </Link>
        </div>
      </div>
    );
  }

  const data = order.data.data;
  const items = data.items ?? [];

  return (
    <div>
      <Link href="/orders" className="text-sm text-gray-600 hover:underline">
        ← Kembali ke riwayat order
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-gray-900">{data.order_number}</h1>

      <dl className="mt-4 grid gap-4 rounded-lg bg-white p-4 shadow sm:grid-cols-3">
        <div>
          <dt className="text-xs font-medium text-gray-500">Tanggal</dt>
          <dd className="mt-1 text-gray-900">{formatDateTime(data.order_date)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500">Pelanggan</dt>
          <dd className="mt-1 text-gray-900">{data.customer?.customer_name ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500">Dibuat oleh</dt>
          <dd className="mt-1 text-gray-900">{data.created_by?.name ?? "-"}</dd>
        </div>
      </dl>

      <div className="mt-4">
        {/* Desktop: tabel */}
        <div className="hidden overflow-hidden rounded-lg bg-white shadow md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Produk</th>
                <th className="px-4 py-3 text-right">Jumlah</th>
                <th className="px-4 py-3 text-right">Harga Satuan</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-gray-500">{item.product_code ?? "-"}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {item.product_name ?? "Produk tidak tersedia"}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {formatRupiah(item.unit_price)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900">
                    {formatRupiah(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t bg-gray-50">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-right font-semibold text-gray-900">
                  Total
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  {formatRupiah(data.total_amount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile: kartu */}
        <ul className="space-y-3 md:hidden">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg bg-white p-4 shadow">
              <p className="text-xs text-gray-500">{item.product_code ?? "-"}</p>
              <p className="font-medium text-gray-900">
                {item.product_name ?? "Produk tidak tersedia"}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {item.quantity} × {formatRupiah(item.unit_price)}
              </p>
              <p className="mt-1 text-right font-medium text-gray-900">
                {formatRupiah(item.subtotal)}
              </p>
            </li>
          ))}
          <li className="flex justify-between rounded-lg bg-white p-4 font-semibold text-gray-900 shadow">
            <span>Total</span>
            <span>{formatRupiah(data.total_amount)}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}