"use client";

/* eslint-disable @next/next/no-img-element */

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { FrameSlot } from "@/lib/frames/types";

export type PreviewFrame = {
  id: number;
  name: string;
  /** URL publik overlay PNG (frame.frames). */
  imageUrl: string | null;
  width: number;
  height: number;
  slots: FrameSlot[];
  isFree: boolean;
};

type FacingMode = "user" | "environment";
type SessionState = "idle" | "running" | "done";

const PANEL_WIDTH = 190;
const PANEL_MAX_HEIGHT = 500;
const CAPTURE_OUTPUT_WIDTH = 1200;
const COUNTDOWN_STEPS = 3;
const CAPTURE_INTERVAL_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

let logoPromise: Promise<HTMLImageElement | null> | null = null;

function loadLogo(): Promise<HTMLImageElement | null> {
  if (!logoPromise) {
    logoPromise = new Promise((resolve) => {
      if (typeof window === "undefined" || typeof Image === "undefined") {
        resolve(null);
        return;
      }
      const image = new (Image as unknown as new () => HTMLImageElement)();
      image.src = "/logo.png";
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
    });
  }
  return logoPromise;
}

async function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): Promise<void> {
  const logo = await loadLogo();
  if (!logo || !logo.width) return;
  const logoWidth = Math.round(width * 0.32);
  const logoHeight = Math.round((logo.height / logo.width) * logoWidth);
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.drawImage(
    logo,
    Math.round((width - logoWidth) / 2),
    Math.round((height - logoHeight) / 2),
    logoWidth,
    logoHeight,
  );
  ctx.restore();
}

