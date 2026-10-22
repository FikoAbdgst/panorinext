"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CategoryCreateModal } from "./CategoryCreateModal";
import { RemoveCategoryButton } from "./RemoveCategoryButton";

export type CategoryAdminRow = {
  id: number;
  name: string;
};

export function CategoryAdminList({ categories }: { categories: CategoryAdminRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return categories;
    }
    return categories.filter((category) =>
      category.name.toLowerCase().includes(term),
    );
  }, [categories, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari kategori..."
          className="w-full max-w-xs rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <CategoryCreateModal />
      </div>

      {filtered.length === 0 ? (
        <p className="admin-empty">
          {categories.length === 0
            ? "Belum ada kategori. Tambahkan kategori pertama Anda."
            : "Tidak ada kategori yang cocok."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((category) => (
                <tr key={category.id} className="align-middle">
                  <td className="px-4 py-3 font-medium text-neutral-800">
                    {category.name}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{category.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/admin/categories/${category.id}/edit`}
                        className="text-sm font-medium text-[#BF3131] underline"
                      >
                        Edit
                      </Link>
                      <RemoveCategoryButton id={category.id} name={category.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
