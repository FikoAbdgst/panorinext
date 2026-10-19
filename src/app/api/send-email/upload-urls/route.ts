import { NextResponse } from "next/server";

import { STORAGE_BUCKETS } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isSupabaseAdminConfigured,
  warnSupabaseNotConfigured,
} from "@/lib/supabase/config";

/**
 * Membuat signed upload URL untuk foto & GIF hasil booth, agar browser
 * mengunggah langsung ke Supabase Storage. Ini menghindari batas 4.5 MB body
 * request Vercel pada Route Handler `/api/send-email`.
 */
export async function POST() {
  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return NextResponse.json(
      { success: false, message: "Layanan email belum dikonfigurasi. Hubungi admin." },
      { status: 503 },
    );
  }

  try {
    const supabase = createAdminClient();
    const photoPath = `photo-${crypto.randomUUID()}.png`;
    const gifPath = `gif-${crypto.randomUUID()}.gif`;

    const [photo, gif] = await Promise.all([
      supabase.storage
        .from(STORAGE_BUCKETS.photoResults)
        .createSignedUploadUrl(photoPath, { upsert: false }),
      supabase.storage
        .from(STORAGE_BUCKETS.photoResults)
        .createSignedUploadUrl(gifPath, { upsert: false }),
    ]);

    if (photo.error || !photo.data || gif.error || !gif.data) {
      return NextResponse.json(
        { success: false, message: "Gagal menyiapkan unggahan." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      photo: { path: photo.data.path, token: photo.data.token },
      gif: { path: gif.data.path, token: gif.data.token },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal menyiapkan unggahan." },
      { status: 500 },
    );
  }
}
