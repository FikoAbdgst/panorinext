import "server-only";

import { connection } from "next/server";

import type {
  CatalogFilters,
  CatalogFrame,
  FrameSlot,
} from "@/lib/frames/types";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isSupabaseAdminConfigured,
  warnSupabaseNotConfigured,
} from "@/lib/supabase/config";

export type CategoryOption = {
  id: number;
  name: string;
  icon: string | null;
};

export type FrameRow = {
  id: number;
  name: string;
  slug: string;
  image_path: string | null;
  price: number;
  used: number;
  width: number;
  height: number;
  slots: FrameSlot[];
  category_id: number | null;
};

export type FrameListRow = FrameRow & {
  category_name: string | null;
};

export type TopFrameRow = {
  id: number;
  name: string;
  image_path: string | null;
  price: number;
  used: number;
  width: number;
  height: number;
  slots: FrameSlot[];
  category_icon: string | null;
  category_name: string | null;
};

const FRAME_COLUMNS =
  "id, name, slug, image_path, price, used, width, height, slots, category_id";

export async function listCategories(
  orderBy: "name" | "idDesc" = "name",
): Promise<CategoryOption[]> {
  await connection();
  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return [];
  }
  const supabase = createAdminClient();
  const { data, error } =
    orderBy === "idDesc"
      ? await supabase
          .from("categories")
          .select("id, name, icon")
          .order("id", { ascending: false })
      : await supabase
          .from("categories")
          .select("id, name, icon")
          .order("name", { ascending: true });
  if (error) {
    throw new Error(`Gagal memuat kategori: ${error.message}`);
  }
  return data ?? [];
}

export async function getCategoryById(
  id: number,
): Promise<CategoryOption | null> {
  await connection();
  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return null;
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, icon")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error(`Gagal memuat kategori: ${error.message}`);
  }
  return data ?? null;
}

export async function listFrames(): Promise<FrameListRow[]> {
  await connection();
  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return [];
  }
  const supabase = createAdminClient();
  const [framesResult, categories] = await Promise.all([
    supabase
      .from("frames")
      .select(FRAME_COLUMNS)
      .order("created_at", { ascending: false }),
    listCategories(),
  ]);
  if (framesResult.error) {
    throw new Error(`Gagal memuat frame: ${framesResult.error.message}`);
  }
  const categoryNames = new Map(categories.map((item) => [item.id, item.name]));
  return (framesResult.data ?? []).map((frame) => ({
    ...frame,
    category_name:
      frame.category_id !== null ? categoryNames.get(frame.category_id) ?? null : null,
  }));
}

export async function listTopFrames(limit = 3): Promise<TopFrameRow[]> {
  await connection();
  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return [];
  }
  const supabase = createAdminClient();
  const [framesResult, categories] = await Promise.all([
    supabase
      .from("frames")
      .select("id, name, image_path, price, used, width, height, slots, category_id")
      .order("used", { ascending: false })
      .limit(limit),
    listCategories(),
  ]);
  if (framesResult.error) {
    throw new Error(`Gagal memuat frame unggulan: ${framesResult.error.message}`);
  }
  const categoryMap = new Map(categories.map((item) => [item.id, item]));
  return (framesResult.data ?? []).map((frame) => {
    const category =
      frame.category_id !== null ? categoryMap.get(frame.category_id) : undefined;
    return {
      id: frame.id,
      name: frame.name,
      image_path: frame.image_path,
      price: frame.price,
      used: frame.used,
      width: frame.width,
      height: frame.height,
      slots: frame.slots ?? [],
      category_icon: category?.icon ?? null,
      category_name: category?.name ?? null,
    };
  });
}

export async function getFrameById(id: number): Promise<FrameRow | null> {
  await connection();
  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return null;
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("frames")
    .select(FRAME_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error(`Gagal memuat frame: ${error.message}`);
  }
  return data ?? null;
}

/**
 * Verifikasi transaksi berbayar untuk guard `/booth`.
 * `transactions` hanya bisa dibaca admin, jadi query ini memakai service role.
 */
export async function getApprovedTransaction(
  orderId: string,
  frameId: number,
): Promise<{ id: number; order_id: string; status: string } | null> {
  await connection();
  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return null;
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("id, order_id, status")
    .eq("order_id", orderId)
    .eq("frame_id", frameId)
    .eq("status", "approved")
    .maybeSingle();
  if (error) {
    throw new Error(`Gagal memverifikasi transaksi: ${error.message}`);
  }
  return data ?? null;
}

type CatalogFrameQueryRow = {
  id: number;
  name: string;
  image_path: string | null;
  price: number;
  used: number;
  width: number;
  height: number;
  slots: FrameSlot[];
  category_id: number | null;
  created_at: string;
};

export async function listCatalogFrames(
  filters: CatalogFilters,
): Promise<CatalogFrame[]> {
  await connection();
  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return [];
  }
  const supabase = createAdminClient();

  let query = supabase
    .from("frames")
    .select("id, name, image_path, price, used, width, height, slots, category_id, created_at");
  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }
  if (filters.freeOnly) {
    query = query.eq("price", 0);
  }

  const [framesResult, categories] = await Promise.all([
    query,
    listCategories(),
  ]);
  if (framesResult.error) {
    throw new Error(`Gagal memuat frame: ${framesResult.error.message}`);
  }

  const categoryMap = new Map(categories.map((item) => [item.id, item]));
  const rows: CatalogFrameQueryRow[] = framesResult.data ?? [];

  if (filters.sortPopular) {
    rows.sort((a, b) => b.used - a.used);
  } else {
    rows.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

  return rows
    .map((frame) => {
      const category =
        frame.category_id !== null ? categoryMap.get(frame.category_id) : undefined;
      return {
        id: frame.id,
        name: frame.name,
        image_path: frame.image_path,
        price: frame.price,
        used: frame.used,
        width: frame.width,
        height: frame.height,
        slots: frame.slots ?? [],
        category_icon: category?.icon ?? null,
        category_name: category?.name ?? null,
      };
    })
    .filter((frame) =>
      filters.slots ? frame.slots.length === filters.slots : true,
    );
}

/** ID kategori yang benar-benar dipakai oleh minimal satu frame. */
export async function listFrameCategoryIds(): Promise<number[]> {
  await connection();
  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return [];
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("frames").select("category_id");
  if (error) {
    throw new Error(`Gagal memuat kategori frame: ${error.message}`);
  }
  const ids = new Set<number>();
  for (const row of data ?? []) {
    if (row.category_id !== null) ids.add(row.category_id);
  }
  return [...ids];
}

/** Daftar jumlah slot unik yang ada di seluruh frame, urut menaik. */
export async function listFrameSlotCounts(): Promise<number[]> {
  await connection();
  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return [];
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("frames").select("id, slots");
  if (error) {
    throw new Error(`Gagal memuat jumlah slot: ${error.message}`);
  }
  const counts = new Set<number>();
  for (const row of data ?? []) {
    counts.add((row.slots ?? []).length);
  }
  return [...counts].sort((a, b) => a - b);
}
