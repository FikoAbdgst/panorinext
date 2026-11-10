import { getSlotBounds } from "./rotation";
import type { AlphaImageData, FrameSlot } from "./types";

export type EraseColorOptions = {
  tolerance?: number;
  contiguous?: boolean;
  /**
   * Hitung toleransi otomatis dari variasi warna di sekitar titik klik.
   * Saat aktif, nilai `tolerance` diabaikan. Ini menghindari admin harus
   * menebak-nebak angka toleransi.
   */
  autoTolerance?: boolean;
  /**
   * Radius (px) pembersihan tambahan di sekitar area terhapus. Hanya piksel
   * yang warnanya masih mirip warna target yang ikut dihapus, sehingga sisa
   * putih / anti-aliasing di tepi slot hilang tanpa memakan dekorasi frame.
   */
  cleanup?: number;
  /**
   * Ikut hapus piksel putih/terang di cincin tepi area terhapus. Berguna untuk
   * membuang garis putih tipis sisa background tanpa menaikkan toleransi.
   */
  cleanupWhite?: boolean;
  /**
   * Radius (px) perluasan area transparan tanpa cek warna. Dipakai untuk
   * memotong sisa tepi yang sudah tercampur warna lain.
   */
  expand?: number;
  /** Radius (px) tepi yang dibuat semi-transparan agar tidak bergerigi. */
  feather?: number;
};

export type WhiteFringeOptions = {
  /** Radius (px) cincin di sekitar area transparan yang ikut dibersihkan. */
  radius?: number;
  /** Ambang kecerahan minimum piksel yang dianggap putih. */
  luminance?: number;
  /** Ambang selisih warna maksimum agar piksel dianggap putih/netral. */
  chroma?: number;
};

export type EraseResult = {
  bounds: FrameSlot | null;
  area: number;
};

const DEFAULT_TOLERANCE = 24;
const LUMINANCE_RED = 0.299;
const LUMINANCE_GREEN = 0.587;
const LUMINANCE_BLUE = 0.114;
/* Ambang putih dibuat ketat supaya warna kulit/kuning muda pada dekorasi
 * tidak ikut dianggap sisa background. */
const WHITE_LUMINANCE = 210;
const WHITE_CHROMA = 24;

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function cloneAlphaImage(image: AlphaImageData): AlphaImageData {
  return {
    data: new Uint8ClampedArray(image.data),
    width: image.width,
    height: image.height,
  };
}

/**
 * Jarak warna berbobot persepsi (bukan selisih per-kanal). Perubahan hijau
 * lebih terasa daripada biru, sehingga satu angka toleransi berperilaku lebih
 * konsisten di berbagai warna background.
 */
function colorDistance(
  data: Uint8ClampedArray | Uint8Array,
  offset: number,
  r: number,
  g: number,
  b: number,
): number {
  const dr = data[offset] - r;
  const dg = data[offset + 1] - g;
  const db = data[offset + 2] - b;
  return Math.sqrt(
    LUMINANCE_RED * dr * dr +
      LUMINANCE_GREEN * dg * dg +
      LUMINANCE_BLUE * db * db,
  );
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
    colorDistance(data, offset, r, g, b) <= tolerance
  );
}

/** Jumlah tetangga (8 arah) yang sudah menjadi bagian area transparan. */
function countMaskNeighbors(
  mask: Uint8Array,
  index: number,
  width: number,
  height: number,
): number {
  const x = index % width;
  const y = (index - x) / width;
  let count = 0;
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) {
        continue;
      }
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
        continue;
      }
      if (mask[ny * width + nx]) {
        count += 1;
      }
    }
  }
  return count;
}

function isWhitishPixel(
  data: Uint8ClampedArray | Uint8Array,
  offset: number,
  luminanceThreshold = WHITE_LUMINANCE,
  chromaThreshold = WHITE_CHROMA,
): boolean {
  if (data[offset + 3] === 0) {
    return false;
  }
  const r = data[offset];
  const g = data[offset + 1];
  const b = data[offset + 2];
  const maximum = Math.max(r, g, b);
  const minimum = Math.min(r, g, b);
  const luminance =
    LUMINANCE_RED * r + LUMINANCE_GREEN * g + LUMINANCE_BLUE * b;
  return luminance >= luminanceThreshold && maximum - minimum <= chromaThreshold;
}

/**
 * Perkirakan toleransi dari variasi warna lokal di sekitar klik. Background
 * rata menghasilkan angka kecil; background bergradasi/noise otomatis
 * mendapat angka lebih longgar.
 */
