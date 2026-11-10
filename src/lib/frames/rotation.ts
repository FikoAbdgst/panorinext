import type { FrameSlot } from "./types";

export type SlotPoint = { x: number; y: number };

/** Sudut slot yang aman dipakai, termasuk untuk data lama tanpa `rotation`. */
export function getSlotRotation(
  slot: Pick<FrameSlot, "rotation">,
): number {
  const rotation = slot.rotation ?? 0;
  return Number.isFinite(rotation) ? rotation : 0;
}

/** Normalisasi sudut ke rentang (-180, 180]. */
export function normalizeRotation(degrees: number): number {
  if (!Number.isFinite(degrees)) {
    return 0;
  }
  let value = degrees % 360;
  if (value > 180) {
    value -= 360;
  } else if (value <= -180) {
    value += 360;
  }
  return Math.abs(value) < 0.05 ? 0 : value;
}

export function getSlotCenter(slot: FrameSlot): SlotPoint {
  return { x: slot.x + slot.w / 2, y: slot.y + slot.h / 2 };
}

export function rotatePoint(
  point: SlotPoint,
  center: SlotPoint,
  degrees: number,
): SlotPoint {
  if (!degrees) {
    return point;
  }
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

/** Empat sudut slot setelah diputar, dalam koordinat gambar. */
export function getSlotCorners(
  slot: FrameSlot,
): [SlotPoint, SlotPoint, SlotPoint, SlotPoint] {
  const center = getSlotCenter(slot);
  const rotation = getSlotRotation(slot);
  const corners: SlotPoint[] = [
    { x: slot.x, y: slot.y },
    { x: slot.x + slot.w, y: slot.y },
    { x: slot.x + slot.w, y: slot.y + slot.h },
    { x: slot.x, y: slot.y + slot.h },
  ];
  return corners.map((corner) =>
    rotatePoint(corner, center, rotation),
  ) as [SlotPoint, SlotPoint, SlotPoint, SlotPoint];
}

/** Bounding box sumbu-X/Y dari slot yang sudah diputar. */
export function getSlotBounds(slot: FrameSlot): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  if (!getSlotRotation(slot)) {
    return { x: slot.x, y: slot.y, w: slot.w, h: slot.h };
  }
  const corners = getSlotCorners(slot);
  const xs = corners.map((corner) => corner.x);
  const ys = corners.map((corner) => corner.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/**
 * Ukuran bounding box slot yang diputar. Dipakai untuk membatasi posisi saat
 * slot digeser supaya sudutnya tidak keluar dari kanvas.
 */
export function getSlotOuterSize(
  slot: Pick<FrameSlot, "w" | "h" | "rotation">,
): { w: number; h: number } {
  const radians = (getSlotRotation(slot) * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  return {
    w: slot.w * cos + slot.h * sin,
    h: slot.w * sin + slot.h * cos,
  };
}

/** Transform CSS untuk elemen slot (rotasi mengelilingi pusat). */
export function getSlotTransform(slot: Pick<FrameSlot, "rotation">): string | undefined {
  const rotation = getSlotRotation(slot);
  return rotation ? `rotate(${rotation}deg)` : undefined;
}
