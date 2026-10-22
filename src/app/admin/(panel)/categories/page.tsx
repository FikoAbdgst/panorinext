import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CategoryAdminList } from "@/components/admin/categories/CategoryAdminList";
import { AdminLoading } from "@/components/admin/ui";
import { listCategories } from "@/lib/frames/queries";

export default function AdminCategoriesPage() {
  return (
    <>
      <AdminPageHeader
        title="Kategori"
        description="Kategori dipakai untuk mengelompokkan frame di katalog."
      />

      <Suspense fallback={<AdminLoading label="Memuat kategori..." />}>
        <CategoryList />
      </Suspense>
    </>
  );
}

async function CategoryList() {
  const categories = await listCategories("idDesc");
  return <CategoryAdminList categories={categories} />;
}
