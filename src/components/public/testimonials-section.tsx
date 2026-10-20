import Link from "next/link"

import { TestimonialMarquee } from "@/components/public/testimonial-marquee"
import { listTestimonials } from "@/lib/testimonials/queries"
import type { TestimonialItem } from "@/lib/testimonials/types"

export async function TestimonialsSection() {
  const items = (await listTestimonials(50))
    .filter((item): item is TestimonialItem & { message: string } =>
      Boolean(item.message?.trim()),
    )
    .slice(0, 12)

  return (
    <section
      id="testimoni"
      className="relative overflow-hidden bg-[#FEF3E2] py-16 font-['Poppins'] sm:py-20"
    >
      <div
        aria-hidden="true"
        className="lab-paper absolute inset-0 opacity-70"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              suppressHydrationWarning
              data-aos="lab-sweep"
              data-aos-duration="1100"
              className="max-w-2xl text-balance text-3xl font-extrabold leading-[0.98] tracking-[-0.045em] text-[#2A0A0A] sm:text-5xl"
            >
              Catatan dari{" "}
              <span className="text-[#BF3131]">Kustomer kami.</span>
            </h2>
            <p
              suppressHydrationWarning
              data-aos="lab-focus"
              data-aos-duration="1000"
              data-aos-delay="140"
              className="mt-4 max-w-xl text-sm leading-relaxed text-[#5B3A32] sm:text-base"
            >
              Testimoni asli dari orang yang sudah mencoba PanoriCam. Ada yang
              soal frame, ada yang soal hasilnya.
            </p>
          </div>
        </div>

        {items.length > 0 ? (
          <>
            <div
              suppressHydrationWarning
              data-aos="lab-develop"
              data-aos-duration="1200"
              data-aos-delay="140"
            >
              <TestimonialMarquee items={items} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-4 px-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#9A6B5E]">
              <span>Klik catatan untuk baca versi lengkap</span>
              <span className="hidden sm:inline">Hover untuk jeda</span>
            </div>
          </>
        ) : (
          <div
            suppressHydrationWarning
            data-aos="lab-focus"
            data-aos-duration="1100"
            className="mt-12 border border-dashed border-[#BF3131]/35 bg-[#FFFBF3] px-6 py-16 text-center"
          >
            <p className="text-lg font-bold text-[#2A0A0A]">
              Testimoni masih kosong.
            </p>
            <p className="mt-2 text-sm text-[#7A5A50]">
              Jadi yang pertama setelah foto, lalu ceritakan pengalamanmu di
              sini.
            </p>
            <Link
              href="/frame"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[2px] bg-[#BF3131] px-5 py-3 text-sm font-semibold text-[#FEF3E2] transition hover:bg-[#A02828] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFBF3]"
            >
              Buka katalog frame
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
