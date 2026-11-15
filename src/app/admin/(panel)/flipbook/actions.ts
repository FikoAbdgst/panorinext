"use server";

import { revalidatePath } from "next/cache";

import { FLIPBOOK_PAGE_COUNT, STORAGE_BUCKETS } from "@/lib/constants";
import type { FlipbookAssetKind } from "@/lib/flipbook/types";
import type { FrameSlot } from "@/lib/frames/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth";
import { slugify } from "@/lib/utils/slug";

export type FlipbookFrameFormState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export type FlipbookAssetActionResult = {
  status: "success" | "error";
  message: string;
};

export type FlipbookAssetUploadTarget = { path: string; token: string };

const ASSET_KINDS: FlipbookAssetKind[] = ["cover", "page", "back"];
const ASSET_PATH_PATTERN =
  /^frame-(\d+)\/(cover|page|back)-(\d+)-[a-z0-9-]+\.png$/;

function parseKind(raw: string | null | undefined): FlipbookAssetKind | null {
  const value = typeof raw === "string" ? raw.trim() : "";
  return ASSET_KINDS.includes(value as FlipbookAssetKind)
    ? (value as FlipbookAssetKind)
    : null;
}

/** `cover`/`back` selalu 0; `page` bernilai 1..10. */
function parsePageIndex(
  kind: FlipbookAssetKind,
  raw: number | string | null | undefined,
): number | null {
  const value = Number(raw);
  if (!Number.isInteger(value)) {
    return null;
  }
  if (kind === "page") {
    return value >= 1 && value <= FLIPBOOK_PAGE_COUNT ? value : null;
  }
  return value === 0 ? 0 : null;
}

function parseNonNegativeInt(raw: FormDataEntryValue | null): number {
  const value = Number(String(raw ?? "").trim());
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

function parseSlots(raw: FormDataEntryValue | null): FrameSlot[] | null {
  if (typeof raw !== "string" || raw.trim() === "") {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) {
    return null;
  }
  const slots: FrameSlot[] = [];
  for (const item of parsed) {
    if (typeof item !== "object" || item === null) {
      return null;
    }
    const slot = item as Record<string, unknown>;
    const x = Number(slot.x);
    const y = Number(slot.y);
    const w = Number(slot.w);
    const h = Number(slot.h);
    const rawRotation =
      slot.rotation === undefined || slot.rotation === null
        ? 0
        : Number(slot.rotation);
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(w) ||
      !Number.isFinite(h) ||
      !Number.isFinite(rawRotation) ||
      w <= 0 ||
      h <= 0
    ) {
      return null;
    }
    const normalizedRotation = ((rawRotation % 360) + 540) % 360 - 180;
    const rotation =
      Math.abs(normalizedRotation) < 0.05
        ? 0
        : Math.round(normalizedRotation * 10) / 10;
    slots.push({
      x: Math.round(x),
      y: Math.round(y),
      w: Math.round(w),
      h: Math.round(h),
      ...(rotation ? { rotation } : {}),
    });
  }
  return slots;
}

function isMatchingAssetPath(
  path: string,
  frameId: number,
  kind: FlipbookAssetKind,
  pageIndex: number,
): boolean {
  const match = ASSET_PATH_PATTERN.exec(path);
  if (!match) {
    return false;
  }
  return (
    Number(match[1]) === frameId &&
    match[2] === kind &&
    Number(match[3]) === pageIndex
  );
}

function revalidateFlipbookViews(frameId?: number): void {
  revalidatePath("/admin/flipbook");
  if (frameId !== undefined) {
    revalidatePath(`/admin/flipbook/${frameId}/edit`);
  }
  revalidatePath("/flipbook");
}

async function assetExists(
  supabase: ReturnType<typeof createAdminClient>,
  path: string,
): Promise<boolean> {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.flipbookFrames)
    .createSignedUrl(path, 60);
  return !error;
}

function readFrameFields(formData: FormData):
  | { error: string }
  | { name: string; slug: string; isActive: boolean; sortOrder: number } {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Nama tipe frame wajib diisi." };
  }

  const slug = slugify(String(formData.get("slug") ?? "").trim() || name);
  if (!slug) {
    return { error: "Slug tidak valid." };
  }

  return {
    name,
    slug,
    isActive: formData.get("is_active") === "on",
    sortOrder: parseNonNegativeInt(formData.get("sort_order")),
  };
}

