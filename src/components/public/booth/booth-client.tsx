"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GIF from "gif.js";

import { BoothToast, type ToastType } from "@/components/public/booth/booth-toast";
import {
  CropModal,
  type CropRequest,
} from "@/components/public/booth/crop-modal";
import { WelcomeModal } from "@/components/public/booth/welcome-modal";
import { useSingleSession } from "@/lib/booth/single-session";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { composeStrip } from "@/lib/frames/compose-strip";
import { getCoverSourceRect } from "@/lib/frames/geometry";
import { loadImage } from "@/lib/frames/image";
import type { FrameSlot } from "@/lib/frames/types";
import { createClient } from "@/lib/supabase/client";

export type BoothFrame = {
  id: number;
  name: string;
  /** URL publik overlay PNG (frame.frames). */
  imageUrl: string | null;
  width: number;
  height: number;
  slots: FrameSlot[];
  isFree: boolean;
};

type ToastState = {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
};

const CAMERA_ICON_PATH =
  "M149.1 64.8L138.7 96 64 96C28.7 96 0 124.7 0 160L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-256c0-35.3-28.7-64-64-64l-74.7 0L362.9 64.8C356.4 45.2 338.1 32 317.4 32L194.6 32c-20.7 0-39 13.2-45.5 32.8zM256 192a96 96 0 1 1 0 192 96 96 0 1 1 0-192z";

const COUNTDOWN_OPTIONS = [3, 5, 10, 0];
const TESTIMONI_EMOJIS = ["😊", "😍", "🤩", "😎", "🥰"];

const PANEL_WIDTH = 190;
const PANEL_MAX_HEIGHT = 500;
const CAPTURE_OUTPUT_WIDTH = 1200;
const STRIP_EXPORT_WIDTH = 1080;
const GIF_WIDTH = 1080;
const GIF_HEIGHT = 810;
const FRAME_BACKGROUND = "#FEF3E2";

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, payload] = dataUrl.split(",");
  const mime = header.slice(header.indexOf(":") + 1, header.indexOf(";"));
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

function triggerDownload(href: string, filename: string): void {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function isHeicFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

async function prepareImageFile(file: File): Promise<Blob> {
  if (!isHeicFile(file)) {
    return file;
  }
  const { default: heic2any } = await import("heic2any");
  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.9,
  });
  return Array.isArray(result) ? result[0] : result;
}

function fileToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsDataURL(blob);
  });
}

