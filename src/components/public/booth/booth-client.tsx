"use client"

/* eslint-disable @next/next/no-img-element */

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import {
  BoothToast,
  type ToastType,
} from "@/components/public/booth/booth-toast"
import {
  CropModal,
  type CropRequest,
} from "@/components/public/booth/crop-modal"
import { WelcomeModal } from "@/components/public/booth/welcome-modal"
import { useSingleSession } from "@/lib/booth/single-session"
import { STORAGE_BUCKETS } from "@/lib/constants"
import { composeStrip } from "@/lib/frames/compose-strip"
import { getCoverSourceRect } from "@/lib/frames/geometry"
import { loadImage } from "@/lib/frames/image"
import type { FrameSlot } from "@/lib/frames/types"
import { createClient } from "@/lib/supabase/client"

export type BoothFrame = {
  id: number
  name: string
  /** URL publik overlay PNG (frame.frames). */
  imageUrl: string | null
  width: number
  height: number
  slots: FrameSlot[]
  isFree: boolean
}

type ToastState = {
  id: number
  message: string
  type: ToastType
  duration: number
}

const COUNTDOWN_OPTIONS = [3, 5, 10, 0]
const TESTIMONI_EMOJIS = ["😊", "😍", "🤩", "😎", "🥰"]

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

const BTN_SECONDARY = `inline-flex min-h-12 items-center justify-center gap-2 rounded-[2px] border border-[#BF3131]/35 bg-[#FFFBF3]/70 px-5 py-3 text-sm font-semibold text-[#BF3131] transition duration-200 hover:bg-[#FFFBF3] disabled:pointer-events-none disabled:opacity-40 ${FOCUS_RING}`

const BTN_GHOST = `inline-flex min-h-11 items-center justify-center gap-2 rounded-[2px] px-4 py-2.5 text-sm font-semibold text-[#7A3E32] transition duration-200 hover:bg-[#BF3131]/8 hover:text-[#2A0A0A] disabled:pointer-events-none disabled:opacity-40 ${FOCUS_RING}`

const MODAL_OVERLAY =
  "fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-[#2A0A0A]/65 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"

const MODAL_CARD =
  "booth-sheet relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[16px] border border-[#BF3131]/25 bg-[#FFFBF3] p-5 shadow-[0_-18px_50px_-30px_rgba(42,10,10,0.6)] sm:rounded-[3px] sm:p-7 sm:shadow-[0_24px_60px_-30px_rgba(42,10,10,0.55)]"

const MODAL_CLOSE = `absolute right-2.5 top-2.5 flex h-11 w-11 items-center justify-center rounded-[2px] text-[#7A5A50] transition hover:bg-[#BF3131]/8 hover:text-[#2A0A0A] ${FOCUS_RING}`

const INPUT_CLASS = `min-h-11 w-full rounded-[2px] border border-[#BF3131]/30 bg-[#FFFBF3] px-3 py-2.5 text-sm text-[#2A0A0A] placeholder:text-[#9A7568] transition focus:border-[#BF3131] focus:outline-none focus:ring-2 focus:ring-[#BF3131]/20`

type IconName =
  | "auto"
  | "back"
  | "camera"
  | "check"
  | "close"
  | "download"
  | "film"
  | "flash"
  | "help"
  | "image"
  | "lock"
  | "mail"
  | "mirror"
  | "reset"
  | "share"
  | "sparkle"
  | "star"
  | "timer"
  | "upload"

const ICON_PATHS: Record<IconName, ReactNode> = {
  auto: (
    <>
      <path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z" />
      <path d="M18.5 15.5l.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7z" />
    </>
  ),
  back: <path d="M15 18l-6-6 6-6" />,
  camera: (
    <>
      <path d="M4 8.5h3l1.5-2h7L17 8.5h3V19H4z" />
      <circle cx="12" cy="13.5" r="3.2" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L20 7" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  download: (
    <>
      <path d="M12 4v11" />
      <path d="M7.5 10.5L12 15l4.5-4.5" />
      <path d="M4 19h16" />
    </>
  ),
  film: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <path d="M7.5 4v16M16.5 4v16M3 9h4.5M3 15h4.5M16.5 9H21M16.5 15H21" />
    </>
  ),
  flash: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.2 9.2a2.8 2.8 0 015.5.9c0 1.9-2.7 2.2-2.7 4" />
      <circle cx="12" cy="17.6" r="0.7" fill="currentColor" stroke="none" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M4 17l5-5 4 4 3-3 4 4" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="10" rx="1.5" />
      <path d="M8 10V7a4 4 0 018 0v3" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3.5 7l8.5 6 8.5-6" />
    </>
  ),
  mirror: (
    <>
      <path d="M12 3v18" />
      <path d="M9 7L4.5 12 9 17" />
      <path d="M15 7l4.5 5L15 17" />
    </>
  ),
  reset: (
    <>
      <path d="M4 4v6h6" />
      <path d="M4.6 14a8 8 0 103-9.5L4 10" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" />
    </>
  ),
  sparkle: (
    <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z" />
  ),
  star: (
    <path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />
  ),
  timer: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 1.5M9 2h6" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4" />
      <path d="M7.5 8.5L12 4l4.5 4.5" />
      <path d="M4 17v3h16v-3" />
    </>
  ),
}

function Icon({
  name,
  className = "h-5 w-5",
  filled = false,
}: {
  name: IconName
  className?: string
  filled?: boolean
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICON_PATHS[name]}
    </svg>
  )
}

const PANEL_WIDTH = 190
const PANEL_MAX_HEIGHT = 500
const CAPTURE_OUTPUT_WIDTH = 1200
const STRIP_EXPORT_WIDTH = 1080
const GIF_WIDTH = 1080
const GIF_HEIGHT = 810
const FRAME_BACKGROUND = "#FEF3E2"

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
}

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  )
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, payload] = dataUrl.split(",")
  const mime = header.slice(header.indexOf(":") + 1, header.indexOf(";"))
  const binary = atob(payload)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

function triggerDownload(href: string, filename: string): void {
  const link = document.createElement("a")
  link.href = href
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function isHeicFile(file: File): boolean {
  const name = file.name.toLowerCase()
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  )
}

async function prepareImageFile(file: File): Promise<Blob> {
  if (!isHeicFile(file)) {
    return file
  }
  const { default: heic2any } = await import("heic2any")
  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.9,
  })
  return Array.isArray(result) ? result[0] : result
}

function fileToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Gagal membaca file"))
    reader.readAsDataURL(blob)
  })
}

