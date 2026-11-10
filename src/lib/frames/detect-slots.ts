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
  /**
   * Seberapa mirip komponen dengan persegi panjang (luas komponen dibagi luas
   * minimum rectangle) sebelum sudut rotasinya dipakai. Komponen yang tidak
   * berbentuk slot, misalnya celah di antara dekorasi, tetap memakai bounding
   * box lurus seperti sebelumnya. Default 0.8.
   */
  rectangularityThreshold?: number;
};

type Point = { x: number; y: number };

type ComponentBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

type OrientedRect = {
  cx: number;
  cy: number;
  w: number;
  h: number;
  /** Radian. */
  angle: number;
};

/**
 * Andrew's monotone chain. Titik collinear dibuang agar sudut slot tidak
 * terpengaruh piksel tangga (staircase) pada tepi yang miring.
 */
function convexHull(points: Point[]): Point[] {
  if (points.length <= 1) {
    return points;
  }
  const sorted = [...points].sort((a, b) =>
    a.x === b.x ? a.y - b.y : a.x - b.x,
  );
  const cross = (o: Point, a: Point, b: Point) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower: Point[] = [];
  for (const point of sorted) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0
    ) {
      lower.pop();
    }
    lower.push(point);
  }

  const upper: Point[] = [];
  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    const point = sorted[index];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0
    ) {
      upper.pop();
    }
    upper.push(point);
  }

  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

/**
 * Minimum-area rectangle dari satu komponen. Sudut diambil dari sisi convex
 * hull, lalu semua titik diproyeksikan ke sumbu sisi tersebut. Cara ini akurat
 * untuk slot persegi panjang yang diputar, termasuk yang tepinya bergerigi.
 */
function minAreaRectangle(
  boundary: Point[],
  bounds: ComponentBounds,
  componentArea: number,
  rectangularityThreshold: number,
): OrientedRect {
  const fallbackW = bounds.maxX - bounds.minX + 1;
  const fallbackH = bounds.maxY - bounds.minY + 1;
  const fallback: OrientedRect = {
    cx: bounds.minX + fallbackW / 2,
    cy: bounds.minY + fallbackH / 2,
    w: fallbackW,
    h: fallbackH,
    angle: 0,
  };

  const hull = convexHull(boundary);
  if (hull.length < 3) {
    return fallback;
  }

  let best: (OrientedRect & { area: number }) | null = null;

  for (let index = 0; index < hull.length; index += 1) {
    const start = hull[index];
    const end = hull[(index + 1) % hull.length];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    if (length === 0) {
      continue;
    }

    const ux = dx / length;
    const uy = dy / length;
    const vx = -uy;
    const vy = ux;

    let minU = Infinity;
    let maxU = -Infinity;
    let minV = Infinity;
    let maxV = -Infinity;
    for (const point of hull) {
      const u = point.x * ux + point.y * uy;
      const v = point.x * vx + point.y * vy;
      if (u < minU) minU = u;
      if (u > maxU) maxU = u;
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }

    /* +1 karena koordinat piksel inklusif; tanpa ini slot tegak lurus
     * kehilangan 1px dibandingkan bounding box lama. */
    const w = maxU - minU + 1;
    const h = maxV - minV + 1;
    const area = w * h;
    if (best && area >= best.area - 1e-6) {
      continue;
    }

    const centerU = (minU + maxU) / 2;
    const centerV = (minV + maxV) / 2;
    best = {
      cx: centerU * ux + centerV * vx,
      cy: centerU * uy + centerV * vy,
      w,
      h,
      angle: Math.atan2(uy, ux),
      area,
    };
  }

  if (!best) {
    return fallback;
  }
  /* Komponen yang tidak menyerupai persegi panjang (mis. celah di antara
   * dekorasi) jangan dipaksa miring; pakai bounding box lama. */
  if (componentArea / best.area < rectangularityThreshold) {
    return fallback;
  }
  return best;
}

function roundToInt(value: number): number {
  const rounded = Math.round(value);
  return rounded === 0 ? 0 : rounded;
}

/**
 * Ubah rectangle berorientasi menjadi FrameSlot. Sudut dinormalisasi ke
 * rentang (-45, 45] dengan menukar lebar/tinggi, sehingga angka rotasi tetap
 * kecil dan hasil visualnya sama.
 */
function toFrameSlot(rect: OrientedRect): FrameSlot {
  let angle = (rect.angle * 180) / Math.PI;
  let w = rect.w;
  let h = rect.h;

  while (angle <= -45) {
    angle += 90;
    const swap = w;
    w = h;
    h = swap;
  }
  while (angle > 45) {
    angle -= 90;
    const swap = w;
    w = h;
    h = swap;
  }

  const width = Math.max(1, roundToInt(w));
  const height = Math.max(1, roundToInt(h));
  const rotation = Math.abs(angle) < 0.5 ? 0 : Math.round(angle * 10) / 10;
  const slot: FrameSlot = {
    x: roundToInt(rect.cx - width / 2),
    y: roundToInt(rect.cy - height / 2),
    w: width,
    h: height,
  };
  if (rotation) {
    slot.rotation = rotation;
  }
  return slot;
}

