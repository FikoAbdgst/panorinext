import { NextResponse } from "next/server";

import type { PaymentMethod } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isSupabaseAdminConfigured,
  warnSupabaseNotConfigured,
} from "@/lib/supabase/config";

const PAYMENT_METHODS = new Set<PaymentMethod>(["bank_transfer", "qris"]);

const PROOF_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
};

const MAX_PROOF_BYTES = 2048 * 1024;

function fail(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return fail("Layanan pembayaran belum dikonfigurasi. Hubungi admin.", 503);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Data tidak valid", 400);
  }

  const packId = Number(asString(form.get("pack_id")));
  const customerName = asString(form.get("customer_name"));
  const whatsappNumber = asString(form.get("whatsapp_number"));
  const paymentMethod = asString(form.get("payment_method"));
  const proof = form.get("payment_proof");

  if (!Number.isInteger(packId) || packId <= 0) {
    return fail("Validation failed: paket wajib dipilih", 422);
  }
  if (customerName.length === 0) {
    return fail("Validation failed: nama wajib diisi", 422);
  }
  if (customerName.length > 255) {
    return fail("Validation failed: nama maksimal 255 karakter", 422);
  }
  if (whatsappNumber.length > 0 && !/^[0-9+]+$/.test(whatsappNumber)) {
    return fail("Validation failed: nomor WhatsApp harus berupa angka", 422);
  }
  if (!PAYMENT_METHODS.has(paymentMethod as PaymentMethod)) {
    return fail("Validation failed: metode pembayaran tidak valid", 422);
  }
  if (!(proof instanceof File) || proof.size === 0) {
    return fail("Validation failed: bukti pembayaran wajib diunggah", 422);
  }

  const extension = PROOF_EXTENSION[proof.type];
  if (!extension) {
    return fail("Validation failed: bukti pembayaran harus berupa gambar jpeg, png, atau jpg", 422);
  }
  if (proof.size > MAX_PROOF_BYTES) {
    return fail("Validation failed: bukti pembayaran maksimal 2048 KB", 422);
  }

  const method = paymentMethod as PaymentMethod;
  const methodLabel = method === "bank_transfer" ? "E-Wallet" : "QRIS";

  try {
    const supabase = createAdminClient();

    const { data: pack, error: packError } = await supabase
      .from("packs")
      .select("id, name, price, is_active")
      .eq("id", packId)
      .maybeSingle();
    if (packError) {
      return fail(`Terjadi kesalahan: ${packError.message}`, 500);
    }
    if (!pack || !pack.is_active) {
      return fail("Validation failed: paket tidak ditemukan atau tidak aktif", 422);
    }

    const { count: frameCount } = await supabase
      .from("pack_frames")
      .select("pack_id", { count: "exact", head: true })
      .eq("pack_id", pack.id);
    if (!frameCount) {
      return fail("Validation failed: paket belum memiliki frame", 422);
    }

    const proofPath = `${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(proofPath, proof, { contentType: proof.type, upsert: false });
    if (uploadError) {
      return fail(`Terjadi kesalahan: ${uploadError.message}`, 500);
    }

    const { data: transaction, error: insertError } = await supabase
      .from("transactions")
      .insert({
        frame_id: null,
        pack_id: pack.id,
        customer_name: customerName,
        whatsapp_number: whatsappNumber.length > 0 ? whatsappNumber : null,
        payment_method: method,
        payment_proof: proofPath,
      })
      .select("order_id")
      .single();

    if (insertError || !transaction) {
      await supabase.storage.from("payment-proofs").remove([proofPath]);
      return fail(
        `Terjadi kesalahan: ${insertError?.message ?? "transaksi gagal dibuat"}`,
        500,
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Pembayaran berhasil disubmit melalui " +
        methodLabel +
        ". Menunggu konfirmasi admin.",
      order_id: transaction.order_id,
      payment_method: methodLabel,
      customer_name: customerName,
      pack_id: pack.id,
      pack_name: pack.name,
    });
  } catch (error) {
    return fail(
      `Terjadi kesalahan: ${error instanceof Error ? error.message : "unknown error"}`,
      500,
    );
  }
}
