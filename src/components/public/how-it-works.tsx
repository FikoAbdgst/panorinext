"use client"

import { useState } from "react"

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

function StepConnector({
  next,
  nextLabel,
  onNext,
}: {
  next: number
  nextLabel: string
  onNext: () => void
}) {
  return (
    <div className="relative h-16">
      {/* garis putus-putus, sejajar dengan badge nomor */}
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-9 top-0 border-l-2 border-dashed border-[#FEF3E2]/55 md:left-11"
      />

      {/* tombol panah */}
      <button
        type="button"
        onClick={onNext}
        aria-label={`Buka langkah ${next}: ${nextLabel}`}
        className="group absolute left-9 top-1/2 z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#FEF3E2] text-[#BF3131] shadow-[0_4px_0_rgba(42,10,10,0.35)] ring-4 ring-[#7A1C1C] transition duration-200 hover:bg-white hover:shadow-[0_2px_0_rgba(42,10,10,0.35)] focus-visible:outline-none focus-visible:ring-[#FEF3E2] active:translate-y-[calc(-50%+2px)] md:left-11"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5"
        >
          <path d="M12 5v14m-6-6 6 6 6-6" />
        </svg>
      </button>

      {/* label */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-16 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#FEF3E2]/75 md:left-[4.75rem]"
      >
        Lanjut ke 0{next} · {nextLabel}
      </span>
    </div>
  )
}

export function HowItWorks() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section
      id="cara-kerja"
      className="relative scroll-mt-24 overflow-hidden bg-[#BF3131] pb-16 pt-10 font-['Poppins'] sm:pb-20 sm:pt-14"
    >
      <div
        aria-hidden="true"
        className="lab-dots-cream absolute inset-0 opacity-50"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <h2
            suppressHydrationWarning
            data-aos="lab-sweep"
            data-aos-duration="1100"
            className="text-balance text-3xl font-extrabold leading-[0.98] tracking-[-0.035em] text-[#FEF3E2] sm:text-5xl"
          >
            Dari frame ke print, tiga langkah.
          </h2>
          <p
            suppressHydrationWarning
            data-aos="lab-focus"
            data-aos-duration="1000"
            data-aos-delay="140"
            className="mt-4 max-w-xl text-sm leading-relaxed text-[#FEF3E2]/80 sm:text-base"
          >
            Nggak perlu install aplikasi. Semua prosesnya jalan di browser, dari
            pilih frame sampai hasil siap diunduh.
          </p>
        </div>

        <div className="relative mx-auto mt-12 max-w-3xl border-y-[10px] border-[#7A1C1C] bg-[#7A1C1C] px-3 py-8 sm:px-5">
          <Sprockets position="top" />

          <ol className="relative m-0 list-none p-0">
            {STEPS.map((step, index) => {
              const isOpen = open === index

              return (
                <li key={step.title}>
                  <div className="border border-[#FEF3E2]/20 bg-[#FEF3E2]">
                    <h3>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={`cara-kerja-${index}`}
                        onClick={() => setOpen(isOpen ? null : index)}
                        className="flex w-full items-center gap-3 px-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#BF3131] md:gap-4 md:px-5"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#BF3131] text-sm font-extrabold text-[#FEF3E2] md:h-12 md:w-12 md:text-base">
                          0{index + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[9px] font-bold uppercase tracking-[0.22em] text-[#BF3131]">
                            {step.label}
                          </span>
                          <span className="mt-0.5 block text-lg font-bold leading-tight text-[#2A0A0A] md:text-xl">
                            {step.title}
                          </span>
                        </span>
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center text-[#BF3131] transition-transform duration-300 ${
                            isOpen ? "rotate-45" : ""
                          }`}
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-5 w-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 5v14M5 12h14"
                            />
                          </svg>
                        </span>
                      </button>
                    </h3>

                    <div
                      id={`cara-kerja-${index}`}
                      aria-hidden={!isOpen}
                      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                        isOpen
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="grid gap-4 border-t border-dashed border-[#BF3131]/20 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-start md:px-5">
                          <div>
                            <p className="max-w-prose text-sm leading-relaxed text-[#6B4A40]">
                              {step.body}
                            </p>
                            <p className="mt-3 inline-flex border-t border-dashed border-[#BF3131]/25 pt-2 text-[8px] font-bold uppercase tracking-[0.2em] text-[#BF3131]/65">
                              {STEP_CAPTIONS[index]}
                            </p>
                          </div>

                          <div
                            aria-hidden="true"
                            className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden border border-[#BF3131]/15 bg-[#FEF3E2] p-4 sm:aspect-[4/3] sm:w-56"
                          >
                            <span className="lab-dots absolute inset-0 opacity-60" />
                            <CropMarks />
                            <div className="relative z-10 scale-90">
                              <StepVisual step={index + 1} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {index < STEPS.length - 1 ? (
                    <StepConnector
                      next={index + 2}
                      nextLabel={STEPS[index + 1].title}
                      onNext={() => setOpen(index + 1)}
                    />
                  ) : null}
                </li>
              )
            })}
          </ol>

          <Sprockets position="bottom" />
        </div>
      </div>
    </section>
  )
}
