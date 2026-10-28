"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLogout, type User } from "@/lib/auth";

export default function HomePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-gray-600">Ringkasan menyusul di step berikutnya.</p>
    </div>
  );
}