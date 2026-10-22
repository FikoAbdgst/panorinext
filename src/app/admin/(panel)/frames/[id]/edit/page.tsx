import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FrameForm } from "@/components/admin/frames/FrameForm";
import { AdminLoading } from "@/components/admin/ui";
import { getFrameById, listCategories } from "@/lib/frames/queries";

import { updateFrameAction } from "../../actions";

export default function EditFramePage(props: PageProps<"/admin/frames/[id]/edit">) {
  return (
    <>
      <AdminPageHeader
        title="Edit frame"
        description="Perbarui overlay, slot foto, dan status premium frame ini."
        backHref="/admin/frames"
        backLabel="Daftar frame"
      />

      <Suspense fallback={<AdminLoading label="Memuat form..." />}>
        <EditFrameContent params={props.params} />
      </Suspense>
    </>
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
