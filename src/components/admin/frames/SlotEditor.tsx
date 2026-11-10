"use client";

import { useEffect, useRef, useState } from "react";

import {
  getSlotCenter,
  getSlotOuterSize,
  getSlotRotation,
  getSlotTransform,
  normalizeRotation,
} from "@/lib/frames/rotation";
import type { FrameSlot } from "@/lib/frames/types";

type SlotEditorProps = {
  imageUrl: string | null;
  width: number;
  height: number;
  slots: FrameSlot[];
  onChange: (slots: FrameSlot[]) => void;
};

type DragKind = "move" | "resize" | "rotate";

type DragState = {
  kind: DragKind;
  index: number;
  pointerId: number;
  startX: number;
  startY: number;
  origin: FrameSlot;
  /** Sudut awal pointer terhadap pusat slot, untuk drag rotasi. */
  startAngle: number;
  centerX: number;
  centerY: number;
};

const MIN_SIZE = 8;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function roundRotation(value: number): number {
  const normalized = normalizeRotation(value);
  if (!normalized) {
    return 0;
  }
  return Math.round(normalized * 10) / 10;
}

export function SlotEditor({ imageUrl, width, height, slots, onChange }: SlotEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || width <= 0) {
      return;
    }
    const update = () => setScale(element.clientWidth / width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [width]);

  const handlePointerDown = (
    event: React.PointerEvent<HTMLElement>,
    index: number,
    kind: DragKind,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);

    const slot = slots[index];
    const container = containerRef.current;
    const bounds = container?.getBoundingClientRect();
    const center = getSlotCenter(slot);
    const centerX = (bounds?.left ?? 0) + center.x * scale;
    const centerY = (bounds?.top ?? 0) + center.y * scale;
    const startAngle =
      (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) /
      Math.PI;

    dragRef.current = {
      kind,
      index,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: { ...slot },
      startAngle,
      centerX,
      centerY,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    const dx = (event.clientX - drag.startX) / scale;
    const dy = (event.clientY - drag.startY) / scale;
    const origin = drag.origin;
    const rotation = getSlotRotation(origin);
    const next = slots.slice();

    if (drag.kind === "move") {
      /* Batasi memakai bounding box slot yang diputar supaya sudut slot
       * tidak keluar kanvas. */
      const outer = getSlotOuterSize(origin);
      const center = getSlotCenter(origin);
      const centerX = clamp(
        center.x + dx,
        outer.w / 2,
        Math.max(outer.w / 2, width - outer.w / 2),
      );
      const centerY = clamp(
        center.y + dy,
        outer.h / 2,
        Math.max(outer.h / 2, height - outer.h / 2),
      );
      next[drag.index] = {
        ...origin,
        x: Math.round(centerX - origin.w / 2),
        y: Math.round(centerY - origin.h / 2),
      };
    } else if (drag.kind === "resize") {
      if (rotation) {
        /* Ubah ukuran mengikuti sumbu lokal slot, dengan sudut kiri-atas
         * (sebelum diputar) tetap sebagai jangkar. */
        const radians = (rotation * Math.PI) / 180;
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        const localDx = dx * cos + dy * sin;
        const localDy = -dx * sin + dy * cos;
        const center = getSlotCenter(origin);
        const anchorX =
          center.x - (origin.w / 2) * cos + (origin.h / 2) * sin;
        const anchorY =
          center.y - (origin.w / 2) * sin - (origin.h / 2) * cos;
        const nextWidth = clamp(
          Math.round(origin.w + localDx),
          MIN_SIZE,
          Math.max(MIN_SIZE, width),
        );
        const nextHeight = clamp(
          Math.round(origin.h + localDy),
          MIN_SIZE,
          Math.max(MIN_SIZE, height),
        );
        const nextCenterX =
          anchorX + (nextWidth / 2) * cos - (nextHeight / 2) * sin;
        const nextCenterY =
          anchorY + (nextWidth / 2) * sin + (nextHeight / 2) * cos;
        next[drag.index] = {
          ...origin,
          w: nextWidth,
          h: nextHeight,
          x: Math.round(nextCenterX - nextWidth / 2),
          y: Math.round(nextCenterY - nextHeight / 2),
        };
      } else {
        next[drag.index] = {
          ...origin,
          w: clamp(
            Math.round(origin.w + dx),
            MIN_SIZE,
            Math.max(MIN_SIZE, width - origin.x),
          ),
          h: clamp(
            Math.round(origin.h + dy),
            MIN_SIZE,
            Math.max(MIN_SIZE, height - origin.y),
          ),
        };
      }
    } else {
      const pointerAngle =
        (Math.atan2(
          event.clientY - drag.centerY,
          event.clientX - drag.centerX,
        ) *
          180) /
        Math.PI;
      const nextRotation = roundRotation(
        rotation + pointerAngle - drag.startAngle,
      );
      next[drag.index] = {
        ...origin,
        rotation: nextRotation === 0 ? undefined : nextRotation,
      };
    }

    onChange(next);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    dragRef.current = null;
  };

  const updateField = (index: number, key: keyof FrameSlot, value: number) => {
    if (!Number.isFinite(value)) {
      return;
    }
    const next = slots.slice();
    const slot = next[index];

    if (key === "rotation") {
      const rotation = roundRotation(value);
      next[index] = {
        ...slot,
        rotation: rotation === 0 ? undefined : rotation,
      };
    } else if (key === "w") {
      const maxWidth = getSlotRotation(slot)
        ? width
        : Math.max(MIN_SIZE, width - slot.x);
      next[index] = {
        ...slot,
        w: clamp(Math.round(value), MIN_SIZE, maxWidth),
      };
    } else if (key === "h") {
      const maxHeight = getSlotRotation(slot)
        ? height
        : Math.max(MIN_SIZE, height - slot.y);
      next[index] = {
        ...slot,
        h: clamp(Math.round(value), MIN_SIZE, maxHeight),
      };
    } else if (key === "x") {
      next[index] = {
        ...slot,
        x: clamp(Math.round(value), 0, Math.max(0, width - slot.w)),
      };
    } else {
      next[index] = {
        ...slot,
        y: clamp(Math.round(value), 0, Math.max(0, height - slot.h)),
      };
    }
    onChange(next);
  };

  const removeSlot = (index: number) => {
    onChange(slots.filter((_, i) => i !== index));
  };

  const addSlot = () => {
    const w = Math.round(width * 0.6);
    const h = Math.round(height * 0.18);
    onChange([
      ...slots,
      {
        x: Math.round((width - w) / 2),
        y: Math.round(height * 0.1 + slots.length * (h + 12)),
        w,
        h,
      },
    ]);
  };

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="relative w-full max-w-md touch-none select-none overflow-hidden rounded-xl border border-neutral-300 bg-neutral-100"
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Preview overlay frame"
            className="block w-full"
            draggable={false}
          />
        ) : (
          <div className="flex aspect-[2/5] items-center justify-center text-sm text-neutral-500">
            Unggah PNG untuk melihat preview
          </div>
        )}

        {imageUrl &&
          slots.map((slot, index) => {
            const rotation = getSlotRotation(slot);
            return (
              <div
                key={index}
                onPointerDown={(event) => handlePointerDown(event, index, "move")}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="absolute cursor-move border-2 border-[#BF3131] bg-[#BF3131]/20"
                style={{
                  left: slot.x * scale,
                  top: slot.y * scale,
                  width: slot.w * scale,
                  height: slot.h * scale,
                  transform: getSlotTransform(slot),
                  transformOrigin: "center",
                }}
              >
                <span className="absolute -top-5 left-0 rounded bg-[#BF3131] px-1 text-[10px] font-semibold text-white">
                  {index + 1}
                </span>
                <button
                  type="button"
                  aria-label={`Hapus slot ${index + 1}`}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => removeSlot(index)}
                  className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#BF3131] text-xs font-bold text-white"
                >
                  ×
                </button>
                <button
                  type="button"
                  aria-label={`Putar slot ${index + 1}`}
                  title="Tarik untuk memutar slot"
                  onPointerDown={(event) => handlePointerDown(event, index, "rotate")}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="absolute -top-8 left-1/2 flex h-6 w-6 -translate-x-1/2 cursor-grab items-center justify-center rounded-full border border-[#BF3131] bg-white text-xs font-bold text-[#BF3131] shadow active:cursor-grabbing"
                >
                  ↻
                </button>
                <div
                  onPointerDown={(event) => handlePointerDown(event, index, "resize")}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="absolute right-0 bottom-0 h-3.5 w-3.5 cursor-se-resize bg-[#BF3131]"
                />
                {rotation ? (
                  <span className="absolute right-0 -bottom-5 rounded bg-[#2A0A0A]/80 px-1 text-[10px] font-semibold text-white">
                    {rotation.toFixed(1)}°
                  </span>
                ) : null}
              </div>
            );
          })}
      </div>

      <p className="text-xs leading-relaxed text-neutral-500">
        Geser kotak untuk memindahkan, tarik ujung kanan bawah untuk mengubah
        ukuran, dan tarik tombol <span className="font-semibold">↻</span> di atas
        kotak untuk memutar slot.
      </p>

      <div className="space-y-2">
        {slots.length === 0 ? (
          <p className="text-sm text-neutral-500">Belum ada slot. Tambahkan manual atau muat ulang PNG.</p>
        ) : (
          slots.map((slot, index) => (
            <div
              key={index}
              className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-600">
                  Slot #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeSlot(index)}
                  className="text-xs font-medium text-[#BF3131] underline"
                >
                  Hapus
                </button>
              </div>

              <div className="grid grid-cols-5 gap-1">
                {(["x", "y", "w", "h"] as const).map((key) => (
                  <label
                    key={key}
                    className="flex items-center gap-1 text-[10px] uppercase text-neutral-500"
                  >
                    {key}
                    <input
                      type="number"
                      value={slot[key]}
                      onChange={(event) =>
                        updateField(index, key, Number(event.target.value))
                      }
                      className="w-full rounded-md border border-neutral-300 px-1 py-0.5 text-sm text-neutral-800"
                    />
                  </label>
                ))}
                <label className="flex items-center gap-1 text-[10px] uppercase text-neutral-500">
                  rot
                  <input
                    type="number"
                    step={0.5}
                    value={getSlotRotation(slot)}
                    onChange={(event) =>
                      updateField(index, "rotation", Number(event.target.value))
                    }
                    className="w-full rounded-md border border-neutral-300 px-1 py-0.5 text-sm text-neutral-800"
                  />
                </label>
              </div>

              <label className="block space-y-1">
                <span className="flex items-center justify-between text-[10px] uppercase tracking-wide text-neutral-500">
                  <span>Putar slot</span>
                  <span className="tabular-nums text-neutral-700">
                    {getSlotRotation(slot).toFixed(1)}°
                  </span>
                </span>
                <input
                  type="range"
                  min={-90}
                  max={90}
                  step={1}
                  value={Math.round(getSlotRotation(slot))}
                  onChange={(event) =>
                    updateField(index, "rotation", Number(event.target.value))
                  }
                  className="w-full accent-[#BF3131]"
                />
              </label>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={addSlot}
        className="rounded-lg border border-[#BF3131] px-3 py-1.5 text-sm font-medium text-[#BF3131] hover:bg-[#FEF3E2]"
      >
        + Tambah Slot
      </button>
    </div>
  );
}
