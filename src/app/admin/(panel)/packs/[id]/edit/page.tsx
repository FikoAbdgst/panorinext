import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { PackFrameOption } from "@/components/admin/packs/PackForm";
import { PackForm } from "@/components/admin/packs/PackForm";
import { AdminLoading } from "@/components/admin/ui";
import { getPackById, listPremiumFrames } from "@/lib/packs/queries";

import { updatePackAction } from "../../actions";

export default function EditPackPage(props: PageProps<"/admin/packs/[id]/edit">) {
  return (
    <>
      <AdminPageHeader
        title="Edit paket"
        description="Perbarui harga, deskripsi, dan daftar frame premium paket ini."
        backHref="/admin/packs"
        backLabel="Daftar paket"
      />

      <Suspense fallback={<AdminLoading label="Memuat form..." />}>
        <EditPackContent params={props.params} />
      </Suspense>
    </>
  );
}

async function EditPackContent({
  params,
}: Pick<PageProps<"/admin/packs/[id]/edit">, "params">) {
  const { id } = await params;
  const packId = Number(id);
  if (!Number.isInteger(packId)) {
    notFound();
  }

  const [pack, frames] = await Promise.all([
    getPackById(packId),
    listPremiumFrames(),
  ]);
  if (!pack) {
    notFound();
  }

  return (
    <PackForm
      mode="edit"
      frames={frames as PackFrameOption[]}
      pack={pack}
      action={updatePackAction.bind(null, packId)}
    />
  );
}
