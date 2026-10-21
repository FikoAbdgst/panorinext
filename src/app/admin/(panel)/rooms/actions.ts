"use server";

import { revalidatePath } from "next/cache";

import { generatePremiumCodeValue } from "@/lib/premium/code";
import { normalizePremiumCode } from "@/lib/premium/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth";

export type RoomFormState = {
  status: "idle" | "error" | "success";
  message?: string;
};

function revalidateRoomPaths() {
  revalidatePath("/admin/rooms");
  revalidatePath("/admin/transactions");
  revalidatePath("/premium");
  revalidatePath("/premium/room");
}

function readCode(formData: FormData): string | { error: string } {
  const raw = String(formData.get("code") ?? "").trim();
  if (!raw) return "";
  const code = normalizePremiumCode(raw);
  if (code.length !== 8) {
    return { error: "Kode harus 8 karakter huruf/angka." };
  }
  return code;
}

function readExpiry(formData: FormData): { value: string | null } | { error: string } {
  const raw = String(formData.get("expires_at") ?? "").trim();
  if (!raw) return { value: null };

  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) {
    return { error: "Tanggal kedaluwarsa tidak valid." };
  }
  return { value: date.toISOString() };
}

function isDuplicateCode(error: { message: string; code?: string } | null): boolean {
  return Boolean(
    error &&
      (error.code === "23505" || error.message.toLowerCase().includes("duplicate")),
  );
}

export async function createRoomAction(
  _prevState: RoomFormState,
  formData: FormData,
): Promise<RoomFormState> {
  await requireAdmin();

  const packId = Number(String(formData.get("pack_id") ?? "").trim());
  if (!Number.isInteger(packId) || packId <= 0) {
    return { status: "error", message: "Paket wajib dipilih." };
  }

  const customerName = String(formData.get("customer_name") ?? "").trim();
  const whatsappNumber = String(formData.get("whatsapp_number") ?? "").trim();
  const codeField = readCode(formData);
  if (typeof codeField === "object") {
    return { status: "error", message: codeField.error };
  }

  const expiry = readExpiry(formData);
  if ("error" in expiry) {
    return { status: "error", message: expiry.error };
  }

  const supabase = createAdminClient();
  const { data: pack } = await supabase
    .from("packs")
    .select("id")
    .eq("id", packId)
    .maybeSingle();
  if (!pack) {
    return { status: "error", message: "Paket tidak ditemukan." };
  }

  let lastError: { message: string; code?: string } | null = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = codeField || generatePremiumCodeValue();
    const { error } = await supabase.from("premium_access").insert({
      pack_id: packId,
      code,
      customer_name: customerName || null,
      whatsapp_number: whatsappNumber || null,
      first_used_at: expiry.value ? new Date().toISOString() : null,
      expires_at: expiry.value,
    });

    if (!error) {
      revalidateRoomPaths();
      return { status: "success", message: `Ruang premium dibuat dengan kode ${code}.` };
    }

    lastError = error;
    if (codeField || !isDuplicateCode(error)) break;
  }

  return {
    status: "error",
    message: `Gagal membuat ruang premium: ${lastError?.message ?? "unknown"}`,
  };
}

export async function updateRoomAction(
  roomId: number,
  _prevState: RoomFormState,
  formData: FormData,
): Promise<RoomFormState> {
  await requireAdmin();
  if (!Number.isInteger(roomId)) {
    return { status: "error", message: "ID ruang tidak valid." };
  }

  const packId = Number(String(formData.get("pack_id") ?? "").trim());
  if (!Number.isInteger(packId) || packId <= 0) {
    return { status: "error", message: "Paket wajib dipilih." };
  }

  const codeField = readCode(formData);
  if (typeof codeField === "object") {
    return { status: "error", message: codeField.error };
  }
  if (!codeField) {
    return { status: "error", message: "Kode wajib diisi." };
  }

  const expiry = readExpiry(formData);
  if ("error" in expiry) {
    return { status: "error", message: expiry.error };
  }

  const supabase = createAdminClient();
  const { data: existing, error: fetchError } = await supabase
    .from("premium_access")
    .select("first_used_at, session_token")
    .eq("id", roomId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { status: "error", message: "Ruang premium tidak ditemukan." };
  }

  const customerName = String(formData.get("customer_name") ?? "").trim();
  const whatsappNumber = String(formData.get("whatsapp_number") ?? "").trim();
  const revoked = String(formData.get("revoked") ?? "") === "on";

  const firstUsedAt = expiry.value
    ? existing.first_used_at ?? new Date().toISOString()
    : null;

  const { error } = await supabase
    .from("premium_access")
    .update({
      pack_id: packId,
      code: codeField,
      customer_name: customerName || null,
      whatsapp_number: whatsappNumber || null,
      first_used_at: firstUsedAt,
      expires_at: expiry.value,
      session_token: expiry.value ? existing.session_token : null,
      revoked_at: revoked ? new Date().toISOString() : null,
    })
    .eq("id", roomId);

  if (error) {
    if (isDuplicateCode(error)) {
      return { status: "error", message: "Kode sudah dipakai ruang lain." };
    }
    return { status: "error", message: `Gagal menyimpan ruang: ${error.message}` };
  }

  revalidateRoomPaths();
  return { status: "success", message: "Ruang premium berhasil diperbarui." };
}

export async function deleteRoomAction(
  roomId: number,
): Promise<{ success: boolean; message: string }> {
  await requireAdmin();
  if (!Number.isInteger(roomId)) {
    return { success: false, message: "ID ruang tidak valid." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("premium_access")
    .delete()
    .eq("id", roomId);

  if (error) {
    return { success: false, message: `Gagal menghapus ruang: ${error.message}` };
  }

  revalidateRoomPaths();
  return { success: true, message: "Ruang premium berhasil dihapus." };
}
