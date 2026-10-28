"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLogout, type User } from "@/lib/auth";

export default function HomePage() {
  const logout = useLogout();
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => api<User>("/auth/me"),
  });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Halo, {me.data?.data.name}</h1>
      <p className="mt-1 text-gray-600">Login berhasil. Dashboard menyusul.</p>
      <button
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
        className="mt-4 rounded bg-gray-900 px-4 py-2 text-white disabled:opacity-60"
      >
        Keluar
      </button>
    </main>
  );
}