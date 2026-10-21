import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import type { PackFrameOption } from "@/components/admin/packs/PackForm";
import { PackForm } from "@/components/admin/packs/PackForm";
import { getPackById, listPremiumFrames } from "@/lib/packs/queries";

import { updatePackAction } from "../../actions";

export default function EditPackPage(props: PageProps<"/admin/packs/[id]/edit">) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <Link href="/admin/packs" className="text-sm text-neutral-500 underline">
          ← Kembali ke daftar paket
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-neutral-900">Edit Paket</h1>
      </div>

      <Suspense fallback={<p className="text-sm text-neutral-500">Memuat form...</p>}>
        <EditPackContent params={props.params} />
      </Suspense>
    </main>
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
