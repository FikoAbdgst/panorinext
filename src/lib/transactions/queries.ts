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
  pack_id: number | null;
  pack_name: string | null;
  pack_slug: string | null;
  room_code: string | null;
  room_first_used_at: string | null;
  room_expires_at: string | null;
  room_revoked_at: string | null;
  payment_proof_url: string | null;
};

export type TransactionCounts = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

const SELECT_COLUMNS =
  "id, order_id, frame_id, pack_id, customer_name, whatsapp_number, payment_method, amount, status, approved_at, created_at, payment_proof";

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

  const packIds = Array.from(
    new Set(rows.map((row) => row.pack_id).filter((id): id is number => id !== null)),
  );
  const packMap = new Map<number, { name: string; slug: string }>();
  if (packIds.length > 0) {
    const { data: packs } = await supabase
      .from("packs")
      .select("id, name, slug")
      .in("id", packIds);
    for (const pack of packs ?? []) {
      packMap.set(pack.id, { name: pack.name, slug: pack.slug });
    }
  }

  const transactionIds = rows.map((row) => row.id);
  const accessMap = new Map<
    number,
    {
      code: string;
      first_used_at: string | null;
      expires_at: string | null;
      revoked_at: string | null;
    }
  >();
  if (transactionIds.length > 0) {
    const { data: accesses } = await supabase
      .from("premium_access")
      .select("transaction_id, code, first_used_at, expires_at, revoked_at")
      .in("transaction_id", transactionIds);
    for (const access of accesses ?? []) {
      if (access.transaction_id !== null) {
        accessMap.set(access.transaction_id, {
          code: access.code,
          first_used_at: access.first_used_at,
          expires_at: access.expires_at,
          revoked_at: access.revoked_at,
        });
      }
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
    const pack = row.pack_id !== null ? packMap.get(row.pack_id) : undefined;
    const access = accessMap.get(row.id);
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
      pack_id: row.pack_id,
      pack_name: pack?.name ?? null,
      pack_slug: pack?.slug ?? null,
      room_code: access?.code ?? null,
      room_first_used_at: access?.first_used_at ?? null,
      room_expires_at: access?.expires_at ?? null,
      room_revoked_at: access?.revoked_at ?? null,
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
