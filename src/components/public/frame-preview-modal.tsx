"use client";

/* eslint-disable @next/next/no-img-element */

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

const CAMERA_TOGGLE_ICON_PATH =
  "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

let logoPromise: Promise<HTMLImageElement | null> | null = null;

function loadLogo(): Promise<HTMLImageElement | null> {
  if (!logoPromise) {
    logoPromise = new Promise((resolve) => {
      const image = new Image();
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

      /* Pangkas video sesuai aspek rasio slot — logika sama dengan /booth. */
      const targetAspectRatio = slot.w / slot.h;
      const videoAspectRatio = video.videoWidth / video.videoHeight;
      let sourceWidth = video.videoWidth;
      let sourceHeight = video.videoHeight;
      let sourceX = 0;
      let sourceY = 0;
      if (videoAspectRatio > targetAspectRatio) {
        sourceWidth = video.videoHeight * targetAspectRatio;
        sourceX = (video.videoWidth - sourceWidth) / 2;
      } else {
        sourceHeight = video.videoWidth / targetAspectRatio;
        sourceY = (video.videoHeight - sourceHeight) / 2;
      }

      const canvas = document.createElement("canvas");
      canvas.width = CAPTURE_OUTPUT_WIDTH;
      canvas.height = Math.round(CAPTURE_OUTPUT_WIDTH / targetAspectRatio);
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
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
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
      setCountdown("Snap!");
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
      ? "Kamera Tidak Tersedia"
      : sessionState === "running"
        ? "Sedang mengambil foto..."
        : sessionState === "done"
          ? "Selesai! Klik untuk ulang"
          : isCameraReady
            ? "📷 Start Session"
            : "Menyiapkan kamera...";

  return createPortal(
    <div
      id="previewCameraModal"
      className="preview-modal fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-black/50 backdrop-blur-sm md:items-center"
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

      <div className="preview-modal-panel relative max-h-[90vh] w-full overflow-y-auto rounded-t-xl bg-white shadow-xl md:mx-4 md:max-h-none md:max-w-4xl md:overflow-visible md:rounded-xl md:p-6">
        <div className="sticky top-0 z-10 flex items-center justify-center border-b border-gray-200 bg-white px-4 py-3 md:static md:border-none md:py-0 md:pb-4">
          <h2 className="text-xl font-semibold">Frame Preview</h2>
          <button
            type="button"
            className="absolute top-3 right-4 cursor-pointer text-2xl text-gray-500 hover:text-black"
            onClick={onClose}
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-6 p-4 md:flex-row md:items-center md:justify-center md:p-0">
          <div className="w-full md:w-3/5">
            <div
              className="relative w-full overflow-hidden rounded-lg bg-white"
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
                <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-red-500">
                  <svg
                    className="mb-4 h-12 w-12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p>{cameraError}</p>
                </div>
              ) : null}
              {frame.isFree ? null : (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-40">
                  <img src="/logo.png" alt="" className="h-10" />
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
                className="absolute top-4 right-4 z-20 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-all duration-300 hover:bg-black/70 md:hidden"
                onClick={() => {
                  setIsCameraReady(false);
                  setCameraError(null);
                  setFacingMode((current) =>
                    current === "user" ? "environment" : "user",
                  );
                }}
                aria-label="Ganti kamera"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d={CAMERA_TOGGLE_ICON_PATH}
                  />
                </svg>
              </button>
            </div>

            <button
              type="button"
              className="mt-4 w-full rounded-lg bg-red-500 py-3 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
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
              <div className="relative h-full w-full overflow-hidden bg-transparent shadow-md">
                {slots.map((slot, index) => {
                  const photo = photos[index];
                  return (
                    <div
                      key={`preview-slot-${index}`}
                      className={`preview-slot absolute overflow-hidden ${
                        photo ? "" : "bg-gray-100"
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
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <p className="p-4 text-center text-gray-400">
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
