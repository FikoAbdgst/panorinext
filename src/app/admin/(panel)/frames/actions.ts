"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { STORAGE_BUCKETS } from "@/lib/constants";
import type { FrameAccessType, FrameSlot } from "@/lib/frames/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth";
import { slugify } from "@/lib/utils/slug";

export type FrameFormState = {
  status: "idle" | "error" | "success";
  message?: string;
};

function parseNonNegativeInt(raw: FormDataEntryValue | null): number | null {
  if (raw === null) {
    return null;
  }
  const value = Number(String(raw).trim());
  if (!Number.isInteger(value) || value < 0) {
    return null;
  }
  return value;
}

function parsePositiveInt(raw: FormDataEntryValue | null): number | null {
  const value = parseNonNegativeInt(raw);
  if (value === null || value === 0) {
    return null;
  }
  return value;
}

function parseSlots(raw: FormDataEntryValue | null): FrameSlot[] | null {
  if (typeof raw !== "string" || raw.trim() === "") {
    return null;
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
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(w) ||
      !Number.isFinite(h) ||
      w <= 0 ||
      h <= 0
    ) {
      return null;
    }
    slots.push({
      x: Math.round(x),
      y: Math.round(y),
      w: Math.round(w),
      h: Math.round(h),
    });
  }
  return slots;
}

function readFrameFields(formData: FormData):
  | { error: string }
  | {
      name: string;
      slug: string;
      categoryId: number | null;
      accessType: FrameAccessType;
      width: number;
      height: number;
      slots: FrameSlot[];
    } {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Nama frame wajib diisi." };
  }

  const slug = slugify(String(formData.get("slug") ?? "").trim() || name);
  if (!slug) {
    return { error: "Slug tidak valid." };
  }

  const categoryRaw = String(formData.get("category_id") ?? "").trim();
  let categoryId: number | null = null;
  if (categoryRaw) {
    const parsed = Number(categoryRaw);
    if (!Number.isInteger(parsed)) {
      return { error: "Kategori tidak valid." };
    }
    categoryId = parsed;
  }

  const accessTypeRaw = String(formData.get("access_type") ?? "free");
  if (accessTypeRaw !== "free" && accessTypeRaw !== "premium") {
    return { error: "Tipe akses frame tidak valid." };
  }
  const accessType = accessTypeRaw as FrameAccessType;

  const width = parsePositiveInt(formData.get("width"));
  const height = parsePositiveInt(formData.get("height"));
  if (width === null || height === null) {
    return { error: "Ukuran frame tidak valid." };
  }

  const slots = parseSlots(formData.get("slots"));
  if (slots === null) {
    return { error: "Data slot tidak valid." };
  }
  /* Frame tanpa slot tidak bisa dipakai di booth maupun pratinjau publik.
   * Menolak di sini mencegah frame "kosong" tersimpan lalu tidak muncul
   * sebagai frame yang bisa dipakai user. */
  if (slots.length === 0) {
    return {
      error:
        "Frame harus memiliki minimal satu slot foto. Deteksi ulang PNG atau tambahkan slot manual sebelum menyimpan.",
    };
  }

  return { name, slug, categoryId, accessType, width, height, slots };
}

/**
 * Semua tampilan yang menampilkan daftar/overlay frame. Dipanggil setiap kali
 * frame dibuat, diubah, atau dihapus agar user tidak melihat data lama.
 */
function revalidateFrameViews(): void {
  revalidatePath("/admin/frames");
  revalidatePath("/frame");
  revalidatePath("/");
  revalidatePath("/premium");
  revalidatePath("/premium/[slug]", "page");
  revalidatePath("/premium/room", "page");
  revalidatePath("/booth", "page");
}

/**
 * Memastikan file overlay benar-benar ada di storage sebelum path-nya
 * disimpan ke database. Tanpa ini, kegagalan unggah yang tidak terdeteksi
 * bisa menghasilkan frame dengan gambar rusak/kosong.
 */
async function frameImageExists(
  supabase: ReturnType<typeof createAdminClient>,
  path: string,
): Promise<boolean> {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.frames)
    .createSignedUrl(path, 60);
  return !error;
}

const IMAGE_PATH_PATTERN = /^[a-z0-9][a-z0-9._-]*\.png$/;

function readImagePath(formData: FormData): string {
  const raw = formData.get("image_path");
  return typeof raw === "string" ? raw.trim() : "";
}

function isValidImagePath(path: string): boolean {
  return (
    path.length > 0 &&
    path.length <= 200 &&
    !path.includes("..") &&
    IMAGE_PATH_PATTERN.test(path)
  );
}

export type FrameUploadTarget = { path: string; token: string };

/**
 * Membuat signed upload URL agar browser mengunggah PNG langsung ke Supabase.
 * Ini menghindari batas 4.5 MB body Server Action di Vercel.
 */
export async function createFrameUploadUrlAction(
  slug: string,
): Promise<FrameUploadTarget | { error: string }> {
  await requireAdmin();

  const safeSlug = slugify(slug) || "frame";
  const path = `${safeSlug}-${crypto.randomUUID()}.png`;

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.frames)
    .createSignedUploadUrl(path, { upsert: false });

  if (error || !data) {
    return { error: error?.message ?? "Gagal membuat URL unggah." };
  }

  return { path: data.path, token: data.token };
}

