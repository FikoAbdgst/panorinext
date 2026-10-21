import { Suspense } from "react";

import type { PackFrameOption } from "@/components/admin/packs/PackForm";
import { PackAdminList } from "@/components/admin/packs/PackAdminList";
import { listPacks, listPremiumFrames } from "@/lib/packs/queries";

export default function AdminPacksPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Kelola Paket</h1>
        <p className="text-sm text-neutral-500">
          Satu paket berisi beberapa frame premium dan dibuka dengan satu kode.
        </p>
      </header>

      <Suspense fallback={<p className="text-sm text-neutral-500">Memuat paket...</p>}>
        <PackList />
      </Suspense>
    </main>
  );
}

async function PackList() {
  const [packs, frames] = await Promise.all([listPacks(), listPremiumFrames()]);
  return <PackAdminList packs={packs} frames={frames as PackFrameOption[]} />;
}
