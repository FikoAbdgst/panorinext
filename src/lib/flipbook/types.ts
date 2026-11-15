import type { FrameSlot } from "@/lib/frames/types";

/** Halaman pembuka, halaman foto, atau penutup flipbook. */
export type FlipbookAssetKind = "cover" | "page" | "back";

/**
 * Satu overlay PNG di dalam tipe frame flipbook.
 *
 * `pageIndex` bernilai 0 untuk sampul/penutup, dan 1..10 untuk halaman foto.
 * `slots` opsional; bila kosong, foto mengisi penuh area overlay.
 */
export type FlipbookAsset = {
  id: number;
  kind: FlipbookAssetKind;
  pageIndex: number;
  imageUrl: string;
  width: number;
  height: number;
  slots: FrameSlot[];
};

/**
 * Satu TIPE frame flipbook berisi 12 overlay:
 * 1 sampul + 10 halaman + 1 penutup.
 *
 * `pages` selalu berurutan halaman 1..10. Nilai `null` berarti aset belum
 * diunggah (hanya mungkin terlihat di panel admin).
 */
export type FlipbookFrame = {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  cover: FlipbookAsset | null;
  pages: Array<FlipbookAsset | null>;
  back: FlipbookAsset | null;
};

/** Tipe frame dianggap siap dipakai user bila 12 overlay sudah lengkap. */
export function isFlipbookFrameComplete(frame: FlipbookFrame): boolean {
  return Boolean(frame.cover && frame.back) && frame.pages.every(Boolean);
}

/** Urutan label aset untuk panel admin. */
export function flipbookAssetLabel(kind: FlipbookAssetKind, pageIndex: number): string {
  if (kind === "cover") {
    return "Sampul";
  }
  if (kind === "back") {
    return "Penutup";
  }
  return `Halaman ${String(pageIndex).padStart(2, "0")}`;
}
