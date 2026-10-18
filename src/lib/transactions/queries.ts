import "server-only";

import { connection } from "next/server";

import { STORAGE_BUCKETS } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isSupabaseAdminConfigured,
  warnSupabaseNotConfigured,
} from "@/lib/supabase/config";

export type TransactionStatus = "pending" | "approved" | "rejected";

export type AdminTransactionRow = {
  id: number;
  order_id: string;
  customer_name: string;
  whatsapp_number: string | null;
  payment_method: string;
  amount: number;
  status: TransactionStatus;
  approved_at: string | null;
  created_at: string;
  frame_id: number | null;
  frame_name: string | null;
  frame_slug: string | null;
  payment_proof_url: string | null;
};

export type TransactionCounts = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

const SELECT_COLUMNS =
  "id, order_id, frame_id, customer_name, whatsapp_number, payment_method, amount, status, approved_at, created_at, payment_proof";

/**
 * Daftar transaksi untuk panel admin (memakai service role, jadi tidak terhalang RLS).
 * Bila `status` diberikan dan bukan "all", hasil difilter.
 */
export async function listTransactions(
  status?: string,
): Promise<AdminTransactionRow[]> {
  await connection();
  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return [];
  }
  const supabase = createAdminClient();

  let query = supabase
    .from("transactions")
    .select(SELECT_COLUMNS)
    .order("created_at", { ascending: false });
  if (status && status !== "all") {
    query = query.eq("status", status as TransactionStatus);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Gagal memuat transaksi: ${error.message}`);
  }
  const rows = data ?? [];

  const frameIds = Array.from(
    new Set(rows.map((row) => row.frame_id).filter((id): id is number => id !== null)),
  );
  const frameMap = new Map<number, { name: string; slug: string }>();
  if (frameIds.length > 0) {
    const { data: frames } = await supabase
      .from("frames")
      .select("id, name, slug")
      .in("id", frameIds);
    for (const frame of frames ?? []) {
      frameMap.set(frame.id, { name: frame.name, slug: frame.slug });
    }
  }

  const proofPaths = rows
    .map((row) => row.payment_proof)
    .filter((path): path is string => Boolean(path));
  const proofUrlMap = new Map<string, string>();
  if (proofPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from(STORAGE_BUCKETS.paymentProofs)
      .createSignedUrls(proofPaths, 60 * 60);
    for (const item of signed ?? []) {
      if (item.path && item.signedUrl) {
        proofUrlMap.set(item.path, item.signedUrl);
      }
    }
  }

  return rows.map((row) => {
    const frame = row.frame_id !== null ? frameMap.get(row.frame_id) : undefined;
    return {
      id: row.id,
      order_id: row.order_id,
      customer_name: row.customer_name,
      whatsapp_number: row.whatsapp_number,
      payment_method: row.payment_method,
      amount: Number(row.amount),
      status: row.status,
      approved_at: row.approved_at,
      created_at: row.created_at,
      frame_id: row.frame_id,
      frame_name: frame?.name ?? null,
      frame_slug: frame?.slug ?? null,
      payment_proof_url: row.payment_proof
        ? proofUrlMap.get(row.payment_proof) ?? null
        : null,
    };
  });
}

export async function countTransactions(): Promise<TransactionCounts> {
  await connection();
  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return { total: 0, pending: 0, approved: 0, rejected: 0 };
  }
  const supabase = createAdminClient();
  const [total, pending, approved, rejected] = await Promise.all([
    supabase.from("transactions").select("id", { count: "exact", head: true }),
    supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("status", "rejected"),
  ]);

  return {
    total: total.count ?? 0,
    pending: pending.count ?? 0,
    approved: approved.count ?? 0,
    rejected: rejected.count ?? 0,
  };
}
