import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FlipbookFrameEditor } from "@/components/admin/flipbook/FlipbookFrameEditor";
import { AdminLoading } from "@/components/admin/ui";
import { getFlipbookFrameById } from "@/lib/flipbook/queries";

export default function EditFlipbookFramePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <>
      <AdminPageHeader
        title="Edit tipe frame flipbook"
        description="Unggah 1 sampul, 10 halaman, dan 1 penutup. Slot foto dideteksi otomatis dari area transparan PNG."
        backHref="/admin/flipbook"
        backLabel="Daftar tipe frame"
      />

      <Suspense fallback={<AdminLoading label="Memuat tipe frame..." />}>
        <EditFlipbookFrameContent params={params} />
      </Suspense>
    </>
  );
}

async function EditFlipbookFrameContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const frameId = Number(id);
  if (!Number.isInteger(frameId)) {
    notFound();
  }

  const frame = await getFlipbookFrameById(frameId);
  if (!frame) {
    notFound();
  }

  return <FlipbookFrameEditor frame={frame} />;
}
