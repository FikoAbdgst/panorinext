"use client"

import { FramePickerThumb } from "@/components/public/flipbook/frame-picker-thumb"
import { FLIPBOOK_PAGE_COUNT } from "@/lib/constants"
import type { FlipbookFrame } from "@/lib/flipbook/types"

export type WizardStep = "frame" | "tutorial"

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"

const BTN_PRIMARY = `inline-flex min-h-12 items-center justify-center gap-2 rounded-[2px] bg-[#BF3131] px-5 py-3 text-sm font-semibold text-[#FEF3E2] shadow-[3px_3px_0_#7A1C1C] transition duration-200 hover:-translate-y-0.5 hover:bg-[#A02828] hover:shadow-[4px_4px_0_#7A1C1C] active:translate-y-0 disabled:pointer-events-none disabled:opacity-40 ${FOCUS_RING}`

const BTN_GHOST = `inline-flex min-h-10 items-center justify-center gap-1.5 rounded-[2px] px-2.5 text-xs font-semibold text-[#7A3E32] transition hover:bg-[#BF3131]/8 hover:text-[#2A0A0A] disabled:pointer-events-none disabled:opacity-40 ${FOCUS_RING}`

const STEPS = [
  { id: "frame", label: "Frame" },
  { id: "tutorial", label: "Tutorial" },
] as const

const TUTORIAL_STEPS = [
  {
    title: "Pilih frame",
    body: "Frame PNG dipasang di setiap halaman flipbook. Frame yang dipilih dipakai untuk seluruh sesi.",
  },
  {
    title: "Sampul & penutup",
    body: "Setiap tipe frame sudah berisi desain sampul, 10 halaman, dan penutup. Foto pertama dan terakhir mengisi area transparannya.",
  },
  {
    title: `Rekam ${FLIPBOOK_PAGE_COUNT} frame`,
    body: `Kamera mengambil ${FLIPBOOK_PAGE_COUNT} frame berurutan. Hitung mundur bisa diubah kapan saja di layar kamera.`,
  },
  {
    title: "Putar & bawa pulang",
    body: "Putar flipbook seperti buku 3D, lalu unduh halaman atau GIF.",
  },
] as const

function ArrowRightIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 5l7 7-7 7M21 12H3" />
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

function FrameOffIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="4" width="16" height="16" rx="1.5" />
      <path d="M4 20L20 4" />
    </svg>
  )
}