export async function createFrameAction(
  _prevState: FrameFormState,
  formData: FormData,
): Promise<FrameFormState> {
  await requireAdmin();
  const fields = readFrameFields(formData);
  if ("error" in fields) {
    return { status: "error", message: fields.error };
  }

  const imagePath = readImagePath(formData);
  if (!isValidImagePath(imagePath)) {
    return { status: "error", message: "File PNG overlay wajib diunggah." };
  }

  const supabase = createAdminClient();

  if (!(await frameImageExists(supabase, imagePath))) {
    return {
      status: "error",
      message:
        "File PNG overlay tidak ditemukan di storage. Coba unggah ulang lalu simpan kembali.",
    };
  }

  const { error: insertError } = await supabase.from("frames").insert({
    name: fields.name,
    slug: fields.slug,
    category_id: fields.categoryId,
    price: 0,
    access_type: fields.accessType,
    width: fields.width,
    height: fields.height,
    slots: fields.slots,
    image_path: imagePath,
  });
  if (insertError) {
    await supabase.storage.from(STORAGE_BUCKETS.frames).remove([imagePath]);
    return { status: "error", message: `Gagal menyimpan frame: ${insertError.message}` };
  }

  revalidateFrameViews();
  return { status: "success", message: "Frame berhasil ditambahkan!" };
}

export async function updateFrameAction(
  frameId: number,
  _prevState: FrameFormState,
  formData: FormData,
): Promise<FrameFormState> {
  await requireAdmin();
  if (!Number.isInteger(frameId)) {
    return { status: "error", message: "ID frame tidak valid." };
  }

  const fields = readFrameFields(formData);
  if ("error" in fields) {
    return { status: "error", message: fields.error };
  }

  const supabase = createAdminClient();
  const { data: existing, error: fetchError } = await supabase
    .from("frames")
    .select("image_path, access_type")
    .eq("id", frameId)
    .maybeSingle();
  if (fetchError || !existing) {
    return { status: "error", message: "Frame tidak ditemukan." };
  }

  if (fields.accessType === "free") {
    const { count: packCount, error: packError } = await supabase
      .from("pack_frames")
      .select("frame_id", { count: "exact", head: true })
      .eq("frame_id", frameId);

    if (packError) {
      return {
        status: "error",
        message: `Gagal memeriksa paket frame: ${packError.message}`,
      };
    }

    if ((packCount ?? 0) > 0) {
      return {
        status: "error",
        message:
          "Frame ini masih menjadi isi paket. Keluarkan dari paket terlebih dahulu sebelum mengubahnya menjadi gratis.",
      };
    }
  }

  let imagePath = existing.image_path;
  let uploadedPath: string | null = null;

  const submittedPath = readImagePath(formData);
  if (submittedPath && submittedPath !== existing.image_path) {
    if (!isValidImagePath(submittedPath)) {
      return { status: "error", message: "File PNG overlay tidak valid." };
    }
    imagePath = submittedPath;
    uploadedPath = submittedPath;
  }

  /* Hanya verifikasi path yang benar-benar baru. Path lama dibiarkan agar frame
   * lama tetap bisa diperbarui meski pengecekan storage sedang bermasalah. */
  if (uploadedPath && !(await frameImageExists(supabase, uploadedPath))) {
    return {
      status: "error",
      message:
        "File PNG overlay baru tidak ditemukan di storage. Coba unggah ulang lalu simpan kembali.",
    };
  }

  const { error: updateError } = await supabase
    .from("frames")
    .update({
      name: fields.name,
      slug: fields.slug,
      category_id: fields.categoryId,
      access_type: fields.accessType,
      width: fields.width,
      height: fields.height,
      slots: fields.slots,
      image_path: imagePath,
    })
    .eq("id", frameId);
  if (updateError) {
    if (uploadedPath) {
      await supabase.storage.from(STORAGE_BUCKETS.frames).remove([uploadedPath]);
    }
    return { status: "error", message: `Gagal menyimpan frame: ${updateError.message}` };
  }

  // Hapus overlay lama hanya bila diganti dan bukan file yang sama.
  if (uploadedPath && existing.image_path && existing.image_path !== uploadedPath) {
    await supabase.storage.from(STORAGE_BUCKETS.frames).remove([existing.image_path]);
  }

  revalidateFrameViews();
  redirect("/admin/frames");
}

export async function deleteFrameAction(
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  await requireAdmin();
  const id = Number(String(formData.get("id") ?? "").trim());
  if (!Number.isInteger(id)) {
    return { success: false, message: "ID frame tidak valid." };
  }

  const supabase = createAdminClient();
  const { count: packCount, error: packError } = await supabase
    .from("pack_frames")
    .select("frame_id", { count: "exact", head: true })
    .eq("frame_id", id);

  if (packError) {
    return {
      success: false,
      message: `Gagal memeriksa paket frame: ${packError.message}`,
    };
  }
  if ((packCount ?? 0) > 0) {
    return {
      success: false,
      message:
        "Frame ini masih menjadi isi paket. Keluarkan dari paket terlebih dahulu sebelum menghapusnya.",
    };
  }

  const { data: existing } = await supabase
    .from("frames")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();

  const { error: deleteError } = await supabase
    .from("frames")
    .delete()
    .eq("id", id);
  if (deleteError) {
    return {
      success: false,
      message: `Gagal menghapus frame: ${deleteError.message}`,
    };
  }

  if (existing?.image_path) {
    await supabase.storage.from(STORAGE_BUCKETS.frames).remove([existing.image_path]);
  }

  revalidateFrameViews();
  return { success: true, message: "Frame berhasil dihapus." };
}
