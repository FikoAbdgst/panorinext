"use client";

import { useEffect, useRef, useState } from "react";

import { Modal } from "@/components/admin/Modal";
import { detectSlots } from "@/lib/frames/detect-slots";
import {
  eraseColorRegion,
  eraseRect,
  mergeSlots,
  removeWhiteFringe,
} from "@/lib/frames/edit-image";
import {
  getImageData,
  imageDataToPngBlob,
  loadImageFromUrl,
} from "@/lib/frames/image";
import type { FrameSlot } from "@/lib/frames/types";

export type FrameImageEditResult = {
  blob: Blob;
  width: number;
  height: number;
  slots: FrameSlot[];
};

type FrameImageEditorProps = {
  open: boolean;
  imageUrl: string | null;
  initialSlots?: FrameSlot[];
  onClose: () => void;
  onApply: (result: FrameImageEditResult) => Promise<void> | void;
};

type Tool = "wand" | "rect" | "brush" | "restore";

type Snapshot = {
  imageData: ImageData;
  manualSlots: FrameSlot[];
};

type Point = { x: number; y: number };

type BrushStroke = {
  last: Point;
  pointerId: number;
};

const MIN_SLOT_AREA = 64;
const MIN_SLOT_SIZE = 6;
const MAX_HISTORY_BYTES = 64 * 1024 * 1024;

const CHECKERBOARD: React.CSSProperties = {
  backgroundColor: "#ffffff",
  backgroundImage:
    "linear-gradient(45deg, #e5e5e5 25%, transparent 25%), linear-gradient(-45deg, #e5e5e5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e5e5 75%), linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)",
  backgroundSize: "16px 16px",
  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
};

