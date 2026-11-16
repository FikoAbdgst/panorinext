"use client"

/* eslint-disable @next/next/no-img-element */

import Link from "next/link"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type AnimationEvent,
  type PointerEvent as ReactPointerEvent,
} from "react"

import { BoothToast, type ToastType } from "@/components/public/booth/booth-toast"
import { FramedPhoto } from "@/components/public/flipbook/framed-photo"
import {
  buildMeta,
  createBackCoverPng,
  createContactSheetPng,
  createCoverPng,
  createFlipbookGif,
  createPhotoPagePng,
  downloadBlob,
  flipbookFilename,
  flipbookGifFilename,
  type FlipbookMeta,
} from "@/lib/flipbook/export"
import type { FlipbookAsset, FlipbookFrame } from "@/lib/flipbook/types"

type FlipDirection = "next" | "prev"

type FlipState = {
  direction: FlipDirection
  from: number
  to: number
  nonce: number
}

type ToastState = {
  id: number
  message: string
  type: ToastType
  duration: number
}

type BusyState = {
  label: string
  progress: number | null
}

type BookPage =
  | { kind: "cover" }
  | { kind: "photo"; index: number }
  | { kind: "back" }

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"

const BTN_PRIMARY = `inline-flex min-h-12 items-center justify-center gap-2 rounded-[2px] bg-[#BF3131] px-5 py-3 text-sm font-semibold text-[#FEF3E2] shadow-[3px_3px_0_#7A1C1C] transition duration-200 hover:-translate-y-0.5 hover:bg-[#A02828] hover:shadow-[4px_4px_0_#7A1C1C] active:translate-y-0 disabled:pointer-events-none disabled:opacity-40 ${FOCUS_RING}`

const BTN_SECONDARY = `inline-flex min-h-11 items-center justify-center gap-2 rounded-[2px] border border-[#BF3131]/35 bg-[#FFFBF3] px-4 py-2.5 text-sm font-semibold text-[#BF3131] transition duration-200 hover:border-[#BF3131] hover:bg-[#FEF3E2] disabled:pointer-events-none disabled:opacity-40 ${FOCUS_RING}`

function pad(value: number): string {
  return String(value).padStart(2, "0")
}

/**
 * Sampul/penutup dengan overlay PNG dari admin. Foto pertama/terakhir
 * digambar di belakang overlay; area transparan PNG memperlihatkannya.
 */
function OverlayCoverPage({
  photo,
  asset,
  meta,
  total,
}: {
  photo: string | null
  asset: FlipbookAsset
  meta: FlipbookMeta
  total: number
}) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#FFFBF3]">
      {photo ? (
        <img
          src={photo}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      <img
        src={asset.imageUrl}
        alt=""
        draggable={false}
        className="absolute inset-0 z-10 h-full w-full object-cover"
      />
      <span className="sr-only">
        {meta.dateLabel} · {total} halaman
      </span>
    </div>
  )
}

function CoverPage({
  photo,
  asset,
  meta,
  total,
}: {
  photo: string | null
  asset: FlipbookAsset | null
  meta: FlipbookMeta
  total: number
}) {
  if (asset) {
    return (
      <OverlayCoverPage
        photo={photo}
        asset={asset}
        meta={meta}
        total={total}
      />
    )
  }

  if (!photo) {
    return <PlainCoverPage meta={meta} total={total} />
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#2A0A0A]">
      <img
        src={photo}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(42,10,10,0.62)_0%,rgba(42,10,10,0.08)_35%,rgba(42,10,10,0.4)_62%,rgba(42,10,10,0.96)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(42,10,10,0.55)_0%,rgba(42,10,10,0)_35%,rgba(42,10,10,0.3)_100%)]" />
      <div className="absolute inset-[4%] border border-[#FEF3E2]/45" />

      <div className="absolute left-[6.5%] top-[7%] text-[#FEF3E2]">
        <p className="text-[clamp(10px,1.6vw,17px)] font-extrabold tracking-[0.28em]">
          PANORICAM
        </p>
        <p className="mt-1 text-[clamp(7px,1vw,11px)] font-semibold tracking-[0.38em] text-[#FEF3E2]/70">
          FLIPBOOK
        </p>
        <span className="mt-3 block h-0.5 w-12 bg-[#FEF3E2]" />
      </div>

      <div className="absolute inset-x-[6.5%] bottom-[9%]">
        <p className="text-[clamp(2rem,7vw,3.6rem)] font-extrabold leading-none tracking-[0.04em] text-[#FEF3E2] [text-shadow:0_2px_18px_rgba(0,0,0,0.45)]">
          FLIPBOOK
        </p>
        <div className="mt-3 flex items-end justify-between gap-3 border-t border-[#FEF3E2]/35 pt-2.5 text-[clamp(7px,1.05vw,12px)] font-semibold uppercase tracking-[0.16em] text-[#FEF3E2]/80">
          <span>{meta.dateLabel}</span>
          <span className="shrink-0 text-right">{total} halaman</span>
        </div>
      </div>
    </div>
  )
}

