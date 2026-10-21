import Link from "next/link";

import {
  buildAdminWhatsappUrl,
  WHATSAPP_TEMPLATES,
} from "@/lib/whatsapp";

export function PremiumComingSoon() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FEF3E2] font-['Poppins']">
      <section className="relative flex flex-1 items-center overflow-hidden px-4 pt-32 pb-20 sm:px-6 lg:px-8">
        <div aria-hidden="true" className="lab-paper absolute inset-0 opacity-60" />

        <div className="relative mx-auto w-full max-w-2xl border border-[#BF3131]/25 bg-[#FFFBF3] px-6 py-12 text-center shadow-[10px_10px_0_rgba(191,49,49,0.08)] sm:px-12 sm:py-16">
          <span
            aria-hidden="true"
            className="mx-auto block h-2 w-16 bg-[#BF3131]"
          />

          <h1 className="mt-8 text-balance text-[2.1rem] font-extrabold leading-[0.94] tracking-[-0.05em] text-[#2A0A0A] min-[360px]:text-[2.6rem] sm:text-6xl">
            Ruang Premium
            <br />
            <span className="text-[#BF3131]">segera hadir.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-md text-pretty text-sm leading-relaxed text-[#5B3A32] sm:text-base">
            Kami sedang menyiapkan paket frame premium. Sementara itu, semua
            frame gratis tetap bisa dipakai seperti biasa.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/frame"
              className="inline-flex min-h-12 items-center justify-center bg-[#BF3131] px-6 py-3.5 text-sm font-semibold text-[#FEF3E2] transition duration-300 hover:bg-[#A02828] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFBF3]"
            >
              Pilih frame gratis
            </Link>
            <a
              href={buildAdminWhatsappUrl(WHATSAPP_TEMPLATES.premiumHelp)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center border border-[#BF3131]/35 px-6 py-3.5 text-sm font-semibold text-[#BF3131] transition duration-300 hover:border-[#BF3131] hover:bg-[#BF3131]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFBF3]"
            >
              Tanya admin
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
