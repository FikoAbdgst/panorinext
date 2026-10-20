"use client";

import AOS from "aos";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

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

export function resetAos() {
  if (typeof document === "undefined") return;

  document.querySelectorAll<HTMLElement>("[data-aos]").forEach((element) => {
    element.classList.remove("aos-init", "aos-animate");
  });

  scheduleRefresh();
}

export function AosProvider() {
  const pathname = usePathname();
  const firstRoute = useRef(true);

  useEffect(() => {
    scheduleRefresh();

    if (typeof MutationObserver === "undefined") return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type !== "childList") continue;

        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) continue;

          if (
            node.matches("[data-aos]") ||
            node.querySelector("[data-aos]")
          ) {
            scheduleRefresh();
            return;
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (firstRoute.current) {
      firstRoute.current = false;
      return;
    }

    resetAos();
  }, [pathname]);

  return null;
}
