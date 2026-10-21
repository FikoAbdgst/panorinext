"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth";

export type TransactionActionResult = {
  success: boolean;
  message: string;
  roomCode?: string | null;
  packName?: string | null;
};

async function setTransactionStatus(
  id: number,
  action: "approve" | "reject",
): Promise<TransactionActionResult> {
  await requireAdmin();

  if (!Number.isInteger(id)) {
    return { success: false, message: "Terjadi kesalahan saat memproses transaksi." };
  }

  const supabase = createAdminClient();
  const { data: existing, error: fetchError } = await supabase
    .from("transactions")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !existing) {
    return { success: false, message: "Terjadi kesalahan saat memproses transaksi." };
  }

  if (existing.status !== "pending") {
    return { success: false, message: "Transaksi ini sudah diproses sebelumnya." };
  }

  if (action === "approve") {
    const { data, error } = await supabase.rpc("approve_transaction_with_code", {
      p_transaction_id: id,
    });

    if (error) {
      return { success: false, message: `Gagal menyetujui transaksi: ${error.message}` };
    }

    const access = data?.[0] ?? null;

    revalidatePath("/admin/transactions");
    revalidatePath("/admin/rooms");
    revalidatePath("/admin/dashboard");
    revalidatePath("/premium");

    return {
      success: true,
      message: access?.room_code
        ? `Transaksi disetujui. Kode ruang: ${access.room_code}.`
        : "Transaksi berhasil disetujui.",
      roomCode: access?.room_code ?? null,
      packName: access?.pack_name ?? null,
    };
  }

  const { error } = await supabase
    .from("transactions")
    .update({ status: "rejected" })
    .eq("id", id);

  if (error) {
    return { success: false, message: "Terjadi kesalahan saat memproses transaksi." };
  }

  revalidatePath("/admin/transactions");
  revalidatePath("/admin/dashboard");

  return {
    success: true,
    message: "Transaksi berhasil ditolak.",
  };
}

export async function approveTransactionAction(
  id: number,
): Promise<TransactionActionResult> {
  return setTransactionStatus(id, "approve");
}

export async function rejectTransactionAction(
  id: number,
): Promise<TransactionActionResult> {
  return setTransactionStatus(id, "reject");
}