function PlainCoverPage({
  meta,
  total,
}: {
  meta: FlipbookMeta
  total: number
}) {
  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-[#FFFBF3] px-[6.5%] py-[6%] text-[#2A0A0A]">
      <div
        aria-hidden="true"
        className="absolute inset-[3.5%] border-2 border-[#BF3131]/80"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[17%] right-[8%] grid grid-cols-4 gap-1.5 opacity-25"
      >
        {Array.from({ length: 16 }).map((_, index) => (
          <span key={index} className="h-1 w-1 rounded-full bg-[#BF3131]" />
        ))}
      </div>

      <div className="relative">
        <p className="text-[clamp(10px,1.7vw,18px)] font-extrabold tracking-[0.28em] text-[#BF3131]">
          PANORICAM
        </p>
        <p className="mt-1 text-[clamp(7px,1vw,11px)] font-semibold tracking-[0.38em] text-[#7A5A50]">
          FLIPBOOK
        </p>
      </div>

      <div className="relative text-center">
        <p className="text-[clamp(1.9rem,7vw,3.6rem)] font-extrabold leading-none tracking-[0.05em] text-[#2A0A0A]">
          FLIPBOOK
        </p>
        <p className="mt-3 text-[clamp(7px,1.05vw,12px)] font-bold uppercase tracking-[0.24em] text-[#BF3131]">
          {total} halaman, satu cerita
        </p>
      </div>

      <div className="relative flex items-end justify-between gap-3 border-t border-[#BF3131]/30 pt-2.5 text-[clamp(7px,1.05vw,12px)] font-semibold uppercase tracking-[0.16em] text-[#7A5A50]">
        <span>{meta.dateLabel}</span>
        <span className="shrink-0 text-right text-[#BF3131]">PanoriCam</span>
      </div>
    </div>
  )
}

function PhotoPage({
  photo,
  asset,
}: {
  photo: string
  asset: FlipbookAsset | null
}) {
  /* Halaman 1–10 tampil penuh: hanya foto dan overlay frame, tanpa header,
   * tanggal, atau nomor halaman. */
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#FFFBF3]">
      {asset ? (
        <FramedPhoto photo={photo} asset={asset} />
      ) : (
        <img
          src={photo}
          alt=""
          draggable={false}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  )
}

function PlainBackCoverPage({
  meta,
  total,
}: {
  meta: FlipbookMeta
  total: number
}) {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[#FFFBF3] p-[5%]">
      <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-[#BF3131] px-[8%] text-center text-[#FEF3E2]">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(254,243,226,0.9)_1px,transparent_1px)] [background-size:18px_18px]"
        />
        <div className="absolute inset-[6%] border border-[#FEF3E2]/35" />

        <div className="relative">
          <p className="text-[clamp(8px,1.2vw,13px)] font-extrabold tracking-[0.32em] text-[#FEF3E2]/85">
            PANORICAM
          </p>
          <p className="mt-[10%] text-[clamp(1.25rem,3.6vw,2.1rem)] font-extrabold leading-[1.02] tracking-[-0.02em]">
            Sampai jumpa
            <br />
            di halaman berikutnya.
          </p>
          <p className="mt-[7%] text-[clamp(7px,1.05vw,11px)] font-medium uppercase tracking-[0.16em] text-[#FEF3E2]/70">
            {total} halaman · {meta.dateLabel}
          </p>
        </div>
      </div>
    </div>
  )
}

function PhotoBackCoverPage({
  photo,
  meta,
  total,
}: {
  photo: string
  meta: FlipbookMeta
  total: number
}) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#2A0A0A]">
      <img
        src={photo}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(42,10,10,0.78)_0%,rgba(42,10,10,0.34)_45%,rgba(42,10,10,0.9)_100%)]" />
      <div className="absolute inset-[4%] border border-[#FEF3E2]/45" />

      <p className="absolute inset-x-0 top-[8%] text-center text-[clamp(8px,1.2vw,13px)] font-extrabold tracking-[0.32em] text-[#FEF3E2]/85">
        PANORICAM
      </p>

      <div className="absolute inset-0 flex flex-col items-center justify-center px-[8%] text-center text-[#FEF3E2]">
        <p className="text-[clamp(1.4rem,4.2vw,2.4rem)] font-extrabold leading-[1.02] tracking-[-0.02em] [text-shadow:0_2px_18px_rgba(0,0,0,0.5)]">
          Sampai jumpa
          <br />
          di halaman berikutnya.
        </p>
      </div>

      <p className="absolute inset-x-0 bottom-[8%] text-center text-[clamp(7px,1.05vw,11px)] font-semibold uppercase tracking-[0.16em] text-[#FEF3E2]/75">
        {total} halaman · {meta.dateLabel}
      </p>
    </div>
  )
}

