"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useMemo, useState } from "react";

import { deleteFlipbookFrameAction } from "@/app/admin/(panel)/flipbook/actions";
import {
  isFlipbookFrameComplete,
  type FlipbookFrame,
} from "@/lib/flipbook/types";

import { FlipbookCreateModal } from "./FlipbookCreateModal";

function countAssets(frame: FlipbookFrame): number {
  return (
    (frame.cover ? 1 : 0) +
    frame.pages.filter(Boolean).length +
    (frame.back ? 1 : 0)
  );
}

function RemoveFlipbookFrameButton({
  id,
  name,
}: {
  id: number;
  name: string;
}) {
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    if (
      !window.confirm(
        `Hapus tipe frame "${name}" beserta 12 overlay-nya? Tindakan ini tidak dapat dibatalkan.`,
      )
    ) {
      return;
    }
    const formData = new FormData();
    formData.set("id", String(id));
    setIsPending(true);
    try {
      const result = await deleteFlipbookFrameAction(formData);
      if (!result.success) {
        window.alert(result.message);
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={isPending}
      className="text-sm font-medium text-[#BF3131] underline disabled:opacity-50"
    >
      {isPending ? "Menghapus..." : "Hapus"}
    </button>
  );
}

export function FlipbookAdminList({ frames }: { frames: FlipbookFrame[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return frames;
    }
    return frames.filter(
      (frame) =>
        frame.name.toLowerCase().includes(term) ||
        frame.slug.toLowerCase().includes(term),
    );
  }, [frames, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari tipe frame..."
          className="w-full max-w-xs rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <FlipbookCreateModal />
      </div>

      {filtered.length === 0 ? (
        <p className="admin-empty">
          {frames.length === 0
            ? "Belum ada tipe frame flipbook. Tambahkan tipe frame pertama Anda."
            : "Tidak ada tipe frame yang cocok dengan pencarian."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th className="px-4 py-3">Sampul</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Overlay</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((frame) => {
                const count = countAssets(frame);
                const complete = isFlipbookFrameComplete(frame);
                return (
                  <tr key={frame.id} className="align-middle">
                    <td className="px-4 py-3">
                      {frame.cover ? (
                        <img
                          src={frame.cover.imageUrl}
                          alt={frame.name}
                          className="h-16 w-24 rounded border border-neutral-200 bg-neutral-100 object-contain"
                        />
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-800">
                        {frame.name}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {frame.slug}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                          count === 12
                            ? "bg-[#FEF3E2] text-[#BF3131]"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {count} / 12 overlay
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {complete ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Siap dipakai
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
                          Belum lengkap
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-4">
                        <Link
                          href={`/admin/flipbook/${frame.id}/edit`}
                          className="text-sm font-medium text-[#BF3131] underline"
                        >
                          Edit
                        </Link>
                        <RemoveFlipbookFrameButton
                          id={frame.id}
                          name={frame.name}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-neutral-500">
        Menampilkan {filtered.length} dari {frames.length} tipe frame. User hanya
        melihat tipe frame aktif yang 12 overlay-nya lengkap.
      </p>
    </div>
  );
}