function estimateAutoTolerance(
  image: AlphaImageData,
  x: number,
  y: number,
): number {
  const { data, width, height } = image;
  const radius = Math.max(
    2,
    Math.min(5, Math.round(Math.min(width, height) * 0.006)),
  );
  const seedOffset = (y * width + x) * 4;
  const r = data[seedOffset];
  const g = data[seedOffset + 1];
  const b = data[seedOffset + 2];
  const distances: number[] = [];

  for (let py = Math.max(0, y - radius); py <= Math.min(height - 1, y + radius); py += 1) {
    for (let px = Math.max(0, x - radius); px <= Math.min(width - 1, x + radius); px += 1) {
      const dx = px - x;
      const dy = py - y;
      if (dx * dx + dy * dy > radius * radius) {
        continue;
      }
      const offset = (py * width + px) * 4;
      if (data[offset + 3] < 32) {
        continue;
      }
      distances.push(colorDistance(data, offset, r, g, b));
    }
  }

  if (distances.length === 0) {
    return DEFAULT_TOLERANCE;
  }
  distances.sort((a, b) => a - b);
  const median = distances[Math.floor((distances.length - 1) * 0.5)];
  const p70 = distances[Math.floor((distances.length - 1) * 0.7)];
  /* Hanya variasi background yang dipakai. Persentil tinggi dibatasi supaya
   * klik di dekat objek (mis. wajah/kulit terang) tidak membuat toleransi
   * melonjak dan ikut menghapus objek. */
  const spread = Math.min(20, Math.max(0, p70 - median));
  const estimated = median + spread * 0.6 + 10;
  return clampNumber(Math.round(estimated), 14, 40);
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
  include?: (index: number, current: Uint8Array) => boolean,
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
        if (include && !include(index, current)) continue;

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
  const contiguous = options.contiguous ?? true;
  const autoTolerance = options.autoTolerance ?? false;
  const cleanupWhite = options.cleanupWhite ?? false;
  const tolerance = autoTolerance
    ? estimateAutoTolerance(image, x, y)
    : options.tolerance ?? DEFAULT_TOLERANCE;
  const cleanupRadius = Math.max(0, Math.floor(options.cleanup ?? 0));
  const expandRadius = Math.max(0, Math.floor(options.expand ?? 0));
  const featherRadius = Math.max(0, Math.floor(options.feather ?? 0));
  /* Pembersihan putih maksimal dua lapis di tepi area transparan. Jangan
   * melebar lebih jauh karena lapisan berikutnya bisa merupakan bagian objek
   * (kulit, baju terang, dsb.). */
  const effectiveCleanupRadius = cleanupWhite
    ? Math.max(cleanupRadius, 2)
    : cleanupRadius;

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
  if (effectiveCleanupRadius > 0) {
    /* Toleransi pembersihan hanya sedikit lebih longgar dari toleransi utama
     * supaya anti-aliasing background ikut terangkat, tetapi warna objek
     * terang tetap aman. */
    const cleanupTolerance = Math.min(255, tolerance + 8);
    const cleaned = growMask(
      mask,
      width,
      height,
      effectiveCleanupRadius,
      bounds,
      (index, currentMask) => {
        const offset = index * 4;
        if (data[offset + 3] === 0) {
          return false;
        }
        if (
          matchesColor(
            data,
            offset,
            targetR,
            targetG,
            targetB,
            cleanupTolerance,
          )
        ) {
          return true;
        }
        if (!cleanupWhite || !isWhitishPixel(data, offset)) {
          return false;
        }
        /* Hanya buang putih yang benar-benar menempel pada tepi transparan
         * dan tipis. Piksel putih di dalam objek (mis. wajah) punya sedikit
         * tetangga transparan sehingga tidak ikut terhapus. */
        return countMaskNeighbors(currentMask, index, width, height) >= 3;
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

/**
 * Bersihkan sisa putih/terang yang menempel pada tepi area transparan.
 * Dipakai sebagai tombol "Bersihkan Sisa Putih" untuk merapikan halo putih
 * yang tertinggal setelah Magic Wand tanpa harus mengubah toleransi.
 */
export function removeWhiteFringe(
  image: AlphaImageData,
  options: WhiteFringeOptions = {},
): EraseResult {
  const { data, width, height } = image;
  const radius = clampNumber(Math.floor(options.radius ?? 2), 0, 32);
  if (radius <= 0 || width <= 0 || height <= 0) {
    return { bounds: null, area: 0 };
  }

  const total = width * height;
  const mask = new Uint8Array(total);
  let frontier: number[] = [];
  for (let index = 0; index < total; index += 1) {
    if (data[index * 4 + 3] === 0) {
      mask[index] = 1;
      frontier.push(index);
    }
  }
  if (frontier.length === 0) {
    return { bounds: null, area: 0 };
  }

  const luminance = options.luminance ?? WHITE_LUMINANCE;
  const chroma = options.chroma ?? WHITE_CHROMA;
  const clearedBounds = emptyBounds();
  let area = 0;

  for (let step = 0; step < radius; step += 1) {
    if (frontier.length === 0) {
      break;
    }
    const added: number[] = [];

    for (const index of frontier) {
      const x = index % width;
      const y = (index - x) / width;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) {
            continue;
          }
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
            continue;
          }
          const neighbor = ny * width + nx;
          if (mask[neighbor]) {
            continue;
          }
          const offset = neighbor * 4;
          if (!isWhitishPixel(data, offset, luminance, chroma)) {
            continue;
          }
          clearPixel(data, offset);
          mask[neighbor] = 1;
          added.push(neighbor);
          extendMaskBounds(clearedBounds, neighbor, width);
          area += 1;
        }
      }
    }

    frontier = added;
  }

  return { bounds: toBounds(clearedBounds), area };
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
  /* Posisi visual slot diputar bisa berbeda dari x/y lokalnya, jadi urutkan
   * berdasarkan bounding box hasil rotasi. Slot tanpa rotasi tetap identik
   * dengan perilaku lama. */
  const entries = slots.map((slot) => ({ slot, bounds: getSlotBounds(slot) }));
  entries.sort((a, b) =>
    a.bounds.y === b.bounds.y
      ? a.bounds.x - b.bounds.x
      : a.bounds.y - b.bounds.y,
  );
  const rows: Array<typeof entries> = [];

  for (const entry of entries) {
    const row = rows[rows.length - 1];
    if (row) {
      const tolerance = Math.max(
        4,
        Math.round(Math.min(row[0].bounds.h, entry.bounds.h) * 0.1),
      );
      if (Math.abs(entry.bounds.y - row[0].bounds.y) <= tolerance) {
        row.push(entry);
        continue;
      }
    }
    rows.push([entry]);
  }

  return rows.flatMap((row) =>
    row.sort((a, b) => a.bounds.x - b.bounds.x).map((entry) => entry.slot),
  );
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