function BackCoverPage({
  photo,
  asset,
  meta,
  total,
}: {
  photo: string | null
  asset: FlipbookAsset | null
  meta: FlipbookMeta
  total: number
}) {
  if (asset) {
    return (
      <OverlayCoverPage
        photo={photo}
        asset={asset}
        meta={meta}
        total={total}
      />
    )
  }
  if (photo) {
    return <PhotoBackCoverPage photo={photo} meta={meta} total={total} />
  }
  return <PlainBackCoverPage meta={meta} total={total} />
}

function PageVisual({
  page,
  photos,
  meta,
  frame,
}: {
  page: BookPage
  photos: string[]
  meta: FlipbookMeta
  frame: FlipbookFrame | null
}) {
  if (page.kind === "cover") {
    return (
      <CoverPage
        photo={photos[0] ?? null}
        asset={frame?.cover ?? null}
        meta={meta}
        total={photos.length}
      />
    )
  }
  if (page.kind === "back") {
    return (
      <BackCoverPage
        photo={photos[photos.length - 1] ?? null}
        asset={frame?.back ?? null}
        meta={meta}
        total={photos.length}
      />
    )
  }
  return (
    <PhotoPage
      photo={photos[page.index]}
      asset={frame?.pages[page.index] ?? null}
    />
  )
}

