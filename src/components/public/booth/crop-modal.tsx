"use client";

import Cropper from "cropperjs";
import { useEffect, useRef } from "react";
import "cropperjs/dist/cropper.css";

export type CropRequest = {
  src: string;
  aspectRatio: number;
  mode: "crop" | "recrop";
  onConfirm: (dataUrl: string) => void;
};

const OUTPUT_WIDTH = 800;

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

    const cropper = new Cropper(image, {
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

    return () => {
      cropper.destroy();
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[90vh] w-full min-w-0 max-w-2xl flex-col overflow-hidden rounded-lg bg-white p-4 sm:p-6">
        <h3 className="mb-4 shrink-0 text-xl font-bold text-neutral-800">
          {request.mode === "recrop" ? "Recrop Your Photo" : "Crop Your Photo"}
        </h3>
        <div className="relative mb-4 h-[55vh] min-h-0 w-full min-w-0 overflow-hidden bg-gray-100 sm:h-[60vh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={request.src}
            alt="Photo to crop"
            className="absolute inset-0 h-full w-full object-contain"
          />
        </div>
        <div className="flex shrink-0 justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Crop &amp; Use Photo
          </button>
        </div>
      </div>
    </div>
  );
}
