import { STORAGE_BUCKETS } from "@/lib/constants";

/** URL publik overlay PNG pada bucket `frames`. */
export function getFramePublicUrl(imagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) {
    return imagePath;
  }
  return `${base}/storage/v1/object/public/${STORAGE_BUCKETS.frames}/${imagePath}`;
}

/**
 * URL same-origin untuk pratinjau overlay di area admin.
 *
 * Dibaca lewat Route Handler yang memakai service role, sehingga:
 * - tidak kena CORS saat canvas perlu `getImageData()` untuk deteksi slot;
 * - tidak gagal hanya karena akses langsung ke storage sedang bermasalah.
 */
export function getFrameAdminPreviewUrl(imagePath: string): string {
  return `/api/admin/frame-overlay?path=${encodeURIComponent(imagePath)}`;
}
