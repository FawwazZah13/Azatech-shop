"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLogout, type User } from "@/lib/auth";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/products", label: "Produk" },
  { href: "/customers", label: "Pelanggan" },
  { href: "/orders", label: "Riwayat Order" },
  { href: "/orders/new", label: "Buat Order" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const logout = useLogout();
  const me = useQuery({ queryKey: ["me"], queryFn: () => api<User>("/auth/me") });

  // Menu aktif: "/" harus persis, lainnya cukup diawali path. "/orders/new" punya aturan sendiri
  // supaya tidak ikut menyalakan "Riwayat Order".
  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    if (href === "/orders") return pathname === "/orders" || /^\/orders\/\d+/.test(pathname);
    return pathname.startsWith(href);
  }

  const menu = (
    <nav className="flex flex-col gap-1">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={() => setOpen(false)}
          className={`rounded px-3 py-2 text-sm font-medium ${
            isActive(link.href)
              ? "bg-gray-900 text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );

  const userBox = (
    <div className="border-t pt-4">
      <p className="truncate text-sm font-medium text-gray-900">{me.data?.data.name}</p>
      <p className="truncate text-xs text-gray-500">{me.data?.data.email}</p>
      <button
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
        className="mt-3 w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
      >
        Keluar
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop: sidebar tetap di kiri */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col justify-between border-r bg-white p-4 md:flex">
        <div>
          <p className="mb-6 px-3 text-lg font-semibold text-gray-900">Azatech Shop</p>
          {menu}
        </div>
        {userBox}
      </aside>

      {/* Mobile: bar atas + menu buka-tutup */}
      <header className="sticky top-0 z-20 border-b bg-white md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="font-semibold text-gray-900">Azatech Shop</p>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Buka menu"
            aria-expanded={open}
            className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700"
          >
            {open ? "Tutup" : "Menu"}
          </button>
        </div>
        {open && (
          <div className="space-y-4 border-t p-4">
            {menu}
            {userBox}
          </div>
        )}
      </header>
    </>
  );
}