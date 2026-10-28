"use client";

import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/product-form";
import { useCreateProduct } from "@/lib/products";

export default function NewProductPage() {
  const router = useRouter();
  const create = useCreateProduct();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Tambah Produk</h1>
      <ProductForm
        submitLabel="Simpan"
        isPending={create.isPending}
        error={create.error}
        onSubmit={(values) =>
          create.mutate(values, { onSuccess: () => router.push("/products") })
        }
      />
    </div>
  );
}