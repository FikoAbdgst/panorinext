"use client"

import { FramePickerThumb } from "@/components/public/flipbook/frame-picker-thumb"
import { FLIPBOOK_PAGE_COUNT } from "@/lib/constants"
import type { FlipbookFrame } from "@/lib/flipbook/types"

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"

const BTN_PRIMARY = `inline-flex min-h-12 items-center justify-center gap-2 rounded-[2px] bg-[#BF3131] px-5 py-3 text-sm font-semibold text-[#FEF3E2] shadow-[3px_3px_0_#7A1C1C] transition duration-200 hover:-translate-y-0.5 hover:bg-[#A02828] hover:shadow-[4px_4px_0_#7A1C1C] active:translate-y-0 disabled:pointer-events-none disabled:opacity-40 ${FOCUS_RING}`

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

export function FlipbookWizard({
  frames,
  selectedFrameId,
  onSelectFrame,
  onStartCapture,
}: {
  frames: FlipbookFrame[]
  selectedFrameId: number | null
  onSelectFrame: (id: number | null) => void
  onStartCapture: () => void
}) {
  return (
    <div className="border border-[#BF3131]/25 bg-[#FFFBF3] p-6 shadow-[0_24px_60px_-48px_rgba(42,10,10,0.8)] sm:p-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#BF3131]">
        Flipbook · {FLIPBOOK_PAGE_COUNT} halaman
      </p>
      <h2 className="mt-2 text-balance text-3xl font-extrabold leading-[0.98] tracking-[-0.04em] text-[#2A0A0A] sm:text-4xl">
        Pilih frame flipbook.
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#5B3A32]">
        Frame PNG dipakai di setiap halaman. Setelah dipilih, rekam{" "}
        {FLIPBOOK_PAGE_COUNT} frame sekaligus lalu putar hasilnya.
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
            Flipbook tetap bisa dibuat tanpa frame.
          </p>
        </div>
      )}

      <div className="mt-6 flex justify-end border-t border-[#BF3131]/20 pt-4">
        <button
          type="button"
          onClick={onStartCapture}
          className={`${BTN_PRIMARY} w-full sm:w-auto`}
        >
          Nyalakan kamera
          <ArrowRightIcon />
        </button>
      </div>
    </div>
  )
}
