import type { AlphaImageData, FrameSlot } from "./types";

export type EraseColorOptions = {
  tolerance?: number;
  contiguous?: boolean;
  /**
   * Radius (px) pembersihan tambahan di sekitar area terhapus. Hanya piksel
   * yang warnanya masih mirip warna target yang ikut dihapus, sehingga sisa
   * putih / anti-aliasing di tepi slot hilang tanpa memakan dekorasi frame.
   */
  cleanup?: number;
  /**
   * Radius (px) perluasan area transparan tanpa cek warna. Dipakai untuk
   * memotong sisa tepi yang sudah tercampur warna lain.
   */
  expand?: number;
  /** Radius (px) tepi yang dibuat semi-transparan agar tidak bergerigi. */
  feather?: number;
};

export type EraseResult = {
  bounds: FrameSlot | null;
  area: number;
};

const DEFAULT_TOLERANCE = 24;

export function cloneAlphaImage(image: AlphaImageData): AlphaImageData {
  return {
    data: new Uint8ClampedArray(image.data),
    width: image.width,
    height: image.height,
  };
}

function matchesColor(
  data: Uint8ClampedArray | Uint8Array,
  offset: number,
  r: number,
  g: number,
  b: number,
  tolerance: number,
): boolean {
  return (
    data[offset + 3] > 0 &&
    Math.abs(data[offset] - r) <= tolerance &&
    Math.abs(data[offset + 1] - g) <= tolerance &&
    Math.abs(data[offset + 2] - b) <= tolerance
  );
}

function clearPixel(
  data: Uint8ClampedArray | Uint8Array,
  offset: number,
): void {
  data[offset] = 0;
  data[offset + 1] = 0;
  data[offset + 2] = 0;
  data[offset + 3] = 0;
}

function emptyBounds(): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  return {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: -1,
    maxY: -1,
  };
}

function toBounds(
  bounds: ReturnType<typeof emptyBounds>,
): FrameSlot | null {
  if (bounds.maxX < bounds.minX || bounds.maxY < bounds.minY) {
    return null;
  }
  return {
    x: bounds.minX,
    y: bounds.minY,
    w: bounds.maxX - bounds.minX + 1,
    h: bounds.maxY - bounds.minY + 1,
  };
}

type MaskBounds = ReturnType<typeof emptyBounds>;

function extendMaskBounds(
  bounds: MaskBounds,
  index: number,
  width: number,
): void {
  const x = index % width;
  const y = (index - x) / width;
  if (x < bounds.minX) bounds.minX = x;
  if (x > bounds.maxX) bounds.maxX = x;
  if (y < bounds.minY) bounds.minY = y;
  if (y > bounds.maxY) bounds.maxY = y;
}

/**
 * Melebarkan masker selebar `radius` piksel. `include` bisa dipakai untuk
 * membatasi piksel baru yang boleh ikut (mis. hanya warna yang masih mirip
 * background), sehingga dekorasi frame tidak ikut terhapus.
 */
function growMask(
  mask: Uint8Array,
  width: number,
  height: number,
  radius: number,
  bounds: MaskBounds,
  include?: (index: number) => boolean,
): { mask: Uint8Array; bounds: MaskBounds; added: number } {
  let current = mask;
  let currentBounds = { ...bounds };
  let added = 0;

  for (let step = 0; step < radius; step += 1) {
    if (
      currentBounds.maxX < currentBounds.minX ||
      currentBounds.maxY < currentBounds.minY
    ) {
      break;
    }

    const search = {
      minX: Math.max(0, currentBounds.minX - 1),
      minY: Math.max(0, currentBounds.minY - 1),
      maxX: Math.min(width - 1, currentBounds.maxX + 1),
      maxY: Math.min(height - 1, currentBounds.maxY + 1),
    };
    const next = new Uint8Array(current);
    const nextBounds = { ...currentBounds };
    let changed = false;

    for (let y = search.minY; y <= search.maxY; y += 1) {
      for (let x = search.minX; x <= search.maxX; x += 1) {
        const index = y * width + x;
        if (current[index]) continue;
        if (include && !include(index)) continue;

        const touchesMask =
          (x > 0 && current[index - 1] === 1) ||
          (x < width - 1 && current[index + 1] === 1) ||
          (y > 0 && current[index - width] === 1) ||
          (y < height - 1 && current[index + width] === 1) ||
          (x > 0 && y > 0 && current[index - width - 1] === 1) ||
          (x < width - 1 && y > 0 && current[index - width + 1] === 1) ||
          (x > 0 && y < height - 1 && current[index + width - 1] === 1) ||
          (x < width - 1 &&
            y < height - 1 &&
            current[index + width + 1] === 1);
        if (!touchesMask) continue;

        next[index] = 1;
        changed = true;
        added += 1;
        extendMaskBounds(nextBounds, index, width);
      }
    }

    current = next;
    currentBounds = nextBounds;
    if (!changed) break;
  }

  return { mask: current, bounds: currentBounds, added };
}

