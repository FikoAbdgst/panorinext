"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth";

export type CategoryFormState = {
  status: "idle" | "error" | "success";
  message?: string;
};

function readFields(formData: FormData): { error: string } | { name: string } {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Nama kategori wajib diisi." };
  }
  if (name.length > 255) {
    return { error: "Nama kategori maksimal 255 karakter." };
  }

  return { name };
}

function revalidateCategories() {
  revalidatePath("/admin/categories");
  revalidatePath("/frame");
  revalidatePath("/");
}

export async function createCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();

  const fields = readFields(formData);
  if ("error" in fields) {
    return { status: "error", message: fields.error };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("categories")
    .insert({ name: fields.name });
  if (error) {
    return { status: "error", message: `Gagal menyimpan kategori: ${error.message}` };
  }

  revalidateCategories();
  return { status: "success", message: "Kategori berhasil ditambahkan!" };
}

export async function updateCategoryAction(
  categoryId: number,
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();

  if (!Number.isInteger(categoryId)) {
    return { status: "error", message: "ID kategori tidak valid." };
  }

  const fields = readFields(formData);
  if ("error" in fields) {
    return { status: "error", message: fields.error };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("categories")
    .update({ name: fields.name })
    .eq("id", categoryId);
  if (error) {
    return { status: "error", message: `Gagal memperbarui kategori: ${error.message}` };
  }

  revalidateCategories();
  redirect("/admin/categories");
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = Number(String(formData.get("id") ?? "").trim());
  if (!Number.isInteger(id)) {
    return;
  }

  const supabase = createAdminClient();
  await supabase.from("categories").delete().eq("id", id);

  revalidateCategories();
}
