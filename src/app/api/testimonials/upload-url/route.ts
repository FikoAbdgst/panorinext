import { NextResponse } from "next/server";

import { STORAGE_BUCKETS } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isSupabaseAdminConfigured,
  warnSupabaseNotConfigured,
} from "@/lib/supabase/config";

/**
 * Membuat signed upload URL untuk foto testimoni (photostrip sesi). Foto
 * disimpan di bucket privat `photo-results`, lalu dibaca admin/landing lewat
 * signed URL yang dibuat di server.
 */
export async function POST() {
  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return NextResponse.json(
      { success: false, message: "Layanan foto belum dikonfigurasi." },
      { status: 503 },
    );
  }

  try {
    const supabase = createAdminClient();
    const path = `testimonial-${crypto.randomUUID()}.png`;
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.photoResults)
      .createSignedUploadUrl(path, { upsert: false });

    if (error || !data) {
      return NextResponse.json(
        { success: false, message: "Gagal menyiapkan unggahan foto." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      photo: { path: data.path, token: data.token },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal menyiapkan unggahan foto." },
      { status: 500 },
    );
  }
}
