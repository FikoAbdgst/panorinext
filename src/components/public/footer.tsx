import Link from "next/link"

import { PREMIUM_PUBLIC_ENABLED } from "@/lib/premium/availability"
import {
  ADMIN_WHATSAPP_DISPLAY,
  buildAdminWhatsappUrl,
  WHATSAPP_TEMPLATES,
} from "@/lib/whatsapp"

/* eslint-disable @next/next/no-img-element */

export function Footer() {
  return (
    <footer className="relative overflow-hidden  bg-[#FEF3E2] font-['Poppins']">
      <div
        aria-hidden="true"
        className="lab-paper absolute inset-0 opacity-60"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div
          suppressHydrationWarning
          data-aos="lab-develop"
          data-aos-duration="1200"
          className="relative overflow-hidden bg-[#BF3131] p-6 text-[#FEF3E2] shadow-[8px_8px_0_rgba(122,28,28,0.18)] sm:p-10"
        >
          <div
            aria-hidden="true"
            className="lab-dots-cream absolute inset-0 opacity-40"
          />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 className="max-w-2xl text-balance text-4xl font-extrabold leading-[0.94] tracking-[-0.05em] sm:text-6xl">
                Frame sudah siap. Tinggal pose.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#FEF3E2]/85 sm:text-base">
                Pilih frame, ambil foto, lalu bawa pulang photostrip dan GIF-mu.
                Bisa dari HP atau laptop.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/frame"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[2px] bg-[#FEF3E2] px-6 py-3.5 text-sm font-semibold text-[#BF3131] shadow-[4px_4px_0_#7A1C1C] transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[5px_5px_0_#7A1C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FEF3E2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#BF3131]"
              >
                Pilih frame
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </Link>
              {PREMIUM_PUBLIC_ENABLED ? (
                <Link
                  href="/premium"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[2px] border border-[#FEF3E2]/40 px-6 py-3.5 text-sm font-semibold text-[#FEF3E2] transition duration-300 hover:bg-[#FEF3E2]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FEF3E2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#BF3131]"
                >
                  Ruang Premium
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-10 md:grid-cols-[1.2fr_0.8fr_1fr]">
          <div
            suppressHydrationWarning
            data-aos="lab-focus"
            data-aos-duration="1000"
            data-aos-delay="80"
          >
            <img src="/logo.png" alt="PanoriCam" className="h-12 w-auto" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-[#5B3A32]">
              Photobooth online dengan frame custom dan hasil digital yang bisa
              langsung dibawa pulang.
            </p>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[#BF3131]/70">
              Panoricam photo lab / online
            </p>
          </div>

          <div
            suppressHydrationWarning
            data-aos="lab-focus"
            data-aos-duration="1000"
            data-aos-delay="160"
          >
            <h3 className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#BF3131]">
              Jelajahi
            </h3>
            <ul className="mt-4 space-y-3 text-sm font-semibold text-[#5B3A32]">
              <li>
                <Link
                  href="/"
                  className="transition hover:text-[#BF3131] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/frame"
                  className="transition hover:text-[#BF3131] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"
                >
                  Frame
                </Link>
              </li>
              {PREMIUM_PUBLIC_ENABLED ? (
                <li>
                  <Link
                    href="/premium"
                    className="transition hover:text-[#BF3131] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"
                  >
                    Ruang Premium
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>

          <div
            suppressHydrationWarning
            data-aos="lab-focus"
            data-aos-duration="1000"
            data-aos-delay="240"
          >
            <h3 className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#BF3131]">
              Hubungi
            </h3>
            <ul className="mt-4 space-y-3 text-sm font-semibold text-[#5B3A32]">
              <li>
                <a
                  href="https://instagram.com/panoricam"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-[#BF3131] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"
                >
                  @panoricam
                </a>
              </li>
              <li>
                <a
                  href={buildAdminWhatsappUrl(WHATSAPP_TEMPLATES.footer)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-[#BF3131] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"
                >
                  {ADMIN_WHATSAPP_DISPLAY}
                </a>
              </li>
              <li>
                <a
                  href="mailto:panoricam5@gmail.com"
                  className="transition hover:text-[#BF3131] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"
                >
                  panoricam5@gmail.com
                </a>
              </li>
              <li className="font-normal text-[#7A5A50]">
                Bandung, Jawa Barat
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-[#BF3131]/20 pt-6 text-xs text-[#7A5A50] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © 2026 PanoriCam. Dibuat untuk kenangan yang ingin dibawa pulang.
          </p>
          <a
            href="#top"
            className="inline-flex items-center gap-2 font-semibold text-[#BF3131] underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"
          >
            Kembali ke atas
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  )
}
