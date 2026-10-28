"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, tokenStorage } from "@/lib/api";
import { useLogin } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Kalau sudah login, tidak perlu melihat halaman login
  useEffect(() => {
    if (tokenStorage.get()) router.replace("/");
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login.mutate(
      { email, password },
      { onSuccess: () => router.replace("/") }
    );
  }

  const error = login.error instanceof ApiError ? login.error : null;
  const fieldErrors = error?.errors ?? {};

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow"
      >
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Azatech Shop</h1>
          <p className="text-sm text-gray-500">Masuk untuk mengelola toko</p>
        </div>

        {error && Object.keys(fieldErrors).length === 0 && (
          <div role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">
            {error.message}
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
          />
          {fieldErrors.email && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.email[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
          />
          {fieldErrors.password && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.password[0]}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={login.isPending}
          className="w-full rounded bg-gray-900 py-2 font-medium text-white disabled:opacity-60"
        >
          {login.isPending ? "Memproses..." : "Masuk"}
        </button>
      </form>
    </main>
  );
}