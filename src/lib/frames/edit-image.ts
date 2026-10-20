import type { AlphaImageData, FrameSlot } from "./types";

export type EraseColorOptions = {
  tolerance?: number;
  contiguous?: boolean;
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

export function eraseColorRegion(
  image: AlphaImageData,
  x: number,
  y: number,
  options: EraseColorOptions = {},
): EraseResult {
  const { data, width, height } = image;
  const tolerance = options.tolerance ?? DEFAULT_TOLERANCE;
  const contiguous = options.contiguous ?? true;

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
  const bounds = emptyBounds();
  let area = 0;

  if (!contiguous) {
    for (let index = 0; index < width * height; index += 1) {
      const offset = index * 4;
      if (
        !matchesColor(data, offset, targetR, targetG, targetB, tolerance)
      ) {
        continue;
      }
      const px = index % width;
      const py = (index - px) / width;
      if (px < bounds.minX) bounds.minX = px;
      if (px > bounds.maxX) bounds.maxX = px;
      if (py < bounds.minY) bounds.minY = py;
      if (py > bounds.maxY) bounds.maxY = py;
      clearPixel(data, offset);
      area += 1;
    }
    return { bounds: toBounds(bounds), area };
  }

  const total = width * height;
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

    const px = index % width;
    const py = (index - px) / width;
    if (px < bounds.minX) bounds.minX = px;
    if (px > bounds.maxX) bounds.maxX = px;
    if (py < bounds.minY) bounds.minY = py;
    if (py > bounds.maxY) bounds.maxY = py;
    clearPixel(data, offset);
    area += 1;

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

  return { bounds: toBounds(bounds), area };
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
