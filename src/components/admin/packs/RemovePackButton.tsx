"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deletePackAction } from "@/app/admin/(panel)/packs/actions";

export function RemovePackButton({ id, name }: { id: number; name: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleDelete() {
    if (!window.confirm(`Hapus paket "${name}"?`)) return;
    startTransition(async () => {
      const result = await deletePackAction(id);
      setMessage(result.message);
      if (result.success) router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="text-sm font-medium text-red-600 underline disabled:opacity-50"
      >
        {isPending ? "Menghapus..." : "Hapus"}
      </button>
      {message ? (
        <span className="max-w-48 text-right text-xs text-neutral-500">
          {message}
        </span>
      ) : null}
    </div>
  );
}
