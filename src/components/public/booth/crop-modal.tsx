"use client";

import type Cropper from "cropperjs";
import { useEffect, useRef } from "react";
import "cropperjs/dist/cropper.css";

export type CropRequest = {
  src: string;
  aspectRatio: number;
  mode: "crop" | "recrop";
  onConfirm: (dataUrl: string) => void;
};

const OUTPUT_WIDTH = 800;

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFBF3]";

export function CropModal({
  request,
  onClose,
}: {
  request: CropRequest;
  onClose: () => void;
}) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const cropperRef = useRef<Cropper | null>(null);

  useEffect(() => {
    const image = imageRef.current;
    if (!image) {
      return;
    }

    let cancelled = false;
    let cropper: Cropper | null = null;

    void import("cropperjs").then(({ default: CropperCtor }) => {
      if (cancelled || !imageRef.current) {
        return;
      }

      cropper = new CropperCtor(imageRef.current, {
        aspectRatio: request.aspectRatio,
        viewMode: 1,
        autoCropArea: 0.8,
        responsive: true,
        guides: false,
        scalable: false,
        zoomable: request.mode === "crop",
        background: false,
      });
      cropperRef.current = cropper;
    });

    return () => {
      cancelled = true;
      cropper?.destroy();
      cropperRef.current = null;
    };
  }, [request.aspectRatio, request.mode, request.src]);

  function handleConfirm() {
    const cropper = cropperRef.current;
    if (!cropper) {
      return;
    }
    const canvas = cropper.getCroppedCanvas({
      width: OUTPUT_WIDTH,
      height: Math.round(OUTPUT_WIDTH / request.aspectRatio),
      fillColor: "#fff",
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "high",
    });
    if (!canvas) {
      return;
    }
    request.onConfirm(canvas.toDataURL("image/png", 0.9));
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto bg-[#2A0A0A]/70 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cropTitle"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="booth-sheet flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[16px] border border-[#BF3131]/25 bg-[#FFFBF3] shadow-[0_-18px_50px_-30px_rgba(42,10,10,0.6)] sm:rounded-[3px] sm:shadow-[0_24px_60px_-30px_rgba(42,10,10,0.55)]">
        <div className="flex items-start justify-between gap-4 px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
          <div>
            <h2 id="cropTitle" className="text-lg font-bold tracking-[-0.02em]">
              {request.mode === "recrop" ? "Atur ulang potongan" : "Atur posisi foto"}
            </h2>
            <p className="mt-0.5 text-xs leading-relaxed text-[#7A5A50]">
              {request.mode === "recrop"
                ? "Geser bingkai sampai pas dengan slot."
                : "Geser dan zoom foto sampai pas di dalam bingkai."}
            </p>
          </div>
          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] text-[#7A5A50] transition hover:bg-[#BF3131]/8 hover:text-[#2A0A0A] ${FOCUS_RING}`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="relative h-[48vh] min-h-0 w-full overflow-hidden bg-[#1B0D0B] sm:h-[54vh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={request.src}
            alt="Foto yang akan dipotong"
            className="absolute inset-0 h-full w-full object-contain"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-dashed border-[#BF3131]/25 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex min-h-11 items-center justify-center rounded-[2px] border border-[#BF3131]/35 bg-[#FFFBF3]/70 px-5 py-2.5 text-sm font-semibold text-[#BF3131] transition hover:bg-[#FFFBF3] ${FOCUS_RING}`}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`inline-flex min-h-11 items-center justify-center rounded-[2px] bg-[#BF3131] px-5 py-2.5 text-sm font-semibold text-[#FEF3E2] shadow-[3px_3px_0_#7A1C1C] transition hover:-translate-y-0.5 hover:bg-[#A02828] hover:shadow-[4px_4px_0_#7A1C1C] ${FOCUS_RING}`}
          >
            Gunakan foto
          </button>
        </div>
      </div>
    </div>
  );
}
