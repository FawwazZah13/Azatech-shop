"use client";

import Link from "next/link";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Pagination } from "@/components/pagination";
import { useCustomers, useDeleteCustomer } from "@/lib/customers";
import { formatDate } from "@/lib/format";
import type { Customer } from "@/lib/types";
import { useDebounce } from "@/lib/use-debounce";

const PER_PAGE = 10;

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [toDelete, setToDelete] = useState<Customer | null>(null);
  const search = useDebounce(searchInput, 400);

  const customers = useCustomers({ page, perPage: PER_PAGE, search });
  const remove = useDeleteCustomer();
  const items = customers.data?.data ?? [];
  const meta = customers.data?.meta;

  function closeDialog() {
    setToDelete(null);
    remove.reset();
  }

  function confirmDelete() {
    if (!toDelete) return;
    remove.mutate(toDelete.id, {
      onSuccess: () => {
        if (items.length === 1 && page > 1) setPage(page - 1);
        closeDialog();
      },
    });
  }

  const actionButtons = (c: Customer) => (
    <div className="flex gap-2">
      <Link
        href={`/customers/${c.id}/edit`}
        className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
      >
        Edit
      </Link>
      <button
        onClick={() => setToDelete(c)}
        className="rounded border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
      >
        Hapus
      </button>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Pelanggan</h1>
        <Link
          href="/customers/new"
          className="rounded bg-gray-900 px-4 py-2 text-center text-sm font-medium text-white"
        >
          Tambah Pelanggan
        </Link>
      </div>

      <input
        type="search"
        value={searchInput}
        onChange={(e) => {
          setSearchInput(e.target.value);
          setPage(1);
        }}
        placeholder="Cari nama pelanggan..."
        aria-label="Cari pelanggan"
        className="mt-4 w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 sm:max-w-sm"
      />

      <div className="mt-4">
        {customers.isPending ? (
          <p className="rounded bg-white p-8 text-center text-gray-500">Memuat pelanggan...</p>
        ) : customers.isError ? (
          <div role="alert" className="rounded bg-red-50 p-6 text-center">
            <p className="text-red-700">Gagal memuat pelanggan: {customers.error.message}</p>
            <button
              onClick={() => customers.refetch()}
              className="mt-3 rounded bg-gray-900 px-4 py-2 text-sm text-white"
            >
              Coba lagi
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="rounded bg-white p-8 text-center text-gray-500">
            {search
              ? `Tidak ada pelanggan yang cocok dengan "${search}".`
              : "Belum ada pelanggan."}
          </p>
        ) : (
          <div className={customers.isPlaceholderData ? "opacity-60" : ""}>
            {/* Desktop: tabel */}
            <div className="hidden overflow-hidden rounded-lg bg-white shadow md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Nama</th>
                    <th className="px-4 py-3">Gender</th>
                    <th className="px-4 py-3">Tgl Lahir</th>
                    <th className="px-4 py-3">No. HP</th>
                    <th className="px-4 py-3">Alamat</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{c.customer_name}</td>
                      <td className="px-4 py-3 text-gray-700">{c.gender}</td>
                      <td className="px-4 py-3 text-gray-700">{formatDate(c.birth_date)}</td>
                      <td className="px-4 py-3 text-gray-700">{c.phone ?? "-"}</td>
                      <td className="px-4 py-3 text-gray-700">{c.customer_address}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">{actionButtons(c)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: kartu */}
            <ul className="space-y-3 md:hidden">
              {items.map((c) => (
                <li key={c.id} className="rounded-lg bg-white p-4 shadow">
                  <p className="font-medium text-gray-900">{c.customer_name}</p>
                  <p className="text-sm text-gray-600">
                    {c.gender} · {formatDate(c.birth_date)}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">{c.phone ?? "-"}</p>
                  <p className="text-sm text-gray-600">{c.customer_address}</p>
                  <div className="mt-3">{actionButtons(c)}</div>
                </li>
              ))}
            </ul>

            {meta && <Pagination meta={meta} onChange={setPage} />}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title="Hapus pelanggan?"
        message={`Pelanggan "${toDelete?.customer_name ?? ""}" akan dihapus dari daftar. Riwayat order pelanggan ini tetap utuh.`}
        isPending={remove.isPending}
        error={remove.error ? remove.error.message : null}
        onConfirm={confirmDelete}
        onCancel={closeDialog}
      />
    </div>
  );
}