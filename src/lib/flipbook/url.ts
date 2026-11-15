import { STORAGE_BUCKETS } from "@/lib/constants";

/** URL publik overlay PNG pada bucket `flipbook-frames`. */
export function getFlipbookFramePublicUrl(imagePath: string): string {
  return storagePublicUrl(STORAGE_BUCKETS.flipbookFrames, imagePath);
}

function storagePublicUrl(bucket: string, imagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) {
    return imagePath;
  }
  return `${base}/storage/v1/object/public/${bucket}/${imagePath}`;
}
