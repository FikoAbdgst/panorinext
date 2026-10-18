"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { getFramePublicUrl } from "@/lib/frames/url";

import { FrameCreateModal } from "./FrameCreateModal";
import { RemoveFrameButton } from "./RemoveFrameButton";

export type FrameAdminRow = {
  id: number;
  name: string;
  slug: string;
  image_path: string | null;
  price: number;
  used: number;
  slots: unknown[];
  category_id: number | null;
  category_name: string | null;
};

type CategoryOption = {
  id: number;
  name: string;
};

export function FrameAdminList({
  frames,
  categories,
}: {
  frames: FrameAdminRow[];
  categories: CategoryOption[];
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return frames.filter((frame) => {
      if (
        term &&
        !frame.name.toLowerCase().includes(term) &&
        !frame.slug.toLowerCase().includes(term)
      ) {
        return false;
      }
      if (categoryFilter !== "all") {
        if (String(frame.category_id ?? "") !== categoryFilter) {
          return false;
        }
      }
      if (priceFilter === "gratis" && frame.price !== 0) {
        return false;
      }
      if (priceFilter === "berbayar" && frame.price === 0) {
        return false;
      }
      return true;
    });
  }, [frames, search, categoryFilter, priceFilter]);

  const hasFilters =
    search.trim() !== "" || categoryFilter !== "all" || priceFilter !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari frame..."
            className="w-full max-w-xs rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((category) => (
              <option key={category.id} value={String(category.id)}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={priceFilter}
            onChange={(event) => setPriceFilter(event.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="all">Semua Harga</option>
            <option value="gratis">Gratis</option>
            <option value="berbayar">Berbayar</option>
          </select>
        </div>
        <FrameCreateModal categories={categories} />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-500">
          {frames.length === 0
            ? "Belum ada frame. Tambahkan frame pertama Anda."
            : hasFilters
              ? "Tidak ada frame yang cocok dengan filter."
              : "Belum ada frame."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Overlay</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Harga</th>
                <th className="px-4 py-3">Slot</th>
                <th className="px-4 py-3">Dipakai</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((frame) => (
                <tr key={frame.id} className="align-middle">
                  <td className="px-4 py-3">
                    {frame.image_path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getFramePublicUrl(frame.image_path)}
                        alt={frame.name}
                        className="h-16 w-auto rounded border border-neutral-200 bg-neutral-100"
                      />
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-800">{frame.name}</div>
                    <div className="text-xs text-neutral-400">{frame.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {frame.category_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {frame.price === 0
                      ? "Gratis"
                      : `Rp ${frame.price.toLocaleString("id-ID")}`}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{frame.slots.length}</td>
                  <td className="px-4 py-3 text-neutral-600">{frame.used}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/admin/frames/${frame.id}/edit`}
                        className="text-sm font-medium text-[#BF3131] underline"
                      >
                        Edit
                      </Link>
                      <RemoveFrameButton id={frame.id} name={frame.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-neutral-500">
        Menampilkan {filtered.length} dari {frames.length} frame.
      </p>
    </div>
  );
}
