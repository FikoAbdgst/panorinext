"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import type { TestimonialItem } from "@/lib/testimonials/types"

const EMOJIS_BY_RATING: Record<number, string[]> = {
  5: ["😍", "🤩", "⭐", "🎉", "💖", "👏"],
  4: ["😊", "👍", "😄", "🙂", "💙"],
  3: ["😐", "👌", "🙂"],
  2: ["😕", "👎"],
  1: ["😞", "👎", "😔"],
}

const ROTATIONS = [
  "-rotate-1",
  "rotate-1",
  "rotate-0",
  "-rotate-[0.5deg]",
  "rotate-[0.5deg]",
  "rotate-0",
] as const

function pickEmoji(emoji: string | null, rating: number): string {
  if (emoji) return emoji
  const list = EMOJIS_BY_RATING[rating] ?? EMOJIS_BY_RATING[5] ?? ["⭐"]
  return list[0] ?? "⭐"
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function Stars({ rating }: { rating: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`Rating ${rating} dari 5`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <svg
          key={index}
          aria-hidden="true"
          className={`h-3.5 w-3.5 ${
            index < rating ? "fill-[#BF3131]" : "fill-[#BF3131]/20"
          }`}
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.92 10.1c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </span>
  )
}

function TestimonialCard({
  testimonial,
  index,
  duplicate,
  onOpen,
}: {
  testimonial: TestimonialItem
  index: number
  duplicate: boolean
  onOpen: () => void
}) {
  const name = testimonial.name?.trim() || "Tamu PanoriCam"
  const initial = name.charAt(0).toUpperCase()
  const rotation = ROTATIONS[index % ROTATIONS.length]

  return (
    <article className={`relative w-[290px] shrink-0 sm:w-[330px] ${rotation}`}>
      <button
        type="button"
        onClick={onOpen}
        tabIndex={duplicate ? -1 : undefined}
        aria-label={`Baca testimoni dari ${name}`}
        aria-haspopup="dialog"
        className="group relative flex min-h-[268px] w-full flex-col border border-[#BF3131]/25 bg-[#FFFBF3] p-5 text-left shadow-[5px_5px_0_rgba(191,49,49,0.08)] transition duration-300 hover:-translate-y-1 hover:border-[#BF3131]/55 hover:shadow-[7px_7px_0_rgba(191,49,49,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"
      >
        <span
          aria-hidden="true"
          className="absolute -top-2 left-8 h-4 w-16 -rotate-2 bg-[#F16767]/20"
        />

        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#BF3131] text-sm font-bold text-[#FEF3E2]">
              {initial}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-[#2A0A0A]">
                {name}
              </h3>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#9A6B5E]">
                {formatDate(testimonial.created_at)}
              </p>
            </div>
          </div>
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#BF3131]/20 bg-[#FEF3E2] text-lg"
          >
            {pickEmoji(testimonial.emoji, testimonial.rating)}
          </span>
        </div>

        <div className="mt-4">
          <Stars rating={testimonial.rating} />
        </div>

        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#4A2A22]">
          {testimonial.message}
        </p>

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-3 border-t border-dashed border-[#BF3131]/20 pt-3">
            <span className="truncate text-[9px] font-bold uppercase tracking-[0.12em] text-[#BF3131]">
              {testimonial.frame
                ? `Frame: ${testimonial.frame.name}`
                : "Photobooth"}
            </span>
          </div>
        </div>
      </button>
    </article>
  )
}

export function TestimonialMarquee({ items }: { items: TestimonialItem[] }) {
  const [selected, setSelected] = useState<number | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (selected === null) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null)
    }
    window.addEventListener("keydown", onKeyDown)

    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 0)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener("keydown", onKeyDown)
      window.clearTimeout(focusTimer)
    }
  }, [selected])

  const closeModal = useCallback(() => setSelected(null), [])

  if (items.length === 0) return null

  const repeat =
    items.length === 1 ? 6 : items.length < 4 ? 3 : items.length < 6 ? 2 : 1
  const loopItems = Array.from({ length: repeat }, () => items).flat()
  const duration = Math.max(38, loopItems.length * 6)
  const current = selected !== null ? items[selected] : null

  return (
    <>
      <div className="lab-marquee relative mt-12 overflow-hidden border-y-4 border-[#BF3131] bg-[#FFFBF3] py-8">
        <div
          aria-hidden="true"
          className="lab-grid absolute inset-0 opacity-40"
        />
        <div
          className="lab-marquee-track flex w-max"
          style={{ animationDuration: `${duration}s` }}
        >
          {[0, 1].map((group) => (
            <div
              key={group}
              className="flex shrink-0"
              aria-hidden={group === 1 ? true : undefined}
            >
              {loopItems.map((testimonial, index) => (
                <div
                  key={`${group}-${testimonial.id}-${index}`}
                  className="mx-2"
                >
                  <TestimonialCard
                    testimonial={testimonial}
                    index={index}
                    duplicate={group === 1}
                    onOpen={() => setSelected(index % items.length)}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {current
        ? createPortal(
            <div
              data-lenis-prevent
              className="fixed inset-0 z-50 flex items-end justify-center bg-[#2A0A0A]/65 p-0 backdrop-blur-sm sm:items-center sm:p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="testimonial-dialog-title"
              onClick={(event) => {
                if (event.target === event.currentTarget) closeModal()
              }}
            >
              <div
                data-lenis-prevent
                className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto border border-[#BF3131]/30 bg-[#FEF3E2] p-6 shadow-[10px_10px_0_rgba(42,10,10,0.25)] sm:p-8"
              >
                <button
                  ref={closeRef}
                  type="button"
                  onClick={closeModal}
                  aria-label="Tutup testimoni"
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center border border-[#BF3131]/25 bg-[#FFFBF3] text-2xl leading-none text-[#BF3131] transition hover:bg-[#FEF3E2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"
                >
                  ×
                </button>

                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#BF3131]/65">
                  Guestbook / note{" "}
                  {String((selected ?? 0) + 1).padStart(3, "0")}
                </p>
                <h2
                  id="testimonial-dialog-title"
                  className="mt-4 pr-10 text-3xl font-extrabold leading-tight tracking-[-0.04em] text-[#2A0A0A]"
                >
                  {current.name?.trim() || "Tamu PanoriCam"}
                </h2>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Stars rating={current.rating} />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9A6B5E]">
                    {formatDate(current.created_at)}
                  </span>
                </div>

                <p className="mt-6 text-base leading-relaxed text-[#4A2A22]">
                  {current.message ?? ""}
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-[#BF3131]/25 pt-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#BF3131]">
                    {current.frame
                      ? `Frame: ${current.frame.name}`
                      : "Photobooth"}
                  </span>
                  <Link
                    href="/frame"
                    onClick={closeModal}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[2px] bg-[#BF3131] px-5 py-3 text-sm font-semibold text-[#FEF3E2] shadow-[3px_3px_0_#7A1C1C] transition hover:-translate-y-0.5 hover:bg-[#A02828] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"
                  >
                    Coba frame ini
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
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
