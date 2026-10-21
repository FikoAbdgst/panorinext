"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth";
import { slugify } from "@/lib/utils/slug";

export type PackFormState = {
  status: "idle" | "error" | "success";
  message?: string;
};

type PackFields = {
  name: string;
  slug: string;
  description: string | null;
  price: number;
  durationDays: number;
  isActive: boolean;
  sortOrder: number;
  frameIds: number[];
};

function readPackFields(formData: FormData): PackFields | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nama paket wajib diisi." };

  const slug = slugify(String(formData.get("slug") ?? "").trim() || name);
  if (!slug) return { error: "Slug paket tidak valid." };

  const descriptionRaw = String(formData.get("description") ?? "").trim();
  const price = Number(String(formData.get("price") ?? "").trim());
  if (!Number.isFinite(price) || price < 0) {
    return { error: "Harga paket tidak valid." };
  }

  const durationDays = Number(String(formData.get("duration_days") ?? "").trim());
  if (!Number.isInteger(durationDays) || durationDays <= 0) {
    return { error: "Masa aktif harus minimal 1 hari." };
  }

  const sortOrderRaw = Number(String(formData.get("sort_order") ?? "0").trim());
  const sortOrder = Number.isInteger(sortOrderRaw) ? sortOrderRaw : 0;
  const isActive = String(formData.get("is_active") ?? "") === "on";

  const frameIds = [
    ...new Set(
      formData
        .getAll("frame_ids")
        .map((value) => Number(String(value)))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  ];
  if (frameIds.length === 0) {
    return { error: "Pilih minimal satu frame premium untuk paket ini." };
  }

  return {
    name,
    slug,
    description: descriptionRaw || null,
    price,
    durationDays,
    isActive,
    sortOrder,
    frameIds,
  };
}

async function validatePremiumFrames(
  frameIds: number[],
): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("frames")
    .select("id, access_type")
    .in("id", frameIds);

  if (error) return `Gagal memeriksa frame: ${error.message}`;
  if ((data ?? []).length !== frameIds.length || data?.some((f) => f.access_type !== "premium")) {
    return "Semua frame dalam paket harus bertipe premium.";
  }
  return null;
}

function revalidatePackPaths(slug?: string) {
  revalidatePath("/admin/packs");
  revalidatePath("/premium");
  revalidatePath("/");
  if (slug) revalidatePath(`/premium/${slug}`);
}

export async function createPackAction(
  _prevState: PackFormState,
  formData: FormData,
): Promise<PackFormState> {
  await requireAdmin();
  const fields = readPackFields(formData);
  if ("error" in fields) return { status: "error", message: fields.error };

  const frameError = await validatePremiumFrames(fields.frameIds);
  if (frameError) return { status: "error", message: frameError };

  const supabase = createAdminClient();
  const { data: pack, error: packError } = await supabase
    .from("packs")
    .insert({
      name: fields.name,
      slug: fields.slug,
      description: fields.description,
      price: fields.price,
      duration_days: fields.durationDays,
      is_active: fields.isActive,
      sort_order: fields.sortOrder,
    })
    .select("id")
    .single();

  if (packError || !pack) {
    return { status: "error", message: `Gagal menyimpan paket: ${packError?.message ?? "unknown"}` };
  }

  const { error: linkError } = await supabase.from("pack_frames").insert(
    fields.frameIds.map((frameId, index) => ({
      pack_id: pack.id,
      frame_id: frameId,
      sort_order: index,
    })),
  );

  if (linkError) {
    await supabase.from("packs").delete().eq("id", pack.id);
    return { status: "error", message: `Gagal menyimpan frame paket: ${linkError.message}` };
  }

  revalidatePackPaths(fields.slug);
  return { status: "success", message: "Paket berhasil dibuat." };
}

export async function updatePackAction(
  packId: number,
  _prevState: PackFormState,
  formData: FormData,
): Promise<PackFormState> {
  await requireAdmin();
  if (!Number.isInteger(packId)) {
    return { status: "error", message: "ID paket tidak valid." };
  }

  const fields = readPackFields(formData);
  if ("error" in fields) return { status: "error", message: fields.error };

  const frameError = await validatePremiumFrames(fields.frameIds);
  if (frameError) return { status: "error", message: frameError };

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("packs")
    .select("slug")
    .eq("id", packId)
    .maybeSingle();

  const { error: packError } = await supabase
    .from("packs")
    .update({
      name: fields.name,
      slug: fields.slug,
      description: fields.description,
      price: fields.price,
      duration_days: fields.durationDays,
      is_active: fields.isActive,
      sort_order: fields.sortOrder,
    })
    .eq("id", packId);

  if (packError) {
    return { status: "error", message: `Gagal menyimpan paket: ${packError.message}` };
  }

  const { data: oldLinks } = await supabase
    .from("pack_frames")
    .select("frame_id, sort_order")
    .eq("pack_id", packId);

  await supabase.from("pack_frames").delete().eq("pack_id", packId);
  const { error: linkError } = await supabase.from("pack_frames").insert(
    fields.frameIds.map((frameId, index) => ({
      pack_id: packId,
      frame_id: frameId,
      sort_order: index,
    })),
  );

  if (linkError) {
    if (oldLinks && oldLinks.length > 0) {
      await supabase.from("pack_frames").insert(
        oldLinks.map((link) => ({
          pack_id: packId,
          frame_id: link.frame_id,
          sort_order: link.sort_order,
        })),
      );
    }
    return { status: "error", message: `Gagal menyimpan frame paket: ${linkError.message}` };
  }

  revalidatePackPaths(existing?.slug);
  revalidatePackPaths(fields.slug);
  redirect("/admin/packs");
}

export async function deletePackAction(
  packId: number,
): Promise<{ success: boolean; message: string }> {
  await requireAdmin();
  if (!Number.isInteger(packId)) {
    return { success: false, message: "ID paket tidak valid." };
  }

  const supabase = createAdminClient();
  const [accessCount, transactionCount] = await Promise.all([
    supabase
      .from("premium_access")
      .select("id", { count: "exact", head: true })
      .eq("pack_id", packId),
    supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("pack_id", packId),
  ]);

  if ((accessCount.count ?? 0) > 0 || (transactionCount.count ?? 0) > 0) {
    return {
      success: false,
      message:
        "Paket sudah punya transaksi atau kode akses. Nonaktifkan paket ini saja agar riwayat tetap aman.",
    };
  }

  const { data: pack } = await supabase
    .from("packs")
    .select("slug")
    .eq("id", packId)
    .maybeSingle();

  const { error } = await supabase.from("packs").delete().eq("id", packId);
  if (error) {
    return { success: false, message: `Gagal menghapus paket: ${error.message}` };
  }

  revalidatePackPaths(pack?.slug);
  return { success: true, message: "Paket berhasil dihapus." };
}
