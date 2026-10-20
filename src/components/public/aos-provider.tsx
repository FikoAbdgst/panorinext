"use client";

import AOS from "aos";
import { useEffect } from "react";

/**
 * Konfigurasi mengikuti `layouts/app.blade.php` (init terakhir di DOMContentLoaded,
 * jadi ini yang efektif dipakai semua halaman).
 *
 * AOS menulis kelas `aos-init`/`aos-animate` ke `className` elemen `[data-aos]`.
 * Halaman publik memakai Partial Prerender + banyak `<Suspense>`, sehingga layout
 * (tempat `<AosProvider/>`) dan tiap boundary halaman terhidrasi pada waktu yang
 * berbeda. Bila `AOS.init`/`refreshHard` dijalankan langsung dari `useEffect`, ia
 * memutasi elemen `[data-aos]` milik subtree yang belum selesai dihidrasi, dan React
 * melaporkan hydration mismatch.
 *
 * Karena itu init/refresh ditunda sampai main thread idle — yaitu setelah task
 * hidrasi yang sedang berjalan selesai — lalu beberapa permintaan digabung menjadi
 * satu flush. AOS tetap berjalan dari `useEffect` (client-only), jadi tidak pernah
 * dieksekusi saat SSR.
 */
const AOS_OPTIONS = {
  duration: 1000,
  easing: "ease-out-cubic",
  once: true,
  offset: 90,
  disableMutationObserver: true,
} as const;

let initialized = false;
let scheduled = false;

function flush() {
  scheduled = false;
  if (!initialized) {
    initialized = true;
    AOS.init(AOS_OPTIONS);
    return;
  }
  AOS.refreshHard();
}

function scheduleRefresh() {
  if (scheduled) return;
  scheduled = true;

  const requestIdle = (
    window as Window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout?: number },
      ) => number;
    }
  ).requestIdleCallback;

  if (typeof requestIdle === "function") {
    requestIdle(flush, { timeout: 300 });
  } else {
    window.setTimeout(flush, 150);
  }
}

export function ensureAosInit() {
  scheduleRefresh();
}

export function refreshAos() {
  scheduleRefresh();
}

export function AosProvider() {
  useEffect(() => {
    scheduleRefresh();
  }, []);

  return null;
}
