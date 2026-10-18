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

  const frameId = Number(asString(form.get("frame_id")));
  const customerName = asString(form.get("customer_name"));
  const whatsappNumber = asString(form.get("whatsapp_number"));
  const paymentMethod = asString(form.get("payment_method"));
  const proof = form.get("payment_proof");

  if (!Number.isInteger(frameId) || frameId <= 0) {
    return fail("Validation failed: frame_id wajib diisi", 422);
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

    const { data: frame, error: frameError } = await supabase
      .from("frames")
      .select("id, price")
      .eq("id", frameId)
      .maybeSingle();
    if (frameError) {
      return fail(`Terjadi kesalahan: ${frameError.message}`, 500);
    }
    if (!frame) {
      return fail("Validation failed: frame tidak ditemukan", 422);
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
        frame_id: frame.id,
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
    });
  } catch (error) {
    return fail(
      `Terjadi kesalahan: ${error instanceof Error ? error.message : "unknown error"}`,
      500,
    );
  }
}