export function BoothClient({
  frame,
  orderId,
}: {
  frame: BoothFrame;
  orderId: string | null;
}) {
  const slots = frame.slots;
  const totalSlots = slots.length;

  const [photos, setPhotos] = useState<Array<string | null>>(() =>
    slots.map(() => null),
  );
  const [isMirrored, setIsMirrored] = useState(false);
  const [filter, setFilter] = useState("none");
  const [countdownSetting, setCountdownSetting] = useState(3);
  const [countdownDisplay, setCountdownDisplay] = useState<string | null>(null);
  const [isFlashEnabled, setIsFlashEnabled] = useState(false);
  const [isFlashVisible, setIsFlashVisible] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [retakeIndex, setRetakeIndex] = useState<number | null>(null);
  const [revealedSlot, setRevealedSlot] = useState<number | null>(null);
  const [isResetOpen, setIsResetOpen] = useState(false);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  const [gifProgress, setGifProgress] = useState({
    percentage: 0,
    text: "Initializing...",
  });
  const [isGifLoading, setIsGifLoading] = useState(false);

  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [driveProgress, setDriveProgress] = useState({
    percentage: 0,
    text: "Mempersiapkan upload...",
  });

  const [isTestimoniOpen, setIsTestimoniOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [emoji, setEmoji] = useState("");
  const [testimoniName, setTestimoniName] = useState("");
  const [testimoniMessage, setTestimoniMessage] = useState("");
  const [isSubmittingTestimoni, setIsSubmittingTestimoni] = useState(false);

  const [hasGif, setHasGif] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isUploadSlotOpen, setIsUploadSlotOpen] = useState(false);
  const [crop, setCrop] = useState<CropRequest | null>(null);
  const [isAutoCaptureEnabled, setIsAutoCaptureEnabled] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [isSessionEndOpen, setIsSessionEndOpen] = useState(false);
  const [sessionAlert, setSessionAlert] = useState<null | "takeover">(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const gifBlobRef = useRef<Blob | null>(null);
  const hasShownTestimoniRef = useRef(false);
  const toastIdRef = useRef(0);
  const photosRef = useRef<Array<string | null>>(photos);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingFileRef = useRef<File | null>(null);
  const isAutoCapturingRef = useRef(false);

  const router = useRouter();
  const downloadedKey = `boothDownloaded_${orderId ?? `frame_${frame.id}`}`;

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  const { blocked, forceNewSession } = useSingleSession({
    enabled: !frame.isFree,
    orderId,
    frameId: frame.id,
    onTakeover: () => setSessionAlert("takeover"),
  });

  const goToMainMenu = useCallback(() => {
    router.push("/");
  }, [router]);

  useEffect(() => {
    const startTimer = window.setTimeout(() => {
      let downloaded = false;
      if (!frame.isFree) {
        try {
          downloaded = window.localStorage.getItem(downloadedKey) === "1";
        } catch {
          downloaded = false;
        }
      }
      if (downloaded) {
        setHasDownloaded(true);
        setIsSessionEndOpen(true);
      } else {
        setIsWelcomeOpen(true);
      }
    }, 500);
    return () => window.clearTimeout(startTimer);
  }, [downloadedKey, frame.isFree]);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration = 4000) => {
      toastIdRef.current += 1;
      setToast({ id: toastIdRef.current, message, type, duration });
    },
    [],
  );

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  const scale = useMemo(
    () =>
      Math.min(PANEL_WIDTH / frame.width, PANEL_MAX_HEIGHT / frame.height),
    [frame.height, frame.width],
  );
  const panelWidth = Math.round(frame.width * scale);
  const panelHeight = Math.round(frame.height * scale);

  const takenCount = photos.filter(Boolean).length;
  const allPhotosTaken = takenCount === totalSlots;
  const showFlashToggle =
    facingMode === "user" || (isMobileDevice() && facingMode === "environment");
  /* Flash hanya berlaku saat tombolnya tampil: di Laravel, menyembunyikan tombol
   * flash saat berpindah ke kamera belakang desktop juga mematikan flash. */
  const flashEnabled = showFlashToggle && isFlashEnabled;

  /* --- Kamera ------------------------------------------------------------ */

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const attachStream = useCallback(
    async (stream: MediaStream, mode: "user" | "environment") => {
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        try {
          await video.play();
        } catch {
          /* putar otomatis bisa ditunda browser; elemen tetap menampilkan frame */
        }
      }
      setFacingMode(mode);
      setCameraError(null);
    },
    [],
  );

  const startWebcam = useCallback(
    async (mode: "user" | "environment") => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices) {
        setCameraError("Kamera tidak tersedia di perangkat ini.");
        return;
      }

      const requestStream = async (
        target: "user" | "environment",
      ): Promise<MediaStream | null> => {
        const ios = isIosDevice();
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
          });
        } catch {
          if (!ios) return null;
          try {
            return await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: target,
                width: { min: 640, ideal: 1280 },
                height: { min: 480, ideal: 720 },
              },
              audio: false,
            });
          } catch {
            return null;
          }
        }
      };

      stopStream();

      const stream =
        (await requestStream(mode)) ??
        (mode === "environment" ? await requestStream("user") : null);

      if (!stream) {
        setCameraError(
          "Gagal mengakses kamera. Pastikan izin kamera sudah diberikan lalu muat ulang halaman.",
        );
        return;
      }

      await attachStream(stream, mode);
    },
    [attachStream, stopStream],
  );

  useEffect(() => {
    /* Ditunda satu tick agar pemanggilan setState pertama tidak terjadi di dalam
     * badan effect (aturan react-hooks/set-state-in-effect). */
    const startTimer = window.setTimeout(() => {
      void startWebcam("user");
    }, 0);
    return () => {
      window.clearTimeout(startTimer);
      stopStream();
      if (countdownTimerRef.current !== null) {
        window.clearInterval(countdownTimerRef.current);
      }
    };
  }, [startWebcam, stopStream]);

  /* --- Tangkap foto ------------------------------------------------------ */

  const triggerNativeFlash = useCallback(async (): Promise<boolean> => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return false;
    try {
      const capabilities = track.getCapabilities();
      if (!("torch" in capabilities)) return false;
      await track.applyConstraints({
        advanced: [{ torch: true } as unknown as MediaTrackConstraintSet],
      });
      await sleep(1000);
      await track.applyConstraints({
        advanced: [{ torch: false } as unknown as MediaTrackConstraintSet],
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const captureImage = useCallback(
    async (target: number) => {
      const video = videoRef.current;
      const slot = slots[target];
      if (!video || !slot || video.videoWidth === 0 || video.videoHeight === 0) {
        setIsCapturing(false);
        setCountdownDisplay(null);
        return;
      }

      // Simpan seluruh frame kamera (tidak langsung dipotong ke rasio slot)
      // supaya pengguna masih bisa memilih area potong lewat Recrop. Penyesuaian
      // ke ukuran frame terjadi saat ditampilkan/dikomposit (mode "cover").
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      const outputScale = CAPTURE_OUTPUT_WIDTH / Math.max(videoWidth, videoHeight);

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(videoWidth * outputScale);
      canvas.height = Math.round(videoHeight * outputScale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setIsCapturing(false);
        setCountdownDisplay(null);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.save();
      if (isMirrored) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      const videoFilter = window.getComputedStyle(video).filter;
      ctx.filter = flashEnabled ? `${videoFilter} brightness(1.2)` : videoFilter;
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
      );
      ctx.restore();

      const dataUrl = canvas.toDataURL("image/png", 1.0);
      setPhotos((previous) => {
        const next = [...previous];
        next[target] = dataUrl;
        return next;
      });
      setIsCapturing(false);
      setCountdownDisplay(null);
    },
    [flashEnabled, isMirrored, slots],
  );

  const captureWithFlash = useCallback(
    async (target: number) => {
      if (!flashEnabled) {
        await captureImage(target);
        return;
      }
      if (isMobileDevice() && facingMode === "environment") {
        const usedNativeFlash = await triggerNativeFlash();
        if (usedNativeFlash) {
          await sleep(100);
          await captureImage(target);
          return;
        }
      }
      setIsFlashVisible(true);
      await sleep(1000);
      setIsFlashVisible(false);
      await captureImage(target);
    },
    [captureImage, facingMode, flashEnabled, triggerNativeFlash],
  );

  const startCountdown = useCallback(
    (target: number) => {
      if (isCapturing) return;
      setIsCapturing(true);

      if (countdownSetting === 0) {
        void captureWithFlash(target);
        return;
      }

      let remaining = countdownSetting;
      setCountdownDisplay(String(remaining));
      countdownTimerRef.current = window.setInterval(() => {
        remaining -= 1;
        if (remaining > 0) {
          setCountdownDisplay(String(remaining));
          return;
        }
        if (countdownTimerRef.current !== null) {
          window.clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        setCountdownDisplay("");
        void captureWithFlash(target);
      }, 1000);
    },
    [captureWithFlash, countdownSetting, isCapturing],
  );

  function handleCaptureClick() {
    if (isCapturing || allPhotosTaken || isAutoCapturingRef.current) return;
    if (isAutoCaptureEnabled) {
      void runAutoCapture();
      return;
    }
    const nextEmptySlot = photos.findIndex((photo) => !photo);
    if (nextEmptySlot === -1) return;
    startCountdown(nextEmptySlot);
  }

  async function captureWithCountdown(target: number) {
    if (countdownSetting === 0) {
      await captureWithFlash(target);
      return;
    }
    for (let remaining = countdownSetting; remaining > 0; remaining -= 1) {
      setCountdownDisplay(String(remaining));
      await sleep(1000);
    }
    setCountdownDisplay("");
    await captureWithFlash(target);
  }

  async function runAutoCapture() {
    const filled = new Set<number>();
    photosRef.current.forEach((photo, index) => {
      if (photo) filled.add(index);
    });
    const firstEmpty = slots.findIndex((_, index) => !filled.has(index));
    if (firstEmpty === -1) {
      showToast("Semua slot sudah terisi!", "warning");
      setIsAutoCaptureEnabled(false);
      return;
    }
    isAutoCapturingRef.current = true;
    showToast("Auto Capture dimulai! Foto diambil berurutan.", "info", 3000);
    try {
      let target = firstEmpty;
      while (target !== -1 && isAutoCapturingRef.current) {
        await captureWithCountdown(target);
        filled.add(target);
        target = slots.findIndex((_, index) => !filled.has(index));
      }
    } finally {
      isAutoCapturingRef.current = false;
      setIsAutoCaptureEnabled(false);
    }
    showToast("Auto Capture selesai!", "success", 3000);
  }

  function clearPhotoSlot(index: number) {
    setPhotos((previous) => {
      const next = [...previous];
      next[index] = null;
      return next;
    });
  }

  function setPhotoAt(index: number, dataUrl: string) {
    setPhotos((previous) => {
      const next = [...previous];
      next[index] = dataUrl;
      return next;
    });
  }

  function resetPhotos() {
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setIsCapturing(false);
    setCountdownDisplay(null);
    setPhotos(slots.map(() => null));
    setPreviewImage(null);
    setIsPreviewOpen(false);
  }

  /* --- Upload & crop ----------------------------------------------------- */

  function handleUploadClick() {
    const input = fileInputRef.current;
    if (!input) return;
    input.value = "";
    input.click();
  }

  function handleFileSelected(file: File) {
    pendingFileRef.current = file;
    setIsUploadSlotOpen(true);
  }

  async function handleSlotChosen(index: number) {
    const file = pendingFileRef.current;
    setIsUploadSlotOpen(false);
    pendingFileRef.current = null;
    if (!file) return;
    const slot = slots[index];
    if (!slot) return;
    try {
      showToast("Mempersiapkan foto...", "info", 2500);
      const prepared = await prepareImageFile(file);
      const src = await fileToDataUrl(prepared);
      setCrop({
        src,
        aspectRatio: slot.w / slot.h,
        mode: "crop",
        onConfirm: (dataUrl) => {
          setPhotoAt(index, dataUrl);
          setCrop(null);
        },
      });
    } catch {
      showToast(
        "Gagal memproses file. Gunakan format JPEG/PNG bila HEIC gagal.",
        "error",
      );
    }
  }

  function openRecrop(index: number) {
    const photo = photos[index];
    const slot = slots[index];
    if (!photo || !slot) return;
    setCrop({
      src: photo,
      aspectRatio: slot.w / slot.h,
      mode: "recrop",
      onConfirm: (dataUrl) => {
        setPhotoAt(index, dataUrl);
        setCrop(null);
      },
    });
  }

  /* --- Share ------------------------------------------------------------- */

  async function sharePhotoStrip() {
    if (!previewImage) {
      showToast("Tidak ada foto yang siap dibagikan", "error");
      return;
    }
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
      showToast(
        "Perangkat ini tidak mendukung fitur Share. Silakan unduh saja.",
        "warning",
      );
      return;
    }
    try {
      const blob = dataUrlToBlob(previewImage);
      const file = new File([blob], "photo-strip.png", { type: "image/png" });
      const canShareFiles =
        typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
      if (canShareFiles) {
        await navigator.share({
          title: "My Photo Strip",
          text: "Yuk, intip hasil foto dari PanoriCam! Follow @panoricam buat update seru lainnya!",
          files: [file],
        });
      } else {
        await navigator.share({
          title: "My Photo Strip",
          text: "Check out my photo strip!",
          url: window.location.href,
        });
      }
      if (!hasShownTestimoniRef.current) {
        window.setTimeout(() => showTestimoniModal(), 1000);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      showToast("Sharing gagal. Silakan unduh fotonya saja.", "error");
    }
  }

  /* --- Komposit strip ---------------------------------------------------- */

  const buildStripDataUrl = useCallback(
    async (quality: number): Promise<string | null> => {
      if (photos.every((photo) => !photo)) return null;

      let overlay: CanvasImageSource;
      if (frame.imageUrl) {
        overlay = await loadImage(frame.imageUrl, true);
      } else {
        const empty = document.createElement("canvas");
        empty.width = frame.width;
        empty.height = frame.height;
        overlay = empty;
      }

      const photoImages = await Promise.all(
        photos.map((photo) => (photo ? loadImage(photo) : Promise.resolve(null))),
      );

      const composed = composeStrip({
        width: frame.width,
        height: frame.height,
        slots,
        photos: photoImages,
        overlay,
      });

      const output = document.createElement("canvas");
      const outputScale = STRIP_EXPORT_WIDTH / frame.width;
      output.width = STRIP_EXPORT_WIDTH;
      output.height = Math.round(frame.height * outputScale);
      const ctx = output.getContext("2d");
      if (!ctx) return null;

      // Samakan dengan preview /booth: latar putih. PNG frame bisa punya tepi
      // transparan (mis. 1px kiri / 3px bawah) yang menjadi garis putih pada
      // hasil; gambar digambar sedikit lebih besar (overscan) agar tepi
      // transparan itu terdorong keluar kanvas -> hasil penuh tanpa garis putih.
      const overscan = Math.max(2, Math.ceil(outputScale * 4));
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, output.width, output.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        composed,
        -overscan,
        -overscan,
        output.width + overscan * 2,
        output.height + overscan * 2,
      );

      return output.toDataURL("image/png", quality);
    },
    [frame.height, frame.imageUrl, frame.width, photos, slots],
  );

  async function openPreviewModal() {
    if (isComposing) return;
    showToast("Mempersiapkan preview...", "info", 2000);
    setIsComposing(true);
    try {
      const image = await buildStripDataUrl(1.0);
      if (!image) {
        showToast("Tidak ada foto yang siap dipreview", "error");
        return;
      }
      setPreviewImage(image);
      setIsPreviewOpen(true);
    } catch {
      showToast("Gagal memuat preview", "error");
    } finally {
      setIsComposing(false);
    }
  }

  async function downloadPhotoStrip() {
    if (isComposing) return;
    showToast("Sedang memproses foto, harap tunggu...", "info", 3000);
    setIsComposing(true);
    try {
      const image = await buildStripDataUrl(0.9);
      if (!image) {
        showToast("Tidak ada foto yang siap diunduh", "error");
        return;
      }
      setPreviewImage(image);
      triggerDownload(image, "Panoricam💫.png");
      if (!frame.isFree) {
        setHasDownloaded(true);
        try {
          window.localStorage.setItem(downloadedKey, "1");
        } catch {
          /* localStorage bisa diblokir; tidak fatal */
        }
      }
      showToast("Download berhasil!", "success", 2000);
      if (!hasShownTestimoniRef.current) {
        window.setTimeout(() => showTestimoniModal(), 1000);
      }
    } catch {
      showToast("Gagal membuat foto strip HD. Coba lagi.", "error");
    } finally {
      setIsComposing(false);
    }
  }

  function handleClosePreview() {
    if (!frame.isFree && hasDownloaded) {
      setIsExitConfirmOpen(true);
      return;
    }
    setIsPreviewOpen(false);
  }

  /* --- GIF --------------------------------------------------------------- */

  const createGifBlob = useCallback((): Promise<Blob> => {
    const availablePhotos = photos.filter(
      (photo): photo is string => typeof photo === "string",
    );

    return new Promise<Blob>((resolve, reject) => {
      if (availablePhotos.length === 0) {
        reject(new Error("Tidak ada foto untuk dibuat GIF"));
        return;
      }

      // Rasio kanvas GIF disamakan dengan slot pada frame terpilih supaya tiap
      // foto mengisi penuh (tanpa margin latar) seperti pada preview /booth.
      const refSlot = slots.find((slot) => slot.w > 0 && slot.h > 0);
      const gifWidth = GIF_WIDTH;
      const gifHeight = refSlot
        ? Math.max(1, Math.round((GIF_WIDTH * refSlot.h) / refSlot.w))
        : GIF_HEIGHT;

      const gif = new GIF({
        workers: 4,
        quality: 10,
        width: gifWidth,
        height: gifHeight,
        dither: false,
        workerScript: "/js/gif.worker.js",
      });

      gif.on("progress", (progress: number) => {
        setGifProgress({
          percentage: Math.round(progress * 100),
          text: `Memproses frame ${Math.ceil(progress * availablePhotos.length)} dari ${availablePhotos.length}...`,
        });
      });
      gif.on("finished", (blob: Blob) => resolve(blob));
      gif.on("error", (error: Error) => reject(error));

      let processed = 0;
      const onFrameDone = () => {
        processed += 1;
        if (processed === availablePhotos.length) {
          setGifProgress({ percentage: 50, text: "Menyusun GIF HD..." });
          gif.render();
        }
      };

      availablePhotos.forEach((photo) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = gifWidth;
          canvas.height = gifHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.fillStyle = FRAME_BACKGROUND;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const sourceWidth = image.naturalWidth || image.width;
            const sourceHeight = image.naturalHeight || image.height;
            if (sourceWidth > 0 && sourceHeight > 0) {
              const { sx, sy, sw, sh } = getCoverSourceRect(
                sourceWidth,
                sourceHeight,
                gifWidth,
                gifHeight,
              );
              ctx.drawImage(image, sx, sy, sw, sh, 0, 0, gifWidth, gifHeight);
            }
          }
          gif.addFrame(canvas, { delay: 1000, copy: true });
          setGifProgress({
            percentage: ((processed + 1) / availablePhotos.length) * 50,
            text: `Memuat foto HD ${processed + 1} dari ${availablePhotos.length}...`,
          });
          onFrameDone();
        };
        image.onerror = () => {
          onFrameDone();
        };
        image.src = photo;
      });
    });
  }, [photos, slots]);

  async function handleCreateGif() {
    setIsGifLoading(true);
    setGifProgress({ percentage: 0, text: "Membuat GIF HD..." });
    try {
      const blob = await createGifBlob();
      gifBlobRef.current = blob;
      setHasGif(true);
      setIsGifLoading(false);

      const url = URL.createObjectURL(blob);
      triggerDownload(url, "PanoricamGif✨.gif");
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

      showToast(
        "GIF HD berhasil dibuat! Sekarang Anda bisa mengirim foto dan GIF via email.",
        "success",
        3000,
      );
    } catch {
      setIsGifLoading(false);
      showToast("Gagal membuat GIF", "error");
    }
  }

  /* --- Email ------------------------------------------------------------- */

  function showEmailModal() {
    if (!previewImage) {
      showToast("Tidak ada foto yang siap dikirim", "error");
      return;
    }
    setEmail("");
    setIsEmailOpen(true);
  }

  async function sendPhotoToDrive() {
    const target = email.trim();
    if (!target) {
      showToast("Mohon masukkan alamat email", "error");
      return;
    }
    if (!isValidEmail(target)) {
      showToast("Format email tidak valid", "error");
      return;
    }
    if (!previewImage) {
      showToast("Tidak ada foto yang siap dikirim", "error");
      return;
    }

    setIsEmailOpen(false);
    setIsSending(true);
    setDriveProgress({ percentage: 10, text: "Mempersiapkan file..." });

    try {
      const photoBlob = dataUrlToBlob(previewImage);
      setDriveProgress({ percentage: 30, text: "Menyiapkan foto PNG..." });

      let gifFile = gifBlobRef.current;
      if (gifFile) {
        setDriveProgress({ percentage: 40, text: "Menyiapkan GIF animasi..." });
      } else {
        setDriveProgress({ percentage: 40, text: "Membuat GIF animasi..." });
        gifFile = await createGifBlob();
        gifBlobRef.current = gifFile;
        setHasGif(true);
      }

      setDriveProgress({ percentage: 60, text: "Mengupload file..." });

      const uploadResponse = await fetch("/api/send-email/upload-urls", {
        method: "POST",
      });
      const uploadTargets = (await uploadResponse.json()) as {
        success?: boolean;
        message?: string;
        photo?: { path: string; token: string };
        gif?: { path: string; token: string };
      };
      if (
        !uploadResponse.ok ||
        !uploadTargets.success ||
        !uploadTargets.photo ||
        !uploadTargets.gif
      ) {
        throw new Error(uploadTargets.message ?? "Gagal menyiapkan upload");
      }

      const supabase = createClient();
      const photoUpload = await supabase.storage
        .from(STORAGE_BUCKETS.photoResults)
        .uploadToSignedUrl(
          uploadTargets.photo.path,
          uploadTargets.photo.token,
          photoBlob,
          { contentType: "image/png" },
        );
      if (photoUpload.error) {
        throw new Error(`Gagal mengunggah foto: ${photoUpload.error.message}`);
      }

      setDriveProgress({ percentage: 75, text: "Mengupload GIF..." });
      const gifUpload = await supabase.storage
        .from(STORAGE_BUCKETS.photoResults)
        .uploadToSignedUrl(
          uploadTargets.gif.path,
          uploadTargets.gif.token,
          gifFile,
          { contentType: "image/gif" },
        );
      if (gifUpload.error) {
        throw new Error(`Gagal mengunggah GIF: ${gifUpload.error.message}`);
      }

      setDriveProgress({ percentage: 85, text: "Mengirim email..." });

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: target,
          frame_id: frame.id,
          photo_path: uploadTargets.photo.path,
          gif_path: uploadTargets.gif.path,
        }),
      });
      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Gagal mengirim file");
      }

      setDriveProgress({ percentage: 100, text: "Berhasil!" });
      await sleep(1000);
      setIsSending(false);
      showToast(
        `Foto dan GIF berhasil dikirim ke email ${target}`,
        "success",
        5000,
      );

      if (!hasShownTestimoniRef.current) {
        window.setTimeout(() => showTestimoniModal(), 2000);
      }
    } catch (error) {
      setIsSending(false);
      showToast(
        `Gagal mengirim file: ${
          error instanceof Error ? error.message : "kesalahan tidak diketahui"
        }`,
        "error",
      );
    }
  }

  /* --- Testimoni --------------------------------------------------------- */

  function showTestimoniModal() {
    if (hasShownTestimoniRef.current) return;
    hasShownTestimoniRef.current = true;
    setIsTestimoniOpen(true);
    window.setTimeout(() => {
      showToast("Silakan berikan rating dan testimoni Anda! 😊", "info", 3000);
    }, 800);
  }

  function closeTestimoniModal() {
    setIsTestimoniOpen(false);
    setToast(null);
  }

  async function submitTestimoni() {
    if (rating === 0) {
      showToast("Mohon berikan rating terlebih dahulu! ⭐", "warning");
      return;
    }
    if (testimoniName.trim().length < 2) {
      showToast("Mohon masukkan nama Anda (minimal 2 karakter)! 👤", "error");
      return;
    }
    if (testimoniMessage.trim().length < 10) {
      showToast(
        "Mohon tuliskan testimoni Anda (minimal 10 karakter)! 💬",
        "error",
      );
      return;
    }
    if (!emoji) {
      showToast(
        "Mohon pilih emoji yang sesuai dengan pengalaman Anda! 😊",
        "warning",
      );
      return;
    }

    setIsSubmittingTestimoni(true);
    try {
      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          emoji,
          name: testimoniName.trim(),
          message: testimoniMessage.trim(),
          frame_id: frame.id,
        }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || !data.success) {
        showToast(
          data.message ?? "Gagal mengirim testimoni. Silakan coba lagi.",
          "error",
        );
        return;
      }

      showToast("Terima kasih atas testimoni Anda! 🙏✨", "success", 5000);
      closeTestimoniModal();
      setRating(0);
      setEmoji("");
      setTestimoniName("");
      setTestimoniMessage("");
      window.setTimeout(() => {
        showToast("Kami sangat menghargai masukan Anda! 😊", "success", 3000);
      }, 1500);
    } catch {
      showToast("Terjadi kesalahan saat mengirim testimoni. Silakan coba lagi. 🔄", "error");
    } finally {
      setIsSubmittingTestimoni(false);
    }
  }

  /* --- Render ------------------------------------------------------------ */

  const captureLabel = isCapturing
    ? `Capturing ${takenCount}/${totalSlots}...`
    : allPhotosTaken
      ? "All Photos Taken"
      : `Capture ${takenCount}/${totalSlots}`;

  const countdownText = countdownSetting === 0 ? "0s" : `${countdownSetting}s`;

  return (
    <div className="page-booth relative flex min-h-screen flex-col items-center bg-[#FEF3E2]">
      {toast ? (
        <BoothToast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onDone={dismissToast}
        />
      ) : null}

      <Link
        href="/frame"
        className="absolute top-14 left-14 z-50 hidden text-2xl font-bold text-[#BF3131] hover:text-[#F16767] sm:block"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 448 512"
          className="h-8 w-8"
          fill="currentColor"
        >
          <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" />
        </svg>
      </Link>

      <div className="relative z-20 flex w-full max-w-7xl flex-col items-center px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-5 rounded-lg bg-transparent text-center text-5xl font-semibold text-gray-800">
          <span className="text-red-600">C</span>
          <span className="text-pink-300">A</span>
          <span className="text-green-400">P</span>
          <span className="text-yellow-300">T</span>
          <span className="text-blue-300">U</span>
          <span className="text-purple-400">R</span>
          <span className="text-yellow-300">E</span>{" "}
          <span className="text-blue-300">T</span>
          <span className="text-green-300">I</span>
          <span className="text-orange-300">M</span>
          <span className="text-purple-400">E</span>
          <span className="text-pink-300">!</span>
        </h1>

        {!frame.isFree ? (
          <div className="flex flex-col items-start justify-center gap-8 pb-5 md:flex-row md:gap-20">
            <div className="max-w3xl w-full rounded-lg border-l-4 border-yellow-500 bg-yellow-100 p-4 text-yellow-700 shadow-md">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">
                    Frame Premium - Tolong gunakan frame hingga selesai di download,
                    agar session foto tidak hilang
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col items-start justify-center gap-8 md:flex-row md:gap-20">
          <div className="w-full md:w-auto">
            <div
              className="relative mx-auto"
              style={{ width: "min(90vw, 660px)", maxWidth: "660px", aspectRatio: "4/3" }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full rounded-xl bg-gray-200 object-cover shadow-md"
                style={{ transform: isMirrored ? "scaleX(-1)" : "none", filter }}
              />

              <div
                id="countdown-overlay"
                className="pointer-events-none absolute top-0 left-0 flex h-full w-full items-center justify-center text-8xl font-bold text-white"
              >
                {countdownDisplay}
              </div>
              <div
                id="flash-overlay"
                className={isFlashVisible ? "active" : undefined}
              />

              <button
                type="button"
                id="floatingSettingsToggle"
                className={`floating-settings-toggle ${isSettingsOpen ? "active" : ""}`}
                title="Settings"
                onClick={() => setIsSettingsOpen((open) => !open)}
              >
                <i className="fa-solid fa-gear text-white" />
              </button>

              <div
                id="floatingOptions"
                className={`floating-options ${isSettingsOpen ? "" : "hidden"}`}
              >
                <button
                  type="button"
                  id="floatingCameraToggle"
                  className="floating-option floating-camera-toggle"
                  title="Switch Camera"
                  onClick={() => {
                    void startWebcam(
                      facingMode === "user" ? "environment" : "user",
                    );
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    fill="currentColor"
                  >
                    <path d="M448 224c0 35.3-28.7 64-64 64s-64-28.7-64-64s28.7-64 64-64s64 28.7 64 64zM224 256c-35.3 0-64-28.7-64-64s28.7-64 64-64s64 28.7 64 64s-28.7 64-64 64zm-256 0c0-17.7 14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32s-32-14.3-32-32zm256 192c-35.3 0-64-28.7-64-64s28.7-64 64-64s64 28.7 64 64s-28.7 64-64 64z" />
                  </svg>
                </button>
                <button
                  type="button"
                  id="floatingMirrorToggle"
                  className={`floating-option floating-mirror-toggle ${isMirrored ? "active" : ""}`}
                  title={`Toggle Mirror: ${isMirrored ? "On" : "Off"}`}
                  onClick={() => setIsMirrored((mirrored) => !mirrored)}
                >
                  <i className="fa-solid fa-clone mt-2 text-white" />
                </button>
                <button
                  type="button"
                  id="floatingCountdownToggle"
                  className={`floating-option floating-countdown-toggle ${countdownSetting !== 0 ? "active" : ""}`}
                  title={`Countdown: ${countdownText}`}
                  onClick={() => {
                    const currentIndex = COUNTDOWN_OPTIONS.indexOf(countdownSetting);
                    const nextIndex = (currentIndex + 1) % COUNTDOWN_OPTIONS.length;
                    setCountdownSetting(COUNTDOWN_OPTIONS[nextIndex]);
                  }}
                >
                  <span className="countdown-text">{countdownText}</span>
                </button>
                {showFlashToggle ? (
                  <button
                    type="button"
                    id="floatingFlashToggle"
                    className={`floating-option floating-flash-toggle ${flashEnabled ? "active" : ""}`}
                    title={`Flash: ${flashEnabled ? "On" : "Off"}`}
                    onClick={() => setIsFlashEnabled((enabled) => !enabled)}
                  >
                    <i className="fa-solid fa-bolt mt-2 text-white" />
                  </button>
                ) : null}
                <button
                  type="button"
                  id="floatingAutoToggle"
                  className={`floating-option floating-auto-toggle ${isAutoCaptureEnabled ? "active" : ""}`}
                  title={`Auto Capture: ${isAutoCaptureEnabled ? "On" : "Off"}`}
                  onClick={() => setIsAutoCaptureEnabled((enabled) => !enabled)}
                >
                  <i className="fa-solid fa-robot mt-2 text-white" />
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
              <select
                id="filterSelect"
                className="w-auto cursor-pointer rounded-xl border-2 border-[#BF3131] bg-white px-3 py-2 text-sm font-medium transition-all duration-300 ease-in-out hover:bg-[#F16767] hover:text-white sm:px-4 sm:py-2.5 sm:text-base"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option value="none">No Filter</option>
                <option value="grayscale(100%)">Grayscale</option>
                <option value="sepia(100%)">Sepia</option>
                <option value="contrast(150%)">High Contrast</option>
                <option value="brightness(120%)">Bright</option>
              </select>
            </div>

            <div className="mt-5 flex w-full flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                id="captureButton"
                disabled={allPhotosTaken || isCapturing}
                onClick={handleCaptureClick}
                className="flex cursor-pointer gap-2 rounded-xl border border-transparent bg-[#BF3131] px-6 py-3 text-base font-semibold text-white shadow-sm transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#F16767] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  className={`h-5 w-5 ${isCapturing ? "animate-pulse" : ""}`}
                  fill="currentColor"
                >
                  <path d={CAMERA_ICON_PATH} />
                </svg>
                {captureLabel}
              </button>

              <button
                type="button"
                id="uploadButton"
                onClick={handleUploadClick}
                className="flex cursor-pointer gap-2 rounded-xl border border-transparent bg-[#BF3131] px-6 py-3 text-base font-semibold text-white shadow-sm transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#F16767] hover:shadow-lg"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  className="h-5 w-5"
                  fill="currentColor"
                >
                  <path d="M288 109.3L288 352c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-242.7-73.4 73.4c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l128-128c12.5-12.5 32.8-12.5 45.3 0l128 128c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L288 109.3zM64 352l128 0c0 35.3 28.7 64 64 64s64-28.7 64-64l128 0c35.3 0 64 28.7 64 64l0 32c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64l0-32c0-35.3 28.7-64 64-64zM432 456a24 24 0 1 0 0-48 24 24 0 1 0 0 48z" />
                </svg>
                Upload Photo
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    handleFileSelected(file);
                  }
                }}
              />
            </div>

            {cameraError ? (
              <p className="mt-4 text-center text-sm font-medium text-red-600">
                {cameraError}
              </p>
            ) : null}
          </div>

          <div
            className="frame-container relative"
            style={{ width: panelWidth, height: panelHeight }}
          >
            <div
              id="frameTemplate"
              className="relative h-full w-full rounded-lg bg-white shadow-lg"
            >
              {slots.map((slot, index) => {
                const slotStyle = {
                  left: slot.x * scale,
                  top: slot.y * scale,
                  width: slot.w * scale,
                  height: slot.h * scale,
                };
                return (
                  <div key={`placeholder-${index}`}>
                    {photos[index] ? null : (
                      <div
                        className="photo-overlay absolute z-10 rounded-sm border-2 border-dashed border-gray-300 bg-gray-100"
                        style={slotStyle}
                        data-slot={index}
                      />
                    )}
                  </div>
                );
              })}

              {slots.map((slot, index) => {
                const slotStyle = {
                  left: slot.x * scale,
                  top: slot.y * scale,
                  width: slot.w * scale,
                  height: slot.h * scale,
                };
                const photo = photos[index];
                return (
                  <div
                    key={`slot-${index}`}
                    className="absolute overflow-hidden"
                    style={slotStyle}
                    data-photo-index={index}
                    data-has-photo={photo ? "true" : "false"}
                    onClick={() => {
                      if (!photo || isCapturing) return;
                      setRevealedSlot((current) => (current === index ? null : index));
                    }}
                  >
                    <div className="photo-slot relative h-full w-full">
                      {photo ? (
                        <img
                          className="booth-photo h-full w-full bg-gray-100 object-cover"
                          src={photo}
                          alt={`Photo slot ${index + 1}`}
                        />
                      ) : null}
                      {photo ? (
                        <div
                          className={`photo-actions absolute inset-0 mr-5 flex items-center justify-center gap-5 ${
                            revealedSlot === index ? "is-visible" : ""
                          }`}
                        >
                          <button
                            type="button"
                            className="retake-button booth-retake-button flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-lg shadow-md transition-all hover:bg-white"
                            data-index={index}
                            data-has-photo="true"
                            title="Retake Photo"
                            onClick={(event) => {
                              event.stopPropagation();
                              if (!isCapturing) setRetakeIndex(index);
                            }}
                          >
                            ⟲
                          </button>
                          <button
                            type="button"
                            className="recrop-button booth-recrop-button flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-lg shadow-md transition-all hover:bg-white"
                            data-index={index}
                            data-has-photo="true"
                            title="Recrop Photo"
                            onClick={(event) => {
                              event.stopPropagation();
                              if (!isCapturing) openRecrop(index);
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                              aria-hidden="true"
                            >
                              <path d="M6.13 1 6 16a2 2 0 0 0 2 2h15" />
                              <path d="M1 6.13 16 6a2 2 0 0 1 2 2v15" />
                            </svg>
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
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
                        <img
                          src="/logo.png"
                          alt="Watermark"
                          className="h-24"
                        />
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

            <p className="mt-5 text-center text-[10px] font-bold">
              TEKAN FOTO UNTUK RETAKE FOTO
            </p>
            <div className="mt-5 flex flex-col items-center justify-center gap-4">
              <button
                type="button"
                id="resetButton"
                className="w-full cursor-pointer rounded-xl border border-transparent bg-[#BF3131] px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#F16767] hover:shadow-lg sm:w-auto sm:px-4 sm:py-2.5 sm:text-base"
                onClick={() => {
                  if (takenCount > 0 && !isCapturing) {
                    setIsResetOpen(true);
                  }
                }}
              >
                🔁 Reset
              </button>
              <button
                type="button"
                id="finishButton"
                disabled={!allPhotosTaken}
                className={`w-full rounded-xl border border-transparent bg-[#BF3131] px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#F16767] hover:shadow-lg sm:w-auto sm:px-4 sm:py-2.5 sm:text-base ${
                  allPhotosTaken ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                }`}
                onClick={() => {
                  void openPreviewModal();
                }}
              >
                Selesai
              </button>
            </div>
          </div>
        </div>

        <div id="timer" className="mt-4 text-3xl font-bold text-gray-700" />
      </div>

      {retakeIndex !== null ? (
        <div
          id="retakeModal"
          className="fixed top-0 left-0 z-50 flex h-full w-full items-center justify-center overflow-auto bg-black/70"
        >
          <div
            id="retakeModalContent"
            className="relative mx-auto flex w-11/12 max-w-[450px] flex-col items-center rounded-3xl p-6 shadow-xl sm:p-8"
          >
            <button
              type="button"
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border-none bg-transparent text-2xl font-bold text-gray-500 transition-colors duration-200 hover:text-gray-800 focus:ring-2 focus:ring-[#BF3131] focus:outline-none"
              onClick={() => setRetakeIndex(null)}
            >
              &times;
            </button>
            <h2 className="mb-3 text-center text-2xl font-semibold text-gray-800 sm:text-3xl">
              Retake Your Photo?
            </h2>
            <p className="mb-6 px-2 text-center text-base text-gray-600 sm:text-lg">
              This will replace your current photo with a new one. Are you sure?
            </p>
            <div className="flex w-full justify-center gap-4">
              <button
                type="button"
                className="cursor-pointer rounded-xl border-none bg-gray-600 px-6 py-3 text-sm font-medium text-white shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:bg-gray-700 hover:shadow-lg"
                onClick={() => setRetakeIndex(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-xl border-none bg-[#BF3131] px-6 py-3 text-sm font-medium text-white shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#F16767] hover:shadow-lg"
                onClick={() => {
                  clearPhotoSlot(retakeIndex);
                  setRetakeIndex(null);
                }}
              >
                Retake
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isResetOpen ? (
        <div
          id="resetModal"
          className="fixed top-0 left-0 z-50 flex h-full w-full items-center justify-center overflow-auto bg-black/70"
        >
          <div
            id="resetModalContent"
            className="relative mx-auto flex w-11/12 max-w-[450px] flex-col items-center rounded-3xl p-6 shadow-xl sm:p-8"
          >
            <button
              type="button"
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border-none bg-transparent text-2xl font-bold text-gray-500 transition-colors duration-200 hover:text-gray-800 focus:ring-2 focus:ring-[#BF3131] focus:outline-none"
              onClick={() => setIsResetOpen(false)}
            >
              ×
            </button>
            <h2 className="mb-3 text-center text-2xl font-semibold text-gray-800 sm:text-3xl">
              Reset All Photos?
            </h2>
            <p className="mb-6 px-2 text-center text-base text-gray-600 sm:text-lg">
              This will clear all photos in the slots. This action cannot be
              undone.
            </p>
            <div className="flex w-full justify-center gap-4">
              <button
                type="button"
                className="cursor-pointer rounded-xl border-none bg-gray-600 px-6 py-3 text-sm font-medium text-white shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:bg-gray-700 hover:shadow-lg"
                onClick={() => setIsResetOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-xl border-none bg-[#BF3131] px-6 py-3 text-sm font-medium text-white shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#F16767] hover:shadow-lg"
                onClick={() => {
                  resetPhotos();
                  setIsResetOpen(false);
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isPreviewOpen ? (
        <div
          id="previewModal"
          className="fixed top-0 left-0 z-50 flex h-full w-full items-center justify-center overflow-auto bg-black/70"
        >
          <div
            id="modalContent"
            className="relative mx-auto flex w-4/5 max-w-[500px] transform flex-col items-center rounded-3xl bg-[#FEF3E2] p-8 shadow-lg transition-transform duration-300 ease-out sm:p-10"
          >
            <div
              id="dragHandle"
              className="mb-4 h-1.5 w-16 cursor-grab rounded-full bg-gray-300 md:hidden"
            />
            <button
              type="button"
              className="absolute top-3 right-3 cursor-pointer border-none bg-transparent text-3xl font-bold text-gray-400 hover:text-black"
              onClick={handleClosePreview}
            >
              ×
            </button>
            <h2 className="mb-4 text-xl font-bold text-gray-800">
              Preview Photo Strip
            </h2>
            <div className="mb-6 flex w-full justify-center">
              <div className="w-[160px] shadow-md" id="modalPhotostrip">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Preview photo strip"
                    className="w-full"
                  />
                ) : null}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                id="modalDownloadButton"
                className="cursor-pointer rounded-xl border-none bg-[#BF3131] px-5 py-2 text-sm font-medium text-white shadow-sm transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#F16767] hover:shadow-lg"
                onClick={() => {
                  void downloadPhotoStrip();
                }}
              >
                ⬇ Download PNG
              </button>
              <button
                type="button"
                id="modalDriveButton"
                className="cursor-pointer rounded-xl border-none bg-[#4285F4] px-5 py-2 text-sm font-medium text-white shadow-sm transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#3367D6] hover:shadow-lg"
                onClick={showEmailModal}
              >
                📧 Kirim Foto &amp; GIF
              </button>
              {frame.isFree ? (
                <button
                  type="button"
                  id="modalGifButton"
                  className="cursor-pointer rounded-xl border-none bg-[#4CAF50] px-5 py-2 text-sm font-medium text-white shadow-sm transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#45a049] hover:shadow-lg"
                  onClick={() => {
                    void handleCreateGif();
                  }}
                >
                  🎬 Create GIF
                </button>
              ) : null}
              {frame.isFree ? (
                <button
                  type="button"
                  id="modalShareButton"
                  className="cursor-pointer rounded-xl border-none bg-[#BF3131] px-5 py-2 text-sm font-medium text-white shadow-sm transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#F16767] hover:shadow-lg"
                  onClick={() => {
                    void sharePhotoStrip();
                  }}
                >
                  📤 Share
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {isGifLoading ? (
        <div
          id="gifLoadingModal"
          className="fixed top-0 left-0 z-50 flex h-full w-full items-center justify-center overflow-auto bg-black/70"
        >
          <div className="relative mx-auto flex w-4/5 max-w-[400px] flex-col items-center rounded-3xl bg-[#FEF3E2] p-8 shadow-lg">
            <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-[#BF3131] border-t-transparent" />
            <h3 className="mb-2 text-xl font-bold text-gray-800">
              Creating GIF...
            </h3>
            <p className="mb-4 text-center text-gray-600">
              Please wait while we process your photos into an animated GIF
            </p>
            <div
              id="gifProgress"
              className="mb-4 h-2.5 w-full rounded-full bg-gray-200"
            >
              <div
                id="gifProgressBar"
                className="h-2.5 rounded-full bg-[#BF3131] transition-all duration-300"
                style={{ width: `${gifProgress.percentage}%` }}
              />
            </div>
            <p id="gifProgressText" className="text-sm text-gray-500">
              {gifProgress.text}
            </p>
          </div>
        </div>
      ) : null}

      {isEmailOpen ? (
        <div
          id="emailModal"
          className="fixed top-0 left-0 z-50 flex h-full w-full items-center justify-center overflow-auto bg-black/70"
        >
          <div className="relative mx-auto flex w-4/5 max-w-[500px] flex-col items-center rounded-3xl bg-[#FEF3E2] p-8 shadow-lg">
            <button
              type="button"
              className="absolute top-4 right-4 cursor-pointer border-none bg-transparent text-3xl font-bold text-gray-400 hover:text-black"
              onClick={() => setIsEmailOpen(false)}
            >
              ×
            </button>

            <h2 className="mb-4 text-xl font-bold text-gray-800">
              Kirim Foto &amp; GIF ke Email
            </h2>

            <div className="mb-6 w-full">
              <label
                htmlFor="emailInput"
                className="mb-2 block font-medium text-gray-700"
              >
                Email tujuan:
              </label>
              <input
                type="email"
                id="emailInput"
                className="w-full rounded-xl border-2 border-gray-300 p-3 transition-colors duration-200 focus:border-[#4285F4] focus:outline-none"
                placeholder="masukkan email anda"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void sendPhotoToDrive();
                  }
                }}
              />
              <p className="mt-2 text-xs text-gray-500">
                Foto HD dan GIF animasi akan dikirim ke email ini
              </p>

              <div className="mt-4 rounded-lg bg-blue-50 p-3">
                <p className="text-sm font-medium text-blue-800">
                  File yang akan dikirim:
                </p>
                <ul className="mt-1 text-sm text-blue-700">
                  <li>• 📷 Foto Strip HD (PNG)</li>
                  <li>
                    {hasGif
                      ? "• 🎬 GIF animasi"
                      : "• 🎬 GIF animasi (akan dibuat otomatis)"}
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex w-full justify-center gap-3">
              <button
                type="button"
                id="cancelEmailButton"
                className="cursor-pointer rounded-xl border-none bg-gray-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-300 ease-in-out hover:scale-105 hover:bg-gray-600 hover:shadow-lg"
                onClick={() => setIsEmailOpen(false)}
              >
                Batal
              </button>
              <button
                type="button"
                id="sendToDriveButton"
                disabled={isSending}
                className="cursor-pointer rounded-xl border-none bg-[#4285F4] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#3367D6] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => {
                  void sendPhotoToDrive();
                }}
              >
                📧 Kirim Keduanya
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isSending ? (
        <div
          id="driveLoadingModal"
          className="fixed top-0 left-0 z-50 flex h-full w-full items-center justify-center overflow-auto bg-black/70"
        >
          <div className="relative mx-auto flex w-4/5 max-w-[400px] flex-col items-center rounded-3xl bg-[#FEF3E2] p-8 shadow-lg">
            <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-[#4285F4] border-t-transparent" />
            <h3 className="mb-2 text-xl font-bold text-gray-800">
              Mengupload ke Drive...
            </h3>
            <p className="mb-4 text-center text-gray-600">
              Sedang mengirim foto HD ke Google Drive
            </p>
            <div className="mb-4 h-2.5 w-full rounded-full bg-gray-200">
              <div
                id="driveProgressBar"
                className="h-2.5 rounded-full bg-[#4285F4] transition-all duration-300"
                style={{ width: `${driveProgress.percentage}%` }}
              />
            </div>
            <p id="driveProgressText" className="text-sm text-gray-500">
              {driveProgress.text}
            </p>
          </div>
        </div>
      ) : null}

      {isTestimoniOpen ? (
        <div
          id="testimoniModal"
          className="testimoni-modal fixed top-0 left-0 z-50 flex h-full w-full items-center justify-center overflow-auto bg-black/70"
        >
          <div className="relative mx-auto flex max-h-[90vh] w-[90%] max-w-[500px] flex-col items-center overflow-y-auto rounded-3xl bg-[#FEF3E2] p-6 shadow-lg sm:w-4/5 sm:p-8">
            <button
              type="button"
              className="absolute top-4 right-4 cursor-pointer border-none bg-transparent text-3xl font-bold text-gray-400 hover:text-black"
              onClick={closeTestimoniModal}
            >
              ×
            </button>

            <h2 className="mb-4 text-center text-2xl font-bold text-gray-800">
              Bagaimana pengalaman Anda?
            </h2>
            <p className="mb-6 text-center text-gray-600">
              Berikan rating dan testimoni untuk membantu kami berkembang!
            </p>

            <div className="rating-label mb-2 text-center font-medium text-gray-700">
              Berikan Rating <span style={{ color: "#ef4444" }}>*</span>
            </div>
            <div className="star-rating" id="starRating">
              {[1, 2, 3, 4, 5].map((value) => (
                <span
                  key={value}
                  className={`star ${rating >= value ? "active" : ""}`}
                  data-rating={value}
                  onClick={() => setRating(value)}
                >
                  ★
                </span>
              ))}
            </div>

            <div className="emoji-selector" id="emojiSelector">
              {TESTIMONI_EMOJIS.map((option) => (
                <span
                  key={option}
                  className={`emoji-option ${emoji === option ? "selected" : ""}`}
                  data-emoji={option}
                  onClick={() => setEmoji(option)}
                >
                  {option}
                </span>
              ))}
            </div>

            <div className="w-full">
              <input
                type="text"
                id="testimoniName"
                placeholder="Nama Anda *"
                minLength={2}
                maxLength={50}
                className="mb-4 w-full rounded-xl border-2 border-gray-300 p-3 transition-colors duration-200 focus:border-[#BF3131] focus:outline-none"
                value={testimoniName}
                onChange={(event) => setTestimoniName(event.target.value)}
              />

              <textarea
                id="testimoniMessage"
                placeholder="Ceritakan pengalaman Anda menggunakan photo booth ini... *"
                rows={4}
                minLength={10}
                maxLength={500}
                className="mb-4 w-full resize-none rounded-xl border-2 border-gray-300 p-3 transition-colors duration-200 focus:border-[#BF3131] focus:outline-none"
                value={testimoniMessage}
                onChange={(event) => setTestimoniMessage(event.target.value)}
              />

              <div className="-mt-3 mb-4 text-right text-xs text-gray-500">
                <span id="messageCounter">
                  {testimoniMessage.length}/500
                </span>
              </div>
            </div>

            <div className="mt-4 flex w-full justify-center gap-3">
              <button
                type="button"
                id="skipTestimoni"
                className="cursor-pointer rounded-xl border-none bg-gray-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-300 ease-in-out hover:scale-105 hover:bg-gray-600 hover:shadow-lg"
                onClick={closeTestimoniModal}
              >
                Lewati
              </button>
              <button
                type="button"
                id="submitTestimoni"
                disabled={isSubmittingTestimoni}
                className="cursor-pointer rounded-xl border-none bg-[#BF3131] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#F16767] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => {
                  void submitTestimoni();
                }}
              >
                {isSubmittingTestimoni ? "Mengirim..." : "Kirim Testimoni"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isUploadSlotOpen ? (
        <div
          id="uploadModal"
          className="fixed top-0 left-0 z-50 flex h-full w-full items-center justify-center overflow-auto bg-black/70"
        >
          <div className="relative mx-auto flex w-4/5 max-w-[600px] flex-col items-center rounded-3xl bg-[#FEF3E2] p-8 shadow-lg">
            <button
              type="button"
              className="absolute top-4 right-4 cursor-pointer border-none bg-transparent text-3xl font-bold text-gray-400 hover:text-black"
              onClick={() => {
                setIsUploadSlotOpen(false);
                pendingFileRef.current = null;
              }}
            >
              ×
            </button>
            <h2 className="mb-5 text-2xl font-bold text-gray-800">Pilih Slot Foto</h2>
            <p className="mb-5 text-gray-600">
              Pilih slot untuk menempatkan foto yang diupload:
            </p>
            <div className="mb-6 flex flex-wrap justify-center gap-4">
              {slots.map((slot, index) => (
                <button
                  key={`upload-slot-${index}`}
                  type="button"
                  className="slot-select-button cursor-pointer rounded-xl border-none bg-[#BF3131] px-6 py-3 text-base font-medium text-white shadow-sm transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#F16767] hover:shadow-lg"
                  onClick={() => {
                    void handleSlotChosen(index);
                  }}
                >
                  Slot {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {crop ? <CropModal request={crop} onClose={() => setCrop(null)} /> : null}

      {isExitConfirmOpen ? (
        <div
          id="exitConfirmationModal"
          className="fixed top-0 left-0 z-50 flex h-full w-full items-center justify-center overflow-auto bg-black/70"
        >
          <div className="relative mx-auto flex w-11/12 max-w-[450px] flex-col items-center rounded-3xl bg-[#FEF3E2] p-6 shadow-xl sm:p-8">
            <h2 className="mb-3 text-center text-2xl font-semibold text-gray-800 sm:text-3xl">
              Konfirmasi Keluar
            </h2>
            <p className="mb-6 px-2 text-center text-base text-gray-600 sm:text-lg">
              Anda telah mendownload foto. Apakah Anda yakin ingin kembali ke menu
              utama?
            </p>
            <div className="flex w-full justify-center gap-4">
              <button
                type="button"
                className="cursor-pointer rounded-xl border-none bg-gray-600 px-6 py-3 text-sm font-medium text-white shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:bg-gray-700 hover:shadow-lg"
                onClick={() => setIsExitConfirmOpen(false)}
              >
                Batal
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-xl border-none bg-[#BF3131] px-6 py-3 text-sm font-medium text-white shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#F16767] hover:shadow-lg"
                onClick={() => {
                  setIsExitConfirmOpen(false);
                  goToMainMenu();
                }}
              >
                Kembali ke Menu
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isSessionEndOpen ? (
        <div
          id="sessionEndModal"
          className="fixed top-0 left-0 z-50 flex h-full w-full items-center justify-center overflow-auto bg-black/70"
        >
          <div className="relative mx-auto flex w-11/12 max-w-[450px] flex-col items-center rounded-3xl bg-[#FEF3E2] p-6 shadow-xl sm:p-8">
            <h2 className="mb-3 text-center text-2xl font-semibold text-gray-800 sm:text-3xl">
              Sesi Selesai
            </h2>
            <p className="mb-6 px-2 text-center text-base text-gray-600 sm:text-lg">
              Sesi Anda telah selesai karena foto sudah didownload.
            </p>
            <div className="flex w-full justify-center gap-4">
              <button
                type="button"
                className="cursor-pointer rounded-xl border-none bg-[#BF3131] px-6 py-3 text-sm font-medium text-white shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#F16767] hover:shadow-lg"
                onClick={goToMainMenu}
              >
                Kembali ke Menu
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {blocked ? (
        <div
          id="activeSessionAlert"
          className="fixed top-0 left-0 z-[60] flex h-full w-full items-center justify-center overflow-auto bg-black/75"
        >
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 text-center">
            <h3 className="mb-2 text-xl font-bold text-gray-800">Sesi Sudah Aktif</h3>
            <p className="mb-4 text-gray-600">
              Halaman ini sudah dibuka di tab/browser lain. Tutup tab lain terlebih
              dahulu atau tunggu beberapa saat.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                className="rounded-lg bg-gray-200 px-4 py-2 text-gray-800 transition-colors hover:bg-gray-300"
                onClick={goToMainMenu}
              >
                Kembali ke Menu
              </button>
              <button
                type="button"
                className="rounded-lg bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600"
                onClick={forceNewSession}
              >
                Paksa Buka
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {sessionAlert === "takeover" ? (
        <div
          id="sessionTakeoverAlert"
          className="fixed top-0 left-0 z-[60] flex h-full w-full items-center justify-center overflow-auto bg-black/75"
        >
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 text-center">
            <h3 className="mb-2 text-xl font-bold text-gray-800">
              Sesi Diambil Alih
            </h3>
            <p className="mb-4 text-gray-600">
              Halaman ini sudah dibuka di tab/browser lain. Hanya satu sesi yang
              diizinkan.
            </p>
            <button
              type="button"
              className="rounded-lg bg-red-500 px-6 py-2 text-white transition-colors hover:bg-red-600"
              onClick={goToMainMenu}
            >
              Kembali ke Menu Utama
            </button>
          </div>
        </div>
      ) : null}

      {isWelcomeOpen ? (
        <WelcomeModal onClose={() => setIsWelcomeOpen(false)} />
      ) : null}
    </div>
  );
}
