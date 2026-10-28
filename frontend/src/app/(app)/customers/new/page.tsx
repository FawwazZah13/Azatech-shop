"use client";

import { useRouter } from "next/navigation";
import { CustomerForm } from "@/components/customer-form";
import { useCreateCustomer } from "@/lib/customers";

export default function NewCustomerPage() {
  const router = useRouter();
  const create = useCreateCustomer();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Tambah Pelanggan</h1>
      <CustomerForm
        submitLabel="Simpan"
        isPending={create.isPending}
        error={create.error}
        onSubmit={(values) =>
          create.mutate(values, { onSuccess: () => router.push("/customers") })
        }
      />
    </div>
  );
}