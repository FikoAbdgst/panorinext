import Link from "next/link"

type BoothFeature = "frame" | "flipbook"

const CONTENT = {
  frame: {
    kicker: "Fitur lainnya",
    title: "Foto berurutan, putar jadi flipbook.",
    description:
      "Rekam 10 frame berurutan lalu putar hasilnya seperti buku 3D. Simpan halaman atau GIF flipbook-nya.",
    cta: "Pindah ke Flipbook",
    href: "/flipbook",
  },
  flipbook: {
    kicker: "Fitur lainnya",
    title: "Photostrip klasik dengan frame slot.",
    description:
      "Pilih frame slot favorit, atur pose, lalu simpan photostrip dan GIF-nya. Ada banyak frame gratis yang bisa langsung dipakai.",
    cta: "Pindah ke Frame Slot",
    href: "/frame",
  },
} as const

export function BoothSwitch({ from }: { from: BoothFeature }) {
  const item = CONTENT[from]

  return (
    <section
      id="pindah-fitur"
      aria-labelledby={`booth-switch-${from}`}
      className="relative scroll-mt-28 overflow-hidden border-t border-[#BF3131]/15 bg-[#FFFBF3] py-12 font-['Poppins'] sm:py-16"
    >
      <div
        aria-hidden="true"
        className="lab-paper absolute inset-0 opacity-50"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 border border-[#BF3131]/20 bg-[#FEF3E2] p-6 shadow-[6px_6px_0_rgba(191,49,49,0.08)] sm:p-8 md:flex-row md:items-center md:justify-between md:gap-10">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#BF3131]">
              {item.kicker}
            </p>
            <h2
              id={`booth-switch-${from}`}
              className="mt-2 text-balance text-2xl font-extrabold leading-[1.05] tracking-[-0.04em] text-[#2A0A0A] sm:text-3xl"
            >
              {item.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#5B3A32]">
              {item.description}
            </p>
          </div>

          <Link
            href={item.href}
            className="inline-flex min-h-12 w-full shrink-0 items-center justify-between gap-4 rounded-[2px] bg-[#BF3131] px-5 py-3.5 text-sm font-semibold text-[#FEF3E2] shadow-[4px_4px_0_#7A1C1C] transition duration-300 hover:-translate-y-0.5 hover:bg-[#A02828] hover:shadow-[5px_5px_0_#7A1C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2] md:w-auto"
          >
            {item.cta}
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
        </div>
      </div>
    </section>
  )
}
