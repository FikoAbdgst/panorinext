"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth";

export type TransactionActionResult = {
  success: boolean;
  message: string;
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

  const { error } = await supabase
    .from("transactions")
    .update(
      action === "approve"
        ? { status: "approved", approved_at: new Date().toISOString() }
        : { status: "rejected" },
    )
    .eq("id", id);

  if (error) {
    return { success: false, message: "Terjadi kesalahan saat memproses transaksi." };
  }

  revalidatePath("/admin/transactions");
  revalidatePath("/admin/dashboard");

  return {
    success: true,
    message:
      action === "approve"
        ? "Transaksi berhasil disetujui."
        : "Transaksi berhasil ditolak.",
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
