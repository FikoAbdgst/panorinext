import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CategoryForm } from "@/components/admin/categories/CategoryForm";
import { AdminLoading } from "@/components/admin/ui";
import { getCategoryById } from "@/lib/frames/queries";

import { updateCategoryAction } from "../../actions";

export default function EditCategoryPage(
  props: PageProps<"/admin/categories/[id]/edit">,
) {
  return (
    <>
      <AdminPageHeader
        title="Edit kategori"
        description="Perbarui nama dan slug kategori ini."
        backHref="/admin/categories"
        backLabel="Daftar kategori"
      />

      <Suspense fallback={<AdminLoading label="Memuat form..." />}>
        <EditCategoryContent params={props.params} />
      </Suspense>
    </>
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
    <div className="admin-card p-6">
      <CategoryForm
        mode="edit"
        category={category}
        action={updateCategoryAction.bind(null, categoryId)}
      />
    </div>
  );
}
