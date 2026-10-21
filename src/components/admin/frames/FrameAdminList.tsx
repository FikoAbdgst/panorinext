"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { getFramePublicUrl } from "@/lib/frames/url";
import type { FramePackMembership } from "@/lib/packs/queries";

import { FrameCreateModal } from "./FrameCreateModal";
import { RemoveFrameButton } from "./RemoveFrameButton";

export type FrameAdminRow = {
  id: number;
  name: string;
  slug: string;
  image_path: string | null;
  access_type: "free" | "premium";
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
  memberships,
}: {
  frames: FrameAdminRow[];
  categories: CategoryOption[];
  memberships: FramePackMembership[];
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
  const [slotFilter, setSlotFilter] = useState("all");

  const slotCounts = useMemo(() => {
    const set = new Set<number>();
    for (const frame of frames) {
      set.add(frame.slots.length);
    }
    return [...set].sort((a, b) => a - b);
  }, [frames]);

  const packsByFrame = useMemo(() => {
    const map = new Map<number, FramePackMembership[]>();
    for (const membership of memberships) {
      const current = map.get(membership.frame_id);
      if (current) {
        current.push(membership);
      } else {
        map.set(membership.frame_id, [membership]);
      }
    }
    return map;
  }, [memberships]);

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
      if (accessFilter !== "all" && frame.access_type !== accessFilter) {
        return false;
      }
      if (slotFilter !== "all" && String(frame.slots.length) !== slotFilter) {
        return false;
      }
      return true;
    });
  }, [frames, search, categoryFilter, accessFilter, slotFilter]);

  const hasFilters =
    search.trim() !== "" ||
    categoryFilter !== "all" ||
    accessFilter !== "all" ||
    slotFilter !== "all";

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
            value={accessFilter}
            onChange={(event) => setAccessFilter(event.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="all">Semua Akses</option>
            <option value="free">Gratis</option>
            <option value="premium">Premium</option>
          </select>
          {slotCounts.length > 1 ? (
            <select
              value={slotFilter}
              onChange={(event) => setSlotFilter(event.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="all">Semua Slot</option>
              {slotCounts.map((count) => (
                <option key={count} value={String(count)}>
                  {count} Slot
                </option>
              ))}
            </select>
          ) : null}
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
                <th className="px-4 py-3">Akses</th>
                <th className="px-4 py-3">Paket</th>
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
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        frame.access_type === "premium"
                          ? "bg-[#FEF3E2] text-[#BF3131]"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {frame.access_type === "premium" ? "Premium" : "Gratis"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {packsByFrame.get(frame.id)?.length ? (
                      <div className="flex max-w-48 flex-wrap gap-1">
                        {packsByFrame.get(frame.id)?.map((pack) => (
                          <span
                            key={pack.pack_id}
                            className="inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700"
                            title={`Masuk paket ${pack.pack_name}`}
                          >
                            {pack.pack_name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-[#FEF3E2] px-2.5 py-1 text-xs font-semibold text-[#BF3131]">
                      {frame.slots.length} Slot
                    </span>
                  </td>
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
