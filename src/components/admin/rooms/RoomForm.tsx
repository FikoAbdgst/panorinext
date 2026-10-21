"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import type { RoomFormState } from "@/app/admin/(panel)/rooms/actions";
import type { PremiumAccessRow } from "@/lib/premium/types";

export type RoomPackOption = {
  id: number;
  name: string;
  duration_days: number;
  is_active: boolean;
};

const INITIAL_STATE: RoomFormState = { status: "idle" };

function toDatetimeLocal(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function RoomForm({
  mode,
  packs,
  action,
  room,
  onSuccess,
}: {
  mode: "create" | "edit";
  packs: RoomPackOption[];
  action: (state: RoomFormState, formData: FormData) => Promise<RoomFormState>;
  room?: PremiumAccessRow;
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

  const [packId, setPackId] = useState(
    String(room?.pack_id ?? packs[0]?.id ?? ""),
  );
  const [code, setCode] = useState(room?.code ?? "");
  const [customerName, setCustomerName] = useState(room?.customer_name ?? "");
  const [whatsappNumber, setWhatsappNumber] = useState(
    room?.whatsapp_number ?? "",
  );
  const [expiresAt, setExpiresAt] = useState(
    toDatetimeLocal(room?.expires_at ?? null),
  );
  const [revoked, setRevoked] = useState(Boolean(room?.revoked_at));

  const selectedPack = packs.find((pack) => String(pack.id) === packId);

  return (
    <form action={formAction} className="space-y-4">
      {state.status !== "idle" && state.message ? (
        <p
          className={`rounded-lg border px-4 py-2 text-sm ${
            state.status === "success"
              ? "border-green-300 bg-green-50 text-green-800"
              : "border-red-300 bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Paket</span>
          <select
            name="pack_id"
            value={packId}
            onChange={(event) => setPackId(event.target.value)}
            required
            className="rounded-lg border border-neutral-300 px-3 py-2"
          >
            {packs.map((pack) => (
              <option key={pack.id} value={pack.id}>
                {pack.name}
                {pack.is_active ? "" : " (nonaktif)"}
              </option>
            ))}
          </select>
          {selectedPack ? (
            <span className="text-xs text-neutral-500">
              Masa aktif {selectedPack.duration_days} hari mulai pemakaian
              pertama.
            </span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">
            Kode {mode === "create" ? "(opsional)" : ""}
          </span>
          <input
            name="code"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="Kosongkan untuk dibuat otomatis"
            maxLength={12}
            className="rounded-lg border border-neutral-300 px-3 py-2 font-mono"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Nama Pembeli</span>
          <input
            name="customer_name"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Nomor WhatsApp</span>
          <input
            name="whatsapp_number"
            value={whatsappNumber}
            onChange={(event) => setWhatsappNumber(event.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Berakhir Pada</span>
          <input
            name="expires_at"
            type="datetime-local"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
          <span className="text-xs text-neutral-500">
            Kosongkan untuk mengikuti durasi paket saat kode dipakai.
          </span>
        </label>

        {mode === "edit" ? (
          <label className="flex items-center gap-3 self-end rounded-lg border border-neutral-200 px-3 py-2 text-sm">
            <input
              name="revoked"
              type="checkbox"
              checked={revoked}
              onChange={(event) => setRevoked(event.target.checked)}
              className="h-4 w-4 accent-[#BF3131]"
            />
            <span className="font-medium text-neutral-700">
              Nonaktifkan paksa
            </span>
          </label>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isPending || packs.length === 0}
        className="rounded-lg bg-[#BF3131] px-5 py-2 font-medium text-white hover:bg-[#a52929] disabled:opacity-60"
      >
        {isPending
          ? "Menyimpan..."
          : mode === "create"
            ? "Buat Ruang"
            : "Simpan Perubahan"}
      </button>
    </form>
  );
}