export function eraseColorRegion(
  image: AlphaImageData,
  x: number,
  y: number,
  options: EraseColorOptions = {},
): EraseResult {
  const { data, width, height } = image;
  const tolerance = options.tolerance ?? DEFAULT_TOLERANCE;
  const contiguous = options.contiguous ?? true;
  const cleanupRadius = Math.max(0, Math.floor(options.cleanup ?? 0));
  const expandRadius = Math.max(0, Math.floor(options.expand ?? 0));
  const featherRadius = Math.max(0, Math.floor(options.feather ?? 0));

  if (width <= 0 || height <= 0 || x < 0 || y < 0 || x >= width || y >= height) {
    return { bounds: null, area: 0 };
  }

  const startOffset = (y * width + x) * 4;
  if (data[startOffset + 3] === 0) {
    return { bounds: null, area: 0 };
  }

  const targetR = data[startOffset];
  const targetG = data[startOffset + 1];
  const targetB = data[startOffset + 2];
  const total = width * height;
  let mask: Uint8Array = new Uint8Array(total);
  let bounds = emptyBounds();
  let area = 0;

  if (!contiguous) {
    for (let index = 0; index < total; index += 1) {
      const offset = index * 4;
      if (
        !matchesColor(data, offset, targetR, targetG, targetB, tolerance)
      ) {
        continue;
      }
      mask[index] = 1;
      extendMaskBounds(bounds, index, width);
      area += 1;
    }
  } else {
    const visited = new Uint8Array(total);
    const stack = new Int32Array(total);
    let stackPointer = 0;

    const startIndex = y * width + x;
    stack[stackPointer] = startIndex;
    stackPointer += 1;
    visited[startIndex] = 1;

    while (stackPointer > 0) {
      stackPointer -= 1;
      const index = stack[stackPointer];
      const offset = index * 4;

      if (!matchesColor(data, offset, targetR, targetG, targetB, tolerance)) {
        continue;
      }

      mask[index] = 1;
      extendMaskBounds(bounds, index, width);
      area += 1;

      const px = index % width;
      const py = (index - px) / width;
      if (px > 0) {
        const next = index - 1;
        if (!visited[next]) {
          visited[next] = 1;
          stack[stackPointer] = next;
          stackPointer += 1;
        }
      }
      if (px < width - 1) {
        const next = index + 1;
        if (!visited[next]) {
          visited[next] = 1;
          stack[stackPointer] = next;
          stackPointer += 1;
        }
      }
      if (py > 0) {
        const next = index - width;
        if (!visited[next]) {
          visited[next] = 1;
          stack[stackPointer] = next;
          stackPointer += 1;
        }
      }
      if (py < height - 1) {
        const next = index + width;
        if (!visited[next]) {
          visited[next] = 1;
          stack[stackPointer] = next;
          stackPointer += 1;
        }
      }
    }
  }

  if (area === 0) {
    return { bounds: null, area: 0 };
  }

  /* Pembersihan pertama: buang sisa warna background di sekitar area yang
   * baru dihapus (mis. putih tipis / anti-aliasing) dengan toleransi lebih
   * longgar, tetapi hanya untuk piksel yang masih mirip warna target. */
  if (cleanupRadius > 0) {
    const cleanupTolerance = Math.min(255, tolerance + 40);
    const cleaned = growMask(
      mask,
      width,
      height,
      cleanupRadius,
      bounds,
      (index) => {
        const offset = index * 4;
        return (
          data[offset + 3] > 0 &&
          matchesColor(
            data,
            offset,
            targetR,
            targetG,
            targetB,
            cleanupTolerance,
          )
        );
      },
    );
    mask = cleaned.mask;
    bounds = cleaned.bounds;
  }

  /* Pemotongan kedua: perluas area transparan tanpa cek warna untuk memotong
   * tepi yang sudah tercampur warna dekorasi (penyebab garis putih). */
  if (expandRadius > 0) {
    const expanded = growMask(mask, width, height, expandRadius, bounds);
    mask = expanded.mask;
    bounds = expanded.bounds;
  }

  const clearedBounds = emptyBounds();
  let clearedArea = 0;
  for (let py = bounds.minY; py <= bounds.maxY; py += 1) {
    for (let px = bounds.minX; px <= bounds.maxX; px += 1) {
      const index = py * width + px;
      if (!mask[index]) continue;
      clearPixel(data, index * 4);
      extendMaskBounds(clearedBounds, index, width);
      clearedArea += 1;
    }
  }

  /* Tepi luar dibuat semi-transparan bertingkat supaya transisi ke foto
   * tidak bergerigi dan sisa warna tipis tidak terlihat sebagai garis keras. */
  if (featherRadius > 0) {
    let ringMask = mask;
    let ringBounds = clearedBounds;
    for (let step = 1; step <= featherRadius; step += 1) {
      const grown = growMask(ringMask, width, height, 1, ringBounds);
      const alphaFactor = step / (featherRadius + 1);

      for (let py = grown.bounds.minY; py <= grown.bounds.maxY; py += 1) {
        for (let px = grown.bounds.minX; px <= grown.bounds.maxX; px += 1) {
          const index = py * width + px;
          if (!grown.mask[index] || ringMask[index]) continue;
          const offset = index * 4;
          data[offset + 3] = Math.round(data[offset + 3] * alphaFactor);
        }
      }

      ringMask = grown.mask;
      ringBounds = grown.bounds;
    }
  }

  return { bounds: toBounds(clearedBounds), area: clearedArea };
}

