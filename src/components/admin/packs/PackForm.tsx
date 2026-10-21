"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import type { PackFormState } from "@/app/admin/(panel)/packs/actions";
import type { Pack } from "@/lib/premium/types";
import { getFramePublicUrl } from "@/lib/frames/url";

export type PackFrameOption = {
  id: number;
  name: string;
  slug: string;
  image_path: string | null;
  access_type: "free" | "premium";
};

const INITIAL_STATE: PackFormState = { status: "idle" };

export function PackForm({
  mode,
  frames,
  action,
  pack,
  onSuccess,
}: {
  mode: "create" | "edit";
  frames: PackFrameOption[];
  action: (state: PackFormState, formData: FormData) => Promise<PackFormState>;
  pack?: Pack;
  onSuccess?: () => void;
}) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    if (state.status === "success") {
      onSuccessRef.current?.();
    }
  }, [state]);

  const [name, setName] = useState(pack?.name ?? "");
  const [slug, setSlug] = useState(pack?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [description, setDescription] = useState(pack?.description ?? "");
  const [price, setPrice] = useState(String(pack?.price ?? 25000));
  const [durationDays, setDurationDays] = useState(
    String(pack?.duration_days ?? 1),
  );
  const [sortOrder, setSortOrder] = useState(String(pack?.sort_order ?? 0));
  const [isActive, setIsActive] = useState(pack?.is_active ?? true);
  const [selectedIds, setSelectedIds] = useState<number[]>(
    pack?.frames.map((frame) => frame.id) ?? [],
  );
  const [search, setSearch] = useState("");

  const premiumFrames = useMemo(
    () => frames.filter((frame) => frame.access_type === "premium"),
    [frames],
  );

  const filteredFrames = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return premiumFrames;
    return premiumFrames.filter(
      (frame) =>
        frame.name.toLowerCase().includes(term) ||
        frame.slug.toLowerCase().includes(term),
    );
  }, [premiumFrames, search]);

  function toggleFrame(id: number) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.status === "error" && state.message ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {state.message}
        </p>
      ) : null}

      <div className="rounded-xl border border-[#BF3131]/25 bg-[#FEF3E2] px-4 py-3 text-sm text-[#5B3A32]">
        <p className="font-semibold text-[#2A0A0A]">
          Satu paket, satu kode, semua frame terbuka.
        </p>
        <p className="mt-1 text-xs leading-relaxed">
          Pilih beberapa frame premium di bawah. Pembeli membayar harga paket
          satu kali, lalu kode yang sama membuka seluruh frame terpilih selama
          masa aktif.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Nama Paket</span>
          <input
            name="name"
            value={name}
            onChange={(event) => {
              const value = event.target.value;
              setName(value);
              if (!slugTouched && mode === "create") {
                setSlug(
                  value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, ""),
                );
              }
            }}
            required
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Slug</span>
          <input
            name="slug"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            placeholder="otomatis dari nama"
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Harga (Rp)</span>
          <input
            name="price"
            type="number"
            min={0}
            step={1000}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            required
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
          <span className="text-xs text-neutral-500">
            Harga total paket, bukan harga per frame.
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Masa Aktif (hari)</span>
          <input
            name="duration_days"
            type="number"
            min={1}
            value={durationDays}
            onChange={(event) => setDurationDays(event.target.value)}
            required
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
          <span className="text-xs text-neutral-500">
            Dihitung saat kode pertama kali dipakai.
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Urutan Tampil</span>
          <input
            name="sort_order"
            type="number"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="flex items-center gap-3 self-end rounded-lg border border-neutral-200 px-3 py-2 text-sm">
          <input
            name="is_active"
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="h-4 w-4 accent-[#BF3131]"
          />
          <span className="font-medium text-neutral-700">Aktif dijual</span>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700">Deskripsi</span>
        <textarea
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          className="rounded-lg border border-neutral-300 px-3 py-2"
          placeholder="Ceritakan isi dan suasana paket ini."
        />
      </label>

      <div className="rounded-xl border border-neutral-200 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold text-neutral-800">
              Isi Paket (Frame Premium)
            </h2>
            <p className="text-xs text-neutral-500">
              Semua frame yang dicentang akan terbuka dengan satu kode yang
              sama.
            </p>
          </div>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari frame..."
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        {premiumFrames.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-neutral-300 px-4 py-6 text-sm text-neutral-500">
            <p>Belum ada frame premium.</p>
            <Link
              href="/admin/frames"
              className="mt-2 inline-block font-medium text-[#BF3131] underline"
            >
              Buka Kelola Frame untuk mengubah tipe akses
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid max-h-96 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {filteredFrames.map((frame) => {
              const checked = selectedIds.includes(frame.id);
              return (
                <label
                  key={frame.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-2 transition ${
                    checked
                      ? "border-[#BF3131] bg-[#FEF3E2]"
                      : "border-neutral-200 bg-white hover:border-neutral-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="frame_ids"
                    value={frame.id}
                    checked={checked}
                    onChange={() => toggleFrame(frame.id)}
                    className="h-4 w-4 accent-[#BF3131]"
                  />
                  {frame.image_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getFramePublicUrl(frame.image_path)}
                      alt=""
                      className="h-12 w-9 rounded border border-neutral-200 bg-neutral-100 object-contain"
                    />
                  ) : null}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-neutral-800">
                      {frame.name}
                    </span>
                    <span className="block truncate text-xs text-neutral-400">
                      {frame.slug}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}

        <p className="mt-3 text-xs text-neutral-500">
          {selectedIds.length > 0
            ? `${selectedIds.length} frame akan terbuka dengan 1 kode.`
            : "Pilih minimal satu frame premium."}
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending || selectedIds.length === 0}
        className="rounded-lg bg-[#BF3131] px-5 py-2 font-medium text-white hover:bg-[#a52929] disabled:opacity-60"
      >
        {isPending
          ? "Menyimpan..."
          : mode === "create"
            ? `Simpan Paket${selectedIds.length > 0 ? ` · ${selectedIds.length} frame` : ""}`
            : `Perbarui Paket${selectedIds.length > 0 ? ` · ${selectedIds.length} frame` : ""}`}
      </button>
    </form>
  );
}
