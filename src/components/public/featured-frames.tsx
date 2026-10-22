import Link from "next/link"

import { FeaturedFrameCard } from "@/components/public/frame-preview-card"
import { listTopFrames } from "@/lib/frames/queries"
import { PREMIUM_PUBLIC_ENABLED } from "@/lib/premium/availability"

function FilmEdge() {
  return (
    <div
      aria-hidden="true"
      className="flex h-4 w-full items-center justify-around overflow-hidden bg-[#BF3131] px-2"
    >
      {Array.from({ length: 40 }).map((_, index) => (
        <span
          key={index}
          className="h-1.5 w-2.5 shrink-0 rounded-[1px] bg-[#FEF3E2]/90"
        />
      ))}
    </div>
  )
}

function ArrowRight() {
  return (
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
        d="M14 5l7 7m0 0l-7 7m7-7H3"
      />
    </svg>
  )
}

export async function FeaturedFrames() {
  const topFrames = await listTopFrames(3)

  return (
    <section
      id="frame-rack"
      className="relative overflow-hidden bg-[#FEF3E2] font-['Poppins']"
    >
      <FilmEdge />

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <h2
            suppressHydrationWarning
            data-aos="lab-focus"
            data-aos-duration="1000"
            data-aos-delay="80"
            className="mt-4 text-balance text-3xl font-extrabold leading-[1.05] tracking-[-0.02em] text-[#2A0A0A] sm:text-4xl lg:text-5xl"
          >
            Frame yang siap <span className="text-[#BF3131]">dipakai.</span>
          </h2>

          <p
            suppressHydrationWarning
            data-aos="lab-focus"
            data-aos-duration="1000"
            data-aos-delay="140"
            className="mt-4 max-w-lg text-sm leading-relaxed text-[#5B3A32] sm:text-base"
          >
            Frame pilihan yang bisa langsung dicoba tanpa biaya.
            {PREMIUM_PUBLIC_ENABLED
              ? " Untuk koleksi premium, buka paket dan masuk dengan satu kode."
              : null}
          </p>

          <p className="mt-2 text-xs leading-relaxed text-[#9A6B5E]">
            Klik frame untuk preview, pilih slot, lalu mulai sesi tanpa install.
          </p>
        </div>

        {topFrames.length > 0 ? (
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-6">
            {topFrames.map((frame, index) => (
              <div
                key={frame.id}
                suppressHydrationWarning
                data-aos="lab-develop"
                data-aos-duration="1100"
                data-aos-delay={120 + index * 120}
              >
                <FeaturedFrameCard
                  index={index}
                  frame={{
                    id: frame.id,
                    name: frame.name,
                    imagePath: frame.image_path,
                    price: frame.price,
                    used: frame.used,
                    categoryIcon: frame.category_icon,
                    categoryName: frame.category_name,
                    width: frame.width,
                    height: frame.height,
                    slots: frame.slots,
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="mx-auto mt-12 max-w-xl border border-dashed border-[#BF3131]/35 bg-[#FFFBF3] px-6 py-16 text-center">
            <svg
              aria-hidden="true"
              className="mx-auto h-12 w-12 text-[#BF3131]/40"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-4 text-lg font-bold text-[#2A0A0A]">
              Rak frame masih kosong.
            </p>
            <p className="mt-2 text-sm text-[#7A5A50]">
              Coba lagi nanti atau buka katalog untuk melihat semua frame.
            </p>
          </div>
        )}

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border border-[#BF3131]/20 bg-[#FFFBF3] px-5 py-4 text-center sm:flex-row sm:px-6 sm:text-left">
          <div>
            <p className="text-sm font-bold text-[#2A0A0A]">
              Masih ada frame lain.
            </p>
            <p className="mt-1 text-xs text-[#7A5A50]">
              Telusuri semuanya, gratis untuk dicoba.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
            {PREMIUM_PUBLIC_ENABLED ? (
              <Link
                href="/premium"
                className="text-sm font-semibold text-[#BF3131] underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFBF3]"
              >
                Paket premium
              </Link>
            ) : null}
            <Link
              href="/frame"
              className="inline-flex min-h-11 items-center gap-2 rounded-[2px] bg-[#BF3131] px-5 py-3 text-sm font-semibold text-[#FEF3E2] shadow-[3px_3px_0_#7A1C1C] transition duration-300 hover:-translate-y-0.5 hover:bg-[#A02828] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFBF3]"
            >
              Lihat semua frame
              <ArrowRight />
            </Link>
          </div>
        </div>
      </div>

      <FilmEdge />
    </section>
  )
}
