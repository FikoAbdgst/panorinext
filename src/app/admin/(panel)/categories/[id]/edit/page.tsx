import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CategoryForm } from "@/components/admin/categories/CategoryForm";
import { getCategoryById } from "@/lib/frames/queries";

import { updateCategoryAction } from "../../actions";

export default function EditCategoryPage(
  props: PageProps<"/admin/categories/[id]/edit">,
) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link href="/admin/categories" className="text-sm text-neutral-500 underline">
          ← Kembali ke daftar kategori
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-neutral-900">Edit Kategori</h1>
      </div>

      <Suspense fallback={<p className="text-sm text-neutral-500">Memuat form...</p>}>
        <EditCategoryContent params={props.params} />
      </Suspense>
    </main>
  );
}

async function EditCategoryContent({
  params,
}: Pick<PageProps<"/admin/categories/[id]/edit">, "params">) {
  const { id } = await params;
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId)) {
    notFound();
  }

  const category = await getCategoryById(categoryId);
  if (!category) {
    notFound();
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6">
      <CategoryForm
        mode="edit"
        category={category}
        action={updateCategoryAction.bind(null, categoryId)}
      />
    </div>
  );
}