function cloneImageData(image: ImageData): ImageData {
  return new ImageData(
    new Uint8ClampedArray(image.data),
    image.width,
    image.height,
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeRect(a: Point, b: Point): FrameSlot {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    w: Math.abs(b.x - a.x) + 1,
    h: Math.abs(b.y - a.y) + 1,
  };
}

/**
 * Kuas hapus bekerja langsung pada canvas dengan `destination-out`, sehingga
 * piksel yang dilewati menjadi transparan dan tepinya tetap halus (anti-alias)
 * tanpa perlu menghitung per piksel di JavaScript.
 */
function drawBrushDot(
  context: CanvasRenderingContext2D,
  point: Point,
  size: number,
): void {
  context.save();
  context.globalCompositeOperation = "destination-out";
  context.fillStyle = "rgba(0, 0, 0, 1)";
  context.beginPath();
  context.arc(point.x, point.y, size / 2, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawBrushLine(
  context: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  size: number,
): void {
  context.save();
  context.globalCompositeOperation = "destination-out";
  context.strokeStyle = "rgba(0, 0, 0, 1)";
  context.lineWidth = size;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();
  context.restore();
}

/* Kuas kembalikan mengecat ulang piksel dari PNG asli memakai pattern canvas.
 * Pattern tetap sejajar dengan koordinat gambar, jadi hasilnya sama persis
 * dengan area yang pernah dihapus. */
function drawRestoreDot(
  context: CanvasRenderingContext2D,
  point: Point,
  size: number,
  pattern: CanvasPattern,
): void {
  context.save();
  context.globalCompositeOperation = "source-over";
  context.fillStyle = pattern;
  context.beginPath();
  context.arc(point.x, point.y, size / 2, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawRestoreLine(
  context: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  size: number,
  pattern: CanvasPattern,
): void {
  context.save();
  context.globalCompositeOperation = "source-over";
  context.strokeStyle = pattern;
  context.lineWidth = size;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();
  context.restore();
}

export function FrameImageEditor({
  open,
  imageUrl,
  initialSlots,
  onClose,
  onApply,
}: FrameImageEditorProps) {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [manualSlots, setManualSlots] = useState<FrameSlot[]>([]);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);
  const [tool, setTool] = useState<Tool>("wand");
  const [autoTolerance, setAutoTolerance] = useState(true);
  const [tolerance, setTolerance] = useState(24);
  const [cleanup, setCleanup] = useState(2);
  const [expand, setExpand] = useState(1);
  const [feather, setFeather] = useState(1);
  const [brushSize, setBrushSize] = useState(64);
  const [cleanupWhite, setCleanupWhite] = useState(true);
  const [contiguous, setContiguous] = useState(true);
  const [addSlot, setAddSlot] = useState(true);
  const [rectStart, setRectStart] = useState<Point | null>(null);
  const [rectEnd, setRectEnd] = useState<Point | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const brushCursorRef = useRef<HTMLDivElement>(null);
  const brushRef = useRef<BrushStroke | null>(null);
  const restorePatternRef = useRef<CanvasPattern | null>(null);
  const originalRef = useRef<ImageData | null>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !imageUrl) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const { image, objectUrl } = await loadImageFromUrl(imageUrl);
        if (cancelled) {
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
          }
          return;
        }

        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }
        objectUrlRef.current = objectUrl;

        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;
        const raw = getImageData(image, width, height);
        const data = new ImageData(
          new Uint8ClampedArray(raw.data),
          width,
          height,
        );

        originalRef.current = cloneImageData(data);
        const originalCanvas = document.createElement("canvas");
        originalCanvas.width = width;
        originalCanvas.height = height;
        originalCanvas.getContext("2d")?.putImageData(originalRef.current, 0, 0);
        originalCanvasRef.current = originalCanvas;
        setImageData(data);
        setManualSlots([]);
        setHistory([]);
        setFuture([]);
        setTool("wand");
        brushRef.current = null;
        restorePatternRef.current = null;
        setRectStart(null);
        setRectEnd(null);
      } catch {
        if (!cancelled) {
          setError(
            "Gagal memuat PNG. Pastikan file bisa diakses, lalu coba unggah ulang.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, imageUrl]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageData) {
      return;
    }
    if (canvas.width !== imageData.width) {
      canvas.width = imageData.width;
    }
    if (canvas.height !== imageData.height) {
      canvas.height = imageData.height;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.putImageData(imageData, 0, 0);
  }, [imageData]);

  const pushHistory = (snapshot: Snapshot) => {
    setHistory((previous) => {
      const next = [...previous, snapshot];
      let bytes = next.reduce(
        (total, item) => total + item.imageData.data.byteLength,
        0,
      );
      while (next.length > 1 && bytes > MAX_HISTORY_BYTES) {
        bytes -= next[0].imageData.data.byteLength;
        next.shift();
      }
      return next;
    });
    setFuture([]);
  };

  const getPoint = (event: React.PointerEvent): Point | null => {
    const stage = stageRef.current;
    if (!stage || !imageData) {
      return null;
    }
    const rect = stage.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return null;
    }
    return {
      x: clamp(
        Math.floor(((event.clientX - rect.left) / rect.width) * imageData.width),
        0,
        imageData.width - 1,
      ),
      y: clamp(
        Math.floor(((event.clientY - rect.top) / rect.height) * imageData.height),
        0,
        imageData.height - 1,
      ),
    };
  };

  const applyWand = (point: Point) => {
    if (!imageData) {
      return;
    }
    const next = cloneImageData(imageData);
    const result = eraseColorRegion(next, point.x, point.y, {
      autoTolerance,
      tolerance,
      contiguous,
      cleanup,
      cleanupWhite,
      expand,
      feather,
    });
    if (result.area === 0 || !result.bounds) {
      setError("Area tidak ditemukan atau sudah transparan.");
      return;
    }

    pushHistory({ imageData, manualSlots });
    setImageData(next);
    setError(null);

    if (
      addSlot &&
      result.area >= MIN_SLOT_AREA &&
      result.bounds.w >= MIN_SLOT_SIZE &&
      result.bounds.h >= MIN_SLOT_SIZE
    ) {
      setManualSlots((previous) => mergeSlots(previous, [result.bounds!]));
    }
  };

  const applyRect = (start: Point, end: Point) => {
    if (!imageData) {
      return;
    }
    const rect = normalizeRect(start, end);
    if (rect.w < 2 || rect.h < 2) {
      return;
    }
    const next = cloneImageData(imageData);
    const result = eraseRect(next, rect);
    if (result.area === 0) {
      return;
    }

    pushHistory({ imageData, manualSlots });
    setImageData(next);
    setError(null);

    if (addSlot && result.bounds) {
      setManualSlots((previous) => mergeSlots(previous, [result.bounds!]));
    }
  };

  const handleCleanWhiteFringe = () => {
    if (!imageData) {
      return;
    }
    const next = cloneImageData(imageData);
    const result = removeWhiteFringe(next, { radius: 2 });
    if (result.area === 0) {
      setError("Tidak ada sisa putih di tepi area transparan.");
      return;
    }
    pushHistory({ imageData, manualSlots });
    setImageData(next);
    setError(null);
  };

  const updateBrushCursor = (point: Point | null) => {
    const cursor = brushCursorRef.current;
    if (!cursor) {
      return;
    }
    if (!point || !imageData) {
      cursor.style.opacity = "0";
      return;
    }
    cursor.style.opacity = "1";
    cursor.style.left = `${(point.x / imageData.width) * 100}%`;
    cursor.style.top = `${(point.y / imageData.height) * 100}%`;
  };

  const finishBrushStroke = () => {
    const stroke = brushRef.current;
    if (!stroke || !imageData) {
      return;
    }
    brushRef.current = null;
    restorePatternRef.current = null;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }
    try {
      const next = context.getImageData(
        0,
        0,
        imageData.width,
        imageData.height,
      );
      setImageData(next);
      setError(null);
    } catch {
      setError("Gagal menyimpan hasil kuas. Coba lagi.");
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!imageData || applying) {
      return;
    }
    event.preventDefault();
    const point = getPoint(event);
    if (!point) {
      return;
    }

    if (tool === "wand") {
      applyWand(point);
      return;
    }

    if (tool === "brush" || tool === "restore") {
      const context = canvasRef.current?.getContext("2d");
      if (!context) {
        return;
      }

      let pattern: CanvasPattern | null = null;
      if (tool === "restore") {
        const originalCanvas = originalCanvasRef.current;
        if (!originalCanvas) {
          setError("Gambar asli belum siap untuk dikembalikan.");
          return;
        }
        pattern = context.createPattern(originalCanvas, "no-repeat");
        if (!pattern) {
          setError("Gagal menyiapkan kuas pengembali. Coba lagi.");
          return;
        }
      }

      event.currentTarget.setPointerCapture(event.pointerId);
      pushHistory({ imageData, manualSlots });
      if (tool === "brush") {
        drawBrushDot(context, point, brushSize);
      } else if (pattern) {
        restorePatternRef.current = pattern;
        drawRestoreDot(context, point, brushSize, pattern);
      }
      brushRef.current = { last: point, pointerId: event.pointerId };
      setError(null);
      updateBrushCursor(point);
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setRectStart(point);
    setRectEnd(point);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (tool === "brush" || tool === "restore") {
      const point = getPoint(event);
      updateBrushCursor(point);
      const stroke = brushRef.current;
      if (!stroke || stroke.pointerId !== event.pointerId || !point) {
        return;
      }
      const context = canvasRef.current?.getContext("2d");
      if (!context) {
        return;
      }
      if (tool === "brush") {
        drawBrushLine(context, stroke.last, point, brushSize);
      } else {
        const pattern = restorePatternRef.current;
        if (!pattern) {
          return;
        }
        drawRestoreLine(context, stroke.last, point, brushSize, pattern);
      }
      stroke.last = point;
      return;
    }

    if (tool !== "rect" || !rectStart) {
      return;
    }
    const point = getPoint(event);
    if (point) {
      setRectEnd(point);
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (tool === "brush" || tool === "restore") {
      finishBrushStroke();
      return;
    }

    if (tool !== "rect" || !rectStart) {
      return;
    }
    const point = getPoint(event) ?? rectEnd ?? rectStart;
    applyRect(rectStart, point);
    setRectStart(null);
    setRectEnd(null);
  };

  const handleUndo = () => {
    if (!imageData || history.length === 0) {
      return;
    }
    const previous = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setFuture([{ imageData, manualSlots }, ...future]);
    setImageData(previous.imageData);
    setManualSlots(previous.manualSlots);
    brushRef.current = null;
    setRectStart(null);
    setRectEnd(null);
    setError(null);
  };

  const handleRedo = () => {
    if (!imageData || future.length === 0) {
      return;
    }
    const next = future[0];
    setFuture(future.slice(1));
    setHistory([...history, { imageData, manualSlots }]);
    setImageData(next.imageData);
    setManualSlots(next.manualSlots);
    brushRef.current = null;
    setRectStart(null);
    setRectEnd(null);
    setError(null);
  };

  const handleReset = () => {
    if (!imageData || !originalRef.current) {
      return;
    }
    pushHistory({ imageData, manualSlots });
    setImageData(cloneImageData(originalRef.current));
    setManualSlots([]);
    brushRef.current = null;
    setRectStart(null);
    setRectEnd(null);
    setError(null);
  };

  const handleApply = async () => {
    if (!imageData || applying) {
      return;
    }
    setApplying(true);
    setError(null);
    try {
      const blob = await imageDataToPngBlob(imageData);
      const totalArea = imageData.width * imageData.height;
      const detected = addSlot
        ? detectSlots(imageData, { minAreaRatio: 0.002 }).filter(
            (slot) => slot.w * slot.h < totalArea * 0.95,
          )
        : [];
      const slots = mergeSlots([...(initialSlots ?? []), ...manualSlots], detected);
      await onApply({
        blob,
        width: imageData.width,
        height: imageData.height,
        slots,
      });
      onClose();
    } catch (applyError) {
      setError(
        applyError instanceof Error
          ? applyError.message
          : "Gagal menyiapkan PNG hasil edit.",
      );
    } finally {
      setApplying(false);
    }
  };

  const rectPreview =
    rectStart && rectEnd ? normalizeRect(rectStart, rectEnd) : null;
  const visibleSlots = mergeSlots(initialSlots ?? [], manualSlots);

  return (
    <Modal open={open} onClose={onClose} title="Edit Overlay PNG" size="lg">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-2">
          <div
            className="flex max-h-[65vh] min-h-48 items-center justify-center overflow-auto rounded-xl border border-neutral-300 p-3"
            style={CHECKERBOARD}
          >
            {!imageData && !error ? (
              <p className="py-16 text-sm text-neutral-500">Memuat PNG...</p>
            ) : error && !imageData ? (
              <p className="max-w-sm py-16 text-center text-sm text-red-600">
                {error}
              </p>
            ) : imageData ? (
              <div
                ref={stageRef}
                className="relative inline-block touch-none select-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onPointerEnter={(event) => {
                  if (tool === "brush") {
                    updateBrushCursor(getPoint(event));
                  }
                }}
                onPointerLeave={() => updateBrushCursor(null)}
              >
                <canvas
                  ref={canvasRef}
                  className={`block h-auto w-auto max-h-[60vh] max-w-full ${
                    applying
                      ? "cursor-wait"
                      : tool === "brush" || tool === "restore"
                        ? "cursor-none"
                        : "cursor-crosshair"
                  }`}
                />
                {tool === "brush" || tool === "restore" ? (
                  <div
                    ref={brushCursorRef}
                    aria-hidden="true"
                    className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#BF3131] bg-white/25 opacity-0 shadow-[0_0_0_1px_rgba(255,255,255,0.8)]"
                    style={{
                      width: `${(brushSize / imageData.width) * 100}%`,
                      aspectRatio: "1 / 1",
                      minWidth: "5px",
                      minHeight: "5px",
                    }}
                  />
                ) : null}
                {visibleSlots.map((slot, index) => (
                  <div
                    key={`${slot.x}-${slot.y}-${slot.w}-${slot.h}-${index}`}
                    className="pointer-events-none absolute border border-[#BF3131] bg-[#BF3131]/10"
                    style={{
                      left: `${(slot.x / imageData.width) * 100}%`,
                      top: `${(slot.y / imageData.height) * 100}%`,
                      width: `${(slot.w / imageData.width) * 100}%`,
                      height: `${(slot.h / imageData.height) * 100}%`,
                    }}
                  >
                    <span className="absolute -top-4 left-0 rounded bg-[#BF3131] px-1 text-[10px] font-semibold text-white">
                      {index + 1}
                    </span>
                  </div>
                ))}
                {rectPreview ? (
                  <div
                    className="pointer-events-none absolute border-2 border-dashed border-[#BF3131] bg-[#BF3131]/20"
                    style={{
                      left: `${(rectPreview.x / imageData.width) * 100}%`,
                      top: `${(rectPreview.y / imageData.height) * 100}%`,
                      width: `${(rectPreview.w / imageData.width) * 100}%`,
                      height: `${(rectPreview.h / imageData.height) * 100}%`,
                    }}
                  />
                ) : null}
              </div>
            ) : (
              <p className="py-16 text-sm text-neutral-500">
                Pilih PNG terlebih dahulu.
              </p>
            )}
          </div>
          <p className="text-xs text-neutral-500">
            {tool === "wand"
              ? "Klik area background/slot. Toleransi otomatis menghitung warna dari sekitar klik, lalu sisa putih di tepi ikut dibersihkan. Bila masih ada sisa, klik tombol Bersihkan Sisa Putih."
              : tool === "brush"
                ? "Klik lalu geser kuas di atas objek/background yang ingin dihapus. Area yang dilewati menjadi transparan. Gunakan Undo bila kelebihan menghapus."
                : tool === "restore"
                  ? "Klik lalu geser kuas untuk mengembalikan area yang sudah dihapus ke gambar PNG asli. Cocok untuk memperbaiki bagian yang terlanjur terhapus."
                  : "Tarik kotak di area slot. Seluruh isi kotak akan dibuat transparan."}
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTool("wand")}
              className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                tool === "wand"
                  ? "border-[#BF3131] bg-[#FEF3E2] text-[#BF3131]"
                  : "border-neutral-300 text-neutral-700"
              }`}
            >
              Magic Wand
            </button>
            <button
              type="button"
              onClick={() => setTool("rect")}
              className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                tool === "rect"
                  ? "border-[#BF3131] bg-[#FEF3E2] text-[#BF3131]"
                  : "border-neutral-300 text-neutral-700"
              }`}
            >
              Kotak Slot
            </button>
            <button
              type="button"
              onClick={() => setTool("brush")}
              className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                tool === "brush"
                  ? "border-[#BF3131] bg-[#FEF3E2] text-[#BF3131]"
                  : "border-neutral-300 text-neutral-700"
              }`}
            >
              Kuas Hapus
            </button>
            <button
              type="button"
              onClick={() => setTool("restore")}
              className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                tool === "restore"
                  ? "border-[#BF3131] bg-[#FEF3E2] text-[#BF3131]"
                  : "border-neutral-300 text-neutral-700"
              }`}
            >
              Kuas Kembalikan
            </button>
          </div>

          {tool === "brush" || tool === "restore" ? (
            <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-neutral-700">
                  Ukuran kuas: {brushSize}px
                </span>
                <input
                  type="range"
                  min={1}
                  max={400}
                  step={1}
                  value={brushSize}
                  onChange={(event) =>
                    setBrushSize(Number(event.target.value))
                  }
                  className="w-full accent-[#BF3131]"
                />
                <span className="flex justify-between text-[10px] text-neutral-400">
                  <span>1px</span>
                  <span>400px</span>
                </span>
              </label>
              <p className="text-xs leading-relaxed text-neutral-500">
                {tool === "brush"
                  ? "Area yang dilewati menjadi transparan. Gunakan ukuran 1–3px untuk sela-sela kecil. Slot baru dari area kuas dideteksi saat menekan Terapkan ke Frame."
                  : "Area yang dilewati dikembalikan ke gambar PNG asli. Berguna untuk memperbaiki bagian yang terlanjur terhapus."}
              </p>
            </div>
          ) : null}

          {tool === "wand" ? (
            <>
              <label className="flex items-start gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={autoTolerance}
                  onChange={(event) => setAutoTolerance(event.target.checked)}
                  className="mt-0.5 accent-[#BF3131]"
                />
                <span>
                  Toleransi otomatis (disarankan)
                  <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">
                    Toleransi dihitung dari variasi warna di sekitar klik, jadi
                    tidak perlu menebak angka.
                  </span>
                </span>
              </label>

              {!autoTolerance ? (
                <label className="block space-y-1 text-sm">
                  <span className="font-medium text-neutral-700">
                    Toleransi warna manual: {tolerance}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={120}
                    step={1}
                    value={tolerance}
                    onChange={(event) =>
                      setTolerance(Number(event.target.value))
                    }
                    className="w-full accent-[#BF3131]"
                  />
                </label>
              ) : null}

              <label className="flex items-start gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={cleanupWhite}
                  onChange={(event) => setCleanupWhite(event.target.checked)}
                  className="mt-0.5 accent-[#BF3131]"
                />
                <span>
                  Bersihkan sisa putih di tepi
                  <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">
                    Menghapus garis/halo putih yang tertinggal setelah area
                    utama terhapus.
                  </span>
                </span>
              </label>

              <details className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  Pengaturan lanjutan (opsional)
                </summary>
                <div className="mt-3 space-y-3">
                  <label className="block space-y-1 text-sm">
                    <span className="font-medium text-neutral-700">
                      Radius pembersihan tepi: {cleanup}px
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={12}
                      step={1}
                      value={cleanup}
                      onChange={(event) =>
                        setCleanup(Number(event.target.value))
                      }
                      className="w-full accent-[#BF3131]"
                    />
                  </label>

                  <label className="block space-y-1 text-sm">
                    <span className="font-medium text-neutral-700">
                      Perluas area hapus: {expand}px
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={8}
                      step={1}
                      value={expand}
                      onChange={(event) =>
                        setExpand(Number(event.target.value))
                      }
                      className="w-full accent-[#BF3131]"
                    />
                  </label>

                  <label className="block space-y-1 text-sm">
                    <span className="font-medium text-neutral-700">
                      Kehalusan tepi: {feather}px
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={8}
                      step={1}
                      value={feather}
                      onChange={(event) =>
                        setFeather(Number(event.target.value))
                      }
                      className="w-full accent-[#BF3131]"
                    />
                  </label>
                </div>
              </details>

              <label className="flex items-start gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={contiguous}
                  onChange={(event) => setContiguous(event.target.checked)}
                  className="mt-0.5 accent-[#BF3131]"
                />
                <span>Hanya area terhubung</span>
              </label>
            </>
          ) : null}

          <label className="flex items-start gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={addSlot}
              onChange={(event) => setAddSlot(event.target.checked)}
              className="mt-0.5 accent-[#BF3131]"
            />
            <span>
              Tambahkan area transparan sebagai slot
              {tool === "brush" ? " (dideteksi saat Terapkan)" : ""}
            </span>
          </label>

          {tool === "wand" && !contiguous ? (
            <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Mode global menghapus semua warna serupa di seluruh gambar,
              termasuk dekorasi.
            </p>
          ) : null}

          <div className="space-y-1.5">
            <button
              type="button"
              onClick={handleCleanWhiteFringe}
              disabled={!imageData || applying}
              className="w-full rounded-lg border border-[#BF3131]/40 bg-[#FFFBF3] px-3 py-2 text-sm font-semibold text-[#BF3131] transition hover:bg-[#FEF3E2] disabled:opacity-50"
            >
              Bersihkan Sisa Putih di Tepi
            </button>
            <p className="text-xs leading-relaxed text-neutral-500">
              Menghapus halo putih ±2px di sekitar area transparan. Bisa diklik
              berulang bila masih ada sisa. Gunakan Undo jika terlalu banyak.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0 || applying}
              className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm text-neutral-700 disabled:opacity-50"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={future.length === 0 || applying}
              className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm text-neutral-700 disabled:opacity-50"
            >
              Redo
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={history.length === 0 || applying}
              className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm text-neutral-700 disabled:opacity-50"
            >
              Reset
            </button>
          </div>

          {imageData ? (
            <dl className="space-y-1 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
              <div className="flex justify-between gap-3">
                <dt>Ukuran</dt>
                <dd>
                  {imageData.width}×{imageData.height}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Slot</dt>
                <dd>{visibleSlots.length}</dd>
              </div>
            </dl>
          ) : null}

          {error && imageData ? (
            <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleApply}
              disabled={!imageData || applying}
              className="rounded-lg bg-[#BF3131] px-4 py-2 text-sm font-medium text-white hover:bg-[#a52929] disabled:opacity-60"
            >
              {applying ? "Menyiapkan..." : "Terapkan ke Frame"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
