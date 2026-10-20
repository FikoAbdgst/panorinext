/* eslint-disable @next/next/no-img-element */

import Link from "next/link"

const LEFT_STRIP = [
  { src: "/images/m1.jpeg", alt: "Contoh photostrip PanoriCam 1" },
  { src: "/images/m2.jpeg", alt: "Contoh photostrip PanoriCam 2" },
  { src: "/images/m3.jpeg", alt: "Contoh photostrip PanoriCam 3" },
] as const

const RIGHT_STRIP = [
  { src: "/images/k1.jpeg", alt: "Contoh photostrip PanoriCam 4" },
  { src: "/images/k2.jpeg", alt: "Contoh photostrip PanoriCam 5" },
  { src: "/images/k3.jpeg", alt: "Contoh photostrip PanoriCam 6" },
] as const

function PrintStrip({
  images,
  number,
  className,
}: {
  images: ReadonlyArray<{ src: string; alt: string }>
  number: string
  className?: string
  stamp?: boolean
}) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <div className="absolute -top-4 left-1/2 z-20 h-9 w-7 -translate-x-1/2 rounded-t-[2px] bg-[#BF3131] shadow-[0_4px_10px_rgba(90,20,20,0.25)]">
        <span className="absolute left-1/2 top-2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#FEF3E2]" />
      </div>

      <div className="bg-[#FFFBF3] p-2.5 pb-3 shadow-[0_26px_60px_-30px_rgba(90,20,20,0.7)] ring-1 ring-[#BF3131]/20">
        <div className="border border-[#BF3131]/35 px-1.5 pb-1.5 pt-1.5">
          <div className="flex items-center justify-between text-[7px] font-bold uppercase tracking-[0.18em] text-[#BF3131]/70">
            <span>Panoricam</span>
            <span>35mm</span>
          </div>

          <div className="mt-1.5 space-y-1.5">
            {images.map((image) => (
              <img
                key={image.src}
                src={image.src}
                alt={image.alt}
                decoding="async"
                className="aspect-[4/3] w-full object-cover"
              />
            ))}
          </div>

          <div className="flex items-center justify-between pt-1.5 text-[7px] uppercase tracking-[0.18em] text-[#BF3131]/60">
            <span>Test print</span>
            <span>No. {number}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section
      id="top"
      className="lab-paper relative isolate overflow-hidden bg-[#FEF3E2] pb-16 pt-28 font-['Poppins'] sm:pb-20 sm:pt-32 lg:pb-24 lg:pt-32"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="lab-dots absolute inset-0 opacity-60" />
        <div className="absolute -right-24 top-16 h-80 w-80 rounded-full bg-[#F16767]/20 blur-3xl" />
        <div className="absolute -left-28 bottom-0 h-96 w-96 rounded-full bg-[#BF3131]/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto flex min-h-[600px] w-full max-w-6xl items-center">
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-20 hidden h-px bg-[#BF3131]/25 lg:block"
          />

          <div
            suppressHydrationWarning
            data-aos="lab-swing"
            data-aos-duration="1300"
            data-aos-delay="180"
            className="absolute left-0 top-24 hidden lg:block"
          >
            <PrintStrip
              images={LEFT_STRIP}
              number="01"
              className="w-[130px] -rotate-6 xl:w-[180px]"
            />
          </div>

          <div
            suppressHydrationWarning
            data-aos="lab-hang"
            data-aos-duration="1200"
            data-aos-delay="340"
            className="absolute right-0 top-24 hidden lg:block"
          >
            <PrintStrip
              images={RIGHT_STRIP}
              number="02"
              className="w-[130px] rotate-6 xl:w-[180px]"
            />
          </div>

          <div className="relative z-10 mx-auto max-w-[32rem] text-center xl:max-w-[43rem]">
            <h1
              suppressHydrationWarning data-aos="lab-sweep"
              data-aos-duration="1200"
              className="text-balance text-[2.5rem] font-extrabold leading-[0.93] tracking-[-0.055em] text-[#2A0A0A] min-[380px]:text-[2.7rem] sm:text-6xl lg:text-[4.2rem] xl:text-[5.1rem]"
            >
              Frame lucu,
              <br />
              foto rame,
              <br />
              <span className="text-[#BF3131]">langsung jadi.</span>
            </h1>

            <p
              suppressHydrationWarning data-aos="lab-focus"
              data-aos-duration="1100"
              data-aos-delay="160"
              className="mx-auto mt-6 max-w-xl text-pretty text-sm leading-relaxed text-[#5B3A32] sm:text-base lg:text-lg"
            >
              Photobooth online buat pesta, wisuda, atau event kantor. Pilih
              frame custom, pose bareng, lalu bawa pulang photostrip dan GIF-mu
              tanpa install.
            </p>

            <div
              suppressHydrationWarning data-aos="lab-pop"
              data-aos-duration="1000"
              data-aos-delay="280"
              className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"
            >
              <Link
                href="/frame"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[2px] bg-[#BF3131] px-6 py-3.5 text-sm font-semibold text-[#FEF3E2] shadow-[4px_4px_0_#7A1C1C] transition duration-300 hover:-translate-y-0.5 hover:bg-[#A02828] hover:shadow-[5px_5px_0_#7A1C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2] sm:text-base"
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
              <a
                href="#cara-kerja"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[2px] border border-[#BF3131]/35 bg-[#FFFBF3]/60 px-5 py-3.5 text-sm font-semibold text-[#BF3131] transition duration-300 hover:bg-[#FFFBF3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2] sm:text-base"
              >
                Lihat prosesnya
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
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 border-y border-dashed border-[#BF3131]/35 py-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#7A3E32] min-[380px]:gap-x-4 min-[380px]:text-[10px] min-[380px]:tracking-[0.18em] sm:text-[11px]">
              <span>Tanpa install</span>
              <span
                aria-hidden="true"
                className="h-1 w-1 rounded-full bg-[#BF3131]/60"
              />
              <span>PNG + GIF</span>
              <span
                aria-hidden="true"
                className="h-1 w-1 rounded-full bg-[#BF3131]/60"
              />
              <span>Kirim email</span>
            </div>
          </div>
        </div>

        <div className="relative mx-auto mt-14 flex max-w-md items-start justify-center gap-3 sm:gap-6 lg:hidden">
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-0 h-px bg-[#BF3131]/25"
          />
          <div
            suppressHydrationWarning
            data-aos="lab-swing"
            data-aos-duration="1300"
            data-aos-delay="180"
            data-aos-offset="-180"
            className="w-[46%] max-w-[180px]"
          >
            <PrintStrip images={LEFT_STRIP} number="01" className="-rotate-6" />
          </div>
          <div
            suppressHydrationWarning
            data-aos="lab-hang"
            data-aos-duration="1200"
            data-aos-delay="340"
            data-aos-offset="-180"
            className="mt-6 w-[46%] max-w-[180px]"
          >
            <PrintStrip images={RIGHT_STRIP} number="02" className="rotate-6" />
          </div>
        </div>
      </div>
    </section>
  )
}
