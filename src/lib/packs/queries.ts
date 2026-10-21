import "server-only";

import { connection } from "next/server";

import type { FrameSlot } from "@/lib/frames/types";
import type { Pack, PackFrame } from "@/lib/premium/types";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isSupabaseAdminConfigured,
  warnSupabaseNotConfigured,
} from "@/lib/supabase/config";

type PackRow = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  duration_days: number;
  is_active: boolean;
  sort_order: number;
};

type PackFrameRow = {
  pack_id: number;
  frame_id: number;
  sort_order: number;
};

type FrameRow = {
  id: number;
  name: string;
  slug: string;
  image_path: string | null;
  width: number;
  height: number;
  slots: FrameSlot[];
  category_id: number | null;
  access_type: "free" | "premium";
};

const PACK_COLUMNS =
  "id, name, slug, description, price, duration_days, is_active, sort_order";

async function loadFrameMap(
  frameIds: number[],
): Promise<Map<number, PackFrame>> {
  const map = new Map<number, PackFrame>();
  if (frameIds.length === 0) return map;

  const supabase = createAdminClient();
  const [framesResult, categoriesResult] = await Promise.all([
    supabase
      .from("frames")
      .select("id, name, slug, image_path, width, height, slots, category_id, access_type")
      .in("id", frameIds),
    supabase.from("categories").select("id, name"),
  ]);

  if (framesResult.error) {
    throw new Error(`Gagal memuat frame paket: ${framesResult.error.message}`);
  }
  if (categoriesResult.error) {
    throw new Error(
      `Gagal memuat kategori frame: ${categoriesResult.error.message}`,
    );
  }

  const categoryNames = new Map(
    (categoriesResult.data ?? []).map((category) => [category.id, category.name]),
  );

  for (const frame of (framesResult.data ?? []) as FrameRow[]) {
    map.set(frame.id, {
      id: frame.id,
      name: frame.name,
      slug: frame.slug,
      image_path: frame.image_path,
      width: frame.width,
      height: frame.height,
      slots: frame.slots ?? [],
      category_id: frame.category_id,
      category_name:
        frame.category_id !== null
          ? categoryNames.get(frame.category_id) ?? null
          : null,
    });
  }

  return map;
}

export async function loadFramesByIds(
  frameIds: number[],
): Promise<Map<number, PackFrame>> {
  return loadFrameMap([...new Set(frameIds)]);
}

async function loadPackFrames(
  packIds: number[],
): Promise<Map<number, PackFrame[]>> {
  const map = new Map<number, PackFrame[]>();
  if (packIds.length === 0) return map;

  const supabase = createAdminClient();
  const { data: links, error: linksError } = await supabase
    .from("pack_frames")
    .select("pack_id, frame_id, sort_order")
    .in("pack_id", packIds)
    .order("sort_order", { ascending: true });

  if (linksError) {
    throw new Error(`Gagal memuat isi paket: ${linksError.message}`);
  }

  const rows = (links ?? []) as PackFrameRow[];
  const frames = await loadFrameMap([
    ...new Set(rows.map((row) => row.frame_id)),
  ]);

  for (const packId of packIds) {
    map.set(packId, []);
  }

  for (const row of rows) {
    const frame = frames.get(row.frame_id);
    if (frame) map.get(row.pack_id)?.push(frame);
  }

  return map;
}

function toPack(row: PackRow, frames: PackFrame[]): Pack {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: Number(row.price),
    duration_days: row.duration_days,
    is_active: row.is_active,
    sort_order: row.sort_order,
    frames,
  };
}

export async function listPacks(options?: {
  activeOnly?: boolean;
}): Promise<Pack[]> {
  await connection();
  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return [];
  }

  const supabase = createAdminClient();
  let query = supabase
    .from("packs")
    .select(PACK_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (options?.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Gagal memuat paket: ${error.message}`);
  }

  const rows = (data ?? []) as PackRow[];
  const frames = await loadPackFrames(rows.map((row) => row.id));
  const packs = rows.map((row) => toPack(row, frames.get(row.id) ?? []));

  return options?.activeOnly
    ? packs.filter((pack) => pack.frames.length > 0)
    : packs;
}

export async function getPackById(id: number): Promise<Pack | null> {
  await connection();
  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("packs")
    .select(PACK_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Gagal memuat paket: ${error.message}`);
  }
  if (!data) return null;

  const frames = await loadPackFrames([data.id]);
  return toPack(data as PackRow, frames.get(data.id) ?? []);
}

export async function getPackBySlug(
  slug: string,
  options?: { activeOnly?: boolean },
): Promise<Pack | null> {
  await connection();
  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return null;
  }

  const supabase = createAdminClient();
  let query = supabase.from("packs").select(PACK_COLUMNS).eq("slug", slug);
  if (options?.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new Error(`Gagal memuat paket: ${error.message}`);
  }
  if (!data) return null;

  const frames = await loadPackFrames([data.id]);
  const pack = toPack(data as PackRow, frames.get(data.id) ?? []);
  if (options?.activeOnly && pack.frames.length === 0) return null;
  return pack;
}

export type FramePackMembership = {
  frame_id: number;
  pack_id: number;
  pack_name: string;
  pack_slug: string;
};

export async function listFramePackMemberships(): Promise<
  FramePackMembership[]
> {
  await connection();
  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return [];
  }

  const supabase = createAdminClient();
  const { data: links, error: linksError } = await supabase
    .from("pack_frames")
    .select("frame_id, pack_id");

  if (linksError) {
    throw new Error(
      `Gagal memuat relasi frame dan paket: ${linksError.message}`,
    );
  }

  const packIds = [...new Set((links ?? []).map((link) => link.pack_id))];
  if (packIds.length === 0) return [];

  const { data: packs, error: packsError } = await supabase
    .from("packs")
    .select("id, name, slug")
    .in("id", packIds);

  if (packsError) {
    throw new Error(`Gagal memuat paket frame: ${packsError.message}`);
  }

  const packMap = new Map(
    (packs ?? []).map((pack) => [pack.id, { name: pack.name, slug: pack.slug }]),
  );

  return (links ?? [])
    .map((link) => {
      const pack = packMap.get(link.pack_id);
      if (!pack) return null;
      return {
        frame_id: link.frame_id,
        pack_id: link.pack_id,
        pack_name: pack.name,
        pack_slug: pack.slug,
      };
    })
    .filter((item): item is FramePackMembership => item !== null)
    .sort((a, b) => a.pack_name.localeCompare(b.pack_name));
}

export async function listPremiumFrames() {
  await connection();
  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("frames")
    .select("id, name, slug, image_path, width, height, slots, category_id, access_type")
    .eq("access_type", "premium")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Gagal memuat frame premium: ${error.message}`);
  }

  return (data ?? []) as FrameRow[];
}
