import type { AlphaImageData, FrameSlot } from "./types";

export type DetectSlotsOptions = {
  /** Piksel dengan alpha di bawah ambang ini dianggap "lubang". Default 10. */
  alphaThreshold?: number;
  /** Komponen dengan luas di bawah rasio ini diabaikan (noise). Default 0.01. */
  minAreaRatio?: number;
};

/**
 * Mendeteksi lubang transparan pada overlay PNG sebagai kandidat slot foto.
 *
 * Algoritma:
 * 1. Telusuri kanal alpha.
 * 2. Cari connected components (flood fill 4-arah) dari piksel transparan.
 * 3. Buang komponen yang terlalu kecil.
 * 4. Ambil bounding box tiap komponen.
 * 5. Urutkan dari atas ke bawah, lalu kiri ke kanan.
 */
export function detectSlots(
  image: AlphaImageData,
  options: DetectSlotsOptions = {},
): FrameSlot[] {
  const { data, width, height } = image;
  const alphaThreshold = options.alphaThreshold ?? 10;
  const minAreaRatio = options.minAreaRatio ?? 0.01;

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
      found.push({
        x: minX,
        y: minY,
        w: maxX - minX + 1,
        h: maxY - minY + 1,
        area,
      });
    }
  }

  found.sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));

  return found.map(({ x, y, w, h }) => ({ x, y, w, h }));
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
