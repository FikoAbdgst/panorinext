"use client";

import { useActionState, useEffect, useRef } from "react";

import type { CategoryFormState } from "@/app/admin/(panel)/categories/actions";

type CategoryFormCategory = {
  id: number;
  name: string;
};

type CategoryFormProps = {
  mode: "create" | "edit";
  action: (state: CategoryFormState, formData: FormData) => Promise<CategoryFormState>;
  category?: CategoryFormCategory;
  onSuccess?: () => void;
};

const INITIAL_STATE: CategoryFormState = { status: "idle" };

export function CategoryForm({ mode, action, category, onSuccess }: CategoryFormProps) {
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

  return (
    <form action={formAction} className="space-y-5">
      {state.status === "error" && state.message ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {state.message}
        </p>
      ) : null}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700">Nama Kategori</span>
        <input
          name="name"
          defaultValue={category?.name ?? ""}
          required
          maxLength={255}
          className="rounded-lg border border-neutral-300 px-3 py-2"
          placeholder="mis. Aesthetic"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-[#BF3131] px-5 py-2 font-medium text-white hover:bg-[#a52929] disabled:opacity-60"
      >
        {isPending
          ? "Menyimpan..."
          : mode === "create"
            ? "Simpan Kategori"
            : "Perbarui Kategori"}
      </button>
    </form>
  );
}
