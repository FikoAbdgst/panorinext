"use client";

import AOS from "aos";
import { useEffect } from "react";

/**
 * Konfigurasi mengikuti `layouts/app.blade.php` (init terakhir di DOMContentLoaded,
 * jadi ini yang efektif dipakai semua halaman).
 *
 * AOS menulis kelas `aos-init`/`aos-animate` ke `className` elemen `[data-aos]`.
 * Bila itu terjadi sebelum React selesai menghidrasi elemen terkait (mis. konten
 * di dalam `<Suspense>` yang di-stream), React melaporkan hydration mismatch.
 * Karena itu init/refresh hanya dilakukan dari `useEffect` client component:
 * efek selalu berjalan setelah subtree-nya terhidrasi.
 */
let initialized = false;

export function ensureAosInit() {
  if (initialized) return;
  initialized = true;
  AOS.init({
    duration: 800,
    easing: "ease-in-out",
    once: false,
    mirror: true,
    offset: 120,
    disableMutationObserver: true,
  });
}

export function refreshAos() {
  ensureAosInit();
  AOS.refreshHard();
}

export function AosProvider() {
  useEffect(() => {
    refreshAos();
  }, []);

  return null;
}
