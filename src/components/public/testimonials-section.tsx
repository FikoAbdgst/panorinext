import Link from "next/link"

import { TestimonialGallery } from "@/components/public/testimonial-gallery"
import { LANDING_TESTIMONIAL_LIMIT } from "@/lib/testimonials/constants"
import { listFeaturedTestimonials } from "@/lib/testimonials/queries"
import type { TestimonialItem } from "@/lib/testimonials/types"

export async function TestimonialsSection() {
  const items = (await listFeaturedTestimonials(LANDING_TESTIMONIAL_LIMIT))
    .filter((item): item is TestimonialItem & { message: string } =>
      Boolean(item.message?.trim()),
    )
    .slice(0, LANDING_TESTIMONIAL_LIMIT)

  return (
    <section
      id="testimoni"
      className="relative overflow-hidden bg-[#FEF3E2] pb-16 pt-10 font-['Poppins'] sm:pb-20 sm:pt-14"
    >
      <div
        aria-hidden="true"
        className="lab-paper absolute inset-0 opacity-70"
      />

      <div className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <h2
              suppressHydrationWarning
              data-aos="lab-sweep"
              data-aos-duration="1100"
              className="text-balance text-3xl font-extrabold leading-[0.98] tracking-[-0.035em] text-[#2A0A0A] sm:text-5xl"
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
              Mereka yang udah nyobain PanoriCam, ini katanya!
            </p>
          </div>
        </div>

        {items.length > 0 ? (
          <div
            suppressHydrationWarning
            data-aos="lab-develop"
            data-aos-duration="1200"
            data-aos-delay="140"
            className="w-full"
          >
            <TestimonialGallery items={items} />
          </div>
        ) : (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div
              suppressHydrationWarning
              data-aos="lab-focus"
              data-aos-duration="1100"
              className="mt-12 border border-dashed border-[#BF3131]/35 bg-[#FFFBF3] px-6 py-16 text-center"
            >
              <p className="text-lg font-bold text-[#2A0A0A]">
                Belum ada testimoni pilihan.
              </p>
              <p className="mt-2 text-sm text-[#7A5A50]">
                Cerita yang dikurasi tim PanoriCam akan tampil di sini. Setelah
                sesi foto, bagikan pengalamanmu.
              </p>
              <Link
                href="/frame"
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[2px] bg-[#BF3131] px-5 py-3 text-sm font-semibold text-[#FEF3E2] transition hover:bg-[#A02828] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFBF3]"
              >
                Buka katalog frame
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
