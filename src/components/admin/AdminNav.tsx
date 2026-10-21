"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/frames", label: "Frame" },
  { href: "/admin/packs", label: "Paket" },
  { href: "/admin/rooms", label: "Ruang Premium" },
  { href: "/admin/categories", label: "Kategori" },
  { href: "/admin/transactions", label: "Transaksi" },
  { href: "/admin/testimoni", label: "Testimoni" },
] as const;

export function AdminNav({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      router.replace("/");
      router.refresh();
    }
  };

  return (
    <header className="bg-[#BF3131] text-white shadow">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/admin/dashboard" className="text-lg font-bold">
            PanoriCam Admin
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            {LINKS.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 transition ${
                    isActive ? "bg-white/20 font-semibold" : "hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="hidden sm:inline text-white/80">{adminName}</span>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="rounded-md border border-white/40 px-3 py-1.5 transition hover:bg-white/10 disabled:opacity-60"
          >
            {isLoggingOut ? "Keluar..." : "Keluar"}
          </button>
        </div>
      </div>
    </header>
  );
}