function ArrowIcon({ direction }: { direction: FlipDirection }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-5 w-5 ${direction === "prev" ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export function FlipbookViewer({
  photos,
  frame,
  onRetake,
  onRestart,
}: {
  photos: string[]
  frame: FlipbookFrame | null
  onRetake: () => void
  onRestart: () => void
}) {
  const meta = useMemo(() => buildMeta(), [])
  const bookPages = useMemo<BookPage[]>(
    () => [
      { kind: "cover" },
      ...photos.map((_, index) => ({ kind: "photo" as const, index })),
      { kind: "back" },
    ],
    [photos],
  )
  const totalPages = bookPages.length

  const [current, setCurrent] = useState(0)
  const [flip, setFlip] = useState<FlipState | null>(null)
  const [autoplay, setAutoplay] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [busy, setBusy] = useState<BusyState | null>(null)

  const nonceRef = useRef(0)
  const committedRef = useRef(0)
  const toastIdRef = useRef(0)
  const swipeRef = useRef<{ x: number; y: number } | null>(null)

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration = 4000) => {
      toastIdRef.current += 1
      setToast({ id: toastIdRef.current, message, type, duration })
    },
    [],
  )

  const dismissToast = useCallback(() => setToast(null), [])

  const commitFlip = useCallback((target: FlipState) => {
    if (committedRef.current === target.nonce) {
      return
    }
    committedRef.current = target.nonce
    setCurrent(target.to)
    setFlip(null)
  }, [])

  const goNext = useCallback(() => {
    if (flip || current >= totalPages - 1) {
      return
    }
    nonceRef.current += 1
    setFlip({
      direction: "next",
      from: current,
      to: current + 1,
      nonce: nonceRef.current,
    })
  }, [current, flip, totalPages])

  const goPrev = useCallback(() => {
    if (flip || current <= 0) {
      return
    }
    nonceRef.current += 1
    setFlip({
      direction: "prev",
      from: current,
      to: current - 1,
      nonce: nonceRef.current,
    })
  }, [current, flip])

  const jumpTo = useCallback(
    (index: number) => {
      if (flip || index < 0 || index >= totalPages || index === current) {
        return
      }
      setAutoplay(false)
      setCurrent(index)
    },
    [current, flip, totalPages],
  )

  useEffect(() => {
    if (!flip) {
      return
    }
    /* Cadangan bila animationend tidak terpicu (mis. tab tidak aktif). */
    const timer = window.setTimeout(() => commitFlip(flip), 700)
    return () => window.clearTimeout(timer)
  }, [commitFlip, flip])

  useEffect(() => {
    if (!autoplay) {
      return
    }
    const timer = window.setTimeout(() => {
      if (current >= totalPages - 1) {
        setAutoplay(false)
        return
      }
      goNext()
    }, 1200)
    return () => window.clearTimeout(timer)
  }, [autoplay, current, goNext, totalPages])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return
      }
      if (event.key === "ArrowRight") {
        event.preventDefault()
        goNext()
      } else if (event.key === "ArrowLeft") {
        event.preventDefault()
        goPrev()
      } else if (event.key === " ") {
        event.preventDefault()
        setAutoplay((value) => !value)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [goNext, goPrev])

  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || !flip) {
      return
    }
    commitFlip(flip)
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    swipeRef.current = { x: event.clientX, y: event.clientY }
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = swipeRef.current
    swipeRef.current = null
    if (!start || flip) {
      return
    }
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.4) {
      return
    }
    if (dx < 0) {
      goNext()
    } else {
      goPrev()
    }
  }

  const currentLabel =
    current === 0
      ? "Sampul"
      : current === totalPages - 1
        ? "Sampul belakang"
        : `Halaman ${current} dari ${photos.length}`

  const handleDownloadPage = async () => {
    if (busy) return
    setBusy({ label: "Menyiapkan halaman...", progress: null })
    try {
      const blob =
        current === 0
          ? await createCoverPng(photos, meta, frame)
          : current === totalPages - 1
            ? await createBackCoverPng(photos, meta, frame)
            : await createPhotoPagePng(photos, meta, current - 1, frame)
      const suffix =
        current === 0
          ? "sampul"
          : current === totalPages - 1
            ? "sampul-belakang"
            : `halaman-${pad(current)}`
      downloadBlob(blob, flipbookFilename(suffix))
      showToast("Halaman flipbook tersimpan.", "success", 2500)
    } catch {
      showToast("Gagal menyiapkan halaman. Coba lagi.", "error")
    } finally {
      setBusy(null)
    }
  }

  const handleDownloadGif = async () => {
    if (busy) return
    setBusy({ label: "Menyiapkan GIF...", progress: 0 })
    try {
      const blob = await createFlipbookGif({
        photos,
        meta,
        frame,
        onProgress: (progress, label) =>
          setBusy({ label, progress: Math.min(99, progress) }),
      })
      downloadBlob(blob, flipbookGifFilename())
      showToast("GIF flipbook siap dibagikan.", "success", 3500)
    } catch {
      showToast("GIF gagal dibuat. Coba lagi.", "error")
    } finally {
      setBusy(null)
    }
  }

  const handleShare = async () => {
    if (busy) return
    setBusy({ label: "Menyiapkan file untuk dibagikan...", progress: null })
    try {
      const blob = await createContactSheetPng(photos, meta, frame)
      const file = new File([blob], flipbookFilename("flipbook"), {
        type: "image/png",
      })
      const canShare =
        typeof navigator !== "undefined" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })

      if (canShare && typeof navigator.share === "function") {
        await navigator.share({
          files: [file],
          title: "Flipbook PanoriCam",
          text: `Flipbook dari PanoriCam — ${photos.length} halaman.`,
        })
        showToast("Flipbook dibagikan.", "success", 2500)
      } else {
        downloadBlob(blob, flipbookFilename("flipbook"))
        showToast(
          "Perangkat belum mendukung bagikan langsung. File flipbook sudah diunduh.",
          "info",
          4500,
        )
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return
      }
      showToast("Gagal membagikan flipbook.", "error")
    } finally {
      setBusy(null)
    }
  }

  const baseIndex = flip
    ? flip.direction === "next"
      ? flip.to
      : flip.from
    : current
  const leafIndex = flip
    ? flip.direction === "next"
      ? flip.from
      : flip.to
    : null

  return (
    <div className="relative">
      {toast ? (
        <BoothToast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onDone={dismissToast}
        />
      ) : null}

      <div className="mb-4 flex items-center justify-end">
        <Link
          href="/fitur"
          className={`${BTN_SECONDARY} min-h-10 px-3 text-xs`}
        >
          <ArrowIcon direction="prev" />
          Kembali ke Fitur
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#BF3131]">
                Hasil flipbook
              </p>
              <h2 className="mt-1 text-2xl font-extrabold leading-tight tracking-[-0.03em] text-[#2A0A0A] sm:text-3xl">
                Siap diputar.
              </h2>
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
              {frame ? (
                <span className="border border-[#BF3131]/25 bg-[#FEF3E2] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#BF3131]">
                  {frame.name}
                </span>
              ) : null}
              <span className="border border-[#BF3131]/25 bg-[#FFFBF3] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A5A50]">
                {photos.length} frame
              </span>
            </div>
          </div>

          <div
            className="flipbook-stage mt-5 touch-pan-y select-none"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => {
              swipeRef.current = null
            }}
          >
            <div className="flipbook-book relative mx-auto aspect-[4/3] w-full max-w-[620px]">
              <div
                aria-hidden="true"
                className="absolute inset-0 translate-x-[7px] translate-y-[7px] rounded-[3px] border border-[#BF3131]/20 bg-[#FEF3E2]"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 translate-x-[3px] translate-y-[3px] rounded-[3px] border border-[#BF3131]/25 bg-[#FFFBF3]"
              />

              <div
                className="absolute inset-0 overflow-hidden rounded-[3px] shadow-[0_30px_70px_-34px_rgba(42,10,10,0.7)] ring-1 ring-[#2A0A0A]/20"
                aria-live="polite"
              >
                <PageVisual
                  page={bookPages[baseIndex]}
                  photos={photos}
                  meta={meta}
                  frame={frame}
                />
              </div>

              {flip && leafIndex !== null ? (
                <div
                  key={flip.nonce}
                  onAnimationEnd={handleAnimationEnd}
                  className={`flipbook-leaf overflow-hidden rounded-[3px] shadow-[0_26px_60px_-30px_rgba(42,10,10,0.75)] ring-1 ring-[#2A0A0A]/20 ${
                    flip.direction === "next"
                      ? "flipbook-leaf--next"
                      : "flipbook-leaf--prev"
                  }`}
                  style={{ zIndex: 3 }}
                >
                  <PageVisual
                    page={bookPages[leafIndex]}
                    photos={photos}
                    meta={meta}
                    frame={frame}
                  />
                  <div aria-hidden="true" className="flipbook-leaf-gloss" />
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goPrev}
              disabled={current <= 0 || Boolean(flip)}
              aria-label="Halaman sebelumnya"
              className={`flex h-11 w-11 items-center justify-center rounded-full border border-[#BF3131]/30 bg-[#FFFBF3] text-[#BF3131] transition hover:bg-[#BF3131] hover:text-[#FEF3E2] disabled:pointer-events-none disabled:opacity-35 ${FOCUS_RING}`}
            >
              <ArrowIcon direction="prev" />
            </button>

            <div className="min-w-0 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A5A50]">
                {currentLabel}
              </p>
              <div
                className="mt-2 flex max-w-[280px] flex-wrap items-center justify-center gap-1 sm:max-w-none"
                role="tablist"
                aria-label="Pilih halaman flipbook"
              >
                {bookPages.map((page, index) => {
                  const label =
                    page.kind === "cover"
                      ? "Sampul"
                      : page.kind === "back"
                        ? "Sampul belakang"
                        : `Halaman ${page.index + 1}`
                  const active = index === current
                  return (
                    <button
                      key={`${page.kind}-${index}`}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      aria-label={label}
                      onClick={() => jumpTo(index)}
                      className={`h-2.5 rounded-full transition-all duration-200 ${
                        active
                          ? "w-6 bg-[#BF3131]"
                          : "w-2.5 bg-[#BF3131]/25 hover:bg-[#BF3131]/50"
                      }`}
                    />
                  )
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={goNext}
              disabled={current >= totalPages - 1 || Boolean(flip)}
              aria-label="Halaman berikutnya"
              className={`flex h-11 w-11 items-center justify-center rounded-full border border-[#BF3131]/30 bg-[#FFFBF3] text-[#BF3131] transition hover:bg-[#BF3131] hover:text-[#FEF3E2] disabled:pointer-events-none disabled:opacity-35 ${FOCUS_RING}`}
            >
              <ArrowIcon direction="next" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setAutoplay((value) => !value)}
              disabled={current >= totalPages - 1 && !autoplay}
              className={BTN_SECONDARY}
            >
              {autoplay ? (
                <>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="currentColor"
                  >
                    <rect x="6" y="5" width="4" height="14" rx="0.5" />
                    <rect x="14" y="5" width="4" height="14" rx="0.5" />
                  </svg>
                  Jeda putar
                </>
              ) : (
                <>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="currentColor"
                  >
                    <path d="M8 5.5v13l11-6.5z" />
                  </svg>
                  Putar otomatis
                </>
              )}
            </button>
            <button type="button" onClick={onRetake} className={BTN_SECONDARY}>
              Rekam ulang
            </button>
            <button type="button" onClick={onRestart} className={BTN_SECONDARY}>
              Mulai baru
            </button>
          </div>

          <p className="mt-3 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-[#7A5A50]">
            Geser halaman, klik panah, atau pakai tombol ← → di keyboard.
          </p>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <div className="border border-[#BF3131]/25 bg-[#FFFBF3] p-4 shadow-[0_20px_50px_-40px_rgba(42,10,10,0.7)]">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#BF3131]">
              Bawa pulang
            </h3>
            <div className="mt-3 grid gap-2">
              <button
                type="button"
                onClick={handleDownloadPage}
                disabled={Boolean(busy)}
                className={BTN_PRIMARY}
              >
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
                  <path d="M12 4v10M8 10l4 4 4-4M5 19h14" />
                </svg>
                Unduh halaman ini
              </button>
              <button
                type="button"
                onClick={handleDownloadGif}
                disabled={Boolean(busy)}
                className={BTN_SECONDARY}
              >
                Unduh GIF flipbook
              </button>
              <button
                type="button"
                onClick={handleShare}
                disabled={Boolean(busy)}
                className={BTN_SECONDARY}
              >
                Bagikan flipbook
              </button>
            </div>

            {busy ? (
              <div className="mt-3" role="status" aria-live="polite">
                <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7A5A50]">
                  <span>{busy.label}</span>
                  {busy.progress !== null ? (
                    <span className="tabular-nums">{busy.progress}%</span>
                  ) : null}
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#BF3131]/15">
                  <div
                    className={`h-full rounded-full bg-[#BF3131] transition-all duration-300 ${
                      busy.progress === null ? "w-1/3 animate-pulse" : ""
                    }`}
                    style={
                      busy.progress === null
                        ? undefined
                        : { width: `${busy.progress}%` }
                    }
                  />
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xs leading-relaxed text-[#7A5A50]">
                Unduh halaman aktif atau GIF beranimasi. Semua diproses di
                perangkatmu.
              </p>
            )}
          </div>

          {photos.length > 1 ? (
            <div className="border border-[#BF3131]/20 bg-[#FFFBF3]/70 p-3">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7A5A50]">
                Lompat ke halaman
              </h3>
              <div className="mt-2.5 grid grid-cols-4 gap-2">
                {photos.map((photo, index) => {
                  const active = current === index + 1
                  const pageAsset = frame?.pages[index] ?? null
                  return (
                    <button
                      key={`${photo.slice(-16)}-${index}`}
                      type="button"
                      onClick={() => jumpTo(index + 1)}
                      aria-label={`Buka halaman ${index + 1}`}
                      aria-current={active ? "page" : undefined}
                      className={`relative aspect-[4/3] overflow-hidden rounded-[2px] border-2 transition ${
                        active
                          ? "border-[#BF3131] shadow-[0_0_0_2px_rgba(191,49,49,0.2)]"
                          : "border-transparent opacity-80 hover:opacity-100"
                      }`}
                    >
                      {pageAsset ? (
                        <FramedPhoto photo={photo} asset={pageAsset} />
                      ) : (
                        <img
                          src={photo}
                          alt=""
                          draggable={false}
                          className="h-full w-full object-cover"
                        />
                      )}
                      <span className="absolute bottom-0 left-0 bg-[#2A0A0A]/75 px-1 text-[8px] font-bold tabular-nums text-[#FEF3E2]">
                        {pad(index + 1)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
