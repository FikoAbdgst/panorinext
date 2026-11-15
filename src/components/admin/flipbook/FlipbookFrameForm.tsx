"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import type { FlipbookFrameFormState } from "@/app/admin/(panel)/flipbook/actions";

export type FlipbookFrameFormFrame = {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
};

type FlipbookFrameFormProps = {
  mode: "create" | "edit";
  action: (
    state: FlipbookFrameFormState,
    formData: FormData,
  ) => Promise<FlipbookFrameFormState>;
  frame?: FlipbookFrameFormFrame;
  onSuccess?: () => void;
};

const INITIAL_STATE: FlipbookFrameFormState = { status: "idle" };

function slugifyClient(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function FlipbookFrameForm({
  mode,
  action,
  frame,
  onSuccess,
}: FlipbookFrameFormProps) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const onSuccessRef = useRef(onSuccess);
  const [name, setName] = useState(frame?.name ?? "");
  const [slug, setSlug] = useState(frame?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [isActive, setIsActive] = useState(frame?.is_active ?? true);
  const [sortOrder, setSortOrder] = useState(String(frame?.sort_order ?? 0));

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    if (state.status === "success") {
      onSuccessRef.current?.();
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      {state.status === "error" && state.message ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {state.message}
        </p>
      ) : null}
      {state.status === "success" && state.message ? (
        <p className="rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm text-green-700">
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Nama tipe frame</span>
          <input
            name="name"
            value={name}
            onChange={(event) => {
              const value = event.target.value;
              setName(value);
              if (!slugTouched && mode === "create") {
                setSlug(slugifyClient(value));
              }
            }}
            placeholder="Contoh: Vintage Album"
            required
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Slug (opsional)</span>
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
          <span className="font-medium text-neutral-700">Urutan tampil</span>
          <input
            name="sort_order"
            type="number"
            min={0}
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
          <span className="text-xs text-neutral-500">
            Angka kecil tampil lebih dulu di pemilih frame.
          </span>
        </label>

        <label className="flex items-start gap-2 text-sm sm:pt-7">
          <input
            name="is_active"
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            <span className="block font-medium text-neutral-700">
              Aktifkan tipe frame
            </span>
            <span className="block text-xs text-neutral-500">
              Tipe frame hanya muncul ke user jika aktif dan 12 overlay lengkap.
            </span>
          </span>
        </label>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#BF3131] px-5 py-2 font-medium text-white hover:bg-[#a52929] disabled:opacity-60"
        >
          {isPending
            ? "Menyimpan..."
            : mode === "create"
              ? "Buat tipe frame"
              : "Simpan perubahan"}
        </button>
      </div>
    </form>
  );
}
