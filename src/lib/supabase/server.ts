import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "./database.types";

/**
 * Klien Supabase untuk Server Components, Server Actions, dan Route Handlers.
 * Membaca sesi dari cookie, memakai anon key (tunduk pada RLS).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Dipanggil dari Server Component yang tidak boleh menulis cookie.
            // Aman diabaikan selama ada proxy yang menyegarkan sesi.
          }
        },
      },
    },
  );
}
