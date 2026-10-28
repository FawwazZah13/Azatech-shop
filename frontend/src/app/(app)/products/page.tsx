"use client";

import Link from "next/link";
import { useState } from "react";
import { Pagination } from "@/components/pagination";
import { formatRupiah } from "@/lib/format";
import { useProducts, type ProductSort } from "@/lib/products";
import { useDebounce } from "@/lib/use-debounce";

const PER_PAGE = 10;
type SortKey = "name" | "price" | "stock";

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [sort, setSort] = useState<ProductSort>("name");
  const search = useDebounce(searchInput, 400);

  const products = useProducts({ page, perPage: PER_PAGE, search, sort });
  const items = products.data?.data ?? [];
  const meta = products.data?.meta;

  function toggleSort(key: SortKey) {
    setSort((current) => (current === key ? `-${key}` : key) as ProductSort);
    setPage(1);
  }

  function sortMark(key: SortKey) {
    if (sort === key) return " ↑";
    if (sort === `-${key}`) return " ↓";
    return "";
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Produk</h1>
        <Link
          href="/products/new"
          className="rounded bg-gray-900 px-4 py-2 text-center text-sm font-medium text-white"
        >
          Tambah Produk
        </Link>
      </div>

      <input
        type="search"
        value={searchInput}
        onChange={(e) => {
          setSearchInput(e.target.value);
          setPage(1);
        }}
        placeholder="Cari nama atau kode produk..."
        aria-label="Cari produk"
        className="mt-4 w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 sm:max-w-sm"
      />

      <div className="mt-4">
        {products.isPending ? (
          <p className="rounded bg-white p-8 text-center text-gray-500">Memuat produk...</p>
        ) : products.isError ? (
          <div role="alert" className="rounded bg-red-50 p-6 text-center">
            <p className="text-red-700">Gagal memuat produk: {products.error.message}</p>
            <button
              onClick={() => products.refetch()}
              className="mt-3 rounded bg-gray-900 px-4 py-2 text-sm text-white"
            >
              Coba lagi
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="rounded bg-white p-8 text-center text-gray-500">
            {search ? `Tidak ada produk yang cocok dengan "${search}".` : "Belum ada produk."}
          </p>
        ) : (
          <div className={products.isPlaceholderData ? "opacity-60" : ""}>
            {/* Desktop: tabel */}
            <div className="hidden overflow-hidden rounded-lg bg-white shadow md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Kode</th>
                    <th className="px-4 py-3">
                      <button onClick={() => toggleSort("name")} className="font-semibold">
                        Nama{sortMark("name")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <button onClick={() => toggleSort("stock")} className="font-semibold">
                        Stok{sortMark("stock")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <button onClick={() => toggleSort("price")} className="font-semibold">
                        Harga{sortMark("price")}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 text-gray-500">{p.product_code}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{p.product_name}</td>
                      <td
                        className={`px-4 py-3 text-right ${
                          p.stock < 5 ? "font-semibold text-red-600" : "text-gray-700"
                        }`}
                      >
                        {p.stock}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">{formatRupiah(p.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: kartu */}
            <ul className="space-y-3 md:hidden">
              {items.map((p) => (
                <li key={p.id} className="rounded-lg bg-white p-4 shadow">
                  <p className="text-xs text-gray-500">{p.product_code}</p>
                  <p className="font-medium text-gray-900">{p.product_name}</p>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className={p.stock < 5 ? "font-semibold text-red-600" : "text-gray-700"}>
                      Stok: {p.stock}
                    </span>
                    <span className="text-gray-900">{formatRupiah(p.price)}</span>
                  </div>
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