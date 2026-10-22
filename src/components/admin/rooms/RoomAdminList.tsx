"use client";

import { useMemo, useState } from "react";

import { updateRoomAction } from "@/app/admin/(panel)/rooms/actions";
import { Modal } from "@/components/admin/Modal";
import {
  formatPremiumCode,
  getPremiumAccessStatus,
  type PremiumAccessRow,
  type PremiumAccessStatus,
} from "@/lib/premium/types";
import { buildRoomMessage, buildWhatsappUrl } from "@/lib/whatsapp";

import { RemoveRoomButton } from "./RemoveRoomButton";
import { RoomCreateModal } from "./RoomCreateModal";
import { RoomForm, type RoomPackOption } from "./RoomForm";

const STATUS_BADGE: Record<PremiumAccessStatus, { label: string; className: string }> = {
  unused: { label: "Belum dipakai", className: "bg-amber-100 text-amber-800" },
  active: { label: "Aktif", className: "bg-green-100 text-green-800" },
  expired: { label: "Kedaluwarsa", className: "bg-neutral-200 text-neutral-700" },
  revoked: { label: "Nonaktif", className: "bg-red-100 text-red-700" },
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function RoomAdminList({
  rooms,
  packs,
}: {
  rooms: PremiumAccessRow[];
  packs: RoomPackOption[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PremiumAccessStatus>("all");
  const [editing, setEditing] = useState<PremiumAccessRow | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rooms.filter((room) => {
      const status = getPremiumAccessStatus(room);
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!term) return true;
      return (
        room.code.toLowerCase().includes(term) ||
        (room.customer_name ?? "").toLowerCase().includes(term) ||
        room.pack_name.toLowerCase().includes(term) ||
        (room.whatsapp_number ?? "").includes(term)
      );
    });
  }, [rooms, search, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari kode, nama, atau paket..."
            className="w-full max-w-xs rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "all" | PremiumAccessStatus)
            }
            className="admin-inline-control rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="all">Semua Status</option>
            <option value="unused">Belum dipakai</option>
            <option value="active">Aktif</option>
            <option value="expired">Kedaluwarsa</option>
            <option value="revoked">Nonaktif</option>
          </select>
        </div>
        <RoomCreateModal packs={packs} />
      </div>

      {filtered.length === 0 ? (
        <p className="admin-empty">
          {rooms.length === 0
            ? "Belum ada ruang premium."
            : "Tidak ada ruang yang cocok."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Paket</th>
                <th className="px-4 py-3">Pembeli</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Mulai</th>
                <th className="px-4 py-3">Berakhir</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((room) => {
                const status = getPremiumAccessStatus(room);
                const badge = STATUS_BADGE[status];
                return (
                  <tr key={room.id} className="align-top">
                    <td className="px-4 py-3 font-mono font-semibold text-neutral-800">
                      {formatPremiumCode(room.code)}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{room.pack_name}</td>
                    <td className="px-4 py-3 text-neutral-700">
                      <div>{room.customer_name ?? "—"}</div>
                      {room.whatsapp_number ? (
                        <a
                          href={buildWhatsappUrl(
                            room.whatsapp_number,
                            buildRoomMessage({
                              customerName: room.customer_name,
                              packName: room.pack_name,
                              code: room.code,
                            }),
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[#BF3131] underline"
                        >
                          {room.whatsapp_number}
                        </a>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {formatDate(room.first_used_at)}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {formatDate(room.expires_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-start justify-end gap-4">
                        <button
                          type="button"
                          onClick={() => setEditing(room)}
                          className="text-sm font-medium text-[#BF3131] underline"
                        >
                          Edit
                        </button>
                        <RemoveRoomButton
                          id={room.id}
                          code={formatPremiumCode(room.code)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-neutral-500">
        Menampilkan {filtered.length} dari {rooms.length} ruang.
      </p>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit Ruang Premium"
        size="md"
      >
        {editing ? (
          <RoomForm
            mode="edit"
            packs={packs}
            room={editing}
            action={updateRoomAction.bind(null, editing.id)}
            onSuccess={() => setEditing(null)}
          />
        ) : null}
      </Modal>
    </div>
  );
}
