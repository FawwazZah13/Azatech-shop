"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ProductForm } from "@/components/product-form";
import { ApiError } from "@/lib/api";
import { useProduct, useUpdateProduct } from "@/lib/products";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const product = useProduct(id);
  const update = useUpdateProduct(id);

  if (product.isPending) {
    return <p className="rounded bg-white p-8 text-center text-gray-500">Memuat produk...</p>;
  }

  if (product.isError) {
    const notFound = product.error instanceof ApiError && product.error.status === 404;
    return (
      <div role="alert" className="rounded bg-red-50 p-6 text-center">
        <p className="text-red-700">
          {notFound ? "Produk tidak ditemukan." : `Gagal memuat produk: ${product.error.message}`}
        </p>
        <Link href="/products" className="mt-3 inline-block text-sm text-gray-700 underline">
          Kembali ke daftar produk
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Edit Produk</h1>
      <ProductForm
        initial={product.data.data}
        submitLabel="Simpan Perubahan"
        isPending={update.isPending}
        error={update.error}
        onSubmit={(values) =>
          update.mutate(values, { onSuccess: () => router.push("/products") })
        }
      />
    </div>
  );
}