import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { RoomAdminList } from "@/components/admin/rooms/RoomAdminList";
import { AdminLoading } from "@/components/admin/ui";
import { listPacks } from "@/lib/packs/queries";
import { listPremiumAccesses } from "@/lib/premium/queries";

export default function AdminRoomsPage() {
  return (
    <>
      <AdminPageHeader
        title="Ruang Premium"
        description="Kelola kode akses, masa aktif, dan penonaktifan ruang."
      />

      <Suspense fallback={<AdminLoading label="Memuat ruang..." />}>
        <RoomsContent />
      </Suspense>
    </>
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