export function BoothClient({
  frame,
  orderId,
  accessExpiresAt,
}: {
  frame: BoothFrame
  orderId: string | null
  accessExpiresAt: string | null
}) {
  const slots = frame.slots
  const totalSlots = slots.length

  const [photos, setPhotos] = useState<Array<string | null>>(() =>
    slots.map(() => null),
  )
  const [isMirrored, setIsMirrored] = useState(false)
  const [filter, setFilter] = useState("none")
  const [countdownSetting, setCountdownSetting] = useState(3)
  const [countdownDisplay, setCountdownDisplay] = useState<string | null>(null)
  const [isFlashEnabled, setIsFlashEnabled] = useState(false)
  const [isFlashVisible, setIsFlashVisible] = useState(false)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")
  const [isCapturing, setIsCapturing] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  const [retakeIndex, setRetakeIndex] = useState<number | null>(null)
  const [revealedSlot, setRevealedSlot] = useState<number | null>(null)
  const [isResetOpen, setIsResetOpen] = useState(false)

  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isComposing, setIsComposing] = useState(false)

  const [gifProgress, setGifProgress] = useState({
    percentage: 0,
    text: "Initializing...",
  })
  const [isGifLoading, setIsGifLoading] = useState(false)

  const [isEmailOpen, setIsEmailOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [driveProgress, setDriveProgress] = useState({
    percentage: 0,
    text: "Mempersiapkan upload...",
  })

  const [isTestimoniOpen, setIsTestimoniOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [emoji, setEmoji] = useState("")
  const [testimoniName, setTestimoniName] = useState("")
  const [testimoniMessage, setTestimoniMessage] = useState("")
  const [testimoniConsent, setTestimoniConsent] = useState(false)
  const [isSubmittingTestimoni, setIsSubmittingTestimoni] = useState(false)

  const [hasGif, setHasGif] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false)
  const [isUploadSlotOpen, setIsUploadSlotOpen] = useState(false)
  const [crop, setCrop] = useState<CropRequest | null>(null)
  const [isAutoCaptureEnabled, setIsAutoCaptureEnabled] = useState(false)
  const [sessionAlert, setSessionAlert] = useState<null | "takeover">(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const countdownTimerRef = useRef<number | null>(null)
  const gifBlobRef = useRef<Blob | null>(null)
  const hasShownTestimoniRef = useRef(false)
  const toastIdRef = useRef(0)
  const photosRef = useRef<Array<string | null>>(photos)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const pendingFileRef = useRef<File | null>(null)
  const isAutoCapturingRef = useRef(false)
  const isSendingEmailRef = useRef(false)

  const router = useRouter()

  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  const { blocked, forceNewSession } = useSingleSession({
    enabled: !frame.isFree,
    orderId,
    frameId: frame.id,
    onTakeover: () => setSessionAlert("takeover"),
  })

  const goToMainMenu = useCallback(() => {
    router.push("/")
  }, [router])

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem("panoricam-booth-intro") === "seen") {
        return
      }
    } catch {
      return
    }
    const startTimer = window.setTimeout(() => {
      setIsWelcomeOpen(true)
    }, 500)
    return () => window.clearTimeout(startTimer)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => setIsMobile(isMobileDevice()), 0)
    return () => window.clearTimeout(timer)
  }, [])

  const closeWelcome = useCallback(() => {
    setIsWelcomeOpen(false)
    try {
      window.sessionStorage.setItem("panoricam-booth-intro", "seen")
    } catch {
      return
    }
  }, [])

  useEffect(() => {
    if (!accessExpiresAt) return

    const expiresAt = new Date(accessExpiresAt).getTime()
    if (!Number.isFinite(expiresAt)) return

    let timer: number | null = null

    const scheduleExpiryCheck = () => {
      const remaining = expiresAt - Date.now()
      if (remaining <= 0) {
        router.replace("/premium")
        return
      }

      timer = window.setTimeout(
        scheduleExpiryCheck,
        Math.min(remaining, 60_000),
      )
    }

    scheduleExpiryCheck()

    return () => {
      if (timer !== null) window.clearTimeout(timer)
    }
  }, [accessExpiresAt, router])

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration = 4000) => {
      toastIdRef.current += 1
      setToast({ id: toastIdRef.current, message, type, duration })
    },
    [],
  )

  const dismissToast = useCallback(() => {
    setToast(null)
  }, [])

  const scale = useMemo(
    () => Math.min(PANEL_WIDTH / frame.width, PANEL_MAX_HEIGHT / frame.height),
    [frame.height, frame.width],
  )
  const panelWidth = Math.round(frame.width * scale)
  const panelHeight = Math.round(frame.height * scale)

  const takenCount = photos.filter(Boolean).length
  const allPhotosTaken = takenCount === totalSlots
  const showFlashToggle =
    facingMode === "user" || (isMobile && facingMode === "environment")
  /* Flash hanya berlaku saat tombolnya tampil: di Laravel, menyembunyikan tombol
   * flash saat berpindah ke kamera belakang desktop juga mematikan flash. */
  const flashEnabled = showFlashToggle && isFlashEnabled

  /* --- Kamera ------------------------------------------------------------ */

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  const attachStream = useCallback(
    async (stream: MediaStream, mode: "user" | "environment") => {
      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        try {
          await video.play()
        } catch {
          /* putar otomatis bisa ditunda browser; elemen tetap menampilkan frame */
        }
      }
      setFacingMode(mode)
      setCameraError(null)
    },
    [],
  )

  const startWebcam = useCallback(
    async (mode: "user" | "environment") => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices) {
        setCameraError("Kamera tidak tersedia di perangkat ini.")
        return
      }

      const requestStream = async (
        target: "user" | "environment",
      ): Promise<MediaStream | null> => {
        const ios = isIosDevice()
        try {
          return await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: ios ? 1280 : 1920 },
              height: { ideal: ios ? 720 : 1080 },
              aspectRatio: ios ? { exact: 4 / 3 } : { ideal: 4 / 3 },
              facingMode: target,
              frameRate: { ideal: ios ? 24 : 30, max: ios ? 30 : 60 },
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
    /* Ditunda satu tick agar pemanggilan setState pertama tidak terjadi di dalam
     * badan effect (aturan react-hooks/set-state-in-effect). */
    const startTimer = window.setTimeout(() => {
      void startWebcam("user")
    }, 0)
    return () => {
      window.clearTimeout(startTimer)
      stopStream()
      if (countdownTimerRef.current !== null) {
        window.clearInterval(countdownTimerRef.current)
      }
    }
  }, [startWebcam, stopStream])

  /* --- Tangkap foto ------------------------------------------------------ */

  const triggerNativeFlash = useCallback(async (): Promise<boolean> => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return false
    try {
      const capabilities = track.getCapabilities()
      if (!("torch" in capabilities)) return false
      await track.applyConstraints({
        advanced: [{ torch: true } as unknown as MediaTrackConstraintSet],
      })
      await sleep(1000)
      await track.applyConstraints({
        advanced: [{ torch: false } as unknown as MediaTrackConstraintSet],
      })
      return true
    } catch {
      return false
    }
  }, [])

  const captureImage = useCallback(
    async (target: number) => {
      const video = videoRef.current
      const slot = slots[target]
      if (
        !video ||
        !slot ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        setIsCapturing(false)
        setCountdownDisplay(null)
        return
      }

      // Simpan seluruh frame kamera (tidak langsung dipotong ke rasio slot)
      // supaya pengguna masih bisa memilih area potong lewat Recrop. Penyesuaian
      // ke ukuran frame terjadi saat ditampilkan/dikomposit (mode "cover").
      const videoWidth = video.videoWidth
      const videoHeight = video.videoHeight
      const outputScale =
        CAPTURE_OUTPUT_WIDTH / Math.max(videoWidth, videoHeight)

      const canvas = document.createElement("canvas")
      canvas.width = Math.round(videoWidth * outputScale)
      canvas.height = Math.round(videoHeight * outputScale)
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        setIsCapturing(false)
        setCountdownDisplay(null)
        return
      }

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
      ctx.save()
      if (isMirrored) {
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
      }
      const videoFilter = window.getComputedStyle(video).filter
      ctx.filter = flashEnabled ? `${videoFilter} brightness(1.2)` : videoFilter
      ctx.drawImage(
        video,
        0,
        0,
        videoWidth,
        videoHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      )
      ctx.restore()

      const dataUrl = canvas.toDataURL("image/png", 1.0)
      setPhotos((previous) => {
        const next = [...previous]
        next[target] = dataUrl
        return next
      })
      setIsCapturing(false)
      setCountdownDisplay(null)
    },
    [flashEnabled, isMirrored, slots],
  )

  const captureWithFlash = useCallback(
    async (target: number) => {
      if (!flashEnabled) {
        await captureImage(target)
        return
      }
      if (isMobileDevice() && facingMode === "environment") {
        const usedNativeFlash = await triggerNativeFlash()
        if (usedNativeFlash) {
          await sleep(100)
          await captureImage(target)
          return
        }
      }
      setIsFlashVisible(true)
      await sleep(1000)
      setIsFlashVisible(false)
      await captureImage(target)
    },
    [captureImage, facingMode, flashEnabled, triggerNativeFlash],
  )

  const startCountdown = useCallback(
    (target: number) => {
      if (isCapturing) return
      setIsCapturing(true)

      if (countdownSetting === 0) {
        void captureWithFlash(target)
        return
      }

      let remaining = countdownSetting
      setCountdownDisplay(String(remaining))
      countdownTimerRef.current = window.setInterval(() => {
        remaining -= 1
        if (remaining > 0) {
          setCountdownDisplay(String(remaining))
          return
        }
        if (countdownTimerRef.current !== null) {
          window.clearInterval(countdownTimerRef.current)
          countdownTimerRef.current = null
        }
        setCountdownDisplay("")
        void captureWithFlash(target)
      }, 1000)
    },
    [captureWithFlash, countdownSetting, isCapturing],
  )

  function handleCaptureClick() {
    if (isCapturing || allPhotosTaken || isAutoCapturingRef.current) return
    if (isAutoCaptureEnabled) {
      void runAutoCapture()
      return
    }
    const nextEmptySlot = photos.findIndex((photo) => !photo)
    if (nextEmptySlot === -1) return
    startCountdown(nextEmptySlot)
  }

  async function captureWithCountdown(target: number) {
    if (countdownSetting === 0) {
      await captureWithFlash(target)
      return
    }
    for (let remaining = countdownSetting; remaining > 0; remaining -= 1) {
      setCountdownDisplay(String(remaining))
      await sleep(1000)
    }
    setCountdownDisplay("")
    await captureWithFlash(target)
  }

  async function runAutoCapture() {
    const filled = new Set<number>()
    photosRef.current.forEach((photo, index) => {
      if (photo) filled.add(index)
    })
    const firstEmpty = slots.findIndex((_, index) => !filled.has(index))
    if (firstEmpty === -1) {
      showToast("Semua slot sudah terisi!", "warning")
      setIsAutoCaptureEnabled(false)
      return
    }
    isAutoCapturingRef.current = true
    showToast("Auto dimulai. Foto diambil berurutan.", "info", 3000)
    try {
      let target = firstEmpty
      while (target !== -1 && isAutoCapturingRef.current) {
        await captureWithCountdown(target)
        filled.add(target)
        target = slots.findIndex((_, index) => !filled.has(index))
      }
    } finally {
      isAutoCapturingRef.current = false
      setIsAutoCaptureEnabled(false)
    }
    showToast("Auto selesai.", "success", 3000)
  }

  function clearPhotoSlot(index: number) {
    setPhotos((previous) => {
      const next = [...previous]
      next[index] = null
      return next
    })
  }

  function setPhotoAt(index: number, dataUrl: string) {
    setPhotos((previous) => {
      const next = [...previous]
      next[index] = dataUrl
      return next
    })
  }

  function resetPhotos() {
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
    setIsCapturing(false)
    setCountdownDisplay(null)
    setPhotos(slots.map(() => null))
    setPreviewImage(null)
    setIsPreviewOpen(false)
  }

  /* --- Upload & crop ----------------------------------------------------- */

  function handleUploadClick() {
    const input = fileInputRef.current
    if (!input) return
    input.value = ""
    input.click()
  }

  function handleFileSelected(file: File) {
    pendingFileRef.current = file
    setIsUploadSlotOpen(true)
  }

  async function handleSlotChosen(index: number) {
    const file = pendingFileRef.current
    setIsUploadSlotOpen(false)
    pendingFileRef.current = null
    if (!file) return
    const slot = slots[index]
    if (!slot) return
    try {
      showToast("Mempersiapkan foto...", "info", 2500)
      const prepared = await prepareImageFile(file)
      const src = await fileToDataUrl(prepared)
      setCrop({
        src,
        aspectRatio: slot.w / slot.h,
        mode: "crop",
        onConfirm: (dataUrl) => {
          setPhotoAt(index, dataUrl)
          setCrop(null)
        },
      })
    } catch {
      showToast(
        "Gagal memproses file. Gunakan format JPEG/PNG bila HEIC gagal.",
        "error",
      )
    }
  }

  function openRecrop(index: number) {
    const photo = photos[index]
    const slot = slots[index]
    if (!photo || !slot) return
    setCrop({
      src: photo,
      aspectRatio: slot.w / slot.h,
      mode: "recrop",
      onConfirm: (dataUrl) => {
        setPhotoAt(index, dataUrl)
        setCrop(null)
      },
    })
  }

  /* --- Share ------------------------------------------------------------- */

  async function sharePhotoStrip() {
    if (!previewImage) {
      showToast("Tidak ada foto yang siap dibagikan", "error")
      return
    }
    if (
      typeof navigator === "undefined" ||
      typeof navigator.share !== "function"
    ) {
      showToast(
        "Perangkat ini tidak mendukung fitur Share. Silakan unduh saja.",
        "warning",
      )
      return
    }
    try {
      const blob = dataUrlToBlob(previewImage)
      const file = new File([blob], "photo-strip.png", { type: "image/png" })
      const canShareFiles =
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      if (canShareFiles) {
        await navigator.share({
          title: "My Photo Strip",
          text: "Yuk, intip hasil foto dari PanoriCam! Follow @panoricam buat update seru lainnya!",
          files: [file],
        })
      } else {
        await navigator.share({
          title: "My Photo Strip",
          text: "Check out my photo strip!",
          url: window.location.href,
        })
      }
      if (!hasShownTestimoniRef.current) {
        window.setTimeout(() => showTestimoniModal(), 1000)
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }
      showToast("Sharing gagal. Silakan unduh fotonya saja.", "error")
    }
  }

  /* --- Komposit strip ---------------------------------------------------- */

  const buildStripDataUrl = useCallback(
    async (quality: number): Promise<string | null> => {
      if (photos.every((photo) => !photo)) return null

      let overlay: CanvasImageSource
      if (frame.imageUrl) {
        overlay = await loadImage(frame.imageUrl, true)
      } else {
        const empty = document.createElement("canvas")
        empty.width = frame.width
        empty.height = frame.height
        overlay = empty
      }

      const photoImages = await Promise.all(
        photos.map((photo) =>
          photo ? loadImage(photo) : Promise.resolve(null),
        ),
      )

      const composed = composeStrip({
        width: frame.width,
        height: frame.height,
        slots,
        photos: photoImages,
        overlay,
      })

      const output = document.createElement("canvas")
      const outputScale = STRIP_EXPORT_WIDTH / frame.width
      output.width = STRIP_EXPORT_WIDTH
      output.height = Math.round(frame.height * outputScale)
      const ctx = output.getContext("2d")
      if (!ctx) return null

      // Samakan dengan preview /booth: latar putih. PNG frame bisa punya tepi
      // transparan (mis. 1px kiri / 3px bawah) yang menjadi garis putih pada
      // hasil; gambar digambar sedikit lebih besar (overscan) agar tepi
      // transparan itu terdorong keluar kanvas -> hasil penuh tanpa garis putih.
      const overscan = Math.max(2, Math.ceil(outputScale * 4))
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, output.width, output.height)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(
        composed,
        -overscan,
        -overscan,
        output.width + overscan * 2,
        output.height + overscan * 2,
      )

      return output.toDataURL("image/png", quality)
    },
    [frame.height, frame.imageUrl, frame.width, photos, slots],
  )

  async function openPreviewModal() {
    if (isComposing) return
    setIsComposing(true)
    try {
      const image = await buildStripDataUrl(1.0)
      if (!image) {
        showToast("Belum ada foto untuk dipreview.", "error")
        return
      }
      setPreviewImage(image)
      setIsPreviewOpen(true)
    } catch {
      showToast("Preview gagal dimuat. Coba lagi.", "error")
    } finally {
      setIsComposing(false)
    }
  }

  async function downloadPhotoStrip() {
    if (isComposing) return
    showToast("Menyiapkan PNG…", "info", 3000)
    setIsComposing(true)
    try {
      const image = await buildStripDataUrl(0.9)
      if (!image) {
        showToast("Tidak ada foto yang siap diunduh", "error")
        return
      }
      setPreviewImage(image)
      triggerDownload(image, "Panoricam-strip.png")
      showToast("PNG tersimpan.", "success", 2000)
      if (!hasShownTestimoniRef.current) {
        window.setTimeout(() => showTestimoniModal(), 1000)
      }
    } catch {
      showToast("Gagal membuat foto strip HD. Coba lagi.", "error")
    } finally {
      setIsComposing(false)
    }
  }

  function handleClosePreview() {
    setIsPreviewOpen(false)
  }

  /* --- GIF --------------------------------------------------------------- */

  const createGifBlob = useCallback(async (): Promise<Blob> => {
    const availablePhotos = photos.filter(
      (photo): photo is string => typeof photo === "string",
    )

    if (availablePhotos.length === 0) {
      throw new Error("Tidak ada foto untuk dibuat GIF")
    }

    const { default: GIF } = await import("gif.js")

    return new Promise<Blob>((resolve, reject) => {
      // Rasio kanvas GIF disamakan dengan slot pada frame terpilih supaya tiap
      // foto mengisi penuh (tanpa margin latar) seperti pada preview /booth.
      const refSlot = slots.find((slot) => slot.w > 0 && slot.h > 0)
      const gifWidth = GIF_WIDTH
      const gifHeight = refSlot
        ? Math.max(1, Math.round((GIF_WIDTH * refSlot.h) / refSlot.w))
        : GIF_HEIGHT

      const gif = new GIF({
        workers: 4,
        quality: 10,
        width: gifWidth,
        height: gifHeight,
        dither: false,
        workerScript: "/js/gif.worker.js",
      })

      gif.on("progress", (progress: number) => {
        setGifProgress({
          percentage: Math.round(progress * 100),
          text: `Memproses frame ${Math.ceil(progress * availablePhotos.length)} dari ${availablePhotos.length}...`,
        })
      })
      gif.on("finished", (blob: Blob) => resolve(blob))
      gif.on("error", (error: Error) => reject(error))

      let processed = 0
      const onFrameDone = () => {
        processed += 1
        if (processed === availablePhotos.length) {
          setGifProgress({ percentage: 50, text: "Menyusun GIF HD..." })
          gif.render()
        }
      }

      availablePhotos.forEach((photo) => {
        if (typeof window === "undefined") return
        const image = new window.Image()
        image.crossOrigin = "anonymous"
        image.onload = () => {
          const canvas = document.createElement("canvas")
          canvas.width = gifWidth
          canvas.height = gifHeight
          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = "high"
            ctx.fillStyle = FRAME_BACKGROUND
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            const sourceWidth = image.naturalWidth || image.width
            const sourceHeight = image.naturalHeight || image.height
            if (sourceWidth > 0 && sourceHeight > 0) {
              const { sx, sy, sw, sh } = getCoverSourceRect(
                sourceWidth,
                sourceHeight,
                gifWidth,
                gifHeight,
              )
              ctx.drawImage(image, sx, sy, sw, sh, 0, 0, gifWidth, gifHeight)
            }
          }
          gif.addFrame(canvas, { delay: 1000, copy: true })
          setGifProgress({
            percentage: ((processed + 1) / availablePhotos.length) * 50,
            text: `Memuat foto HD ${processed + 1} dari ${availablePhotos.length}...`,
          })
          onFrameDone()
        }
        image.onerror = () => {
          onFrameDone()
        }
        image.src = photo
      })
    })
  }, [photos, slots])

  async function handleCreateGif() {
    setIsGifLoading(true)
    setGifProgress({ percentage: 0, text: "Membuat GIF HD..." })
    try {
      const blob = await createGifBlob()
      gifBlobRef.current = blob
      setHasGif(true)
      setIsGifLoading(false)

      const url = URL.createObjectURL(blob)
      triggerDownload(url, "Panoricam.gif")
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)

      showToast(
        "GIF siap. Kamu juga bisa mengirimnya lewat email.",
        "success",
        3000,
      )
    } catch {
      setIsGifLoading(false)
      showToast("GIF gagal dibuat. Coba lagi.", "error")
    }
  }

  /* --- Email ------------------------------------------------------------- */

  function showEmailModal() {
    if (!previewImage) {
      showToast("Tidak ada foto yang siap dikirim", "error")
      return
    }
    setEmail("")
    setIsEmailOpen(true)
  }

  async function sendPhotoToDrive() {
    if (isSendingEmailRef.current) return

    const target = email.trim()
    if (!target) {
      showToast("Isi email tujuan dulu.", "error")
      return
    }
    if (!isValidEmail(target)) {
      showToast("Format email belum benar.", "error")
      return
    }
    if (!previewImage) {
      showToast("Tidak ada foto yang siap dikirim", "error")
      return
    }

    isSendingEmailRef.current = true
    setIsEmailOpen(false)
    setIsSending(true)
    setDriveProgress({ percentage: 10, text: "Mempersiapkan file..." })

    try {
      const photoBlob = dataUrlToBlob(previewImage)
      setDriveProgress({ percentage: 30, text: "Menyiapkan foto PNG..." })

      let gifFile = gifBlobRef.current
      if (gifFile) {
        setDriveProgress({ percentage: 40, text: "Menyiapkan GIF animasi..." })
      } else {
        setDriveProgress({ percentage: 40, text: "Membuat GIF animasi..." })
        gifFile = await createGifBlob()
        gifBlobRef.current = gifFile
        setHasGif(true)
      }

      setDriveProgress({ percentage: 60, text: "Mengupload file..." })

      const uploadResponse = await fetch("/api/send-email/upload-urls", {
        method: "POST",
      })
      const uploadTargets = (await uploadResponse.json()) as {
        success?: boolean
        message?: string
        photo?: { path: string; token: string }
        gif?: { path: string; token: string }
      }
      if (
        !uploadResponse.ok ||
        !uploadTargets.success ||
        !uploadTargets.photo ||
        !uploadTargets.gif
      ) {
        throw new Error(uploadTargets.message ?? "Gagal menyiapkan upload")
      }

      const supabase = createClient()
      const photoUpload = await supabase.storage
        .from(STORAGE_BUCKETS.photoResults)
        .uploadToSignedUrl(
          uploadTargets.photo.path,
          uploadTargets.photo.token,
          photoBlob,
          { contentType: "image/png" },
        )
      if (photoUpload.error) {
        throw new Error(`Gagal mengunggah foto: ${photoUpload.error.message}`)
      }

      setDriveProgress({ percentage: 75, text: "Mengupload GIF..." })
      const gifUpload = await supabase.storage
        .from(STORAGE_BUCKETS.photoResults)
        .uploadToSignedUrl(
          uploadTargets.gif.path,
          uploadTargets.gif.token,
          gifFile,
          { contentType: "image/gif" },
        )
      if (gifUpload.error) {
        throw new Error(`Gagal mengunggah GIF: ${gifUpload.error.message}`)
      }

      setDriveProgress({ percentage: 85, text: "Mengirim email..." })

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: target,
          frame_id: frame.id,
          photo_path: uploadTargets.photo.path,
          gif_path: uploadTargets.gif.path,
        }),
      })
      const result = (await response.json()) as {
        success?: boolean
        message?: string
      }

      if (!response.ok || !result.success) {
        if (response.status === 429) {
          setIsSending(false)
          showToast(
            result.message ??
              "Kuota pengiriman email hari ini sudah tercapai. Silakan coba lagi nanti.",
            "warning",
            10000,
          )
          return
        }

        throw new Error(result.message ?? "Gagal mengirim file")
      }

      setDriveProgress({ percentage: 100, text: "Berhasil!" })
      await sleep(1000)
      setIsSending(false)
      showToast(`Foto dan GIF terkirim ke ${target}`, "success", 5000)

      if (!hasShownTestimoniRef.current) {
        window.setTimeout(() => showTestimoniModal(), 2000)
      }
    } catch (error) {
      setIsSending(false)
      showToast(
        `Gagal mengirim file: ${
          error instanceof Error ? error.message : "kesalahan tidak diketahui"
        }`,
        "error",
      )
    } finally {
      isSendingEmailRef.current = false
    }
  }

  /* --- Testimoni --------------------------------------------------------- */

  function showTestimoniModal() {
    if (hasShownTestimoniRef.current) return
    hasShownTestimoniRef.current = true
    setToast(null)
    setIsTestimoniOpen(true)
  }

  function closeTestimoniModal() {
    setIsTestimoniOpen(false)
    setToast(null)
  }

  async function submitTestimoni() {
    if (rating === 0) {
      showToast("Pilih rating dulu, ya.", "warning")
      return
    }
    if (testimoniName.trim().length < 2) {
      showToast("Isi nama dulu (minimal 2 karakter).", "error")
      return
    }
    if (testimoniMessage.trim().length < 10) {
      showToast("Tulis testimoni minimal 10 karakter.", "error")
      return
    }
    if (!emoji) {
      showToast("Pilih satu emoji dulu, ya.", "warning")
      return
    }

    setIsSubmittingTestimoni(true)
    try {
      let photoPath: string | null = null
      if (testimoniConsent && previewImage) {
        const uploadTargetResponse = await fetch("/api/testimonials/upload-url", {
          method: "POST",
        })
        const uploadTarget = (await uploadTargetResponse.json()) as {
          success?: boolean
          message?: string
          photo?: { path: string; token: string }
        }
        if (
          !uploadTargetResponse.ok ||
          !uploadTarget.success ||
          !uploadTarget.photo
        ) {
          showToast(
            uploadTarget.message ?? "Gagal menyiapkan unggahan foto.",
            "error",
          )
          return
        }

        const supabase = createClient()
        const photoUpload = await supabase.storage
          .from(STORAGE_BUCKETS.photoResults)
          .uploadToSignedUrl(
            uploadTarget.photo.path,
            uploadTarget.photo.token,
            dataUrlToBlob(previewImage),
            { contentType: "image/png" },
          )
        if (photoUpload.error) {
          showToast("Gagal mengunggah foto. Coba lagi, ya.", "error")
          return
        }
        photoPath = uploadTarget.photo.path
      }

      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          emoji,
          name: testimoniName.trim(),
          message: testimoniMessage.trim(),
          frame_id: frame.id,
          photo_consent: photoPath !== null,
          photo_path: photoPath,
        }),
      })
      const data = (await response.json()) as {
        success?: boolean
        message?: string
      }

      if (!response.ok || !data.success) {
        showToast(
          data.message ?? "Gagal mengirim testimoni. Silakan coba lagi.",
          "error",
        )
        return
      }

      showToast("Terima kasih atas testimoni kamu!", "success", 5000)
      closeTestimoniModal()
      setRating(0)
      setEmoji("")
      setTestimoniName("")
      setTestimoniMessage("")
      setTestimoniConsent(false)
      window.setTimeout(() => {
        showToast("Masukanmu sangat membantu.", "success", 3000)
      }, 1500)
    } catch {
      showToast(
        "Terjadi kesalahan saat mengirim testimoni. Silakan coba lagi. 🔄",
        "error",
      )
    } finally {
      setIsSubmittingTestimoni(false)
    }
  }

  /* --- Render ------------------------------------------------------------ */

  return (
    <div className="page-booth relative flex min-h-screen flex-col bg-[#FEF3E2] font-['Poppins'] text-[#2A0A0A]">
      <div
        aria-hidden="true"
        className="lab-paper pointer-events-none fixed inset-0 opacity-50"
      />
      {toast ? (
        <BoothToast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onDone={dismissToast}
        />
      ) : null}

      <header className="relative z-30 border-b border-dashed border-[#BF3131]/25 bg-[#FEF3E2]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
          <Link
            href="/frame"
            aria-label="Kembali pilih frame"
            className={`inline-flex h-11 items-center gap-1.5 rounded-[2px] px-2 text-sm font-semibold text-[#7A3E32] transition hover:bg-[#BF3131]/8 hover:text-[#2A0A0A] sm:px-3 ${FOCUS_RING}`}
          >
            <Icon name="back" />
            <span className="hidden sm:inline">Ganti frame</span>
          </Link>

          <div className="ml-1 min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold leading-tight text-[#2A0A0A]">
              {frame.name}
            </h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7A5A50]">
              {frame.isFree ? "Gratis" : "Premium"} · {totalSlots} foto
            </p>
          </div>

          <button
            type="button"
            aria-label="Buka panduan"
            onClick={() => setIsWelcomeOpen(true)}
            className={`inline-flex h-11 items-center gap-1.5 rounded-[2px] px-2.5 text-sm font-semibold text-[#7A3E32] transition hover:bg-[#BF3131]/8 hover:text-[#2A0A0A] ${FOCUS_RING}`}
          >
            <Icon name="help" />
            <span className="hidden sm:inline">Panduan</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-5 sm:px-6 sm:pt-7 lg:pb-10">
        {!frame.isFree ? (
          <div
            className="mb-4 flex items-start gap-2.5 border border-dashed border-[#BF3131]/30 bg-[#FFFBF3] px-3.5 py-2.5 text-xs leading-relaxed text-[#5B3A32]"
            role="note"
          >
            <Icon
              name="sparkle"
              className="mt-0.5 h-4 w-4 shrink-0 text-[#BF3131]"
            />
            <p>
              <span className="font-semibold text-[#2A0A0A]">
                Frame premium.
              </span>{" "}
              Bebas foto dan unduh selama masa aktif paket.
            </p>
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-7 xl:grid-cols-[minmax(0,1fr)_330px]">
          <section aria-label="Kamera" className="min-w-0">
            <div className="relative overflow-hidden rounded-[3px] border border-[#2A0A0A]/15 bg-[#1B0D0B] p-2 shadow-[0_22px_45px_-32px_rgba(42,10,10,0.85)] sm:p-3">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2px] bg-[#0F0706]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  aria-label="Pratinjau kamera"
                  className="h-full w-full object-cover"
                  style={{
                    transform: isMirrored ? "scaleX(-1)" : "none",
                    filter,
                  }}
                />

                <div className="pointer-events-none absolute right-3 top-3 z-20 bg-[#FEF3E2] px-2.5 py-1 text-[11px] font-bold tabular-nums text-[#2A0A0A]">
                  {takenCount}/{totalSlots}
                </div>

                <div
                  id="countdown-overlay"
                  className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-8xl font-extrabold tabular-nums text-[#FEF3E2] sm:text-9xl"
                >
                  {countdownDisplay}
                </div>
                <div
                  id="flash-overlay"
                  className={isFlashVisible ? "active" : undefined}
                />

                {cameraError ? (
                  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-[#1B0D0B]/95 px-6 text-center">
                    <Icon name="camera" className="h-8 w-8 text-[#F16767]" />
                    <p className="max-w-xs text-sm leading-relaxed text-[#FEF3E2]">
                      {cameraError}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        void startWebcam(facingMode)
                      }}
                      className={`inline-flex min-h-11 items-center justify-center rounded-[2px] border border-[#FEF3E2]/35 px-4 py-2 text-sm font-semibold text-[#FEF3E2] transition hover:bg-[#FEF3E2]/10 ${FOCUS_RING}`}
                    >
                      Coba lagi
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <span className="mr-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A5A50]">
                  Filter
                </span>
                <div
                  role="group"
                  aria-label="Filter kamera"
                  className="flex flex-wrap gap-1.5"
                >
                  {FILTER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={filter === option.value}
                      onClick={() => setFilter(option.value)}
                      className={`min-h-11 rounded-[2px] border px-2.5 py-1 text-xs font-semibold transition ${
                        filter === option.value
                          ? "border-[#BF3131] bg-[#BF3131] text-[#FEF3E2]"
                          : "border-[#BF3131]/25 bg-[#FFFBF3]/60 text-[#7A3E32] hover:border-[#BF3131]/50 hover:text-[#2A0A0A]"
                      } ${FOCUS_RING}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 border-t border-dashed border-[#BF3131]/25 pt-2.5">
                <button
                  type="button"
                  aria-pressed={isMirrored}
                  onClick={() => setIsMirrored((mirrored) => !mirrored)}
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-[2px] border px-2.5 py-1.5 text-xs font-semibold transition ${
                    isMirrored
                      ? "border-[#BF3131] bg-[#BF3131]/10 text-[#BF3131]"
                      : "border-transparent text-[#7A3E32] hover:bg-[#BF3131]/8"
                  } ${FOCUS_RING}`}
                >
                  <Icon name="mirror" className="h-4 w-4" />
                  Cermin
                  {isMirrored ? <span className="sr-only">aktif</span> : null}
                </button>

                <button
                  type="button"
                  aria-pressed={countdownSetting !== 0}
                  onClick={() => {
                    const currentIndex =
                      COUNTDOWN_OPTIONS.indexOf(countdownSetting)
                    const nextIndex =
                      (currentIndex + 1) % COUNTDOWN_OPTIONS.length
                    setCountdownSetting(COUNTDOWN_OPTIONS[nextIndex])
                  }}
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-[2px] border px-2.5 py-1.5 text-xs font-semibold tabular-nums transition ${
                    countdownSetting !== 0
                      ? "border-[#BF3131] bg-[#BF3131]/10 text-[#BF3131]"
                      : "border-transparent text-[#7A3E32] hover:bg-[#BF3131]/8"
                  } ${FOCUS_RING}`}
                >
                  <Icon name="timer" className="h-4 w-4" />
                  {countdownSetting === 0
                    ? "Tanpa timer"
                    : `Timer ${countdownSetting}s`}
                </button>

                {showFlashToggle ? (
                  <button
                    type="button"
                    aria-pressed={flashEnabled}
                    onClick={() => setIsFlashEnabled((enabled) => !enabled)}
                    className={`inline-flex min-h-11 items-center gap-1.5 rounded-[2px] border px-2.5 py-1.5 text-xs font-semibold transition ${
                      flashEnabled
                        ? "border-[#BF3131] bg-[#BF3131]/10 text-[#BF3131]"
                        : "border-transparent text-[#7A3E32] hover:bg-[#BF3131]/8"
                    } ${FOCUS_RING}`}
                  >
                    <Icon name="flash" className="h-4 w-4" />
                    Flash
                  </button>
                ) : null}

                <button
                  type="button"
                  aria-pressed={isAutoCaptureEnabled}
                  onClick={() => setIsAutoCaptureEnabled((enabled) => !enabled)}
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-[2px] border px-2.5 py-1.5 text-xs font-semibold transition ${
                    isAutoCaptureEnabled
                      ? "border-[#BF3131] bg-[#BF3131]/10 text-[#BF3131]"
                      : "border-transparent text-[#7A3E32] hover:bg-[#BF3131]/8"
                  } ${FOCUS_RING}`}
                >
                  <Icon name="auto" className="h-4 w-4" />
                  Auto
                </button>

                {isMobile ? (
                  <button
                    type="button"
                    onClick={() => {
                      void startWebcam(
                        facingMode === "user" ? "environment" : "user",
                      )
                    }}
                    className={`inline-flex min-h-11 items-center gap-1.5 rounded-[2px] border border-transparent px-2.5 py-1.5 text-xs font-semibold text-[#7A3E32] transition hover:bg-[#BF3131]/8 ${FOCUS_RING}`}
                  >
                    <Icon name="camera" className="h-4 w-4" />
                    Balik kamera
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                id="captureButton"
                disabled={isCapturing}
                onClick={() => {
                  if (allPhotosTaken) {
                    void openPreviewModal()
                    return
                  }
                  handleCaptureClick()
                }}
                className={`${BTN_PRIMARY} w-full sm:flex-1`}
              >
                <Icon
                  name={allPhotosTaken ? "check" : "camera"}
                  className={isCapturing ? "h-5 w-5 animate-pulse" : "h-5 w-5"}
                />
                {isCapturing
                  ? "Memotret…"
                  : allPhotosTaken
                    ? "Selesai & simpan"
                    : "Ambil foto"}
              </button>

              <button
                type="button"
                id="uploadButton"
                onClick={handleUploadClick}
                className={`${BTN_SECONDARY} w-full sm:w-auto`}
              >
                <Icon name="upload" />
                Unggah foto
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) {
                    handleFileSelected(file)
                  }
                }}
              />
            </div>

            <p className="mt-2 text-center text-xs leading-relaxed text-[#7A5A50] sm:text-left">
              {allPhotosTaken
                ? "Semua slot terisi. Cek strip, lalu simpan hasilnya."
                : isAutoCaptureEnabled
                  ? "Auto aktif: foto diambil berurutan sampai semua slot terisi."
                  : takenCount === 0
                    ? `Tekan Ambil foto untuk mulai. Kamu butuh ${totalSlots} foto.`
                    : `Sisa ${totalSlots - takenCount} foto. Ketuk foto di strip untuk ganti.`}
            </p>
          </section>

          <aside aria-label="Strip foto" className="lg:sticky lg:top-24">
            <div className="relative border border-[#BF3131]/25 bg-[#FFFBF3] p-4 shadow-[6px_6px_0_rgba(191,49,49,0.08)] sm:p-5">
              <span
                aria-hidden="true"
                className="absolute left-2 top-2 h-3 w-3 border-l border-t border-[#BF3131]/40"
              />
              <span
                aria-hidden="true"
                className="absolute right-2 top-2 h-3 w-3 border-r border-t border-[#BF3131]/40"
              />
              <span
                aria-hidden="true"
                className="absolute bottom-2 left-2 h-3 w-3 border-b border-l border-[#BF3131]/40"
              />
              <span
                aria-hidden="true"
                className="absolute bottom-2 right-2 h-3 w-3 border-b border-r border-[#BF3131]/40"
              />

              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2A0A0A]">
                  Strip kamu
                </h2>
                <span className="text-xs font-semibold tabular-nums text-[#7A5A50]">
                  {takenCount} / {totalSlots}
                </span>
              </div>
              <p className="sr-only" aria-live="polite">
                {takenCount} dari {totalSlots} foto sudah terisi.
              </p>

              <div className="mt-4 flex justify-center">
                <div
                  className="frame-container relative"
                  style={{ width: panelWidth, height: panelHeight }}
                >
                  <div
                    id="frameTemplate"
                    className="relative h-full w-full rounded-[2px] bg-white shadow-[0_14px_30px_-22px_rgba(42,10,10,0.7)]"
                  >
                    {slots.map((slot, index) => {
                      const slotStyle = {
                        left: slot.x * scale,
                        top: slot.y * scale,
                        width: slot.w * scale,
                        height: slot.h * scale,
                      }
                      return (
                        <div key={`placeholder-${index}`}>
                          {photos[index] ? null : (
                            <div
                              className="photo-overlay absolute z-10 flex items-center justify-center rounded-sm border border-dashed border-[#BF3131]/30 bg-[#FEF3E2]"
                              style={slotStyle}
                              data-slot={index}
                            >
                              <span className="text-[11px] font-bold tabular-nums text-[#BF3131]/45">
                                {index + 1}
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {slots.map((slot, index) => {
                      const slotStyle = {
                        left: slot.x * scale,
                        top: slot.y * scale,
                        width: slot.w * scale,
                        height: slot.h * scale,
                      }
                      const photo = photos[index]
                      return (
                        <div
                          key={`slot-${index}`}
                          className="absolute overflow-hidden"
                          style={slotStyle}
                          data-photo-index={index}
                          data-has-photo={photo ? "true" : "false"}
                          onClick={() => {
                            if (!photo || isCapturing) return
                            setRevealedSlot((current) =>
                              current === index ? null : index,
                            )
                          }}
                        >
                          <div className="photo-slot relative h-full w-full">
                            {photo ? (
                              <img
                                className="booth-photo h-full w-full bg-[#FEF3E2] object-cover"
                                src={photo}
                                alt={`Foto slot ${index + 1}`}
                              />
                            ) : null}
                            {photo ? (
                              <div
                                className={`photo-actions absolute inset-0 mr-5 flex items-center justify-center gap-3 ${
                                  revealedSlot === index ? "is-visible" : ""
                                }`}
                              >
                                <button
                                  type="button"
                                  aria-label={`Ganti foto slot ${index + 1}`}
                                  className={`retake-button booth-retake-button flex h-8 w-8 items-center justify-center rounded-full bg-[#FFFBF3] text-[#BF3131] shadow-md transition hover:bg-white ${FOCUS_RING}`}
                                  data-index={index}
                                  data-has-photo="true"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    if (!isCapturing) setRetakeIndex(index)
                                  }}
                                >
                                  <Icon name="reset" className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Atur ulang potongan foto slot ${index + 1}`}
                                  className={`recrop-button booth-recrop-button flex h-8 w-8 items-center justify-center rounded-full bg-[#FFFBF3] text-[#BF3131] shadow-md transition hover:bg-white ${FOCUS_RING}`}
                                  data-index={index}
                                  data-has-photo="true"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    if (!isCapturing) openRecrop(index)
                                  }}
                                >
                                  <Icon name="image" className="h-4 w-4" />
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}

                    {!frame.isFree
                      ? slots.map((slot, index) => (
                          <div
                            key={`watermark-${index}`}
                            className="watermark absolute z-20 opacity-40"
                            style={{
                              left: slot.x * scale,
                              top: slot.y * scale,
                              width: slot.w * scale,
                              height: slot.h * scale,
                            }}
                            data-slot={index}
                          >
                            <div className="flex h-full items-center justify-center rounded-lg p-2">
                              <Image src="/logo.png" alt="" width={666} height={375} className="h-24 w-auto" />
                            </div>
                          </div>
                        ))
                      : null}

                    {frame.imageUrl ? (
                      <img
                        className="booth-overlay-image"
                        src={frame.imageUrl}
                        alt=""
                      />
                    ) : null}
                  </div>
                </div>
              </div>

              <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A5A50]">
                {takenCount > 0
                  ? "Ketuk foto untuk ganti"
                  : "Slot kosong menunggu fotomu"}
              </p>

              <div className="mt-4 space-y-1.5 border-t border-dashed border-[#BF3131]/25 pt-4">
                <button
                  type="button"
                  id="finishButton"
                  disabled={!allPhotosTaken}
                  onClick={() => {
                    void openPreviewModal()
                  }}
                  className={`${BTN_PRIMARY} w-full`}
                >
                  <Icon name="check" />
                  {allPhotosTaken
                    ? "Selesai & simpan"
                    : `Lengkapi ${totalSlots - takenCount} foto lagi`}
                </button>
                <button
                  type="button"
                  id="resetButton"
                  disabled={takenCount === 0 || isCapturing}
                  onClick={() => setIsResetOpen(true)}
                  className={`${BTN_GHOST} w-full`}
                >
                  <Icon name="reset" className="h-4 w-4" />
                  Ulangi semua
                </button>
              </div>
            </div>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-[#7A5A50]">
              <Icon name="lock" className="h-3.5 w-3.5" />
              Foto diproses di perangkatmu.
            </p>
          </aside>
        </div>
      </main>

      {allPhotosTaken && !isPreviewOpen ? (
        <div className="booth-bar fixed inset-x-0 bottom-0 z-40 border-t border-[#BF3131]/25 bg-[#FEF3E2]/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm lg:hidden">
          <div className="mx-auto flex max-w-md items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A5A50]">
                {totalSlots} dari {totalSlots} foto
              </p>
              <p className="truncate text-sm font-semibold text-[#2A0A0A]">
                Strip kamu siap.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                void openPreviewModal()
              }}
              className={BTN_PRIMARY}
            >
              <Icon name="check" />
              Selesai
            </button>
          </div>
        </div>
      ) : null}

      {retakeIndex !== null ? (
        <div
          className={MODAL_OVERLAY}
          role="dialog"
          aria-modal="true"
          aria-labelledby="retakeTitle"
        >
          <div className={MODAL_CARD}>
            <button
              type="button"
              aria-label="Tutup"
              className={MODAL_CLOSE}
              onClick={() => setRetakeIndex(null)}
            >
              <Icon name="close" />
            </button>
            <h2
              id="retakeTitle"
              className="pr-10 text-xl font-bold tracking-[-0.02em]"
            >
              Ganti foto ini?
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#5B3A32]">
              Foto di slot {retakeIndex + 1} akan diganti dengan hasil jepretan
              baru. Slot lain tidak berubah.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className={BTN_SECONDARY}
                onClick={() => setRetakeIndex(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className={BTN_PRIMARY}
                onClick={() => {
                  clearPhotoSlot(retakeIndex)
                  setRetakeIndex(null)
                }}
              >
                <Icon name="camera" />
                Ganti foto
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isResetOpen ? (
        <div
          className={MODAL_OVERLAY}
          role="dialog"
          aria-modal="true"
          aria-labelledby="resetTitle"
        >
          <div className={MODAL_CARD}>
            <button
              type="button"
              aria-label="Tutup"
              className={MODAL_CLOSE}
              onClick={() => setIsResetOpen(false)}
            >
              <Icon name="close" />
            </button>
            <h2
              id="resetTitle"
              className="pr-10 text-xl font-bold tracking-[-0.02em]"
            >
              Ulangi semua foto?
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#5B3A32]">
              Semua {totalSlots} slot akan dikosongkan. Tindakan ini tidak bisa
              dibatalkan.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className={BTN_SECONDARY}
                onClick={() => setIsResetOpen(false)}
              >
                Batal
              </button>
              <button
                type="button"
                className={BTN_PRIMARY}
                onClick={() => {
                  resetPhotos()
                  setIsResetOpen(false)
                }}
              >
                <Icon name="reset" />
                Ya, ulangi
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isPreviewOpen ? (
        <div
          className={MODAL_OVERLAY}
          role="dialog"
          aria-modal="true"
          aria-labelledby="previewTitle"
        >
          <div className={MODAL_CARD}>
            <button
              type="button"
              aria-label="Tutup"
              className={MODAL_CLOSE}
              onClick={handleClosePreview}
            >
              <Icon name="close" />
            </button>

            <h2
              id="previewTitle"
              className="pr-10 text-xl font-bold tracking-[-0.02em]"
            >
              Strip kamu siap.
            </h2>
            <p className="mt-1 text-xs text-[#7A5A50]">
              PNG resolusi tinggi
              {frame.isFree ? " · GIF bisa dibuat di sini" : ""}.
            </p>

            <div className="mt-4 flex justify-center">
              <div className="relative border border-[#BF3131]/25 bg-[#FEF3E2] p-2.5">
                <span
                  aria-hidden="true"
                  className="absolute left-1.5 top-1.5 h-2.5 w-2.5 border-l border-t border-[#BF3131]/50"
                />
                <span
                  aria-hidden="true"
                  className="absolute right-1.5 top-1.5 h-2.5 w-2.5 border-r border-t border-[#BF3131]/50"
                />
                <span
                  aria-hidden="true"
                  className="absolute bottom-1.5 left-1.5 h-2.5 w-2.5 border-b border-l border-[#BF3131]/50"
                />
                <span
                  aria-hidden="true"
                  className="absolute bottom-1.5 right-1.5 h-2.5 w-2.5 border-b border-r border-[#BF3131]/50"
                />
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Hasil strip foto"
                    className="max-h-[42vh] w-auto max-w-full"
                  />
                ) : null}
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <p className="flex items-center justify-center gap-2 border border-dashed border-[#BF3131]/30 bg-[#FEF3E2]/60 px-3 py-2 text-center text-xs font-semibold leading-relaxed text-[#2A0A0A]">
                <Icon
                  name="sparkle"
                  className="h-4 w-4 shrink-0 text-[#BF3131]"
                />
                <span>
                  Jangan lupa tag IG{" "}
                  <span className="text-[#BF3131]">@panoricam</span> ya temantimun!{" "}
                </span>
              </p>

              <button
                type="button"
                id="modalDownloadButton"
                disabled={isComposing}
                onClick={() => {
                  void downloadPhotoStrip()
                }}
                className={`${BTN_PRIMARY} w-full`}
              >
                <Icon name="download" />
                {isComposing ? "Menyiapkan…" : "Unduh PNG"}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="modalDriveButton"
                  onClick={showEmailModal}
                  className={BTN_SECONDARY}
                >
                  <Icon name="mail" className="h-4 w-4" />
                  Email
                </button>
                {frame.isFree ? (
                  <button
                    type="button"
                    id="modalGifButton"
                    onClick={() => {
                      void handleCreateGif()
                    }}
                    className={BTN_SECONDARY}
                  >
                    <Icon name="film" className="h-4 w-4" />
                    Unduh GIF
                  </button>
                ) : null}
                {frame.isFree ? (
                  <button
                    type="button"
                    id="modalShareButton"
                    onClick={() => {
                      void sharePhotoStrip()
                    }}
                    className={`${BTN_SECONDARY} col-span-2`}
                  >
                    <Icon name="share" className="h-4 w-4" />
                    Bagikan
                  </button>
                ) : null}
              </div>

              <button
                type="button"
                onClick={handleClosePreview}
                className={`${BTN_GHOST} w-full`}
              >
                Kembali ke kamera
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isGifLoading ? (
        <div
          className={MODAL_OVERLAY}
          role="dialog"
          aria-modal="true"
          aria-labelledby="gifTitle"
        >
          <div className={`${MODAL_CARD} max-w-md`}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] bg-[#BF3131]/10 text-[#BF3131]">
                <Icon name="film" />
              </span>
              <div>
                <h2
                  id="gifTitle"
                  className="text-lg font-bold tracking-[-0.02em]"
                >
                  Membuat GIF…
                </h2>
                <p className="text-xs text-[#7A5A50]">Jangan tutup tab ini.</p>
              </div>
            </div>
            <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-[#BF3131]/12">
              <div
                className="h-full bg-[#BF3131] transition-all duration-300"
                style={{ width: `${gifProgress.percentage}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[#7A5A50]">
              <span>{gifProgress.text}</span>
              <span className="tabular-nums">{gifProgress.percentage}%</span>
            </div>
          </div>
        </div>
      ) : null}

      {isEmailOpen ? (
        <div
          className={MODAL_OVERLAY}
          role="dialog"
          aria-modal="true"
          aria-labelledby="emailTitle"
        >
          <div className={MODAL_CARD}>
            <button
              type="button"
              aria-label="Tutup"
              className={MODAL_CLOSE}
              onClick={() => setIsEmailOpen(false)}
            >
              <Icon name="close" />
            </button>
            <h2
              id="emailTitle"
              className="pr-10 text-xl font-bold tracking-[-0.02em]"
            >
              Kirim ke email
            </h2>
            <p className="mt-1 text-xs text-[#7A5A50]">
              Strip PNG dan GIF animasi dikirim ke alamat ini.
            </p>

            <label
              htmlFor="emailInput"
              className="mt-5 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A5A50]"
            >
              Email tujuan
            </label>
            <input
              type="email"
              id="emailInput"
              inputMode="email"
              autoComplete="email"
              className={`${INPUT_CLASS} mt-1.5`}
              placeholder="nama@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void sendPhotoToDrive()
                }
              }}
            />

            <div className="mt-4 space-y-1.5 border-t border-dashed border-[#BF3131]/25 pt-3 text-xs text-[#5B3A32]">
              <p className="flex items-center gap-2">
                <Icon name="image" className="h-4 w-4 text-[#BF3131]" />
                Foto strip HD (PNG)
              </p>
              <p className="flex items-center gap-2">
                <Icon name="film" className="h-4 w-4 text-[#BF3131]" />
                {hasGif ? "GIF animasi" : "GIF animasi (dibuat otomatis)"}
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className={BTN_SECONDARY}
                onClick={() => setIsEmailOpen(false)}
              >
                Batal
              </button>
              <button
                type="button"
                id="sendToDriveButton"
                disabled={isSending}
                className={BTN_PRIMARY}
                onClick={() => {
                  void sendPhotoToDrive()
                }}
              >
                <Icon name="mail" />
                Kirim
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isSending ? (
        <div
          className={MODAL_OVERLAY}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sendTitle"
        >
          <div className={`${MODAL_CARD} max-w-md`}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] bg-[#BF3131]/10 text-[#BF3131]">
                <Icon name="mail" />
              </span>
              <div>
                <h2
                  id="sendTitle"
                  className="text-lg font-bold tracking-[-0.02em]"
                >
                  Mengirim…
                </h2>
                <p className="text-xs text-[#7A5A50]">
                  Tetap di halaman ini sampai selesai.
                </p>
              </div>
            </div>
            <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-[#BF3131]/12">
              <div
                className="h-full bg-[#BF3131] transition-all duration-300"
                style={{ width: `${driveProgress.percentage}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[#7A5A50]">
              <span>{driveProgress.text}</span>
              <span className="tabular-nums">{driveProgress.percentage}%</span>
            </div>
          </div>
        </div>
      ) : null}

      {isTestimoniOpen ? (
        <div
          id="testimoniModal"
          className={`${MODAL_OVERLAY} testimoni-modal`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="testimoniTitle"
        >
          <div className={MODAL_CARD}>
            <button
              type="button"
              aria-label="Tutup"
              className={MODAL_CLOSE}
              onClick={closeTestimoniModal}
            >
              <Icon name="close" />
            </button>

            <h2
              id="testimoniTitle"
              className="pr-10 text-xl font-bold tracking-[-0.02em]"
            >
              Gimana pengalamannya?
            </h2>
            <p className="mt-1 text-xs text-[#7A5A50]">
              Ceritamu bantu kami bikin booth ini lebih seru.
            </p>

            <div className="mt-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A5A50]">
                Rating
              </p>
              <div
                className="mt-1.5 flex gap-1"
                role="group"
                aria-label="Rating bintang"
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-label={`Bintang ${value}`}
                    aria-pressed={rating === value}
                    onClick={() => setRating(value)}
                    className={`flex h-11 w-11 items-center justify-center rounded-[2px] transition ${
                      rating >= value
                        ? "text-[#BF3131]"
                        : "text-[#BF3131]/25 hover:text-[#BF3131]/50"
                    } ${FOCUS_RING}`}
                  >
                    <Icon
                      name="star"
                      className="h-7 w-7"
                      filled={rating >= value}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A5A50]">
                Mood
              </p>
              <div
                className="mt-1.5 flex flex-wrap gap-1.5"
                role="group"
                aria-label="Pilih emoji"
              >
                {TESTIMONI_EMOJIS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-label={`Emoji ${option}`}
                    aria-pressed={emoji === option}
                    onClick={() => setEmoji(option)}
                    className={`flex h-11 w-11 items-center justify-center rounded-[2px] border text-xl transition ${
                      emoji === option
                        ? "border-[#BF3131] bg-[#BF3131]/10"
                        : "border-transparent hover:bg-[#BF3131]/8"
                    } ${FOCUS_RING}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-2.5">
              <div>
                <label
                  htmlFor="testimoniName"
                  className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A5A50]"
                >
                  Nama
                </label>
                <input
                  type="text"
                  id="testimoniName"
                  placeholder="Nama kamu"
                  minLength={2}
                  maxLength={50}
                  className={INPUT_CLASS}
                  value={testimoniName}
                  onChange={(event) => setTestimoniName(event.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="testimoniMessage"
                  className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A5A50]"
                >
                  Cerita singkat
                </label>
                <textarea
                  id="testimoniMessage"
                  placeholder="Seru nggak? Ada masukan?"
                  rows={3}
                  minLength={10}
                  maxLength={500}
                  className={`${INPUT_CLASS} resize-none`}
                  value={testimoniMessage}
                  onChange={(event) => setTestimoniMessage(event.target.value)}
                />
                <p className="mt-1 text-right text-[10px] tabular-nums text-[#9A7568]">
                  {testimoniMessage.length}/500
                </p>
              </div>
            </div>

            {previewImage ? (
              <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-[2px] border border-[#BF3131]/25 bg-[#FEF3E2]/60 p-3">
                <input
                  type="checkbox"
                  checked={testimoniConsent}
                  onChange={(event) =>
                    setTestimoniConsent(event.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#BF3131]"
                />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-[#2A0A0A]">
                    Boleh pakai fotoku di halaman depan
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-[#7A5A50]">
                    Fotostrip sesi ini boleh tampil di bagian testimoni landing
                    page.
                  </span>
                </span>
              </label>
            ) : null}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                id="skipTestimoni"
                className={BTN_SECONDARY}
                onClick={closeTestimoniModal}
              >
                Lewati
              </button>
              <button
                type="button"
                id="submitTestimoni"
                disabled={isSubmittingTestimoni}
                className={BTN_PRIMARY}
                onClick={() => {
                  void submitTestimoni()
                }}
              >
                {isSubmittingTestimoni ? "Mengirim…" : "Kirim testimoni"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isUploadSlotOpen ? (
        <div
          className={MODAL_OVERLAY}
          role="dialog"
          aria-modal="true"
          aria-labelledby="uploadTitle"
        >
          <div className={MODAL_CARD}>
            <button
              type="button"
              aria-label="Tutup"
              className={MODAL_CLOSE}
              onClick={() => {
                setIsUploadSlotOpen(false)
                pendingFileRef.current = null
              }}
            >
              <Icon name="close" />
            </button>
            <h2
              id="uploadTitle"
              className="pr-10 text-xl font-bold tracking-[-0.02em]"
            >
              Taruh di slot mana?
            </h2>
            <p className="mt-1 text-xs text-[#7A5A50]">
              Pilih slot untuk foto yang baru kamu unggah.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {slots.map((slot, index) => (
                <button
                  key={`upload-slot-${index}`}
                  type="button"
                  aria-label={`Slot ${index + 1}, ${photos[index] ? "sudah terisi" : "kosong"}`}
                  className={`flex min-h-16 flex-col items-start justify-center gap-0.5 rounded-[2px] border px-3 py-2.5 text-left transition ${
                    photos[index]
                      ? "border-[#BF3131]/20 bg-[#BF3131]/5 hover:border-[#BF3131]/50"
                      : "border-dashed border-[#BF3131]/35 bg-[#FEF3E2]/50 hover:border-[#BF3131]"
                  } ${FOCUS_RING}`}
                  onClick={() => {
                    void handleSlotChosen(index)
                  }}
                >
                  <span className="text-sm font-bold text-[#2A0A0A]">
                    Slot {index + 1}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7A5A50]">
                    {photos[index] ? "Terisi · timpa" : "Kosong"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {crop ? <CropModal request={crop} onClose={() => setCrop(null)} /> : null}

      {blocked ? (
        <div
          id="activeSessionAlert"
          className={`${MODAL_OVERLAY} z-[60]`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sessionBlockedTitle"
        >
          <div className={MODAL_CARD}>
            <h3
              id="sessionBlockedTitle"
              className="text-xl font-bold tracking-[-0.02em]"
            >
              Sesi sudah aktif
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#5B3A32]">
              Halaman ini sudah terbuka di tab atau browser lain. Tutup tab lain
              dulu, atau lanjutkan di sini.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className={BTN_SECONDARY}
                onClick={goToMainMenu}
              >
                Kembali
              </button>
              <button
                type="button"
                className={BTN_PRIMARY}
                onClick={forceNewSession}
              >
                Lanjut di sini
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {sessionAlert === "takeover" ? (
        <div
          id="sessionTakeoverAlert"
          className={`${MODAL_OVERLAY} z-[60]`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sessionTakeoverTitle"
        >
          <div className={MODAL_CARD}>
            <h3
              id="sessionTakeoverTitle"
              className="text-xl font-bold tracking-[-0.02em]"
            >
              Sesi diambil alih
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#5B3A32]">
              Booth ini baru dibuka di tab atau browser lain. Hanya satu sesi
              yang bisa aktif.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className={BTN_PRIMARY}
                onClick={goToMainMenu}
              >
                Kembali ke menu
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isWelcomeOpen ? <WelcomeModal onClose={closeWelcome} /> : null}
    </div>
  )
}