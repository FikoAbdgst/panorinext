import { sortSlots } from "./edit-image";
import type { AlphaImageData, FrameSlot } from "./types";

export type DetectSlotsOptions = {
  /** Piksel dengan alpha di bawah ambang ini dianggap "lubang". Default 10. */
  alphaThreshold?: number;
  /** Komponen dengan luas di bawah rasio ini diabaikan (noise). Default 0.01. */
  minAreaRatio?: number;
  /**
   * Abaikan komponen transparan yang menyentuh tepi gambar. Komponen seperti
   * ini biasanya latar luar transparan, bukan lubang foto. Default true.
   */
  ignoreBorderComponents?: boolean;
};

/**
 * Mendeteksi lubang transparan pada overlay PNG sebagai kandidat slot foto.
 *
 * Algoritma:
 * 1. Telusuri kanal alpha.
 * 2. Cari connected components (flood fill 4-arah) dari piksel transparan.
 * 3. Buang komponen yang terlalu kecil.
 * 4. Buang komponen latar luar: menyentuh ≥2 sisi dan menutupi hampir
 *    seluruh kanvas (luas ≥50% atau bounding box ≥85%).
 * 5. Ambil bounding box tiap komponen.
 * 6. Urutkan dari atas ke bawah, lalu kiri ke kanan.
 */
export function detectSlots(
  image: AlphaImageData,
  options: DetectSlotsOptions = {},
): FrameSlot[] {
  const { data, width, height } = image;
  const alphaThreshold = options.alphaThreshold ?? 10;
  const minAreaRatio = options.minAreaRatio ?? 0.01;
  const ignoreBorderComponents = options.ignoreBorderComponents ?? true;

  if (width <= 0 || height <= 0) {
    return [];
  }

  const total = width * height;
  const minArea = Math.max(1, Math.floor(total * minAreaRatio));
  const visited = new Uint8Array(total);
  const stack = new Int32Array(total);
  const found: Array<FrameSlot & { area: number }> = [];

  for (let start = 0; start < total; start += 1) {
    if (visited[start]) {
      continue;
    }

    if (data[start * 4 + 3] >= alphaThreshold) {
      visited[start] = 1;
      continue;
    }

    let sp = 0;
    stack[sp] = start;
    sp += 1;
    visited[start] = 1;

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    let area = 0;
    let edgeMask = 0;

    while (sp > 0) {
      sp -= 1;
      const index = stack[sp];
      const x = index % width;
      const y = (index - x) / width;

      area += 1;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      if (x === 0) edgeMask |= 1;
      if (x === width - 1) edgeMask |= 2;
      if (y === 0) edgeMask |= 4;
      if (y === height - 1) edgeMask |= 8;

      if (x > 0) {
        const n = index - 1;
        if (!visited[n]) {
          visited[n] = 1;
          if (data[n * 4 + 3] < alphaThreshold) {
            stack[sp] = n;
            sp += 1;
          }
        }
      }
      if (x < width - 1) {
        const n = index + 1;
        if (!visited[n]) {
          visited[n] = 1;
          if (data[n * 4 + 3] < alphaThreshold) {
            stack[sp] = n;
            sp += 1;
          }
        }
      }
      if (y > 0) {
        const n = index - width;
        if (!visited[n]) {
          visited[n] = 1;
          if (data[n * 4 + 3] < alphaThreshold) {
            stack[sp] = n;
            sp += 1;
          }
        }
      }
      if (y < height - 1) {
        const n = index + width;
        if (!visited[n]) {
          visited[n] = 1;
          if (data[n * 4 + 3] < alphaThreshold) {
            stack[sp] = n;
            sp += 1;
          }
        }
      }
    }

    if (area >= minArea) {
      const edgeSides =
        (edgeMask & 1 ? 1 : 0) +
        (edgeMask & 2 ? 1 : 0) +
        (edgeMask & 4 ? 1 : 0) +
        (edgeMask & 8 ? 1 : 0);
      const w = maxX - minX + 1;
      const h = maxY - minY + 1;
      const areaRatio = area / total;
      const bboxRatio = (w * h) / total;

      /* Latar luar transparan biasanya menutupi hampir seluruh kanvas.
       * Syarat "menyentuh ≥2 sisi" saja berisiko membuang slot full-bleed
       * yang menempel ke tepi, jadi tambahkan syarat luas/bbox: hanya
       * komponen raksasa yang dianggap latar luar. */
      const isOuterBackground =
        edgeSides >= 2 && (areaRatio >= 0.5 || bboxRatio >= 0.85);
      if (ignoreBorderComponents && isOuterBackground) {
        continue;
      }

      found.push({ x: minX, y: minY, w, h, area });
    }
  }

  return sortSlots(found.map(({ x, y, w, h }) => ({ x, y, w, h })));
}

/** True bila gambar memiliki setidaknya satu piksel transparan. */
export function hasTransparentPixels(
  image: AlphaImageData,
  alphaThreshold = 10,
): boolean {
  const { data, width, height } = image;
  const total = width * height;
  for (let i = 0; i < total; i += 1) {
    if (data[i * 4 + 3] < alphaThreshold) {
      return true;
    }
  }
  return false;
}