function Stepper({ current }: { current: WizardStep }) {
  const activeIndex = STEPS.findIndex((step) => step.id === current)

  return (
    <ol className="flex flex-wrap items-center gap-2">
      {STEPS.map((step, index) => {
        const done = index < activeIndex
        const active = index === activeIndex
        return (
          <li key={step.id} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold tabular-nums ${
                active
                  ? "border-[#BF3131] bg-[#BF3131] text-[#FEF3E2]"
                  : done
                    ? "border-[#BF3131] bg-[#FEF3E2] text-[#BF3131]"
                    : "border-[#BF3131]/25 text-[#7A5A50]"
              }`}
            >
              {done ? <CheckIcon /> : index + 1}
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-[0.16em] ${
                active ? "text-[#2A0A0A]" : "text-[#7A5A50]"
              }`}
            >
              {step.label}
            </span>
            {index < STEPS.length - 1 ? (
              <span
                aria-hidden="true"
                className="h-px w-4 bg-[#BF3131]/25 sm:w-6"
              />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

export function FlipbookWizard({
  step,
  frames,
  selectedFrameId,
  onSelectFrame,
  onStepChange,
  onStartCapture,
}: {
  step: WizardStep
  frames: FlipbookFrame[]
  selectedFrameId: number | null
  onSelectFrame: (id: number | null) => void
  onStepChange: (step: WizardStep) => void
  onStartCapture: () => void
}) {
  const selectedFrame =
    frames.find((frame) => frame.id === selectedFrameId) ?? null

  return (
    <div className="border border-[#BF3131]/25 bg-[#FFFBF3] p-6 shadow-[0_24px_60px_-48px_rgba(42,10,10,0.8)] sm:p-8">
      <Stepper current={step} />

      {step === "frame" ? (
        <div className="mt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#BF3131]">
            Langkah 1 dari 2
          </p>
          <h2 className="mt-2 text-balance text-3xl font-extrabold leading-[0.98] tracking-[-0.04em] text-[#2A0A0A] sm:text-4xl">
            Pilih frame flipbook.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#5B3A32]">
            Seperti photostrip, frame dipilih duluan. Frame PNG ini dipasang di
            setiap halaman flipbook. Foto rekaman mengisi area transparannya.
          </p>

          {frames.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <button
                type="button"
                aria-pressed={selectedFrameId === null}
                onClick={() => onSelectFrame(null)}
                className={`relative flex flex-col overflow-hidden rounded-[2px] border-2 bg-[#FEF3E2]/50 p-2 transition ${
                  selectedFrameId === null
                    ? "border-[#BF3131] bg-[#FEF3E2] shadow-[3px_3px_0_#BF3131]"
                    : "border-[#BF3131]/20 hover:border-[#BF3131]/60"
                } ${FOCUS_RING}`}
              >
                <span className="flex h-28 w-full flex-col items-center justify-center gap-1.5 bg-[#FFFBF3] text-[#BF3131]/55 sm:h-32">
                  <FrameOffIcon />
                  <span className="text-[9px] font-bold uppercase tracking-[0.14em]">
                    Polos
                  </span>
                </span>
                <span className="mt-2 w-full truncate text-center text-[10px] font-bold uppercase tracking-[0.1em] text-[#7A3E32]">
                  Tanpa frame
                </span>
                {selectedFrameId === null ? (
                  <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#BF3131] text-[#FEF3E2]">
                    <CheckIcon />
                  </span>
                ) : null}
              </button>

              {frames.map((frame) => {
                const active = frame.id === selectedFrameId
                return (
                  <button
                    key={frame.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onSelectFrame(frame.id)}
                    title={frame.name}
                    className={`relative flex flex-col overflow-hidden rounded-[2px] border-2 bg-[#FEF3E2]/50 p-2 transition ${
                      active
                        ? "border-[#BF3131] bg-[#FEF3E2] shadow-[3px_3px_0_#BF3131]"
                        : "border-[#BF3131]/20 hover:border-[#BF3131]/60"
                    } ${FOCUS_RING}`}
                  >
                    <span className="relative flex h-28 w-full items-center justify-center overflow-hidden bg-[#FFFBF3] sm:h-32">
                      <FramePickerThumb frame={frame} />
                    </span>
                    <span className="mt-2 w-full truncate text-center text-[10px] font-bold uppercase tracking-[0.1em] text-[#7A3E32]">
                      {frame.name}
                    </span>
                    {active ? (
                      <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#BF3131] text-[#FEF3E2]">
                        <CheckIcon />
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="mt-6 border border-dashed border-[#BF3131]/30 bg-[#FEF3E2]/50 p-6 text-center">
              <p className="text-sm font-bold text-[#2A0A0A]">
                Belum ada frame flipbook.
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#7A5A50]">
                Flipbook tetap bisa dibuat tanpa frame. Tambahkan frame PNG
                lewat panel admin kalau sudah siap.
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#BF3131]/20 pt-4">
            <p className="text-xs text-[#7A5A50]">
              Terpilih:{" "}
              <span className="font-semibold text-[#2A0A0A]">
                {selectedFrame ? selectedFrame.name : "Tanpa frame"}
              </span>
            </p>
            <button
              type="button"
              onClick={() => onStepChange("tutorial")}
              className={BTN_PRIMARY}
            >
              Lanjut ke tutorial
              <ArrowRightIcon />
            </button>
          </div>
        </div>
      ) : null}

      {step === "tutorial" ? (
        <div className="mt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#BF3131]">
            Langkah 2 dari 2
          </p>
          <h2 className="mt-2 text-balance text-3xl font-extrabold leading-[0.98] tracking-[-0.04em] text-[#2A0A0A] sm:text-4xl">
            Cara main flipbook.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#5B3A32]">
            Empat langkah singkat. Semua foto diproses di perangkatmu, tidak
            diunggah ke server.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {TUTORIAL_STEPS.map((item, index) => (
              <div
                key={item.title}
                className="flex items-start gap-3 border border-[#BF3131]/20 bg-[#FEF3E2]/50 p-3.5"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#BF3131]/35 text-[11px] font-bold tabular-nums text-[#BF3131]">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-snug text-[#2A0A0A]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#7A5A50]">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3 border border-[#BF3131]/20 bg-[#FFFBF3] p-3">
            <span className="relative flex h-16 w-14 shrink-0 items-center justify-center overflow-hidden bg-[#FEF3E2] p-1">
              {selectedFrame ? (
                <FramePickerThumb frame={selectedFrame} />
              ) : (
                <span className="flex flex-col items-center gap-1 text-[#BF3131]/55">
                  <FrameOffIcon />
                  <span className="text-[8px] font-bold uppercase tracking-[0.1em]">
                    Polos
                  </span>
                </span>
              )}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A5A50]">
                Frame terpilih
              </p>
              <p className="mt-0.5 truncate text-sm font-bold text-[#2A0A0A]">
                {selectedFrame ? selectedFrame.name : "Tanpa frame"}
              </p>
              <button
                type="button"
                onClick={() => onStepChange("frame")}
                className="mt-1 text-[11px] font-semibold text-[#BF3131] underline-offset-4 hover:underline"
              >
                Ganti frame
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#BF3131]/20 pt-4">
            <button
              type="button"
              onClick={() => onStepChange("frame")}
              className={BTN_GHOST}
            >
              <ArrowLeftIcon />
              Kembali
            </button>
            <button
              type="button"
              onClick={onStartCapture}
              className={BTN_PRIMARY}
            >
              Nyalakan kamera
              <ArrowRightIcon />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
