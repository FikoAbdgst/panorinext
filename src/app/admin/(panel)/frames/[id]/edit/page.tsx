import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { FrameForm } from "@/components/admin/frames/FrameForm";
import { getFrameById, listCategories } from "@/lib/frames/queries";

import { updateFrameAction } from "../../actions";

export default function EditFramePage(props: PageProps<"/admin/frames/[id]/edit">) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <Link href="/admin/frames" className="text-sm text-neutral-500 underline">
          ← Kembali ke daftar frame
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-neutral-900">Edit Frame</h1>
      </div>

      <Suspense fallback={<p className="text-sm text-neutral-500">Memuat form...</p>}>
        <EditFrameContent params={props.params} />
      </Suspense>
    </main>
  );
}

async function EditFrameContent({
  params,
}: Pick<PageProps<"/admin/frames/[id]/edit">, "params">) {
  const { id } = await params;
  const frameId = Number(id);
  if (!Number.isInteger(frameId)) {
    notFound();
  }

  const [frame, categories] = await Promise.all([
    getFrameById(frameId),
    listCategories(),
  ]);
  if (!frame) {
    notFound();
  }

  return (
    <FrameForm
      mode="edit"
      categories={categories}
      frame={frame}
      action={updateFrameAction.bind(null, frameId)}
    />
  );
}
