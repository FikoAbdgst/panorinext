/**
 * Deteksi apakah kredensial Supabase sudah diisi di environment.
 *
 * Sebelum setup proyek Supabase selesai, `.env.local` masih berisi string kosong.
 * Supabase client akan melempar "supabaseUrl is required." dan menggagalkan render.
 * Helper ini dipakai query agar halaman tetap tampil dengan state kosong selama
 * pengembangan, disertai peringatan sekali di console.
 */

function hasValue(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function isSupabaseConfigured(): boolean {
  return (
    hasValue(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    hasValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

export function isSupabaseAdminConfigured(): boolean {
  return (
    hasValue(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    hasValue(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

let warned = false;

export function warnSupabaseNotConfigured(): void {
  if (warned) return;
  warned = true;
  console.warn(
    "[PanoriCam] Supabase belum dikonfigurasi: " +
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY masih kosong di .env.local. " +
      "Halaman akan menampilkan data kosong sampai kredensial diisi.",
  );
}
