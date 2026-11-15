import "server-only";

import { connection } from "next/server";

import {
  isFlipbookFrameComplete,
  type FlipbookAsset,
  type FlipbookAssetKind,
  type FlipbookFrame,
} from "@/lib/flipbook/types";
import { getFlipbookFramePublicUrl } from "@/lib/flipbook/url";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isSupabaseAdminConfigured,
  warnSupabaseNotConfigured,
} from "@/lib/supabase/config";

type FlipbookFrameRow = {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
};

type FlipbookAssetRow = {
  id: number;
  frame_id: number;
  kind: FlipbookAssetKind;
  page_index: number;
  image_path: string;
  width: number;
  height: number;
  slots: FlipbookAsset["slots"] | null;
};

const FRAME_SELECT = "id, name, slug, is_active, sort_order";
const ASSET_SELECT =
  "id, frame_id, kind, page_index, image_path, width, height, slots";

function buildFrame(
  row: FlipbookFrameRow,
  assets: FlipbookAssetRow[],
): FlipbookFrame {
  const pages: Array<FlipbookAsset | null> = Array.from(
    { length: 10 },
    () => null,
  );
  let cover: FlipbookAsset | null = null;
  let back: FlipbookAsset | null = null;

  for (const asset of assets) {
    if (!asset.image_path) {
      continue;
    }
    const mapped: FlipbookAsset = {
      id: asset.id,
      kind: asset.kind,
      pageIndex: asset.page_index,
      imageUrl: getFlipbookFramePublicUrl(asset.image_path),
      width: asset.width,
      height: asset.height,
      slots: asset.slots ?? [],
    };

    if (asset.kind === "cover") {
      cover = mapped;
    } else if (asset.kind === "back") {
      back = mapped;
    } else if (asset.page_index >= 1 && asset.page_index <= 10) {
      pages[asset.page_index - 1] = mapped;
    }
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    cover,
    pages,
    back,
  };
}

async function loadFrames(options: { activeOnly: boolean }): Promise<FlipbookFrame[]> {
  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return [];
  }

  const supabase = createAdminClient();
  let query = supabase.from("flipbook_frames").select(FRAME_SELECT);
  if (options.activeOnly) {
    query = query.eq("is_active", true);
  }
  const { data: frameRows, error: frameError } = await query
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (frameError) {
    throw new Error(`Gagal memuat frame flipbook: ${frameError.message}`);
  }

  const frames: FlipbookFrameRow[] = frameRows ?? [];
  if (frames.length === 0) {
    return [];
  }

  const { data: assetRows, error: assetError } = await supabase
    .from("flipbook_frame_assets")
    .select(ASSET_SELECT)
    .in(
      "frame_id",
      frames.map((frame) => frame.id),
    );

  if (assetError) {
    throw new Error(`Gagal memuat aset frame flipbook: ${assetError.message}`);
  }

  const byFrame = new Map<number, FlipbookAssetRow[]>();
  for (const asset of (assetRows ?? []) as FlipbookAssetRow[]) {
    const list = byFrame.get(asset.frame_id);
    if (list) {
      list.push(asset);
    } else {
      byFrame.set(asset.frame_id, [asset]);
    }
  }

  return frames.map((frame) => buildFrame(frame, byFrame.get(frame.id) ?? []));
}

/**
 * Tipe frame flipbook yang siap dipakai user: aktif dan 12 overlay lengkap.
 * Dipakai halaman `/flipbook` untuk pemilih frame.
 */
export async function listFlipbookFrames(): Promise<FlipbookFrame[]> {
  await connection();
  const frames = await loadFrames({ activeOnly: true });
  return frames.filter(isFlipbookFrameComplete);
}

/** Semua tipe frame untuk panel admin, termasuk yang belum lengkap/nonaktif. */
export async function listFlipbookFramesForAdmin(): Promise<FlipbookFrame[]> {
  await connection();
  return loadFrames({ activeOnly: false });
}

/** Satu tipe frame untuk halaman edit admin. */
export async function getFlipbookFrameById(
  id: number,
): Promise<FlipbookFrame | null> {
  await connection();
  if (!Number.isInteger(id)) {
    return null;
  }
  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return null;
  }

  const supabase = createAdminClient();
  const { data: frame, error } = await supabase
    .from("flipbook_frames")
    .select(FRAME_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Gagal memuat frame flipbook: ${error.message}`);
  }
  if (!frame) {
    return null;
  }

  const { data: assets, error: assetError } = await supabase
    .from("flipbook_frame_assets")
    .select(ASSET_SELECT)
    .eq("frame_id", id);

  if (assetError) {
    throw new Error(`Gagal memuat aset frame flipbook: ${assetError.message}`);
  }

  return buildFrame(frame, (assets ?? []) as FlipbookAssetRow[]);
}
