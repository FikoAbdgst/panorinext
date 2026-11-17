"use client"

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react"

import {
  BoothToast,
  type ToastType,
} from "@/components/public/booth/booth-toast"
import { useFlipbookStage } from "@/components/public/flipbook/flipbook-stage"
import { FlipbookViewer } from "@/components/public/flipbook/flipbook-viewer"
import { FlipbookWizard } from "@/components/public/flipbook/flipbook-wizard"
import { FramedPhoto } from "@/components/public/flipbook/framed-photo"
import { FLIPBOOK_PAGE_COUNT } from "@/lib/constants"
import { FLIPBOOK_FRAME_ASPECT } from "@/lib/flipbook/constants"
import type { FlipbookFrame } from "@/lib/flipbook/types"

type FacingMode = "user" | "environment"

type ToastState = {
  id: number
  message: string
  type: ToastType
  duration: number
}

const COUNTDOWN_OPTIONS = [3, 5, 10, 0] as const
const CAPTURE_MAX_DIMENSION = 1920
/** Jeda antar frame saat mode rekam berurutan. */
const RECORD_INTERVAL_MS = 650

const FILTER_OPTIONS = [
  { value: "none", label: "Asli" },
  { value: "grayscale(100%)", label: "Mono" },
  { value: "sepia(100%)", label: "Sepia" },
  { value: "contrast(150%)", label: "Kontras" },
  { value: "brightness(120%)", label: "Cerah" },
] as const

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"

const BTN_PRIMARY = `inline-flex min-h-12 items-center justify-center gap-2 rounded-[2px] bg-[#BF3131] px-5 py-3 text-sm font-semibold text-[#FEF3E2] shadow-[3px_3px_0_#7A1C1C] transition duration-200 hover:-translate-y-0.5 hover:bg-[#A02828] hover:shadow-[4px_4px_0_#7A1C1C] active:translate-y-0 disabled:pointer-events-none disabled:opacity-40 ${FOCUS_RING}`

const BTN_SECONDARY = `inline-flex min-h-11 items-center justify-center gap-2 rounded-[2px] border border-[#BF3131]/35 bg-[#FFFBF3] px-4 py-2.5 text-sm font-semibold text-[#BF3131] transition duration-200 hover:border-[#BF3131] hover:bg-[#FEF3E2] disabled:pointer-events-none disabled:opacity-40 ${FOCUS_RING}`

const BTN_GHOST = `inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[2px] px-2.5 text-xs font-semibold text-[#7A3E32] transition hover:bg-[#BF3131]/8 hover:text-[#2A0A0A] disabled:pointer-events-none disabled:opacity-40 ${FOCUS_RING}`

const ICON_BUTTON = `flex h-11 w-11 items-center justify-center rounded-full bg-[#FEF3E2]/90 text-[#2A0A0A] shadow-[0_6px_18px_-10px_rgba(42,10,10,0.7)] backdrop-blur transition hover:bg-[#FEF3E2] disabled:pointer-events-none disabled:opacity-45 ${FOCUS_RING}`

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false
  }
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

function pad(value: number): string {
  return String(value).padStart(2, "0")
}

function findNextEmpty(
  list: Array<string | null>,
  from: number,
): number | null {
  for (let step = 1; step <= list.length; step += 1) {
    const index = (from + step) % list.length
    if (!list[index]) {
      return index
    }
  }
  return null
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

function RecordIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="currentColor"
    >
      <circle cx="12" cy="12" r="6" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="currentColor"
    >
      <rect x="6" y="6" width="12" height="12" rx="1" />
    </svg>
  )
}

function MirrorIcon() {
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
      <path d="M12 3v18" />
      <path d="M8 7L4 12l4 5" />
      <path d="M16 7l4 5-4 5" />
    </svg>
  )
}

function SwapIcon() {
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
      <path d="M4 9a7 7 0 0112-3l2 2" />
      <path d="M18 4v4h-4" />
      <path d="M20 15a7 7 0 01-12 3l-2-2" />
      <path d="M6 20v-4h4" />
    </svg>
  )
}

