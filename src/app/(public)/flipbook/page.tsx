import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { FlipbookClient } from "@/components/public/flipbook/flipbook-client";
import {
  FlipbookHeroGate,
  FlipbookStageProvider,
} from "@/components/public/flipbook/flipbook-stage";
import { listFlipbookFrames } from "@/lib/flipbook/queries";
import type { FlipbookFrame } from "@/lib/flipbook/types";

export const metadata: Metadata = {
  title: "Flipbook Photo Booth",
  description:
    "Rekam 10 frame berurutan, pilih frame PNG khusus flipbook, lalu putar hasilnya sebagai flipbook 3D. Simpan halaman atau GIF flipbook dari PanoriCam.",
};

async function loadFlipbookFrames(): Promise<FlipbookFrame[]> {
  try {
    return await listFlipbookFrames();
  } catch {
    /* Katalog frame tidak boleh menggagalkan sesi flipbook. */
    return [];
  }
}

async function FlipbookStudio() {
  const frames = await loadFlipbookFrames();
  return <FlipbookClient frames={frames} />;
}

function StudioFallback() {
  return (
    <div
      aria-busy="true"
      className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]"
    >
      <div className="h-[520px] animate-pulse border border-[#BF3131]/15 bg-[#FFFBF3]" />
      <div className="h-[520px] animate-pulse border border-[#BF3131]/15 bg-[#FFFBF3]" />
    </div>
  );
}

export default function FlipbookPage() {
  return (
    <div className="page-flipbook min-h-screen bg-[#FEF3E2] font-['Poppins']">
      <FlipbookStageProvider>
        <FlipbookHeroGate>
          <section className="relative overflow-hidden pb-9 pt-28 sm:pb-12 sm:pt-32">
            <div aria-hidden="true" className="lab-paper absolute inset-0 opacity-60" />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="border-b border-[#BF3131]/25 pb-8 sm:pb-10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 border border-[#BF3131]/30 bg-[#FFFBF3] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#BF3131]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#BF3131]" />
                    Fitur baru
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#7A5A50]">
                    10 frame · Frame PNG · GIF
                  </span>
                </div>

                <div className="mt-5 max-w-3xl">
                  <h1 className="text-balance text-[2.8rem] font-extrabold leading-[0.92] tracking-[-0.055em] text-[#2A0A0A] sm:text-6xl lg:text-[4.4rem]">
                    Rekam berurutan.
                    <br />
                    <span className="text-[#BF3131]">Jadi flipbook.</span>
                  </h1>

                  <p className="mt-5 max-w-xl text-pretty text-sm leading-relaxed text-[#5B3A32] sm:text-base">
                    Pilih frame seperti photostrip, ikuti tutorial singkat, lalu
                    rekam 10 frame berurutan. Hasilnya diputar seperti buku
                    sungguhan.
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A5A50] sm:mt-8">
                  <span>Kamera browser</span>
                  <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[#BF3131]/50" />
                  <span>Putar 3D</span>
                  <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[#BF3131]/50" />
                  <span>Tanpa install</span>
                  <Link
                    href="/frame"
                    className="inline-flex min-h-10 items-center border border-[#BF3131]/30 px-2.5 text-[#BF3131] transition hover:border-[#BF3131] hover:bg-[#BF3131] hover:text-[#FEF3E2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2] sm:ml-auto"
                  >
                    Mau photostrip? Pilih frame
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </FlipbookHeroGate>

        <section
          id="flipbook-studio"
          className="relative mx-auto max-w-7xl scroll-mt-28 px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8"
        >
          <Suspense fallback={<StudioFallback />}>
            <FlipbookStudio />
          </Suspense>
        </section>
      </FlipbookStageProvider>
    </div>
  );
}
