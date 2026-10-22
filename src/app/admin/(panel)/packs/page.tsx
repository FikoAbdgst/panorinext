import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { PackFrameOption } from "@/components/admin/packs/PackForm";
import { PackAdminList } from "@/components/admin/packs/PackAdminList";
import { AdminLoading } from "@/components/admin/ui";
import { listPacks, listPremiumFrames } from "@/lib/packs/queries";

export default function AdminPacksPage() {
  return (
    <>
      <AdminPageHeader
        title="Paket"
        description="Satu paket berisi beberapa frame premium dan dibuka dengan satu kode."
      />

      <Suspense fallback={<AdminLoading label="Memuat paket..." />}>
        <PackList />
      </Suspense>
    </>
  );
}

async function PackList() {
  const [packs, frames] = await Promise.all([listPacks(), listPremiumFrames()]);
  return <PackAdminList packs={packs} frames={frames as PackFrameOption[]} />;
}
