"use client";

import { useEffect } from "react";

import { refreshAos } from "./aos-provider";

/**
 * Memicu `AOS.refreshHard()` setelah subtree tempat komponen ini dirender selesai
 * dihidrasi. Dipakai di tiap halaman publik dan di dalam setiap `<Suspense>` agar
 * elemen `[data-aos]` hasil navigasi klien / stream juga ikut ter-init dan
 * beranimasi tanpa memicu hydration mismatch.
 */
export function AosRefresh() {
  useEffect(() => {
    refreshAos();
  }, []);

  return null;
}
