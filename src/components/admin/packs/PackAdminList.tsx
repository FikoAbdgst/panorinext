"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { Pack } from "@/lib/premium/types";
import { getFramePublicUrl } from "@/lib/frames/url";

import { PackCreateModal } from "./PackCreateModal";
import type { PackFrameOption } from "./PackForm";
import { RemovePackButton } from "./RemovePackButton";

function formatRupiah(value: number) {
  return `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
}

export function PackAdminList({
  packs,
  frames,
}: {
  packs: Pack[];
  frames: PackFrameOption[];
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return packs;
    return packs.filter(
      (pack) =>
        pack.name.toLowerCase().includes(term) ||
        pack.slug.toLowerCase().includes(term),
    );
  }, [packs, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari paket..."
          className="w-full max-w-xs rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <PackCreateModal frames={frames} />
      </div>

      {frames.length === 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Belum ada frame premium.{" "}
          <Link href="/admin/frames" className="font-medium underline">
            Ubah tipe akses frame
          </Link>{" "}
          terlebih dahulu sebelum membuat paket.
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-500">
          {packs.length === 0
            ? "Belum ada paket. Buat paket pertama Anda."
            : "Tidak ada paket yang cocok."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Preview</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Harga</th>
                <th className="px-4 py-3">Masa Aktif</th>
                <th className="px-4 py-3">Frame</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((pack) => (
                <tr key={pack.id} className="align-middle">
                  <td className="px-4 py-3">
                    <div className="flex -space-x-2">
                      {pack.frames.slice(0, 3).map((frame) =>
                        frame.image_path ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={frame.id}
                            src={getFramePublicUrl(frame.image_path)}
                            alt=""
                            className="h-12 w-9 rounded border border-white bg-neutral-100 object-contain shadow-sm"
                          />
                        ) : null,
                      )}
                      {pack.frames.length === 0 ? (
                        <span className="text-neutral-400">—</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-800">{pack.name}</div>
                    <div className="text-xs text-neutral-400">{pack.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {formatRupiah(pack.price)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {pack.duration_days} hari
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    <div>{pack.frames.length} frame · 1 kode</div>
                    {pack.frames.length > 0 ? (
                      <div
                        className="max-w-48 truncate text-xs text-neutral-400"
                        title={pack.frames.map((frame) => frame.name).join(", ")}
                      >
                        {pack.frames.map((frame) => frame.name).join(", ")}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        pack.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {pack.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-start justify-end gap-4">
                      <Link
                        href={`/admin/packs/${pack.id}/edit`}
                        className="text-sm font-medium text-[#BF3131] underline"
                      >
                        Edit
                      </Link>
                      <RemovePackButton id={pack.id} name={pack.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-neutral-500">
        Menampilkan {filtered.length} dari {packs.length} paket.
      </p>
    </div>
  );
}
