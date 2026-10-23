"use client";

import Image from "next/image";

const STEPS = [
  {
    title: "Ambil foto",
    note: "Berdiri di depan kamera, lalu tekan Ambil foto.",
  },
  {
    title: "Cek strip",
    note: "Ketuk foto di strip untuk ganti atau atur potongannya.",
  },
  {
    title: "Simpan",
    note: "Unduh PNG, buat GIF, atau kirim langsung ke email.",
  },
] as const;

export function WelcomeModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      id="welcomeModal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcomeTitle"
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-[#2A0A0A]/65 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="booth-sheet relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[16px] border border-[#BF3131]/25 bg-[#FFFBF3] p-5 shadow-[0_-18px_50px_-30px_rgba(42,10,10,0.6)] sm:rounded-[3px] sm:p-7 sm:shadow-[0_24px_60px_-30px_rgba(42,10,10,0.55)]">
        <button
          type="button"
          aria-label="Tutup panduan"
          onClick={onClose}
          className="absolute right-2.5 top-2.5 flex h-10 w-10 items-center justify-center rounded-[2px] text-[#7A5A50] transition hover:bg-[#BF3131]/8 hover:text-[#2A0A0A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFBF3]"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="grid gap-6 sm:grid-cols-[170px_1fr] sm:items-center">
          <div aria-hidden="true" className="mx-auto w-[150px] -rotate-2">
            <div className="bg-white p-2 shadow-[7px_9px_0_rgba(191,49,49,0.12)] ring-1 ring-[#BF3131]/20">
              <div className="border border-[#BF3131]/25 p-1.5">
                <div className="flex items-center justify-between text-[6px] font-bold uppercase tracking-[0.18em] text-[#BF3131]/70">
                  <Image
                    src="/logo.png"
                    alt="PanoriCam"
                    width={666}
                    height={375}
                    className="h-5 w-auto"
                  />
                  <span>35mm</span>
                </div>
                <div className="mt-1.5 space-y-1.5">
                  {[1, 2, 3].map((slot) => (
                    <div
                      key={slot}
                      className="flex aspect-[4/3] items-center justify-center border border-dashed border-[#BF3131]/25 bg-[#FEF3E2]"
                    >
                      <span className="text-[9px] font-bold tabular-nums text-[#BF3131]/45">
                        0{slot}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1.5 text-[6px] uppercase tracking-[0.16em] text-[#BF3131]/55">
                  <span>3 foto</span>
                  <span>1 strip</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2
              id="welcomeTitle"
              className="text-balance text-2xl font-extrabold leading-[1.02] tracking-[-0.035em] text-[#2A0A0A] sm:text-[1.7rem]"
            >
              Tiga langkah, satu strip.
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[#5B3A32]">
              Booth-nya jalan di browser. Tanpa install.
            </p>

            <ol className="mt-4 space-y-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#BF3131]/35 text-[10px] font-bold tabular-nums text-[#BF3131]">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold leading-tight text-[#2A0A0A]">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#5B3A32]">
                      {step.note}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <button
              type="button"
              autoFocus
              onClick={onClose}
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[2px] bg-[#BF3131] px-5 py-3 text-sm font-semibold text-[#FEF3E2] shadow-[3px_3px_0_#7A1C1C] transition duration-200 hover:-translate-y-0.5 hover:bg-[#A02828] hover:shadow-[4px_4px_0_#7A1C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFBF3] sm:w-auto"
            >
              Mulai foto
            </button>
            <p className="mt-3 flex items-center gap-1.5 text-[10px] text-[#7A5A50]">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="5" y="10" width="14" height="10" rx="1.5" />
                <path d="M8 10V7a4 4 0 018 0v3" />
              </svg>
              Foto diproses di perangkatmu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
