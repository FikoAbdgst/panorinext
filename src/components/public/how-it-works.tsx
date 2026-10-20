const STEPS = [
  {
    title: "Pilih frame",
    body: "Mulai dari frame lucu yang sudah tersedia, atau ajukan frame custom buat acaramu.",
    label: "Frame rack",
  },
  {
    title: "Ambil foto",
    body: "Atur pose, pakai timer, dan ulangi sampai dapat shot yang paling pas.",
    label: "Capture",
  },
  {
    title: "Bawa pulang",
    body: "Download photostrip PNG atau GIF, lalu kirim ke email kalau mau simpan versi digitalnya.",
    label: "Print / export",
  },
] as const

const STEP_CAPTIONS = ["Pilih satu", "3 · 2 · 1", "PNG / GIF / email"] as const

function CropMarks() {
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute left-3 top-3 h-4 w-4 border-l border-t border-[#BF3131]/40"
      />
      <span
        aria-hidden="true"
        className="absolute right-3 top-3 h-4 w-4 border-r border-t border-[#BF3131]/40"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-3 left-3 h-4 w-4 border-b border-l border-[#BF3131]/40"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-3 right-3 h-4 w-4 border-b border-r border-[#BF3131]/40"
      />
    </>
  )
}

function StepVisual({ step }: { step: number }) {
  if (step === 1) {
    return (
      <div className="flex items-end gap-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className={`relative w-[58px] ${item === 1 ? "-translate-y-2" : ""}`}
          >
            <div
              className={`border-2 p-1.5 ${
                item === 1
                  ? "border-[#BF3131] bg-[#BF3131] shadow-[3px_3px_0_rgba(122,28,28,0.35)]"
                  : "border-[#BF3131]/25 bg-[#FFFBF3]"
              }`}
            >
              <div className="space-y-1">
                {[0, 1, 2].map((slot) => (
                  <div
                    key={slot}
                    className={`h-5 w-full ${
                      item === 1 ? "bg-[#FEF3E2]/80" : "bg-[#BF3131]/10"
                    }`}
                  />
                ))}
              </div>
            </div>
            {item === 1 ? (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#BF3131] text-[10px] font-bold text-[#FEF3E2] shadow">
                ✓
              </span>
            ) : null}
          </div>
        ))}
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="relative flex h-[128px] w-[172px] items-center justify-center border-2 border-[#BF3131]/55 bg-[#FFFBF3] shadow-[4px_4px_0_rgba(191,49,49,0.12)]">
        <span className="absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-[#BF3131]" />
        <span className="absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 border-[#BF3131]" />
        <span className="absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-[#BF3131]" />
        <span className="absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-[#BF3131]" />
        <div className="text-center">
          <p className="text-5xl font-extrabold leading-none text-[#BF3131]">
            3
          </p>
          <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.2em] text-[#BF3131]/60">
            Timer
          </p>
        </div>
        <span className="absolute -right-2 -top-2 h-3 w-3 rounded-full bg-[#BF3131]" />
      </div>
    )
  }

  return (
    <div className="flex items-end gap-5">
      <div className="w-[86px] -rotate-6 bg-[#FFFBF3] p-1.5 shadow-[4px_4px_0_rgba(191,49,49,0.12)] ring-1 ring-[#BF3131]/25">
        <div className="border border-[#BF3131]/35 p-1">
          <div className="space-y-1">
            {[0, 1, 2].map((slot) => (
              <div key={slot} className="h-6 w-full bg-[#BF3131]/15" />
            ))}
          </div>
          <p className="mt-1 text-center text-[6px] font-bold uppercase tracking-[0.12em] text-[#BF3131]/60">
            Panoricam
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 pb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#BF3131] text-[#FEF3E2] shadow-[3px_3px_0_rgba(122,28,28,0.4)]">
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
              d="M12 3v12m0 0l4-4m-4 4l-4-4M5 21h14"
            />
          </svg>
        </div>
        <div className="flex h-8 w-12 items-center justify-center border border-[#BF3131]/30 bg-[#FFFBF3]">
          <svg
            aria-hidden="true"
            className="h-4 w-4 text-[#BF3131]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="M4 6h16v12H4zM4 7l8 6 8-6"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

function Sprockets({ position }: { position: "top" | "bottom" }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-2 flex h-2 items-center justify-around ${
        position === "top" ? "top-2" : "bottom-2"
      }`}
    >
      {Array.from({ length: 24 }).map((_, index) => (
        <span
          key={index}
          className="h-1.5 w-3 shrink-0 rounded-[1px] bg-[#FEF3E2]/80"
        />
      ))}
    </div>
  )
}

export function HowItWorks() {
  return (
    <section
      id="cara-kerja"
      className="relative scroll-mt-28 overflow-hidden bg-[#BF3131] py-16 font-['Poppins'] sm:py-20"
    >
      <div
        aria-hidden="true"
        className="lab-dots-cream absolute inset-0 opacity-50"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              suppressHydrationWarning data-aos="lab-sweep"
              data-aos-duration="1100"
              className="max-w-2xl text-balance text-3xl font-extrabold leading-[0.98] tracking-[-0.045em] text-[#FEF3E2] sm:text-5xl"
            >
              Dari frame ke print, tiga langkah.
            </h2>
            <p
              suppressHydrationWarning data-aos="lab-focus"
              data-aos-duration="1000"
              data-aos-delay="140"
              className="mt-4 max-w-xl text-sm leading-relaxed text-[#FEF3E2]/80 sm:text-base"
            >
              Nggak perlu install aplikasi. Semua prosesnya jalan di browser,
              dari pilih frame sampai hasil siap diunduh.
            </p>
          </div>
        </div>

        <div className="relative mt-12 border-y-[10px] border-[#7A1C1C] bg-[#7A1C1C] px-3 py-8 sm:px-6">
          <Sprockets position="top" />

          <div className="relative grid gap-5 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <article
                key={step.title}
                suppressHydrationWarning data-aos="lab-develop"
                data-aos-duration="1200"
                data-aos-delay={140 + index * 140}
                className="relative border border-[#FEF3E2]/20 bg-[#FEF3E2] p-4 text-[#2A0A0A] shadow-[6px_6px_0_rgba(42,10,10,0.22)]"
              >
                <div className="flex items-start justify-between border-b border-dashed border-[#BF3131]/30 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#BF3131]">
                    {step.label}
                  </span>
                  <span className="text-5xl font-extrabold leading-none text-[#BF3131]/15">
                    0{index + 1}
                  </span>
                </div>

                <div
                  aria-hidden="true"
                  className="relative mt-4 flex aspect-[4/3] items-center justify-center overflow-hidden border border-[#BF3131]/15 bg-[#FEF3E2] p-5"
                >
                  <span className="lab-dots absolute inset-0 opacity-60" />
                  <CropMarks />
                  <div className="relative z-10">
                    <StepVisual step={index + 1} />
                  </div>
                  <span className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-[8px] font-bold uppercase tracking-[0.2em] text-[#BF3131]/60">
                    {STEP_CAPTIONS[index]}
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-bold leading-tight text-[#2A0A0A]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6B4A40]">
                  {step.body}
                </p>
              </article>
            ))}
          </div>

          <Sprockets position="bottom" />
        </div>
      </div>
    </section>
  )
}
