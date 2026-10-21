"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import {
  approveTransactionAction,
  rejectTransactionAction,
} from "@/app/admin/(panel)/transactions/actions";
import { formatPremiumCode } from "@/lib/premium/types";
import {
  buildPremiumAccessMessage,
  buildWhatsappUrl,
} from "@/lib/whatsapp";

export function PremiumAccessHandoff({
  customerName,
  whatsappNumber,
  packName,
  code,
}: {
  customerName: string;
  whatsappNumber: string | null;
  packName: string | null;
  code: string;
}) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOrigin(window.location.origin);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const message = buildPremiumAccessMessage({
    customerName,
    packName: packName ?? "premium",
    code,
    origin: origin || "https://panoricam.com",
  });

  return (
    <div className="w-72 max-w-full space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-left">
      <div>
        <p className="text-xs font-semibold uppercase text-neutral-500">
          Kode Ruang Premium
        </p>
        <p className="mt-1 font-mono text-xl font-bold tracking-wider text-[#BF3131]">
          {formatPremiumCode(code)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          }}
          className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
        >
          {copied ? "Tersalin" : "Salin kode"}
        </button>
        {whatsappNumber ? (
          <a
            href={buildWhatsappUrl(whatsappNumber, message)}
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
          >
            Kirim via WhatsApp
          </a>
        ) : null}
      </div>
      <pre className="whitespace-pre-wrap rounded-md bg-white p-3 text-xs text-neutral-600">
        {message}
      </pre>
    </div>
  );
}

export function TransactionActions({
  id,
  customerName,
  whatsappNumber,
  packName,
  showHandoff = true,
  onDone,
}: {
  id: number;
  customerName: string;
  whatsappNumber: string | null;
  packName: string | null;
  showHandoff?: boolean;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);

  const run = (kind: "approve" | "reject") => {
    const confirmText =
      kind === "approve"
        ? "Setujui transaksi ini dan buat kode ruang?"
        : "Tolak transaksi ini? Tindakan ini tidak dapat dibatalkan.";
    if (!window.confirm(confirmText)) {
      return;
    }
    setMessage(null);
    setRoomCode(null);
    startTransition(async () => {
      const result =
        kind === "approve"
          ? await approveTransactionAction(id)
          : await rejectTransactionAction(id);
      setMessage(result.message);
      if (result.success) {
        router.refresh();
        if (kind === "reject") {
          onDone?.();
        } else if (result.roomCode) {
          setRoomCode(result.roomCode);
        }
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {roomCode ? null : (
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
      )}
      {message ? <span className="text-xs text-neutral-500">{message}</span> : null}
      {roomCode && showHandoff ? (
        <PremiumAccessHandoff
          customerName={customerName}
          whatsappNumber={whatsappNumber}
          packName={packName}
          code={roomCode}
        />
      ) : null}
    </div>
  );
}
