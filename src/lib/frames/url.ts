import { STORAGE_BUCKETS } from "@/lib/constants";

/** URL publik overlay PNG pada bucket `frames`. */
export function getFramePublicUrl(imagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) {
    return imagePath;
  }
  return `${base}/storage/v1/object/public/${STORAGE_BUCKETS.frames}/${imagePath}`;
}
