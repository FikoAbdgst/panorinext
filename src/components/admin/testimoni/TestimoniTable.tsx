"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  bulkDeleteTestimoniAction,
  deleteTestimoniAction,
  setTestimoniFeaturedAction,
} from "@/app/admin/(panel)/testimoni/actions";
import { Modal } from "@/components/admin/Modal";

export type TestimoniRow = {
  id: number;
  rating: number;
  emoji: string | null;
  name: string | null;
  message: string | null;
  created_at: string;
  frame_name: string | null;
  photo_url: string | null;
  photo_consent: boolean;
  is_featured: boolean;
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-500">
      {"★".repeat(rating)}
      <span className="text-neutral-300">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function TestimoniTable({ rows }: { rows: TestimoniRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [viewMessage, setViewMessage] = useState<TestimoniRow | null>(null);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const allSelected = rows.length > 0 && selected.size === rows.length;
  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(rows.map((row) => row.id)));
  };

  const handleDelete = (id: number, name: string | null) => {
    if (!window.confirm(`Hapus testimoni dari ${name ?? "Anonymous"}?`)) {
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await deleteTestimoniAction(id);
      setMessage(result.message);
      if (result.success) {
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        router.refresh();
      }
    });
  };

  const handleToggleFeatured = (row: TestimoniRow) => {
    setMessage(null);
    startTransition(async () => {
      const result = await setTestimoniFeaturedAction(row.id, !row.is_featured);
      setMessage(result.message);
      if (result.success) {
        router.refresh();
      }
    });
  };

  const handleBulkDelete = () => {
    if (selected.size === 0) {
      return;
    }
    if (!window.confirm(`Hapus ${selected.size} testimoni terpilih?`)) {
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await bulkDeleteTestimoniAction(Array.from(selected));
      setMessage(result.message);
      if (result.success) {
        setSelected(new Set());
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleBulkDelete}
          disabled={isPending || selected.size === 0}
          className="rounded-lg bg-[#BF3131] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#a52929] disabled:opacity-50"
        >
          Hapus Terpilih ({selected.size})
        </button>
        {message ? <span className="text-sm text-neutral-600">{message}</span> : null}
      </div>

      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Pilih semua"
                />
              </th>
              <th className="px-4 py-3">Foto</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Pesan</th>
              <th className="px-4 py-3">Frame</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Landing</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="align-top">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggle(row.id)}
                    aria-label={`Pilih testimoni ${row.id}`}
                  />
                </td>
                <td className="px-4 py-3">
                  {row.photo_url ? (
                    <button
                      type="button"
                      onClick={() => setViewMessage(row)}
                      aria-label={`Lihat foto testimoni ${row.id}`}
                      className="block h-16 w-14 overflow-hidden border border-[#2A0A0A]/10 bg-[#F7EFE1]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={row.photo_url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ) : (
                    <span className="text-xs text-neutral-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div>
                    <Stars rating={row.rating} />
                  </div>
                  <div className="text-xs text-neutral-400">{row.emoji ?? ""}</div>
                </td>
                <td className="px-4 py-3 font-medium text-neutral-800">
                  {row.name ?? "Anonymous"}
                </td>
                <td className="max-w-xs px-4 py-3 text-neutral-600">
                  <div className="line-clamp-3">{row.message ?? "—"}</div>
                  {row.message && row.message.length > 80 ? (
                    <button
                      type="button"
                      onClick={() => setViewMessage(row)}
                      className="mt-1 text-xs font-medium text-[#BF3131] underline"
                    >
                      Lihat selengkapnya
                    </button>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-neutral-500">{row.frame_name ?? "—"}</td>
                <td className="px-4 py-3 text-neutral-500">{formatDate(row.created_at)}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleToggleFeatured(row)}
                    disabled={isPending}
                    className={
                      row.is_featured
                        ? "rounded-[3px] bg-[#2A0A0A] px-2.5 py-1 text-xs font-semibold text-[#FEF3E2] disabled:opacity-50"
                        : "rounded-[3px] border border-[#2A0A0A]/15 px-2.5 py-1 text-xs font-semibold text-[#2A0A0A] hover:bg-[#2A0A0A]/5 disabled:opacity-50"
                    }
                  >
                    {row.is_featured ? "Tampil" : "Tampilkan"}
                  </button>
                  {row.photo_consent ? null : (
                    <span className="mt-1 block text-[10px] text-neutral-400">
                      tanpa foto
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleDelete(row.id, row.name)}
                    disabled={isPending}
                    className="text-sm font-medium text-[#BF3131] underline disabled:opacity-50"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={viewMessage !== null}
        onClose={() => setViewMessage(null)}
        title="Pesan Testimoni"
        size="sm"
      >
        {viewMessage ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-neutral-800">
                {viewMessage.name ?? "Anonymous"}
              </span>
              <Stars rating={viewMessage.rating} />
            </div>
            {viewMessage.frame_name ? (
              <p className="text-xs text-neutral-500">Frame: {viewMessage.frame_name}</p>
            ) : null}
            {viewMessage.photo_url ? (
              <div className="border border-[#2A0A0A]/10 bg-[#FFFCF6] p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={viewMessage.photo_url}
                  alt={`Fotostrip ${viewMessage.name ?? "Anonymous"}`}
                  className="mx-auto max-h-[45vh] w-auto object-contain"
                />
              </div>
            ) : null}
            <p className="whitespace-pre-line text-sm text-neutral-700">
              {viewMessage.message ?? "—"}
            </p>
            <p className="text-xs text-neutral-500">
              {viewMessage.photo_consent
                ? "Pengguna mengizinkan fotonya tampil di landing page."
                : "Tanpa foto — hanya teks yang tampil di landing page."}
              {viewMessage.is_featured ? " Saat ini tampil." : ""}
            </p>
            <p className="text-xs text-neutral-400">{formatDate(viewMessage.created_at)}</p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
