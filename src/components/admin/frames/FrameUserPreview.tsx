"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { FrameSlot } from "@/lib/frames/types";
import { getSlotTransform } from "@/lib/frames/rotation";

const PANEL_WIDTH = 220;
const PANEL_MAX_HEIGHT = 520;
const CAPTURE_OUTPUT_WIDTH = 1280;

const SAMPLE_PHOTOS = [
  "/images/m1.jpeg",
  "/images/k2.jpeg",
  "/images/m3.jpeg",
  "/images/k1.jpeg",
  "/images/m2.jpeg",
  "/images/k3.jpeg",
] as const;

type PreviewMode = "camera" | "sample";

type FrameUserPreviewProps = {
  name: string;
  imageUrl: string | null;
  width: number;
  height: number;
  slots: FrameSlot[];
  accessType: "free" | "premium";
  onClose: () => void;
};

/**
 * Pratinjau "POV user" untuk admin: kamera + strip frame seperti di /booth.
 * Semua data diambil dari state form (termasuk PNG yang belum disimpan), jadi
 * admin bisa mengecek komposisi slot sebelum menyimpan frame.
 */
export function FrameUserPreview({
  name,
  imageUrl,
  width,
  height,
  slots,
  accessType,
  onClose,
}: FrameUserPreviewProps) {
  const frameWidth = width > 0 ? width : 4;
  const frameHeight = height > 0 ? height : 5;
  const scale = Math.min(PANEL_WIDTH / frameWidth, PANEL_MAX_HEIGHT / frameHeight);
  const panelWidth = Math.round(frameWidth * scale);
  const panelHeight = Math.round(frameHeight * scale);

  const [mode, setMode] = useState<PreviewMode>("camera");
  const [photos, setPhotos] = useState<Array<string | null>>(() =>
    slots.map(() => null),
  );
  const [isMirrored, setIsMirrored] = useState(true);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showWatermark, setShowWatermark] = useState(accessType === "premium");
  const [flash, setFlash] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  /* Kunci scroll + tutup dengan Escape, sama seperti modal lain. */
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      /* Preview bisa dibuka dari dalam modal "Tambah Frame". Hentikan event
       * di fase capture agar Escape hanya menutup preview, bukan modal form
       * (yang bisa membuat draft hilang). */
      event.stopImmediatePropagation();
      event.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [onClose]);

  /* Nyalakan kamera hanya saat mode kamera aktif. */
  useEffect(() => {
    if (mode !== "camera") {
      return;
    }
    let cancelled = false;

    const start = async () => {
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setCameraError(
          "Kamera tidak tersedia di browser ini. Gunakan mode Contoh foto untuk mengecek komposisi.",
        );
        setIsCameraReady(false);
        return;
      }
      setIsCameraReady(false);
      setCameraError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: { ideal: "user" },
          },
          audio: false,
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
            "Kamera tidak bisa diakses. Izinkan akses kamera di browser, lalu coba lagi. Sementara itu Anda bisa memakai mode Contoh foto.",
          );
        }
      }
    };

    /* Ditunda satu tick agar setState tidak terjadi langsung di badan effect. */
    const timer = window.setTimeout(() => {
      void start();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      stopStream();
    };
  }, [mode, stopStream]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }
    const nextIndex = photos.findIndex((photo) => !photo);
    if (nextIndex === -1) {
      return;
    }

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const outputScale = CAPTURE_OUTPUT_WIDTH / Math.max(videoWidth, videoHeight);

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(videoWidth * outputScale);
    canvas.height = Math.round(videoHeight * outputScale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setPhotos((current) => {
      const target = current.findIndex((photo) => !photo);
      if (target === -1) return current;
      const next = current.slice();
      next[target] = dataUrl;
      return next;
    });
    setFlash(true);
    window.setTimeout(() => setFlash(false), 220);
  };

  const resetPhotos = () => {
    setPhotos(slots.map(() => null));
  };

  /* Mode contoh langsung mengisi semua slot dengan foto bawaan. */
  const photosToShow: Array<string | null> =
    mode === "sample"
      ? slots.map(
          (_slot, index) => SAMPLE_PHOTOS[index % SAMPLE_PHOTOS.length],
        )
      : photos;

  const filledCount = photosToShow.filter(Boolean).length;
  const allFilled = slots.length > 0 && filledCount === slots.length;
  const nextEmptySlot = photos.findIndex((photo) => !photo);

  const preview = (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center overflow-y-auto bg-[#2A0A0A]/70 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Preview sebagai user"
      onMouseDown={onClose}
    >
      <div
        className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[10px] border border-[#BF3131]/30 bg-[#FFFBF3] shadow-[0_-20px_60px_-30px_rgba(42,10,10,0.65)] sm:rounded-[4px]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#BF3131]/20 bg-[#FEF3E2] px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#BF3131]">
              POV user · pratinjau sementara
            </p>
            <h2 className="truncate text-lg font-extrabold tracking-[-0.02em] text-[#2A0A0A]">
              {name.trim() || "Frame tanpa nama"}
            </h2>
            <p className="mt-0.5 text-xs text-[#7A5A50]">
              {accessType === "premium" ? "Premium" : "Gratis"} ·{" "}
              {slots.length} slot foto · tidak mengubah data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              role="group"
              aria-label="Sumber foto pratinjau"
              className="flex rounded-[2px] border border-[#BF3131]/25 bg-[#FFFBF3] p-0.5"
            >
              <button
                type="button"
                aria-pressed={mode === "camera"}
                onClick={() => setMode("camera")}
                className={`rounded-[1px] px-3 py-1.5 text-xs font-semibold transition ${
                  mode === "camera"
                    ? "bg-[#BF3131] text-[#FEF3E2]"
                    : "text-[#7A3E32] hover:bg-[#BF3131]/8"
                }`}
              >
                Kamera
              </button>
              <button
                type="button"
                aria-pressed={mode === "sample"}
                onClick={() => setMode("sample")}
                className={`rounded-[1px] px-3 py-1.5 text-xs font-semibold transition ${
                  mode === "sample"
                    ? "bg-[#BF3131] text-[#FEF3E2]"
                    : "text-[#7A3E32] hover:bg-[#BF3131]/8"
                }`}
              >
                Contoh foto
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup preview"
              className="flex h-10 w-10 items-center justify-center rounded-[2px] text-xl text-[#7A5A50] transition hover:bg-[#BF3131]/8 hover:text-[#2A0A0A]"
            >
              ×
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-4 sm:p-5">
          {slots.length === 0 ? (
            <div className="mb-4 rounded-[2px] border border-dashed border-[#BF3131]/40 bg-[#FEF3E2] px-4 py-3 text-sm text-[#7A3E32]">
              Frame ini belum punya slot foto. User tidak bisa memakai frame
              sampai slot ditambahkan.
            </div>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
            <section aria-label="Simulasi kamera user" className="min-w-0">
              <div className="relative overflow-hidden rounded-[3px] border border-[#2A0A0A]/15 bg-[#1B0D0B] p-2 shadow-[0_22px_45px_-32px_rgba(42,10,10,0.85)] sm:p-3">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2px] bg-[#0F0706]">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    aria-label="Pratinjau kamera"
                    className={`h-full w-full object-cover ${
                      mode === "camera" && !cameraError ? "" : "hidden"
                    }`}
                    style={{ transform: isMirrored ? "scaleX(-1)" : "none" }}
                  />

                  <div
                    className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white transition-opacity duration-150 ${
                      flash ? "opacity-70" : "opacity-0"
                    }`}
                  />

                  {mode === "sample" ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#1B0D0B] px-6 text-center">
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#F16767]">
                        Mode contoh foto
                      </p>
                      <p className="max-w-xs text-sm leading-relaxed text-[#FEF3E2]">
                        Slot diisi foto bawaan supaya komposisi frame mudah
                        dicek. Pindah ke tab Kamera untuk mencoba dengan
                        webcam.
                      </p>
                    </div>
                  ) : cameraError ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#1B0D0B] px-6 text-center">
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#F16767]">
                        Kamera tidak tersedia
                      </p>
                      <p className="max-w-xs text-sm leading-relaxed text-[#FEF3E2]">
                        {cameraError}
                      </p>
                    </div>
                  ) : null}

                  <div className="pointer-events-none absolute right-3 top-3 z-20 bg-[#FEF3E2] px-2.5 py-1 text-[11px] font-bold tabular-nums text-[#2A0A0A]">
                    {filledCount}/{slots.length}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {mode === "camera" ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCapture}
                      disabled={!isCameraReady || allFilled || slots.length === 0}
                      className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-[2px] bg-[#BF3131] px-4 py-2 text-sm font-semibold text-[#FEF3E2] shadow-[3px_3px_0_#7A1C1C] transition hover:bg-[#A02828] disabled:pointer-events-none disabled:opacity-40"
                    >
                      {allFilled
                        ? "Semua slot terisi"
                        : `Ambil foto${nextEmptySlot >= 0 ? ` ke slot ${nextEmptySlot + 1}` : ""}`}
                    </button>
                    <button
                      type="button"
                      aria-pressed={isMirrored}
                      onClick={() => setIsMirrored((value) => !value)}
                      className={`inline-flex min-h-10 items-center justify-center rounded-[2px] border px-3 py-2 text-sm font-semibold transition ${
                        isMirrored
                          ? "border-[#BF3131] bg-[#BF3131]/10 text-[#BF3131]"
                          : "border-[#BF3131]/25 text-[#7A3E32] hover:bg-[#BF3131]/8"
                      }`}
                    >
                      Cermin
                    </button>
                    <button
                      type="button"
                      onClick={resetPhotos}
                      disabled={photos.every((photo) => !photo)}
                      className="inline-flex min-h-10 items-center justify-center rounded-[2px] border border-[#BF3131]/25 px-3 py-2 text-sm font-semibold text-[#7A3E32] transition hover:bg-[#BF3131]/8 disabled:pointer-events-none disabled:opacity-40"
                    >
                      Ulangi
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-[#7A5A50]">
                    Semua slot otomatis diisi foto contoh. Ini bukan foto
                    sungguhan.
                  </p>
                )}
              </div>

              {accessType === "premium" ? (
                <label className="mt-3 flex items-center gap-2 text-xs text-[#7A5A50]">
                  <input
                    type="checkbox"
                    checked={showWatermark}
                    onChange={(event) => setShowWatermark(event.target.checked)}
                    className="h-4 w-4 accent-[#BF3131]"
                  />
                  Tampilkan watermark logo pada slot (perilaku user premium)
                </label>
              ) : null}
            </section>

            <aside aria-label="Strip frame user" className="mx-auto w-full max-w-[300px]">
              <div className="relative border border-[#BF3131]/25 bg-[#FFFBF3] p-4 shadow-[6px_6px_0_rgba(191,49,49,0.08)]">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2A0A0A]">
                    Strip kamu
                  </h3>
                  <span className="text-xs font-semibold tabular-nums text-[#7A5A50]">
                    {filledCount} / {slots.length}
                  </span>
                </div>

                <div className="mt-4 flex justify-center">
                  <div
                    className="relative"
                    style={{ width: panelWidth, height: panelHeight }}
                  >
                    <div
                      className="relative h-full w-full overflow-hidden rounded-[2px] bg-white shadow-[0_14px_30px_-22px_rgba(42,10,10,0.7)]"
                    >
                      {slots.map((slot, index) => {
                        const photo = photosToShow[index];
                        return (
                          <div
                            key={`user-preview-slot-${index}`}
                            className="absolute overflow-hidden bg-[#FEF3E2]"
                            style={{
                              left: slot.x * scale,
                              top: slot.y * scale,
                              width: slot.w * scale,
                              height: slot.h * scale,
                              transform: getSlotTransform(slot),
                              transformOrigin: "center",
                            }}
                          >
                            {photo ? (
                              <img
                                src={photo}
                                alt={`Foto slot ${index + 1}`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center border border-dashed border-[#BF3131]/30">
                                <span className="text-[11px] font-bold tabular-nums text-[#BF3131]/45">
                                  {index + 1}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {accessType === "premium" && showWatermark
                        ? slots.map((slot, index) => (
                            <div
                              key={`user-preview-watermark-${index}`}
                              className="pointer-events-none absolute z-20 flex items-center justify-center opacity-40"
                              style={{
                                left: slot.x * scale,
                                top: slot.y * scale,
                                width: slot.w * scale,
                                height: slot.h * scale,
                                transform: getSlotTransform(slot),
                                transformOrigin: "center",
                              }}
                            >
                              <img
                                src="/logo.png"
                                alt=""
                                className="h-10 w-auto max-w-full"
                              />
                            </div>
                          ))
                        : null}

                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt="Overlay frame"
                          className="pointer-events-none absolute inset-0 z-30 h-full w-full"
                        />
                      ) : (
                        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-[#FEF3E2]/85">
                          <p className="p-4 text-center text-[9px] font-bold uppercase tracking-[0.16em] text-[#BF3131]/70">
                            Belum ada PNG overlay
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <p className="mt-4 border-t border-dashed border-[#BF3131]/25 pt-3 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A5A50]">
                  {slots.length === 0
                    ? "Tidak ada slot"
                    : allFilled
                      ? "Semua slot terisi — begini hasil yang dilihat user"
                      : "Slot kosong menunggu foto user"}
                </p>
              </div>
            </aside>
          </div>

          <p className="mt-4 text-center text-[10px] text-[#7A5A50]">
            Pratinjau memakai data form saat ini, termasuk perubahan yang belum
            disimpan.
          </p>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(preview, document.body);
}
