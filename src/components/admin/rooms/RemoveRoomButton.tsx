"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteRoomAction } from "@/app/admin/(panel)/rooms/actions";

export function RemoveRoomButton({ id, code }: { id: number; code: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleDelete() {
    if (!window.confirm(`Hapus ruang dengan kode ${code}?`)) return;
    startTransition(async () => {
      const result = await deleteRoomAction(id);
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