export function eraseRect(
  image: AlphaImageData,
  rect: FrameSlot,
): EraseResult {
  const { data, width, height } = image;
  const x0 = Math.max(0, Math.floor(Math.min(rect.x, rect.x + rect.w)));
  const y0 = Math.max(0, Math.floor(Math.min(rect.y, rect.y + rect.h)));
  const x1 = Math.min(width, Math.ceil(Math.max(rect.x, rect.x + rect.w)));
  const y1 = Math.min(height, Math.ceil(Math.max(rect.y, rect.y + rect.h)));

  if (x1 <= x0 || y1 <= y0) {
    return { bounds: null, area: 0 };
  }

  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      clearPixel(data, (y * width + x) * 4);
    }
  }

  return {
    bounds: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 },
    area: (x1 - x0) * (y1 - y0),
  };
}

function slotArea(slot: FrameSlot): number {
  return Math.max(0, slot.w) * Math.max(0, slot.h);
}

function intersectionArea(a: FrameSlot, b: FrameSlot): number {
  const left = Math.max(a.x, b.x);
  const top = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.w, b.x + b.w);
  const bottom = Math.min(a.y + a.h, b.y + b.h);
  if (right <= left || bottom <= top) {
    return 0;
  }
  return (right - left) * (bottom - top);
}

export function overlapRatio(a: FrameSlot, b: FrameSlot): number {
  const smaller = Math.min(slotArea(a), slotArea(b));
  if (smaller <= 0) {
    return 0;
  }
  return intersectionArea(a, b) / smaller;
}

export function sortSlots(slots: FrameSlot[]): FrameSlot[] {
  const sorted = [...slots].sort((a, b) =>
    a.y === b.y ? a.x - b.x : a.y - b.y,
  );
  const rows: FrameSlot[][] = [];

  for (const slot of sorted) {
    const row = rows[rows.length - 1];
    if (row) {
      const tolerance = Math.max(
        4,
        Math.round(Math.min(row[0].h, slot.h) * 0.1),
      );
      if (Math.abs(slot.y - row[0].y) <= tolerance) {
        row.push(slot);
        continue;
      }
    }
    rows.push([slot]);
  }

  return rows.flatMap((row) => row.sort((a, b) => a.x - b.x));
}

export function mergeSlots(
  primary: FrameSlot[],
  candidates: FrameSlot[],
): FrameSlot[] {
  const result = [...primary];
  for (const candidate of candidates) {
    const duplicate = result.some(
      (existing) => overlapRatio(existing, candidate) >= 0.5,
    );
    if (!duplicate) {
      result.push(candidate);
    }
  }
  return sortSlots(result);
}
