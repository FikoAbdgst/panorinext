"use client";

import { useTransition } from "react";

import { deleteFrameAction } from "@/app/admin/(panel)/frames/actions";

export function RemoveFrameButton({ id, name }: { id: number; name: string }) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (!window.confirm(`Hapus frame "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    const formData = new FormData();
    formData.set("id", String(id));
    startTransition(() => {
      deleteFrameAction(formData);
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
