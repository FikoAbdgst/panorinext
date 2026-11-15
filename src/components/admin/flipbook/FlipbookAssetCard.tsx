"use client";

/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  createFlipbookAssetUploadUrlAction,
  deleteFlipbookAssetAction,
  saveFlipbookAssetAction,
} from "@/app/admin/(panel)/flipbook/actions";
import { FrameImageEditor, type FrameImageEditResult } from "@/components/admin/frames/FrameImageEditor";
import { STORAGE_BUCKETS } from "@/lib/constants";
import {
  FLIPBOOK_FRAME_ASPECT,
  FLIPBOOK_FRAME_SIZE_LABEL,
} from "@/lib/flipbook/constants";
import {
  flipbookAssetLabel,
  type FlipbookAsset,
  type FlipbookAssetKind,
} from "@/lib/flipbook/types";
import type { FrameSlot } from "@/lib/frames/types";
import { createClient } from "@/lib/supabase/client";

export function FlipbookAssetCard({
  frameId,
  kind,
  pageIndex,
  asset,
}: {
  frameId: number;
  kind: FlipbookAssetKind;
  pageIndex: number;
  asset: FlipbookAsset | null;
}) {
  const router = useRouter();
  const label = flipbookAssetLabel(kind, pageIndex);
  const assetRatio =
    asset && asset.width > 0 && asset.height > 0
      ? asset.width / asset.height
      : null;
  const ratioMismatch =
    assetRatio !== null &&
    Math.abs(assetRatio - FLIPBOOK_FRAME_ASPECT) > 0.02;
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    asset?.imageUrl ?? null,
  );
  const [slotCount, setSlotCount] = useState(asset?.slots.length ?? 0);
  const [editorUrl, setEditorUrl] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewObjectUrlRef = useRef<string | null>(null);
  const appliedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    };
  }, []);

  const uploadAsset = async (
    blob: Blob,
    width: number,
    height: number,
    slots: FrameSlot[],
  ) => {
    const target = await createFlipbookAssetUploadUrlAction(
      frameId,
      kind,
      pageIndex,
    );
    if ("error" in target) {
      throw new Error(target.error);
    }

    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.flipbookFrames)
      .uploadToSignedUrl(target.path, target.token, blob, {
        contentType: "image/png",
      });
    if (uploadError) {
      throw new Error(`Gagal mengunggah PNG: ${uploadError.message}`);
    }

    const result = await saveFlipbookAssetAction({
      frameId,
      kind,
      pageIndex,
      imagePath: target.path,
      width,
      height,
      slots,
    });
    if (result.status === "error") {
      throw new Error(result.message);
    }
  };

  const openEditor = (url: string) => {
    setError(null);
    setEditorUrl(url);
    appliedRef.current = false;
    setIsEditorOpen(true);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setError(null);

    if (!file) {
      return;
    }
    if (file.type !== "image/png" && !file.name.toLowerCase().endsWith(".png")) {
      setError("Overlay harus berformat PNG.");
      return;
    }

    setIsBusy(true);
    try {
      const objectUrl = URL.createObjectURL(file);
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error("Gagal membaca PNG."));
        element.src = objectUrl;
      });
      if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
        URL.revokeObjectURL(objectUrl);
        throw new Error("Ukuran PNG tidak valid.");
      }

      /* Ganti pratinjau sementara. Editor langsung dibuka supaya admin bisa
       * menghapus background putih/opaque sebelum file disimpan. */
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
      previewObjectUrlRef.current = objectUrl;
      setPreviewUrl(objectUrl);
      setSlotCount(0);
      openEditor(objectUrl);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Gagal membaca PNG.",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleApply = async (result: FrameImageEditResult) => {
    setIsBusy(true);
    setError(null);
    try {
      await uploadAsset(result.blob, result.width, result.height, result.slots);
      const objectUrl = URL.createObjectURL(result.blob);
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
      previewObjectUrlRef.current = objectUrl;
      setPreviewUrl(objectUrl);
      setSlotCount(result.slots.length);
      appliedRef.current = true;
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setEditorUrl(null);
    if (!appliedRef.current) {
      /* Batal edit: kembalikan pratinjau ke aset yang tersimpan. */
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
      setPreviewUrl(asset?.imageUrl ?? null);
      setSlotCount(asset?.slots.length ?? 0);
    }
    appliedRef.current = false;
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Hapus overlay ${label}? Tindakan ini tidak dapat dibatalkan.`,
      )
    ) {
      return;
    }

    setIsBusy(true);
    setError(null);
    try {
      const result = await deleteFlipbookAssetAction(frameId, kind, pageIndex);
      if (result.status === "error") {
        throw new Error(result.message);
      }
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
      setPreviewUrl(null);
      setSlotCount(0);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Gagal menghapus overlay.",
      );
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-100 px-3 py-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-700">
            {label}
          </p>
          <p className="text-[11px] text-neutral-500">
            {kind === "page"
              ? `Halaman ${pageIndex}`
              : kind === "cover"
                ? "Sampul depan"
                : "Sampul belakang"}
          </p>
        </div>
        {previewUrl ? (
          <span className="inline-flex shrink-0 items-center rounded-full bg-[#FEF3E2] px-2 py-0.5 text-[10px] font-semibold text-[#BF3131]">
            {slotCount} slot
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-500">
            kosong
          </span>
        )}
      </div>

      <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-[linear-gradient(45deg,#f1f1f1_25%,transparent_25%,transparent_75%,#f1f1f1_75%,#f1f1f1),linear-gradient(45deg,#f1f1f1_25%,transparent_25%,transparent_75%,#f1f1f1_75%,#f1f1f1)] bg-[length:16px_16px] bg-[position:0_0,8px_8px]">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={`Overlay ${label}`}
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="px-4 text-center text-[11px] font-medium text-neutral-400">
            Belum ada overlay PNG
          </span>
        )}
        {isBusy ? (
          <span className="absolute inset-0 flex items-center justify-center bg-white/75 text-xs font-semibold text-neutral-700">
            Memproses...
          </span>
        ) : null}
      </div>

      <div className="space-y-2 px-3 py-3">
        <input
          type="file"
          accept="image/png"
          onChange={handleFileChange}
          disabled={isBusy}
          className="block w-full text-xs text-neutral-600 file:mr-2 file:rounded-lg file:border-0 file:bg-[#BF3131] file:px-3 file:py-1.5 file:text-xs file:text-white disabled:opacity-60"
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (previewUrl) {
                openEditor(previewUrl);
              }
            }}
            disabled={!previewUrl || isBusy}
            className="rounded-lg bg-[#2A0A0A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#140606] disabled:opacity-50"
          >
            Hapus BG / Edit PNG
          </button>
          {previewUrl ? (
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={isBusy}
              className="text-[11px] font-semibold text-red-600 underline disabled:opacity-50"
            >
              Hapus overlay
            </button>
          ) : null}
        </div>

        <p className="text-[11px] leading-relaxed text-neutral-500">
          Pilih PNG → editor terbuka. Klik <strong>Magic Wand</strong> pada area
          putih di dalam frame, lalu <strong>Terapkan ke Flipbook</strong>. Area
          yang dihapus menjadi transparan dan dipakai sebagai slot foto.
        </p>
        <p className="text-[11px] leading-relaxed text-neutral-500">
          Ukuran standar: <strong>{FLIPBOOK_FRAME_SIZE_LABEL}</strong>, sama
          dengan rasio kamera dan halaman buku.
        </p>
        {asset && asset.slots.length > 0 ? (
          <p className="text-[11px] leading-relaxed text-neutral-500">
            Slot foto:{" "}
            <strong>
              {asset.slots
                .map((slot) => `${slot.w} × ${slot.h} px`)
                .join(" · ")}
            </strong>
          </p>
        ) : null}
        {ratioMismatch && asset ? (
          <p className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-800">
            Overlay ini berukuran {asset.width} × {asset.height} px. Agar pas
            dengan kamera, gunakan kanvas 4:3 ({FLIPBOOK_FRAME_SIZE_LABEL}).
          </p>
        ) : null}
        {previewUrl && slotCount === 0 ? (
          <p className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-800">
            Belum ada area transparan, jadi foto tidak akan terlihat di balik
            overlay ini. Klik <strong>Hapus BG / Edit PNG</strong>, lalu Magic
            Wand pada area putih di dalam frame.
          </p>
        ) : null}
        {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
      </div>

      <FrameImageEditor
        key={editorUrl ?? "none"}
        open={isEditorOpen}
        imageUrl={editorUrl}
        applyLabel="Terapkan ke Flipbook"
        onClose={handleEditorClose}
        onApply={handleApply}
      />
    </div>
  );
}
