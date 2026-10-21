"use server";

import { redirect } from "next/navigation";

import {
  clearPremiumAccessCookie,
  setPremiumAccessCookie,
} from "@/lib/premium/session";
import { normalizePremiumCode } from "@/lib/premium/types";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isSupabaseAdminConfigured,
  warnSupabaseNotConfigured,
} from "@/lib/supabase/config";

export type RedeemState = {
  status: "idle" | "error";
  message?: string;
};

export async function redeemPremiumCodeAction(
  _previous: RedeemState,
  formData: FormData,
): Promise<RedeemState> {
  const code = normalizePremiumCode(String(formData.get("code") ?? ""));

  if (code.length !== 8) {
    return { status: "error", message: "Kode harus terdiri dari 8 karakter." };
  }

  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return {
      status: "error",
      message: "Layanan ruang premium belum siap. Hubungi admin.",
    };
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("redeem_premium_code", {
      p_code: code,
    });

    if (error) {
      return { status: "error", message: error.message };
    }

    const access = data?.[0];
    if (!access) {
      return { status: "error", message: "Kode tidak ditemukan." };
    }

    await setPremiumAccessCookie(access.session_token, access.expires_at);
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Gagal membuka ruang premium.",
    };
  }

  redirect("/premium/room");
}

export async function leavePremiumRoomAction(): Promise<void> {
  await clearPremiumAccessCookie();
  redirect("/premium");
}
