"use server";

import { revalidatePath } from "next/cache";

import { STORAGE_BUCKETS } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth";

export type TestimoniActionResult = {
  success: boolean;
  message: string;
};

function revalidateTestimoni() {
  revalidatePath("/admin/testimoni");
  revalidatePath("/");
}

async function removeTestimoniPhotos(paths: (string | null)[]) {
  const photoPaths = paths.filter((path): path is string => Boolean(path));
  if (photoPaths.length === 0) {
    return;
  }
  const supabase = createAdminClient();
  await supabase.storage.from(STORAGE_BUCKETS.photoResults).remove(photoPaths);
}

export async function deleteTestimoniAction(
  id: number,
): Promise<TestimoniActionResult> {
  await requireAdmin();

  if (!Number.isInteger(id)) {
    return { success: false, message: "Terjadi kesalahan saat menghapus testimoni." };
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("testimonials")
    .select("name, photo_path")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) {
    return { success: false, message: "Terjadi kesalahan saat menghapus testimoni." };
  }

  await removeTestimoniPhotos([existing?.photo_path ?? null]);
  revalidateTestimoni();
  return {
    success: true,
    message: `Testimoni dari ${existing?.name ?? "Anonymous"} berhasil dihapus.`,
  };
}

export async function bulkDeleteTestimoniAction(
  ids: number[],
): Promise<TestimoniActionResult> {
  await requireAdmin();

  const validIds = ids.filter((id) => Number.isInteger(id));
  if (validIds.length === 0) {
    return { success: false, message: "Tidak ada testimoni yang dipilih." };
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("testimonials")
    .select("photo_path")
    .in("id", validIds);

  const { error } = await supabase.from("testimonials").delete().in("id", validIds);
  if (error) {
    return { success: false, message: "Terjadi kesalahan saat menghapus testimoni." };
  }

  await removeTestimoniPhotos((existing ?? []).map((row) => row.photo_path));
  revalidateTestimoni();
  return {
    success: true,
    message: `${validIds.length} testimoni berhasil dihapus.`,
  };
}

export async function setTestimoniFeaturedAction(
  id: number,
  isFeatured: boolean,
): Promise<TestimoniActionResult> {
  await requireAdmin();

  if (!Number.isInteger(id)) {
    return { success: false, message: "Terjadi kesalahan saat mengubah testimoni." };
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("testimonials")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    return { success: false, message: "Testimoni tidak ditemukan." };
  }

  const { error } = await supabase
    .from("testimonials")
    .update({ is_featured: isFeatured })
    .eq("id", id);
  if (error) {
    return { success: false, message: "Terjadi kesalahan saat mengubah testimoni." };
  }

  revalidateTestimoni();
  return {
    success: true,
    message: isFeatured
      ? `Testimoni dari ${existing.name ?? "Anonymous"} tampil di landing page.`
      : `Testimoni dari ${existing.name ?? "Anonymous"} disembunyikan dari landing page.`,
  };
}
