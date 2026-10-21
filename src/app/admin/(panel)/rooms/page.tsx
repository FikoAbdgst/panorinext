import { Suspense } from "react";

import { RoomAdminList } from "@/components/admin/rooms/RoomAdminList";
import { listPacks } from "@/lib/packs/queries";
import { listPremiumAccesses } from "@/lib/premium/queries";

export default function AdminRoomsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Ruang Premium</h1>
        <p className="text-sm text-neutral-500">
          Kelola kode akses, masa aktif, dan penonaktifan ruang.
        </p>
      </header>

      <Suspense fallback={<p className="text-sm text-neutral-500">Memuat ruang...</p>}>
        <RoomsContent />
      </Suspense>
    </main>
  );
}

async function RoomsContent() {
  const [rooms, packs] = await Promise.all([listPremiumAccesses(), listPacks()]);
  return (
    <RoomAdminList
      rooms={rooms}
      packs={packs.map((pack) => ({
        id: pack.id,
        name: pack.name,
        duration_days: pack.duration_days,
        is_active: pack.is_active,
      }))}
    />
  );
}
