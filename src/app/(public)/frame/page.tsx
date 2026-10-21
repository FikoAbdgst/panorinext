import Link from "next/link";
import { Suspense } from "react";

import { AosRefresh } from "@/components/public/aos-refresh";
import { CustomFrameSection } from "@/components/public/custom-frame-section";
import { FrameCatalog } from "@/components/public/frame/frame-catalog";
import { PREMIUM_PUBLIC_ENABLED } from "@/lib/premium/availability";

function CatalogFallback() {
  return (
    <div className="pb-4" aria-busy="true">
      <div className="flex flex-wrap gap-2">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-10 w-24 animate-pulse border border-[#BF3131]/10 bg-[#BF3131]/5"
          />
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 border-b border-[#BF3131]/15 pb-3">
        <div className="h-11 w-24 animate-pulse border border-[#BF3131]/10 bg-[#BF3131]/5" />
        <div className="h-4 w-20 animate-pulse bg-[#BF3131]/10" />
      </div>

      <div className="mt-7 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item}>
            <div className="aspect-[4/5] animate-pulse bg-[#BF3131]/10" />
            <div className="mt-3 h-5 w-2/3 animate-pulse bg-[#BF3131]/10" />
            <div className="mt-2 h-3 w-1/2 animate-pulse bg-[#BF3131]/10" />
            <div className="mt-3 h-11 w-full animate-pulse bg-[#BF3131]/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FramePage({ searchParams }: PageProps<"/frame">) {
  return (
    <div className="page-frame min-h-screen bg-[#FEF3E2] font-['Poppins']">
      <section className="relative overflow-hidden pt-28 sm:pt-32">
        <div aria-hidden="true" className="lab-paper absolute inset-0 opacity-60" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="border-b border-[#BF3131]/25 pb-8 sm:pb-10">
            <div className="max-w-3xl">
              <h1
                suppressHydrationWarning
                data-aos="lab-sweep"
                data-aos-duration="1100"
                className="text-balance text-[2.9rem] font-extrabold leading-[0.93] tracking-[-0.055em] text-[#2A0A0A] sm:text-6xl lg:text-[4.5rem]"
              >
                Pilih frame.
                <br />
                <span className="text-[#BF3131]">Mulai pose.</span>
              </h1>

              <p
                suppressHydrationWarning
                data-aos="lab-focus"
                data-aos-duration="1000"
                data-aos-delay="140"
                className="mt-5 max-w-xl text-pretty text-sm leading-relaxed text-[#5B3A32] sm:text-base"
              >
                Preview frame langsung di kamera sebelum mulai sesi. Semua
                frame di katalog ini gratis dipakai.
              </p>
            </div>

            <div
              suppressHydrationWarning
              data-aos="lab-focus"
              data-aos-duration="900"
              data-aos-delay="220"
              className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A5A50] sm:mt-8"
            >
              <span>Browser</span>
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[#BF3131]/50" />
              <span>PNG / GIF</span>
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[#BF3131]/50" />
              <span>Katalog gratis</span>
              {PREMIUM_PUBLIC_ENABLED ? (
                <Link
                  href="/premium"
                  className="inline-flex min-h-10 items-center border border-[#BF3131]/30 px-2.5 text-[#BF3131] transition hover:border-[#BF3131] hover:bg-[#BF3131] hover:text-[#FEF3E2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2] sm:ml-auto"
                >
                  Lihat paket premium
                </Link>
              ) : null}
            </div>
          </div>

          <div id="frame-catalog" className="scroll-mt-28 py-8 sm:py-10">
            <Suspense fallback={<CatalogFallback />}>
              <FrameCatalog searchParams={searchParams} />
              <AosRefresh />
            </Suspense>
          </div>
        </div>
      </section>

      <CustomFrameSection />
      <AosRefresh />
    </div>
  );
}
