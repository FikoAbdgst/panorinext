"use client";

import { useEffect, useRef, useState } from "react";

import type { FrameSlot } from "@/lib/frames/types";

type SlotEditorProps = {
  imageUrl: string | null;
  width: number;
  height: number;
  slots: FrameSlot[];
  onChange: (slots: FrameSlot[]) => void;
};

type DragState = {
  kind: "move" | "resize";
  index: number;
  pointerId: number;
  startX: number;
  startY: number;
  origin: FrameSlot;
};

const MIN_SIZE = 8;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
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
    kind: "move" | "resize",
  ) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      kind,
      index,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: { ...slots[index] },
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
    const next = slots.slice();

    if (drag.kind === "move") {
      next[drag.index] = {
        ...origin,
        x: clamp(Math.round(origin.x + dx), 0, Math.max(0, width - origin.w)),
        y: clamp(Math.round(origin.y + dy), 0, Math.max(0, height - origin.h)),
      };
    } else {
      next[drag.index] = {
        ...origin,
        w: clamp(Math.round(origin.w + dx), MIN_SIZE, Math.max(MIN_SIZE, width - origin.x)),
        h: clamp(Math.round(origin.h + dy), MIN_SIZE, Math.max(MIN_SIZE, height - origin.y)),
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
    if (key === "w") {
      next[index] = { ...slot, w: clamp(Math.round(value), MIN_SIZE, width - slot.x) };
    } else if (key === "h") {
      next[index] = { ...slot, h: clamp(Math.round(value), MIN_SIZE, height - slot.y) };
    } else if (key === "x") {
      next[index] = { ...slot, x: clamp(Math.round(value), 0, width - slot.w) };
    } else {
      next[index] = { ...slot, y: clamp(Math.round(value), 0, height - slot.h) };
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
          slots.map((slot, index) => (
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
              <div
                onPointerDown={(event) => handlePointerDown(event, index, "resize")}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="absolute right-0 bottom-0 h-3.5 w-3.5 cursor-se-resize bg-[#BF3131]"
              />
            </div>
          ))}
      </div>

      <div className="space-y-2">
        {slots.length === 0 ? (
          <p className="text-sm text-neutral-500">Belum ada slot. Tambahkan manual atau muat ulang PNG.</p>
        ) : (
          slots.map((slot, index) => (
            <div
              key={index}
              className="grid grid-cols-[1.5rem_repeat(4,minmax(0,1fr))_auto] items-center gap-2"
            >
              <span className="text-xs font-semibold text-neutral-600">#{index + 1}</span>
              {(["x", "y", "w", "h"] as const).map((key) => (
                <label key={key} className="flex items-center gap-1 text-[10px] uppercase text-neutral-500">
                  {key}
                  <input
                    type="number"
                    value={slot[key]}
                    onChange={(event) => updateField(index, key, Number(event.target.value))}
                    className="w-full rounded-md border border-neutral-300 px-1 py-0.5 text-sm text-neutral-800"
                  />
                </label>
              ))}
              <button
                type="button"
                onClick={() => removeSlot(index)}
                className="text-xs font-medium text-[#BF3131] underline"
              >
                Hapus
              </button>
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
