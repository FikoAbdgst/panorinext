import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { isSupabaseAdminConfigured } from "./config";

/**
 * Klien Supabase dengan service role. HANYA untuk kode server tepercaya.
 * Melewati RLS, jadi jangan pernah menyentuh data atas nama input user tanpa
 * validasi. Dipakai untuk signed URL bukti bayar, upload aset, dan operasi admin.
 */
export function createAdminClient() {
  if (!isSupabaseAdminConfigured()) {
    throw new Error(
      "Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan " +
        "SUPABASE_SERVICE_ROLE_KEY di .env.local, lalu jalankan migrasi.",
    );
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
