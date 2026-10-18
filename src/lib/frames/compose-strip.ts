import { getCoverSourceRect } from "./geometry";
import type { FrameSlot } from "./types";

export type ComposeStripInput = {
  width: number;
  height: number;
  slots: FrameSlot[];
  /** Foto ke-i diletakkan di slot ke-i. Slot tanpa foto dilewati. */
  photos: Array<CanvasImageSource | null | undefined>;
  /** Overlay PNG dengan lubang transparan, digambar paling atas. */
  overlay: CanvasImageSource;
  /** Kanvas yang dipakai ulang (opsional). */
  canvas?: HTMLCanvasElement;
};

function getSourceSize(
  source: CanvasImageSource,
): { width: number; height: number } | null {
  if (
    typeof HTMLImageElement !== "undefined" &&
    source instanceof HTMLImageElement
  ) {
    return {
      width: source.naturalWidth || source.width,
      height: source.naturalHeight || source.height,
    };
  }
  if (
    typeof HTMLVideoElement !== "undefined" &&
    source instanceof HTMLVideoElement
  ) {
    return { width: source.videoWidth, height: source.videoHeight };
  }
  const sized = source as { width?: number; height?: number };
  if (typeof sized.width === "number" && typeof sized.height === "number") {
    return { width: sized.width, height: sized.height };
  }
  return null;
}

/**
 * Menggabungkan foto ke dalam overlay frame pada satu kanvas:
 * 1. Kanvas seukuran frame.
 * 2. Tiap foto digambar di slot-nya dengan mode cover.
 * 3. Overlay PNG digambar di atas; area transparannya menampilkan foto.
 */
export function composeStrip(input: ComposeStripInput): HTMLCanvasElement {
  const { width, height, slots, photos, overlay } = input;
  const canvas = input.canvas ?? document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context tidak tersedia");
  }

  ctx.clearRect(0, 0, width, height);

  slots.forEach((slot, index) => {
    const photo = photos[index];
    if (!photo) {
      return;
    }
    const size = getSourceSize(photo);
    if (!size || size.width <= 0 || size.height <= 0) {
      return;
    }
    const { sx, sy, sw, sh } = getCoverSourceRect(
      size.width,
      size.height,
      slot.w,
      slot.h,
    );
    ctx.drawImage(photo, sx, sy, sw, sh, slot.x, slot.y, slot.w, slot.h);
  });

  ctx.drawImage(overlay, 0, 0, width, height);
  return canvas;
}
