import Link from "next/link"

const POINTS = [
  "Rekam 10 frame berurutan dalam satu sesi.",
  "Pilih frame PNG khusus flipbook, lalu setiap frame jadi satu halaman buku.",
  "Putar seperti buku, lalu unduh PNG atau GIF.",
] as const

export function FlipbookPromo() {
  return (
    <section className="relative overflow-hidden bg-[#FEF3E2] pb-16 pt-6 sm:pb-20 sm:pt-8">
      <div aria-hidden="true" className="lab-paper absolute inset-0 opacity-50" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          suppressHydrationWarning
          data-aos="lab-develop"
          data-aos-duration="1100"
          className="relative overflow-hidden border border-[#BF3131]/25 bg-[#FFFBF3] p-6 shadow-[0_28px_70px_-52px_rgba(42,10,10,0.8)] sm:p-9 lg:p-12"
        >
          <div
            aria-hidden="true"
            className="lab-dots-cream pointer-events-none absolute inset-0 opacity-25"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#BF3131]/8 blur-2xl"
          />

          <div className="relative grid gap-9 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 border border-[#BF3131]/30 bg-[#FEF3E2] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#BF3131]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#BF3131]" />
                Flipbook baru
              </span>

              <h2 className="mt-4 max-w-xl text-balance text-3xl font-extrabold leading-[0.96] tracking-[-0.045em] text-[#2A0A0A] sm:text-4xl lg:text-[2.9rem]">
                Banyak pose,
                <br />
                <span className="text-[#BF3131]">satu flipbook.</span>
              </h2>

              <p className="mt-4 max-w-lg text-sm leading-relaxed text-[#5B3A32] sm:text-base">
                Bukan cuma strip. Jepret satu foto per halaman, lalu putar
                hasilnya seperti buku kecil yang bisa dibawa pulang.
              </p>

              <ul className="mt-6 space-y-2.5">
                {POINTS.map((point, index) => (
                  <li
                    key={point}
                    className="flex items-start gap-3 text-sm leading-snug text-[#5B3A32]"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#BF3131]/35 text-[9px] font-bold tabular-nums text-[#BF3131]">
                      {index + 1}
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/flipbook"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[2px] bg-[#BF3131] px-6 py-3.5 text-sm font-semibold text-[#FEF3E2] shadow-[4px_4px_0_#7A1C1C] transition duration-300 hover:-translate-y-0.5 hover:bg-[#A02828] hover:shadow-[5px_5px_0_#7A1C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFBF3] sm:text-base"
                >
                  Coba flipbook
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
                <span className="text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A5A50] sm:text-left">
                  Gratis · Tanpa install
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[400px]">
              <div
                aria-hidden="true"
                className="absolute inset-x-6 bottom-2 h-8 rounded-[50%] bg-[#2A0A0A]/12 blur-xl"
              />

              <div className="relative aspect-[4/3] [perspective:1200px]">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 translate-x-5 translate-y-5 -rotate-3 rounded-[3px] border border-[#BF3131]/20 bg-[#FEF3E2]"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 translate-x-2.5 translate-y-2.5 rotate-2 rounded-[3px] border border-[#BF3131]/25 bg-[#FFFBF3] shadow-[0_18px_40px_-28px_rgba(42,10,10,0.7)]"
                />

                <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[3px] border border-[#2A0A0A]/30 bg-[#2A0A0A] p-[6%] text-[#FEF3E2] shadow-[0_30px_65px_-32px_rgba(42,10,10,0.8)]">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-90 [background-image:radial-gradient(circle_at_18%_12%,rgba(191,49,49,0.6),transparent_46%),radial-gradient(circle_at_88%_82%,rgba(122,28,28,0.65),transparent_52%)]"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-[4%] border border-[#FEF3E2]/40"
                  />

                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[clamp(9px,1.7vw,14px)] font-extrabold tracking-[0.28em]">
                        PANORICAM
                      </p>
                      <p className="mt-1 text-[clamp(6px,1vw,9px)] font-semibold tracking-[0.36em] text-[#FEF3E2]/70">
                        FLIPBOOK
                      </p>
                    </div>
                    <span className="rounded-[2px] border border-[#FEF3E2]/40 px-1.5 py-0.5 text-[clamp(6px,1vw,9px)] font-bold uppercase tracking-[0.14em] text-[#FEF3E2]/80">
                      10 hal
                    </span>
                  </div>

                  <div className="relative">
                    <span className="block h-0.5 w-10 bg-[#FEF3E2]" />
                    <p className="mt-3 text-balance text-[clamp(1.2rem,4.4vw,2.1rem)] font-extrabold leading-[1] tracking-[-0.03em]">
                      FLIPBOOK
                    </p>
                    <p className="mt-2 text-[clamp(6px,1vw,9px)] font-semibold uppercase tracking-[0.18em] text-[#FEF3E2]/75">
                      Rekam berurutan · satu flipbook
                    </p>
                  </div>

                  <div
                    aria-hidden="true"
                    className="absolute bottom-0 right-0 h-12 w-12 bg-[linear-gradient(135deg,transparent_49%,rgba(254,243,226,0.92)_50%)]"
                  />
                </div>

                <span className="absolute -right-2 -top-2 rotate-3 rounded-[2px] border border-[#BF3131]/20 bg-[#FEF3E2] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#BF3131] shadow-[3px_3px_0_rgba(191,49,49,0.18)]">
                  3D flipbook
                </span>
              </div>

              <div className="mt-4 flex items-center justify-center gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((dot) => (
                  <span
                    key={dot}
                    className={`h-1.5 rounded-full ${
                      dot === 0 ? "w-6 bg-[#BF3131]" : "w-1.5 bg-[#BF3131]/25"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-2 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-[#7A5A50]">
                Sampul · 10 frame · Sampul belakang
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
