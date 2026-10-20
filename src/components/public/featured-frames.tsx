import Link from "next/link"

import { FeaturedFrameCard } from "@/components/public/frame-preview-card"
import { listTopFrames } from "@/lib/frames/queries"

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

export async function FeaturedFrames() {
  const topFrames = await listTopFrames(3)

  return (
    <section
      id="frame-rack"
      className="relative overflow-hidden bg-[#FEF3E2] font-['Poppins']"
    >
      <FilmEdge />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2
              suppressHydrationWarning data-aos="lab-sweep"
              data-aos-duration="1100"
              className="max-w-2xl text-balance text-3xl font-extrabold leading-[0.98] tracking-[-0.045em] text-[#2A0A0A] sm:text-5xl"
            >
              Frame yang siap <span className="text-[#BF3131]">dipakai.</span>
            </h2>
            <p
              suppressHydrationWarning data-aos="lab-focus"
              data-aos-duration="1000"
              data-aos-delay="140"
              className="mt-4 max-w-xl text-sm leading-relaxed text-[#5B3A32] sm:text-base"
            >
              Frame pilihan yang bisa langsung dicoba. Ada yang gratis, ada yang
              premium. Semua bisa dipakai dari browser.
            </p>
          </div>

          <div className="flex items-center gap-5">
            <Link
              href="/frame"
              className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap text-sm font-bold text-[#BF3131] underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"
            >
              Lihat semua frame
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
            </Link>
          </div>
        </div>

        {topFrames.length > 0 ? (
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {topFrames.map((frame, index) => (
              <div
                key={frame.id}
                suppressHydrationWarning data-aos="lab-hang"
                data-aos-duration="1300"
                data-aos-delay={120 + index * 140}
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
          <div className="mt-12 border border-dashed border-[#BF3131]/35 bg-[#FFFBF3] px-6 py-16 text-center">
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
      </div>

      <FilmEdge />
    </section>
  )
}
