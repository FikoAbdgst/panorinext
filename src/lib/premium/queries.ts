import "server-only";

import { connection } from "next/server";

import { loadFramesByIds } from "@/lib/packs/queries";
import type {
  ActivePremiumAccess,
  PackFrame,
  PremiumAccessRow,
} from "@/lib/premium/types";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isSupabaseAdminConfigured,
  warnSupabaseNotConfigured,
} from "@/lib/supabase/config";

type AccessDbRow = {
  id: number;
  transaction_id: number | null;
  pack_id: number;
  code: string;
  customer_name: string | null;
  whatsapp_number: string | null;
  first_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

const ACCESS_COLUMNS =
  "id, transaction_id, pack_id, code, customer_name, whatsapp_number, first_used_at, expires_at, revoked_at, created_at";

async function toAccessRows(rows: AccessDbRow[]): Promise<PremiumAccessRow[]> {
  if (rows.length === 0) return [];

  const supabase = createAdminClient();
  const packIds = [...new Set(rows.map((row) => row.pack_id))];
  const { data: packs, error } = await supabase
    .from("packs")
    .select("id, name, slug")
    .in("id", packIds);

  if (error) {
    throw new Error(`Gagal memuat paket akses: ${error.message}`);
  }

  const packMap = new Map(
    (packs ?? []).map((pack) => [pack.id, { name: pack.name, slug: pack.slug }]),
  );

  return rows.map((row) => {
    const pack = packMap.get(row.pack_id);
    return {
      ...row,
      pack_name: pack?.name ?? "Paket dihapus",
      pack_slug: pack?.slug ?? null,
    };
  });
}

export async function getActivePremiumAccessByToken(
  token: string | null | undefined,
): Promise<ActivePremiumAccess | null> {
  await connection();
  if (!token || !isSupabaseAdminConfigured()) {
    if (!isSupabaseAdminConfigured()) warnSupabaseNotConfigured();
    return null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("premium_access")
    .select(ACCESS_COLUMNS)
    .eq("session_token", token)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    throw new Error(`Gagal memeriksa akses premium: ${error.message}`);
  }
  if (!data) return null;

  const [access] = await toAccessRows([data as AccessDbRow]);
  if (!access) return null;

  return {
    id: access.id,
    pack_id: access.pack_id,
    pack_name: access.pack_name,
    code: access.code,
    expires_at: access.expires_at ?? "",
  };
}

async function loadAccessFrameLinks(
  accessId: number,
): Promise<{ frame_id: number; sort_order: number }[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("premium_access_frames")
    .select("frame_id, sort_order")
    .eq("access_id", accessId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Gagal memuat frame akses premium: ${error.message}`);
  }

  return data ?? [];
}

export async function getPremiumAccessExpiryForFrame(
  token: string | null | undefined,
  frameId: number,
): Promise<string | null> {
  const access = await getActivePremiumAccessByToken(token);
  if (!access) return null;

  const links = await loadAccessFrameLinks(access.id);
  return links.some((link) => link.frame_id === frameId)
    ? access.expires_at
    : null;
}

export async function hasPremiumAccessToFrame(
  token: string | null | undefined,
  frameId: number,
): Promise<boolean> {
  return Boolean(await getPremiumAccessExpiryForFrame(token, frameId));
}

export async function listFramesForPremiumAccess(
  accessId: number,
): Promise<PackFrame[]> {
  await connection();
  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return [];
  }

  const links = await loadAccessFrameLinks(accessId);
  if (links.length === 0) return [];

  const frames = await loadFramesByIds(links.map((link) => link.frame_id));
  return links
    .map((link) => frames.get(link.frame_id))
    .filter((frame): frame is PackFrame => Boolean(frame));
}

export async function listPremiumAccesses(): Promise<PremiumAccessRow[]> {
  await connection();
  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("premium_access")
    .select(ACCESS_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Gagal memuat ruang premium: ${error.message}`);
  }

  return toAccessRows((data ?? []) as AccessDbRow[]);
}

export async function getPremiumAccessById(
  id: number,
): Promise<PremiumAccessRow | null> {
  await connection();
  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("premium_access")
    .select(ACCESS_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Gagal memuat ruang premium: ${error.message}`);
  }
  if (!data) return null;

  const [access] = await toAccessRows([data as AccessDbRow]);
  return access ?? null;
}