export function FlipbookClient({
  frames,
}: {
  frames: FlipbookFrame[]
}) {
  const { stage, setStage } = useFlipbookStage()
  const [countdownSetting, setCountdownSetting] = useState<number>(3)
  const [filter, setFilter] = useState("none")
  const [isMirrored, setIsMirrored] = useState(true)
  const [facingMode, setFacingMode] = useState<FacingMode>("user")
  const [selectedFrameId, setSelectedFrameId] = useState<number | null>(
    frames[0]?.id ?? null,
  )

  const [photos, setPhotos] = useState<Array<string | null>>(() =>
    Array.from({ length: FLIPBOOK_PAGE_COUNT }, () => null),
  )
  const [activeIndex, setActiveIndex] = useState(0)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [countdownDisplay, setCountdownDisplay] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [shutterPulse, setShutterPulse] = useState(0)

  const [toast, setToast] = useState<ToastState | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const photosRef = useRef<Array<string | null>>(photos)
  const captureRunRef = useRef(0)
  const toastIdRef = useRef(0)
  const resultDialogRef = useRef<HTMLDivElement | null>(null)
  const bookTriggerRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  useEffect(() => {
    const root = document.documentElement
    const fullscreen = stage === "capture" || stage === "book"
    if (!fullscreen) {
      delete root.dataset.flipbookCapture
      return
    }
    /* Navbar & hero disembunyikan saat kamera dan hasil flipbook aktif. */
    root.dataset.flipbookCapture = "true"
    document
      .getElementById("flipbook-studio")
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
    return () => {
      delete root.dataset.flipbookCapture
    }
  }, [stage])

  useEffect(() => {
    if (stage !== "book") {
      return
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setStage("capture")
      }
    }
    const previousOverflow = document.body.style.overflow
    const trigger = bookTriggerRef.current
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKeyDown)
    resultDialogRef.current?.focus()
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
      trigger?.focus()
    }
  }, [stage, setStage])

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration = 4000) => {
      toastIdRef.current += 1
      setToast({ id: toastIdRef.current, message, type, duration })
    },
    [],
  )

  const dismissToast = useCallback(() => setToast(null), [])

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  const attachStream = useCallback(
    async (stream: MediaStream, mode: FacingMode) => {
      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        try {
          await video.play()
        } catch {
          /* Autoplay bisa ditunda browser; elemen tetap menampilkan frame. */
        }
      }
      setFacingMode(mode)
      setCameraError(null)
    },
    [],
  )

  const startWebcam = useCallback(
    async (mode: FacingMode) => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices) {
        setCameraError("Kamera tidak tersedia di perangkat ini.")
        return
      }

      const requestStream = async (
        target: FacingMode,
      ): Promise<MediaStream | null> => {
        const ios = isIosDevice()
        try {
          return await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: ios ? 1920 : 2560 },
              height: { ideal: ios ? 1080 : 1440 },
              aspectRatio: ios ? { exact: 4 / 3 } : { ideal: 4 / 3 },
              facingMode: target,
              frameRate: { ideal: 30, max: 60 },
            },
            audio: false,
          })
        } catch {
          if (!ios) return null
          try {
            return await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: target,
                width: { min: 640, ideal: 1280 },
                height: { min: 480, ideal: 720 },
              },
              audio: false,
            })
          } catch {
            return null
          }
        }
      }

      stopStream()

      const stream =
        (await requestStream(mode)) ??
        (mode === "environment" ? await requestStream("user") : null)

      if (!stream) {
        setCameraError(
          "Gagal mengakses kamera. Izinkan kamera di browser, lalu tekan Coba lagi.",
        )
        return
      }

      await attachStream(stream, mode)
    },
    [attachStream, stopStream],
  )

  useEffect(() => {
    if (stage !== "capture") {
      return
    }
    /* Ditunda satu tick agar setState pertama tidak terjadi di badan effect. */
    const timer = window.setTimeout(() => {
      void startWebcam("user")
    }, 0)
    return () => {
      window.clearTimeout(timer)
      captureRunRef.current += 1
      stopStream()
      setIsCapturing(false)
      setIsRecording(false)
      setCountdownDisplay(null)
    }
  }, [stage, startWebcam, stopStream])

  const takenCount = photos.filter(Boolean).length
  const allFilled = takenCount === photos.length
  const selectedFrame =
    frames.find((frame) => frame.id === selectedFrameId) ?? null
  const activePageAsset = selectedFrame?.pages[activeIndex] ?? null
  const activeFrameRatio =
    activePageAsset && activePageAsset.width > 0 && activePageAsset.height > 0
      ? activePageAsset.width / activePageAsset.height
      : FLIPBOOK_FRAME_ASPECT

  const waitCountdown = useCallback(
    async (token: number): Promise<boolean> => {
      if (countdownSetting === 0) {
        return true
      }
      for (let remaining = countdownSetting; remaining > 0; remaining -= 1) {
        if (token !== captureRunRef.current) {
          return false
        }
        setCountdownDisplay(String(remaining))
        await sleep(1000)
      }
      if (token !== captureRunRef.current) {
        return false
      }
      setCountdownDisplay(null)
      return true
    },
    [countdownSetting],
  )

  const captureAt = useCallback(
    (index: number): boolean => {
      const video = videoRef.current
      if (
        !video ||
        !Number.isFinite(index) ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        return false
      }

      const scale = Math.min(
        1,
        CAPTURE_MAX_DIMENSION / Math.max(video.videoWidth, video.videoHeight),
      )
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(video.videoWidth * scale)
      canvas.height = Math.round(video.videoHeight * scale)
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        return false
      }

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
      ctx.save()
      if (isMirrored) {
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
      }
      ctx.filter = filter
      ctx.drawImage(
        video,
        0,
        0,
        video.videoWidth,
        video.videoHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      )
      ctx.restore()

      const dataUrl = canvas.toDataURL("image/png")
      const next = [...photosRef.current]
      next[index] = dataUrl
      photosRef.current = next
      setPhotos(next)
      /* Animasi cekrek singkat di setiap frame, termasuk mode rekam. */
      setShutterPulse((value) => value + 1)
      return true
    },
    [filter, isMirrored],
  )

  const handleRecord = async () => {
    if (isCapturing) {
      return
    }
    const startIndex = photosRef.current.findIndex((photo) => !photo)
    if (startIndex === -1) {
      showToast("Semua halaman sudah terisi.", "info")
      return
    }

    setIsCapturing(true)
    setIsRecording(true)
    const token = ++captureRunRef.current
    let captured = 0
    try {
      const ready = await waitCountdown(token)
      if (!ready) {
        return
      }

      let index: number | null = startIndex
      while (index !== null) {
        if (token !== captureRunRef.current) {
          return
        }
        setActiveIndex(index)
        await sleep(120)
        if (token !== captureRunRef.current) {
          return
        }
        if (!captureAt(index)) {
          showToast("Kamera belum siap. Rekaman dihentikan.", "warning")
          return
        }
        captured += 1
        await sleep(RECORD_INTERVAL_MS)
        if (token !== captureRunRef.current) {
          return
        }
        index = findNextEmpty(photosRef.current, index)
      }

      showToast(
        `Rekaman selesai. ${captured} frame masuk ke flipbook.`,
        "success",
        4000,
      )
    } finally {
      if (token === captureRunRef.current) {
        setIsCapturing(false)
        setIsRecording(false)
        setCountdownDisplay(null)
      }
    }
  }

  const stopRecording = () => {
    captureRunRef.current += 1
    setIsCapturing(false)
    setIsRecording(false)
    setCountdownDisplay(null)
    showToast("Rekaman dihentikan.", "info", 2500)
  }

  const clearAll = () => {
    if (isCapturing) return
    captureRunRef.current += 1
    const empty = Array.from({ length: photos.length }, () => null)
    photosRef.current = empty
    setPhotos(empty)
    setActiveIndex(0)
    setIsCapturing(false)
    setIsRecording(false)
    setCountdownDisplay(null)
    showToast("Semua halaman dikosongkan.", "info", 2500)
  }

  const handleRetake = () => {
    captureRunRef.current += 1
    const empty = Array.from({ length: photos.length }, () => null)
    photosRef.current = empty
    setPhotos(empty)
    setActiveIndex(0)
    setIsCapturing(false)
    setIsRecording(false)
    setCountdownDisplay(null)
    setStage("capture")
    showToast(
      "Halaman dikosongkan. Tekan rekam untuk merekam ulang seluruh video.",
      "info",
      4500,
    )
  }

  /** Kembali ke pilih frame tanpa membuang frame yang sudah direkam. */
  const handleBackStage = () => {
    if (stage !== "capture") {
      return
    }
    captureRunRef.current += 1
    setIsCapturing(false)
    setIsRecording(false)
    setCountdownDisplay(null)
    setStage("frame")
  }

  const activeLabel = `Halaman ${pad(activeIndex + 1)}`

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

      {stage === "frame" ? (
        <FlipbookWizard
          frames={frames}
          selectedFrameId={selectedFrameId}
          onSelectFrame={setSelectedFrameId}
          onStartCapture={() => {
            const firstEmpty = photos.findIndex((photo) => !photo)
            setActiveIndex(firstEmpty === -1 ? 0 : firstEmpty)
            setStage("capture")
          }}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
          <div className="mx-auto w-full min-w-0 max-w-3xl lg:mx-0 lg:max-w-none">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleBackStage}
                aria-label="Kembali ke pilih frame"
                className={`${BTN_GHOST} -ml-1.5`}
              >
                <ArrowLeftIcon />
                Kembali
              </button>

              <div className="flex items-center gap-1">
                <span className="pl-1 text-[10px] font-bold uppercase tracking-[0.18em] tabular-nums text-[#7A5A50]">
                  {takenCount}/{photos.length} terisi
                </span>
                {takenCount > 0 && !allFilled && !isRecording ? (
                  <button
                    type="button"
                    onClick={clearAll}
                    className={`${BTN_GHOST} ml-1`}
                  >
                    Kosongkan
                  </button>
                ) : null}
              </div>
            </div>

            <div className="relative mt-3 overflow-hidden rounded-[3px] border border-[#BF3131]/30 bg-[#2A0A0A] shadow-[0_28px_60px_-38px_rgba(42,10,10,0.8)]">
              <div
                className="relative w-full"
                style={{ aspectRatio: `${activeFrameRatio}` }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                  style={{
                    transform: isMirrored ? "scaleX(-1)" : undefined,
                    filter,
                  }}
                />

                {!cameraError && activePageAsset ? (
                  <img
                    src={activePageAsset.imageUrl}
                    alt=""
                    draggable={false}
                    className="pointer-events-none absolute inset-0 z-10 h-full w-full object-cover"
                  />
                ) : null}

                {cameraError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#2A0A0A] p-6 text-center text-[#FEF3E2]">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#FEF3E2]/30">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4 8h3l1.6-2h6.8L17 8h3v10H4z" />
                        <path d="M4 4l16 16" />
                      </svg>
                    </span>
                    <p className="text-sm font-bold">Kamera belum aktif</p>
                    <p className="max-w-xs text-xs leading-relaxed text-[#FEF3E2]/75">
                      {cameraError}
                    </p>
                    <div className="mt-1 flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          void startWebcam(facingMode)
                        }}
                        className="inline-flex min-h-11 items-center justify-center rounded-[2px] bg-[#FEF3E2] px-4 py-2 text-xs font-bold text-[#BF3131] transition hover:bg-white"
                      >
                        Coba lagi
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-2">
                  <span className="rounded-[2px] bg-[#FEF3E2]/90 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#2A0A0A]">
                    {activeLabel}
                  </span>
                  {isRecording ? (
                    <span className="inline-flex items-center gap-1.5 rounded-[2px] bg-[#BF3131] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#FEF3E2]">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FEF3E2]" />
                      REC
                    </span>
                  ) : null}
                </div>

                {isRecording ? (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="absolute right-3 top-3 z-20 inline-flex min-h-11 items-center gap-1.5 rounded-[2px] bg-[#BF3131] px-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#FEF3E2] shadow-[0_8px_20px_-10px_rgba(0,0,0,0.8)] transition hover:bg-[#A02828] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FEF3E2]"
                  >
                    <StopIcon />
                    <span className="hidden sm:inline">Stop</span>
                  </button>
                ) : null}

                {countdownDisplay ? (
                  <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#2A0A0A]/20">
                    <span className="text-[clamp(4.5rem,16vw,9rem)] font-extrabold leading-none text-[#FEF3E2] [text-shadow:0_4px_30px_rgba(0,0,0,0.55)]">
                      {countdownDisplay}
                    </span>
                  </div>
                ) : null}

                {shutterPulse > 0 ? (
                  <div
                    key={shutterPulse}
                    aria-hidden="true"
                    className="flipbook-shutter pointer-events-none absolute inset-0 z-40 bg-white"
                  />
                ) : null}

                {!cameraError ? (
                  <div className="absolute inset-x-0 bottom-0 z-20 bg-[linear-gradient(0deg,rgba(42,10,10,0.8)_0%,rgba(42,10,10,0)_100%)] px-4 pb-3.5 pt-10">
                    <div className="flex items-end justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsMirrored((value) => !value)}
                          aria-pressed={isMirrored}
                          aria-label="Balik tampilan kamera"
                          title="Balik tampilan"
                          className={ICON_BUTTON}
                        >
                          <MirrorIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void startWebcam(
                              facingMode === "user" ? "environment" : "user",
                            )
                          }}
                          aria-label="Ganti kamera depan atau belakang"
                          title="Ganti kamera"
                          className={ICON_BUTTON}
                        >
                          <SwapIcon />
                        </button>
                      </div>

                      <div className="flex flex-col items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (isRecording) {
                              stopRecording()
                              return
                            }
                            void handleRecord()
                          }}
                          disabled={!isRecording && (isCapturing || allFilled)}
                          aria-label={
                            isRecording
                              ? "Stop rekaman"
                              : "Rekam semua halaman sekaligus"
                          }
                          className={`flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-[#FEF3E2] bg-[#BF3131] text-[#FEF3E2] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)] transition duration-200 hover:scale-105 hover:bg-[#A02828] active:scale-95 disabled:pointer-events-none disabled:opacity-50 ${FOCUS_RING}`}
                        >
                          {isRecording ? <StopIcon /> : <RecordIcon />}
                        </button>
                        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#FEF3E2]/85">
                          {isRecording
                            ? "Stop"
                            : isCapturing
                              ? "Menyiapkan..."
                              : "Rekam"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:gap-x-5">
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                <span className="mr-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A5A50] sm:mr-1">
                  Filter
                </span>
                {FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={filter === option.value}
                    onClick={() => setFilter(option.value)}
                    className={`inline-flex min-h-11 items-center justify-center rounded-full border px-2.5 text-[11px] font-semibold transition sm:px-3 ${
                      filter === option.value
                        ? "border-[#BF3131] bg-[#BF3131] text-[#FEF3E2]"
                        : "border-[#BF3131]/25 bg-[#FFFBF3] text-[#7A3E32] hover:border-[#BF3131]/60"
                    } ${FOCUS_RING}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                <span className="mr-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A5A50] sm:mr-1">
                  Timer
                </span>
                {COUNTDOWN_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={countdownSetting === option}
                    onClick={() => setCountdownSetting(option)}
                    className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border px-2.5 text-[11px] font-semibold tabular-nums transition sm:px-3 ${
                      countdownSetting === option
                        ? "border-[#BF3131] bg-[#BF3131] text-[#FEF3E2]"
                        : "border-[#BF3131]/25 bg-[#FFFBF3] text-[#7A3E32] hover:border-[#BF3131]/60"
                    } ${FOCUS_RING}`}
                  >
                    {option === 0 ? "Off" : `${option}s`}
                  </button>
                ))}
              </div>
            </div>

            {!allFilled ? (
              <p className="mt-3 text-[11px] leading-relaxed text-[#7A5A50]">
                Tekan tombol rekam untuk mengisi {photos.length} frame sekaligus.
              </p>
            ) : null}
          </div>

          <aside className="min-w-0 space-y-3">
            <div className="border border-[#BF3131]/25 bg-[#FFFBF3] p-3 sm:p-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7A5A50]">
                Hasil
              </h3>

              <div className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-5 sm:gap-2 lg:grid-cols-3">
                {photos.map((photo, index) => {
                  const pageAsset = selectedFrame?.pages[index] ?? null
                  return (
                    <div
                      key={index}
                      className="relative aspect-[4/3] overflow-hidden rounded-[2px] border border-[#BF3131]/20 bg-[#FEF3E2]/70"
                    >
                      {photo ? (
                        pageAsset ? (
                          <FramedPhoto photo={photo} asset={pageAsset} />
                        ) : (
                          <img
                            src={photo}
                            alt={`Halaman ${index + 1}`}
                            draggable={false}
                            className="h-full w-full object-cover"
                          />
                        )
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[11px] font-extrabold tabular-nums text-[#BF3131]/40">
                          {pad(index + 1)}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {allFilled ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <button
                    ref={bookTriggerRef}
                    type="button"
                    onClick={() => setStage("book")}
                    className={BTN_PRIMARY}
                  >
                    Lihat flipbook
                  </button>
                  <button
                    type="button"
                    onClick={handleRetake}
                    className={BTN_SECONDARY}
                  >
                    Rekam ulang
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-[11px] leading-relaxed text-[#7A5A50]">
                  Hasil muncul setelah {photos.length} frame terisi.
                </p>
              )}
            </div>
          </aside>
        </div>
      )}

      {stage === "book" ? (
        <div
          ref={resultDialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="flipbook-result-title"
          tabIndex={-1}
          className="fixed inset-0 z-[80] flex flex-col bg-[#FEF3E2] outline-none"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#BF3131]/20 px-4 py-2.5 sm:px-6">
            <p
              id="flipbook-result-title"
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7A5A50]"
            >
              Hasil flipbook
            </p>
            <button
              type="button"
              onClick={() => setStage("capture")}
              className={`${BTN_SECONDARY} min-h-11 px-3 text-xs`}
            >
              Tutup
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-5 sm:px-6 sm:pb-12">
              <FlipbookViewer
                photos={photos.filter((photo): photo is string => Boolean(photo))}
                frame={selectedFrame}
                onRetake={handleRetake}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
