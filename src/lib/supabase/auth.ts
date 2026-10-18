import "server-only";

import { redirect } from "next/navigation";

import { createClient as createServerSupabase } from "./server";

export type AdminIdentity = {
  id: string;
  name: string;
  email: string;
};

/**
 * Memastikan pemanggil adalah admin yang sudah login.
 *
 * Pengganti `checkAdminAuth()` ala Laravel, tapi dipusatkan satu tempat.
 * Dipakai di Server Component, Server Action, dan Route Handler area `/admin`.
 * Bila bukan admin, pemanggil diarahkan ke `/admin/login`.
 */
export async function requireAdmin(): Promise<AdminIdentity> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data } = await supabase
    .from("admins")
    .select("id, name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) {
    redirect("/admin/login");
  }

  return data;
}

/**
 * Versi non-redirect untuk Route Handler yang perlu membalas JSON.
 * Mengembalikan `null` bila bukan admin.
 */
export async function getAdminOrNull(): Promise<AdminIdentity | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("admins")
    .select("id, name, email")
    .eq("id", user.id)
    .maybeSingle();

  return data ?? null;
}
