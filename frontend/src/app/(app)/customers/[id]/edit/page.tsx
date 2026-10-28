"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CustomerForm } from "@/components/customer-form";
import { ApiError } from "@/lib/api";
import { useCustomer, useUpdateCustomer } from "@/lib/customers";

export default function EditCustomerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const customer = useCustomer(id);
  const update = useUpdateCustomer(id);

  if (customer.isPending) {
    return <p className="rounded bg-white p-8 text-center text-gray-500">Memuat pelanggan...</p>;
  }

  if (customer.isError) {
    const notFound = customer.error instanceof ApiError && customer.error.status === 404;
    return (
      <div role="alert" className="rounded bg-red-50 p-6 text-center">
        <p className="text-red-700">
          {notFound
            ? "Pelanggan tidak ditemukan."
            : `Gagal memuat pelanggan: ${customer.error.message}`}
        </p>
        <Link href="/customers" className="mt-3 inline-block text-sm text-gray-700 underline">
          Kembali ke daftar pelanggan
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Edit Pelanggan</h1>
      <CustomerForm
        initial={customer.data.data}
        submitLabel="Simpan Perubahan"
        isPending={update.isPending}
        error={update.error}
        onSubmit={(values) =>
          update.mutate(values, { onSuccess: () => router.push("/customers") })
        }
      />
    </div>
  );
}