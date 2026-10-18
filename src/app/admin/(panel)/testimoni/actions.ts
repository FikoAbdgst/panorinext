"use server";

import { revalidatePath } from "next/cache";

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
    .select("name")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) {
    return { success: false, message: "Terjadi kesalahan saat menghapus testimoni." };
  }

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
  const { error } = await supabase.from("testimonials").delete().in("id", validIds);
  if (error) {
    return { success: false, message: "Terjadi kesalahan saat menghapus testimoni." };
  }

  revalidateTestimoni();
  return {
    success: true,
    message: `${validIds.length} testimoni berhasil dihapus.`,
  };
}
