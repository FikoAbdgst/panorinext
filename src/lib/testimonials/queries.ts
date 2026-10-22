import "server-only";

import { connection } from "next/server";

import { STORAGE_BUCKETS } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isSupabaseAdminConfigured,
  warnSupabaseNotConfigured,
} from "@/lib/supabase/config";
import type { TestimonialFrame, TestimonialItem } from "@/lib/testimonials/types";

export type { TestimonialFrame, TestimonialItem };

const PHOTO_URL_TTL_SECONDS = 60 * 60 * 24;

type TestimonialRow = {
  id: number;
  rating: number;
  emoji: string | null;
  name: string | null;
  message: string | null;
  created_at: string;
  frame_id: number | null;
  photo_path: string | null;
  photo_consent: boolean;
  is_featured: boolean;
};

async function attachFrames(rows: TestimonialRow[]): Promise<TestimonialItem[]> {
  if (rows.length === 0) {
    return [];
  }
  const supabase = createAdminClient();
  const frameIds = [
    ...new Set(
      rows.map((row) => row.frame_id).filter((id): id is number => id !== null),
    ),
  ];
  let frames: TestimonialFrame[] = [];
  if (frameIds.length > 0) {
    const { data: frameData } = await supabase
      .from("frames")
      .select("id, name, price, image_path")
      .in("id", frameIds);
    frames = frameData ?? [];
  }
  const frameMap = new Map(frames.map((frame) => [frame.id, frame]));

  const photoPaths = [
    ...new Set(
      rows.map((row) => row.photo_path).filter((path): path is string => path !== null),
    ),
  ];
  const photoUrlMap = new Map<string, string>();
  if (photoPaths.length > 0) {
    const { data: signedPhotos } = await supabase.storage
      .from(STORAGE_BUCKETS.photoResults)
      .createSignedUrls(photoPaths, PHOTO_URL_TTL_SECONDS);
    for (const photo of signedPhotos ?? []) {
      if (photo.path && photo.signedUrl) {
        photoUrlMap.set(photo.path, photo.signedUrl);
      }
    }
  }

  return rows.map((row) => ({
    id: row.id,
    rating: row.rating,
    emoji: row.emoji,
    name: row.name,
    message: row.message,
    created_at: row.created_at,
    photo_url: row.photo_path ? photoUrlMap.get(row.photo_path) ?? null : null,
    photo_consent: row.photo_consent,
    is_featured: row.is_featured,
    frame: row.frame_id !== null ? frameMap.get(row.frame_id) ?? null : null,
  }));
}

export type TestimonialLandingFilter = "featured" | "unfeatured" | "no-consent";

export type TestimonialFilter = {
  rating?: number;
  search?: string;
  landing?: TestimonialLandingFilter;
};

/** Daftar testimoni untuk panel admin, dengan filter rating + pencarian. */
export async function listAdminTestimonials(
  filters: TestimonialFilter = {},
): Promise<TestimonialItem[]> {
  await connection();
  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return [];
  }
  const supabase = createAdminClient();
  let query = supabase
    .from("testimonials")
    .select(
      "id, rating, emoji, name, message, created_at, frame_id, photo_path, photo_consent, is_featured",
    )
    .order("created_at", { ascending: false });

  if (filters.rating) {
    query = query.eq("rating", filters.rating);
  }

  if (filters.landing === "featured") {
    query = query.eq("is_featured", true);
  } else if (filters.landing === "unfeatured") {
    query = query.eq("is_featured", false);
  } else if (filters.landing === "no-consent") {
    query = query.eq("photo_consent", false);
  }

  const term = filters.search?.trim();
  if (term) {
    const safeTerm = term.replace(/[%,()]/g, " ").trim();
    if (safeTerm) {
      query = query.or(`name.ilike.%${safeTerm}%,message.ilike.%${safeTerm}%`);
    }
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Gagal memuat testimoni: ${error.message}`);
  }
  return attachFrames(data ?? []);
}

export type TestimonialStats = {
  total: number;
  average: number;
  byRating: Record<number, number>;
  consented: number;
  featured: number;
};

export async function getTestimonialStats(): Promise<TestimonialStats> {
  await connection();
  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return {
      total: 0,
      average: 0,
      byRating: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      consented: 0,
      featured: 0,
    };
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("testimonials")
    .select("rating, photo_consent, is_featured");
  if (error) {
    throw new Error(`Gagal memuat statistik testimoni: ${error.message}`);
  }
  const byRating: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  let consented = 0;
  let featured = 0;
  for (const row of data ?? []) {
    sum += row.rating;
    byRating[row.rating] = (byRating[row.rating] ?? 0) + 1;
    if (row.photo_consent) {
      consented += 1;
    }
    if (row.is_featured) {
      featured += 1;
    }
  }
  const total = data?.length ?? 0;
  return {
    total,
    average: total > 0 ? Math.round((sum / total) * 10) / 10 : 0,
    byRating,
    consented,
    featured,
  };
}

export async function listFeaturedTestimonials(
  limit = 12,
): Promise<TestimonialItem[]> {
  await connection();
  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return [];
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("testimonials")
    .select(
      "id, rating, emoji, name, message, created_at, frame_id, photo_path, photo_consent, is_featured",
    )
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    throw new Error(`Gagal memuat testimoni: ${error.message}`);
  }
  return attachFrames(data ?? []);
}
