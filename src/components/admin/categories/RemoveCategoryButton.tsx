"use client";

import { useTransition } from "react";

import { deleteCategoryAction } from "@/app/admin/(panel)/categories/actions";

export function RemoveCategoryButton({ id, name }: { id: number; name: string }) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (
      !window.confirm(
        `Hapus kategori "${name}"? Frame yang memakainya akan menjadi tanpa kategori.`,
      )
    ) {
      return;
    }
    const formData = new FormData();
    formData.set("id", String(id));
    startTransition(() => {
      deleteCategoryAction(formData);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-sm font-medium text-[#BF3131] underline disabled:opacity-50"
    >
      {isPending ? "Menghapus..." : "Hapus"}
    </button>
  );
}
