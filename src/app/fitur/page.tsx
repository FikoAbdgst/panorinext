import type { Metadata } from "next"

import { BackButton } from "@/components/public/back-button"
import { BoothFeatureCards } from "@/components/public/booth-feature-cards"

export const metadata: Metadata = {
  title: "Pilih Fitur Photo Booth",
  description:
    "Mulai sesi foto dengan frame slot klasik atau flipbook 3D. Pilih fitur yang paling cocok, lalu pindah kapan saja.",
}

export default function FiturPage() {
  return (
    <div className="page-fitur min-h-screen bg-[#FEF3E2] font-['Poppins']">
      <section className="relative overflow-hidden pb-16 pt-6 sm:pb-20 sm:pt-8">
        <div aria-hidden="true" className="lab-paper absolute inset-0 opacity-60" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <BackButton />

          <div className="mx-auto mt-10 max-w-2xl text-center sm:mt-12">
            <span className="inline-flex items-center gap-1.5 border border-[#BF3131]/30 bg-[#FFFBF3] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#BF3131]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#BF3131]" />
              Pilih pengalaman
            </span>

            <h1 className="mt-4 text-balance text-4xl font-extrabold leading-[0.95] tracking-[-0.05em] text-[#2A0A0A] sm:text-6xl">
              Mau mulai dari mana?
            </h1>

            <p className="mx-auto mt-4 max-w-lg text-pretty text-sm leading-relaxed text-[#5B3A32] sm:text-base">
              Pilih gaya sesimu dulu. Bisa pindah kapan saja lewat tombol di
              ujung tiap halaman.
            </p>
          </div>

          <BoothFeatureCards />

          <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A5A50]">
            Gratis · Tanpa install · Foto diproses di perangkatmu
          </p>
        </div>
      </section>
    </div>
  )
}