export async function createFlipbookFrameAction(
  _prevState: FlipbookFrameFormState,
  formData: FormData,
): Promise<FlipbookFrameFormState> {
  await requireAdmin();
  const fields = readFrameFields(formData);
  if ("error" in fields) {
    return { status: "error", message: fields.error };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("flipbook_frames")
    .insert({
      name: fields.name,
      slug: fields.slug,
      is_active: fields.isActive,
      sort_order: fields.sortOrder,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    const duplicate = error.code === "23505";
    return {
      status: "error",
      message: duplicate
        ? "Slug sudah dipakai tipe frame lain. Gunakan slug berbeda."
        : `Gagal menyimpan tipe frame: ${error.message}`,
    };
  }

  revalidateFlipbookViews(data?.id);
  return {
    status: "success",
    message: "Tipe frame dibuat. Lanjut unggah 12 overlay.",
  };
}

export async function updateFlipbookFrameAction(
  frameId: number,
  _prevState: FlipbookFrameFormState,
  formData: FormData,
): Promise<FlipbookFrameFormState> {
  await requireAdmin();
  if (!Number.isInteger(frameId)) {
    return { status: "error", message: "ID tipe frame tidak valid." };
  }

  const fields = readFrameFields(formData);
  if ("error" in fields) {
    return { status: "error", message: fields.error };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("flipbook_frames")
    .update({
      name: fields.name,
      slug: fields.slug,
      is_active: fields.isActive,
      sort_order: fields.sortOrder,
    })
    .eq("id", frameId);

  if (error) {
    const duplicate = error.code === "23505";
    return {
      status: "error",
      message: duplicate
        ? "Slug sudah dipakai tipe frame lain. Gunakan slug berbeda."
        : `Gagal menyimpan tipe frame: ${error.message}`,
    };
  }

  revalidateFlipbookViews(frameId);
  return { status: "success", message: "Tipe frame diperbarui." };
}

export async function deleteFlipbookFrameAction(
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  await requireAdmin();
  const frameId = Number(String(formData.get("id") ?? "").trim());
  if (!Number.isInteger(frameId)) {
    return { success: false, message: "ID tipe frame tidak valid." };
  }

  const supabase = createAdminClient();
  const { data: assets, error: assetError } = await supabase
    .from("flipbook_frame_assets")
    .select("image_path")
    .eq("frame_id", frameId);

  if (assetError) {
    return {
      success: false,
      message: `Gagal membaca aset frame: ${assetError.message}`,
    };
  }

  const { error: deleteError } = await supabase
    .from("flipbook_frames")
    .delete()
    .eq("id", frameId);

  if (deleteError) {
    return {
      success: false,
      message: `Gagal menghapus tipe frame: ${deleteError.message}`,
    };
  }

  const paths = (assets ?? [])
    .map((asset) => asset.image_path)
    .filter((path): path is string => Boolean(path));
  if (paths.length > 0) {
    await supabase.storage.from(STORAGE_BUCKETS.flipbookFrames).remove(paths);
  }

  revalidateFlipbookViews(frameId);
  return { success: true, message: "Tipe frame berhasil dihapus." };
}

/**
 * Signed upload URL untuk satu overlay (sampul/halaman/penutup). Browser
 * mengunggah langsung ke Supabase agar tidak kena batas body Server Action.
 */
export async function createFlipbookAssetUploadUrlAction(
  frameId: number,
  kind: string,
  pageIndex: number,
): Promise<FlipbookAssetUploadTarget | { error: string }> {
  await requireAdmin();
  if (!Number.isInteger(frameId)) {
    return { error: "ID tipe frame tidak valid." };
  }

  const parsedKind = parseKind(kind);
  if (!parsedKind) {
    return { error: "Jenis aset tidak valid." };
  }
  const parsedIndex = parsePageIndex(parsedKind, pageIndex);
  if (parsedIndex === null) {
    return { error: "Nomor halaman tidak valid." };
  }

  const supabase = createAdminClient();
  const { data: frame, error: frameError } = await supabase
    .from("flipbook_frames")
    .select("id")
    .eq("id", frameId)
    .maybeSingle();

  if (frameError || !frame) {
    return { error: "Tipe frame tidak ditemukan." };
  }

  const path = `frame-${frameId}/${parsedKind}-${parsedIndex}-${crypto.randomUUID()}.png`;
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.flipbookFrames)
    .createSignedUploadUrl(path, { upsert: false });

  if (error || !data) {
    return { error: error?.message ?? "Gagal membuat URL unggah." };
  }

  return { path: data.path, token: data.token };
}

export async function saveFlipbookAssetAction(input: {
  frameId: number;
  kind: string;
  pageIndex: number;
  imagePath: string;
  width: number;
  height: number;
  slots: FrameSlot[];
}): Promise<FlipbookAssetActionResult> {
  await requireAdmin();

  const { frameId, imagePath } = input;
  if (!Number.isInteger(frameId)) {
    return { status: "error", message: "ID tipe frame tidak valid." };
  }

  const kind = parseKind(input.kind);
  if (!kind) {
    return { status: "error", message: "Jenis aset tidak valid." };
  }
  const pageIndex = parsePageIndex(kind, input.pageIndex);
  if (pageIndex === null) {
    return { status: "error", message: "Nomor halaman tidak valid." };
  }

  if (
    typeof imagePath !== "string" ||
    imagePath.length === 0 ||
    imagePath.length > 240 ||
    !isMatchingAssetPath(imagePath, frameId, kind, pageIndex)
  ) {
    return { status: "error", message: "Path file PNG tidak valid." };
  }

  const width = Number(input.width);
  const height = Number(input.height);
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return { status: "error", message: "Ukuran PNG tidak valid." };
  }

  const slots = parseSlots(JSON.stringify(input.slots ?? []));
  if (slots === null) {
    return { status: "error", message: "Data slot tidak valid." };
  }

  const supabase = createAdminClient();
  if (!(await assetExists(supabase, imagePath))) {
    return {
      status: "error",
      message:
        "File PNG tidak ditemukan di storage. Coba unggah ulang lalu simpan kembali.",
    };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("flipbook_frame_assets")
    .select("image_path")
    .eq("frame_id", frameId)
    .eq("kind", kind)
    .eq("page_index", pageIndex)
    .maybeSingle();

  if (fetchError) {
    return {
      status: "error",
      message: `Gagal membaca aset lama: ${fetchError.message}`,
    };
  }

  const { error: saveError } = await supabase
    .from("flipbook_frame_assets")
    .upsert(
      {
        frame_id: frameId,
        kind,
        page_index: pageIndex,
        image_path: imagePath,
        width,
        height,
        slots,
      },
      { onConflict: "frame_id,kind,page_index" },
    );

  if (saveError) {
    await supabase.storage.from(STORAGE_BUCKETS.flipbookFrames).remove([imagePath]);
    return {
      status: "error",
      message: `Gagal menyimpan aset: ${saveError.message}`,
    };
  }

  if (existing?.image_path && existing.image_path !== imagePath) {
    await supabase.storage
      .from(STORAGE_BUCKETS.flipbookFrames)
      .remove([existing.image_path]);
  }

  revalidateFlipbookViews(frameId);
  return { status: "success", message: "Overlay berhasil disimpan." };
}

export async function deleteFlipbookAssetAction(
  frameId: number,
  kind: string,
  pageIndex: number,
): Promise<FlipbookAssetActionResult> {
  await requireAdmin();
  if (!Number.isInteger(frameId)) {
    return { status: "error", message: "ID tipe frame tidak valid." };
  }

  const parsedKind = parseKind(kind);
  if (!parsedKind) {
    return { status: "error", message: "Jenis aset tidak valid." };
  }
  const parsedIndex = parsePageIndex(parsedKind, pageIndex);
  if (parsedIndex === null) {
    return { status: "error", message: "Nomor halaman tidak valid." };
  }

  const supabase = createAdminClient();
  const { data: existing, error: fetchError } = await supabase
    .from("flipbook_frame_assets")
    .select("image_path")
    .eq("frame_id", frameId)
    .eq("kind", parsedKind)
    .eq("page_index", parsedIndex)
    .maybeSingle();

  if (fetchError) {
    return {
      status: "error",
      message: `Gagal membaca aset: ${fetchError.message}`,
    };
  }
  if (!existing) {
    return { status: "success", message: "Aset sudah kosong." };
  }

  const { error: deleteError } = await supabase
    .from("flipbook_frame_assets")
    .delete()
    .eq("frame_id", frameId)
    .eq("kind", parsedKind)
    .eq("page_index", parsedIndex);

  if (deleteError) {
    return {
      status: "error",
      message: `Gagal menghapus aset: ${deleteError.message}`,
    };
  }

  await supabase.storage
    .from(STORAGE_BUCKETS.flipbookFrames)
    .remove([existing.image_path]);

  revalidateFlipbookViews(frameId);
  return { status: "success", message: "Overlay dihapus." };
}