/**
 * Mendeteksi lubang transparan pada overlay PNG sebagai kandidat slot foto.
 *
 * Algoritma:
 * 1. Labeli komponen transparan (flood fill 4-arah).
 * 2. Buang komponen yang terlalu kecil.
 * 3. Buang komponen latar luar: menyentuh ≥2 sisi dan menutupi hampir
 *    seluruh kanvas (luas ≥50% atau bounding box ≥85%).
 * 4. Untuk tiap komponen, ambil piksel tepinya lalu hitung minimum-area
 *    rectangle. Hasilnya menyertakan `rotation` bila slot miring.
 * 5. Urutkan dari atas ke bawah, lalu kiri ke kanan.
 */
export function detectSlots(
  image: AlphaImageData,
  options: DetectSlotsOptions = {},
): FrameSlot[] {
  const { data, width, height } = image;
  const alphaThreshold = options.alphaThreshold ?? 10;
  const minAreaRatio = options.minAreaRatio ?? 0.01;
  const ignoreBorderComponents = options.ignoreBorderComponents ?? true;
  const rectangularityThreshold = options.rectangularityThreshold ?? 0.8;

  if (width <= 0 || height <= 0) {
    return [];
  }

  const total = width * height;
  const minArea = Math.max(1, Math.floor(total * minAreaRatio));
  /* 0 = belum dikunjungi, -1 = piksel opaque, >0 = id komponen transparan. */
  const labels = new Int32Array(total);
  const stack = new Int32Array(total);

  type Component = ComponentBounds & {
    id: number;
    area: number;
  };
  const components: Component[] = [];
  let nextId = 0;

  for (let start = 0; start < total; start += 1) {
    if (labels[start] !== 0) {
      continue;
    }

    if (data[start * 4 + 3] >= alphaThreshold) {
      labels[start] = -1;
      continue;
    }

    nextId += 1;
    const id = nextId;
    let stackPointer = 0;
    stack[stackPointer] = start;
    stackPointer += 1;
    labels[start] = id;

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    let area = 0;
    let edgeMask = 0;

    while (stackPointer > 0) {
      stackPointer -= 1;
      const index = stack[stackPointer];
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
        const neighbor = index - 1;
        if (labels[neighbor] === 0) {
          if (data[neighbor * 4 + 3] < alphaThreshold) {
            labels[neighbor] = id;
            stack[stackPointer] = neighbor;
            stackPointer += 1;
          } else {
            labels[neighbor] = -1;
          }
        }
      }
      if (x < width - 1) {
        const neighbor = index + 1;
        if (labels[neighbor] === 0) {
          if (data[neighbor * 4 + 3] < alphaThreshold) {
            labels[neighbor] = id;
            stack[stackPointer] = neighbor;
            stackPointer += 1;
          } else {
            labels[neighbor] = -1;
          }
        }
      }
      if (y > 0) {
        const neighbor = index - width;
        if (labels[neighbor] === 0) {
          if (data[neighbor * 4 + 3] < alphaThreshold) {
            labels[neighbor] = id;
            stack[stackPointer] = neighbor;
            stackPointer += 1;
          } else {
            labels[neighbor] = -1;
          }
        }
      }
      if (y < height - 1) {
        const neighbor = index + width;
        if (labels[neighbor] === 0) {
          if (data[neighbor * 4 + 3] < alphaThreshold) {
            labels[neighbor] = id;
            stack[stackPointer] = neighbor;
            stackPointer += 1;
          } else {
            labels[neighbor] = -1;
          }
        }
      }
    }

    if (area < minArea) {
      continue;
    }

    const edgeSides =
      (edgeMask & 1 ? 1 : 0) +
      (edgeMask & 2 ? 1 : 0) +
      (edgeMask & 4 ? 1 : 0) +
      (edgeMask & 8 ? 1 : 0);
    const boxWidth = maxX - minX + 1;
    const boxHeight = maxY - minY + 1;
    const areaRatio = area / total;
    const bboxRatio = (boxWidth * boxHeight) / total;

    /* Latar luar transparan biasanya menutupi hampir seluruh kanvas.
     * Syarat "menyentuh ≥2 sisi" saja berisiko membuang slot full-bleed
     * yang menempel ke tepi, jadi tambahkan syarat luas/bbox: hanya
     * komponen raksasa yang dianggap latar luar. */
    const isOuterBackground =
      edgeSides >= 2 && (areaRatio >= 0.5 || bboxRatio >= 0.85);
    if (ignoreBorderComponents && isOuterBackground) {
      continue;
    }

    components.push({
      id,
      area,
      minX,
      minY,
      maxX,
      maxY,
    });
  }

  const found: FrameSlot[] = [];

  for (const component of components) {
    const { id, minX, minY, maxX, maxY } = component;
    const boundary: Point[] = [];

    /* Ambil hanya piksel tepi. Interior slot bisa ratusan ribu piksel,
     * sedangkan convex hull hanya butuh cincin terluarnya. */
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const index = y * width + x;
        if (labels[index] !== id) {
          continue;
        }
        const isBoundary =
          x === 0 ||
          y === 0 ||
          x === width - 1 ||
          y === height - 1 ||
          labels[index - 1] !== id ||
          labels[index + 1] !== id ||
          labels[index - width] !== id ||
          labels[index + width] !== id;
        if (isBoundary) {
          boundary.push({ x, y });
        }
      }
    }

    found.push(
      toFrameSlot(
        minAreaRectangle(
          boundary,
          { minX, minY, maxX, maxY },
          component.area,
          rectangularityThreshold,
        ),
      ),
    );
  }

  return sortSlots(found);
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
