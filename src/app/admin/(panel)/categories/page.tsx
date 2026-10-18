import { Suspense } from "react";

import { CategoryAdminList } from "@/components/admin/categories/CategoryAdminList";
import { listCategories } from "@/lib/frames/queries";

export default function AdminCategoriesPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Kelola Kategori</h1>
        <p className="text-sm text-neutral-500">
          Kategori dipakai untuk mengelompokkan frame di katalog.
        </p>
      </header>

      <Suspense fallback={<p className="text-sm text-neutral-500">Memuat kategori...</p>}>
        <CategoryList />
      </Suspense>
    </main>
  );
}

async function CategoryList() {
  const categories = await listCategories("idDesc");
  return <CategoryAdminList categories={categories} />;
}
