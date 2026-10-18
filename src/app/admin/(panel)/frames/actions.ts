"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { STORAGE_BUCKETS } from "@/lib/constants";
import type { FrameSlot } from "@/lib/frames/types";
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
      price: number;
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

  const price = parseNonNegativeInt(formData.get("price"));
  if (price === null) {
    return { error: "Harga tidak valid." };
  }

  const width = parsePositiveInt(formData.get("width"));
  const height = parsePositiveInt(formData.get("height"));
  if (width === null || height === null) {
    return { error: "Ukuran frame tidak valid." };
  }

  const slots = parseSlots(formData.get("slots"));
  if (slots === null) {
    return { error: "Data slot tidak valid." };
  }

  return { name, slug, categoryId, price, width, height, slots };
}

function readPng(formData: FormData): { file: File } | { error: string } | null {
  const file = formData.get("frame_image");
  if (!(file instanceof File) || file.size === 0) {
    return null;
  }
  if (file.type && file.type !== "image/png") {
    return { error: "File overlay harus berformat PNG." };
  }
  return { file };
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

  const png = readPng(formData);
  if (png === null) {
    return { status: "error", message: "File PNG overlay wajib diunggah." };
  }
  if ("error" in png) {
    return { status: "error", message: png.error };
  }

  const supabase = createAdminClient();
  const imagePath = `${fields.slug}-${crypto.randomUUID()}.png`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKETS.frames)
    .upload(imagePath, await png.file.arrayBuffer(), {
      contentType: "image/png",
      upsert: false,
    });
  if (uploadError) {
    return { status: "error", message: `Gagal mengunggah PNG: ${uploadError.message}` };
  }

  const { error: insertError } = await supabase.from("frames").insert({
    name: fields.name,
    slug: fields.slug,
    category_id: fields.categoryId,
    price: fields.price,
    width: fields.width,
    height: fields.height,
    slots: fields.slots,
    image_path: imagePath,
  });
  if (insertError) {
    await supabase.storage.from(STORAGE_BUCKETS.frames).remove([imagePath]);
    return { status: "error", message: `Gagal menyimpan frame: ${insertError.message}` };
  }

  revalidatePath("/admin/frames");
  revalidatePath("/frame");
  revalidatePath("/");
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
    .select("image_path")
    .eq("id", frameId)
    .maybeSingle();
  if (fetchError || !existing) {
    return { status: "error", message: "Frame tidak ditemukan." };
  }

  let imagePath = existing.image_path;
  let uploadedPath: string | null = null;

  const png = readPng(formData);
  if (png && "error" in png) {
    return { status: "error", message: png.error };
  }
  if (png) {
    imagePath = `${fields.slug}-${crypto.randomUUID()}.png`;
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.frames)
      .upload(imagePath, await png.file.arrayBuffer(), {
        contentType: "image/png",
        upsert: false,
      });
    if (uploadError) {
      return { status: "error", message: `Gagal mengunggah PNG: ${uploadError.message}` };
    }
    uploadedPath = imagePath;
  }

  const { error: updateError } = await supabase
    .from("frames")
    .update({
      name: fields.name,
      slug: fields.slug,
      category_id: fields.categoryId,
      price: fields.price,
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

  revalidatePath("/admin/frames");
  redirect("/admin/frames");
}

export async function deleteFrameAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(String(formData.get("id") ?? "").trim());
  if (!Number.isInteger(id)) {
    return;
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("frames")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("frames").delete().eq("id", id);

  if (existing?.image_path) {
    await supabase.storage.from(STORAGE_BUCKETS.frames).remove([existing.image_path]);
  }

  revalidatePath("/admin/frames");
}