function PreviewAlert({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex items-center rounded-md border border-yellow-300 bg-yellow-100 text-yellow-700 shadow-lg ${
        compact ? "p-3" : "p-4"
      }`}
      role="alert"
    >
      <svg
        className={`fill-current text-yellow-500 ${compact ? "mr-3 h-5 w-5" : "mr-4 h-6 w-6"}`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
      >
        <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z" />
      </svg>
      <div>
        <p className={`font-medium ${compact ? "text-sm" : ""}`}>Ini hanya preview!</p>
        <p className={compact ? "text-xs" : "text-sm"}>
          {compact ? "Gunakan fitur lengkap " : "Jika Anda ingin gunakan fitur lengkapnya silahkan klik ke halaman "}
          <Link
            href="/frame"
            className="font-semibold text-yellow-800 underline hover:text-yellow-900"
          >
            {compact ? "disini" : "frame"}
          </Link>
          {compact ? (
            ""
          ) : (
            <>
              {" atau klik "}
              <Link
                href="/frame"
                className="font-semibold text-yellow-800 underline hover:text-yellow-900"
              >
                disini
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export function FramePreviewModal({
  frame,
  onClose,
  showAlert = true,
}: {
  frame: PreviewFrame;
  onClose: () => void;
  /** Alert "Ini hanya preview!" — hanya di beranda, bukan di /frame. */
  showAlert?: boolean;
}) {
  const slots = frame.slots;
  const frameWidth = frame.width > 0 ? frame.width : PANEL_WIDTH * 2;
  const frameHeight = frame.height > 0 ? frame.height : PANEL_MAX_HEIGHT * 2;
  const scale = Math.min(PANEL_WIDTH / frameWidth, PANEL_MAX_HEIGHT / frameHeight);
  const panelWidth = Math.round(frameWidth * scale);
  const panelHeight = Math.round(frameHeight * scale);

  const [photos, setPhotos] = useState<Array<string | null>>(() =>
    slots.map(() => null),
  );
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [countdown, setCountdown] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [facingMode, setFacingMode] = useState<FacingMode>("user");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const runningRef = useRef(false);
  const abortRef = useRef(false);

  const isMirrored = facingMode === "user";

  useEffect(() => {
    abortRef.current = false;
    return () => {
      abortRef.current = true;
    };
  }, []);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    const request = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            aspectRatio: 4 / 3,
            facingMode: { ideal: facingMode },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => undefined);
        }
        if (cancelled) return;
        setIsCameraReady(true);
        setCameraError(null);
      } catch {
        if (!cancelled) {
          setIsCameraReady(false);
          setCameraError(
            "Gagal mengakses kamera. Pastikan izin kamera diaktifkan dan coba lagi.",
          );
        }
      }
    };
    void request();
    return () => {
      cancelled = true;
      const stream = streamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [facingMode]);

  const captureFrame = useCallback(
    async (slotIndex: number): Promise<string | null> => {
      const video = videoRef.current;
      const slot = slots[slotIndex];
      if (!video || !slot || video.videoWidth === 0 || video.videoHeight === 0) {
        return null;
      }

      /* Simpan seluruh frame kamera — penyesuaian ke ukuran slot terjadi saat
       * ditampilkan/dikomposit dengan mode "cover". */
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      const outputScale = CAPTURE_OUTPUT_WIDTH / Math.max(videoWidth, videoHeight);

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(videoWidth * outputScale);
      canvas.height = Math.round(videoHeight * outputScale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.save();
      if (isMirrored) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
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
      if (!frame.isFree) {
        await drawWatermark(ctx, canvas.width, canvas.height);
      }
      return canvas.toDataURL("image/jpeg", 0.9);
    },
    [frame.isFree, isMirrored, slots],
  );

  const runSession = useCallback(async () => {
    if (runningRef.current || slots.length === 0) return;
    runningRef.current = true;
    abortRef.current = false;
    setSessionState("running");
    setPhotos(slots.map(() => null));

    for (let index = 0; index < slots.length; index += 1) {
      if (abortRef.current) break;
      for (let step = COUNTDOWN_STEPS; step > 0; step -= 1) {
        if (abortRef.current) break;
        setCountdown(String(step));
        await sleep(1000);
      }
      if (abortRef.current) break;
      setCountdown("Jepret!");
      const snapshot = await captureFrame(index);
      setFlash(true);
      window.setTimeout(() => setFlash(false), 250);
      if (snapshot) {
        setPhotos((current) =>
          current.map((value, slotIndex) => (slotIndex === index ? snapshot : value)),
        );
      }
      await sleep(CAPTURE_INTERVAL_MS);
      setCountdown(null);
    }

    runningRef.current = false;
    if (!abortRef.current) {
      setSessionState("done");
    }
  }, [captureFrame, slots]);

  const captureLabel =
    cameraError !== null
      ? "Kamera tidak tersedia"
      : sessionState === "running"
        ? "Sedang mengambil foto..."
        : sessionState === "done"
          ? "Selesai. Klik untuk ulang"
          : isCameraReady
            ? "Mulai sesi"
            : "Menyiapkan kamera...";

  return createPortal(
    <div
      id="previewCameraModal"
      data-lenis-prevent
      className="preview-modal fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-[#2A0A0A]/75 md:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Frame Preview"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {showAlert ? (
        <>
          <div className="pointer-events-none absolute top-4 left-1/2 z-20 hidden w-11/12 max-w-lg -translate-x-1/2 md:block">
            <PreviewAlert />
          </div>
          <div className="pointer-events-none absolute top-4 left-1/2 z-20 w-11/12 -translate-x-1/2 md:hidden">
            <PreviewAlert compact />
          </div>
        </>
      ) : null}

      <div
        data-lenis-prevent
        className="preview-modal-panel relative max-h-[90vh] w-full overflow-y-auto border border-[#BF3131]/30 bg-[#FEF3E2] shadow-[10px_10px_0_rgba(42,10,10,0.35)] md:mx-4 md:max-h-none md:max-w-4xl md:overflow-visible md:p-6"
      >
        <div className="sticky top-0 z-10 flex items-center justify-center border-b border-[#BF3131]/25 bg-[#FEF3E2] px-4 py-3 md:static md:border-none md:py-0 md:pb-4">
          <h2 className="flex items-center gap-3 text-lg font-extrabold tracking-[-0.02em] text-[#2A0A0A]">
            Preview frame
            <span className="border border-[#BF3131]/30 bg-[#FFFBF3] px-2.5 py-1 align-middle text-[9px] font-bold uppercase tracking-[0.16em] text-[#BF3131]">
              {slots.length} slot
            </span>
          </h2>
          <button
            type="button"
            className="absolute right-3 top-2 flex h-11 w-11 cursor-pointer items-center justify-center border border-[#BF3131]/30 text-xl text-[#BF3131] transition hover:bg-[#BF3131] hover:text-[#FEF3E2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"
            onClick={onClose}
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-6 p-4 md:flex-row md:items-center md:justify-center md:p-0">
          <div className="w-full md:w-3/5">
            <div
              className="relative w-full overflow-hidden border border-[#BF3131]/25 bg-[#FFFBF3]"
              style={{ aspectRatio: "4 / 3" }}
            >
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`preview-video absolute inset-0 h-full w-full object-cover ${
                  cameraError ? "hidden" : ""
                }`}
                style={{ transform: isMirrored ? "scaleX(-1)" : "none" }}
              />
              {cameraError ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 border border-[#BF3131]/15 bg-[#FFFBF3] p-6 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#BF3131]">
                    Kamera tidak tersedia
                  </p>
                  <p className="max-w-xs text-sm leading-relaxed text-[#5B3A32]">{cameraError}</p>
                </div>
              ) : null}
              {frame.isFree ? null : (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-40">
                  <Image src="/logo.png" alt="" width={666} height={375} className="h-10 w-auto" />
                </div>
              )}
              <div
                className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-6xl font-bold text-white/90 transition-colors duration-200 ${
                  flash ? "bg-white/90" : "bg-transparent"
                }`}
              >
                <span className={countdown ? "opacity-100" : "opacity-0"}>
                  {countdown}
                </span>
              </div>
              <button
                type="button"
                className="absolute right-3 top-3 z-20 border border-[#FEF3E2]/40 bg-[#2A0A0A]/75 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#FEF3E2] transition hover:bg-[#2A0A0A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FEF3E2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2A0A0A] md:hidden"
                onClick={() => {
                  setIsCameraReady(false);
                  setCameraError(null);
                  setFacingMode((current) =>
                    current === "user" ? "environment" : "user",
                  );
                }}
                aria-label="Ganti kamera"
              >
                Balik
              </button>
            </div>

            <button
              type="button"
              className="mt-3 w-full min-h-11 border border-[#BF3131] bg-[#BF3131] py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#FEF3E2] shadow-[4px_4px_0_#7A1C1C] transition hover:bg-[#A02828] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2] disabled:cursor-not-allowed disabled:opacity-70"
              onClick={() => {
                void runSession();
              }}
              disabled={sessionState === "running" || !isCameraReady}
            >
              {captureLabel}
            </button>
          </div>

          <div className="flex w-full justify-center md:w-auto">
            <div className="relative" style={{ width: panelWidth, height: panelHeight }}>
              <div className="relative h-full w-full overflow-hidden border border-[#BF3131]/20 bg-[#FFFBF3]">
                {slots.map((slot, index) => {
                  const photo = photos[index];
                  return (
                    <div
                      key={`preview-slot-${index}`}
                      className={`preview-slot absolute overflow-hidden ${
                        photo ? "" : "bg-[#F3D8C8]"
                      }`}
                      style={{
                        left: slot.x * scale,
                        top: slot.y * scale,
                        width: slot.w * scale,
                        height: slot.h * scale,
                      }}
                    >
                      {photo ? (
                        <img
                          className="h-full w-full object-cover"
                          src={photo}
                          alt={`Preview ${index + 1}`}
                        />
                      ) : null}
                    </div>
                  );
                })}
                {frame.imageUrl ? (
                  <img
                    className="preview-overlay-image absolute inset-0 z-30 h-full w-full"
                    src={frame.imageUrl}
                    alt=""
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#F3D8C8]">
                    <p className="p-4 text-center text-[9px] font-bold uppercase tracking-[0.16em] text-[#BF3131]/70">
                      Frame akan muncul di sini
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
