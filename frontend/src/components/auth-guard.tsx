"use client";

import { useQuery } from "@tanstack/react-query";
import { api, ApiError, tokenStorage } from "@/lib/api";
import type { User } from "@/lib/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const me = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      if (!tokenStorage.get()) {
        window.location.href = "/login";
        throw new ApiError("Unauthenticated", 401);
      }
      return api<User>("/auth/me");
    },
  });

  if (me.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        Memuat...
      </div>
    );
  }

  if (me.isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <p className="text-red-600">Gagal memuat sesi: {me.error.message}</p>
        <button
          onClick={() => me.refetch()}
          className="rounded bg-gray-900 px-4 py-2 text-white"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  return <>{children}</>;
}