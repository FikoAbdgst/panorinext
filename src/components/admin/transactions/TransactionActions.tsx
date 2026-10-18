"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  approveTransactionAction,
  rejectTransactionAction,
} from "@/app/admin/(panel)/transactions/actions";

export function TransactionActions({ id, onDone }: { id: number; onDone?: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const run = (kind: "approve" | "reject") => {
    const confirmText =
      kind === "approve"
        ? "Setujui transaksi ini?"
        : "Tolak transaksi ini? Tindakan ini tidak dapat dibatalkan.";
    if (!window.confirm(confirmText)) {
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const result =
        kind === "approve"
          ? await approveTransactionAction(id)
          : await rejectTransactionAction(id);
      setMessage(result.message);
      if (result.success) {
        router.refresh();
        onDone?.();
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => run("approve")}
          disabled={isPending}
          className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          Setujui
        </button>
        <button
          type="button"
          onClick={() => run("reject")}
          disabled={isPending}
          className="rounded-md bg-neutral-200 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-300 disabled:opacity-50"
        >
          Tolak
        </button>
      </div>
      {message ? <span className="text-xs text-neutral-500">{message}</span> : null}
    </div>
  );
}
