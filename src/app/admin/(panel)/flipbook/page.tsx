import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FlipbookAdminList } from "@/components/admin/flipbook/FlipbookAdminList";
import { AdminLoading } from "@/components/admin/ui";
import { listFlipbookFramesForAdmin } from "@/lib/flipbook/queries";

export default function AdminFlipbookPage() {
  return (
    <>
      <AdminPageHeader
        title="Flipbook"
        description="Kelola tipe frame flipbook. Setiap tipe berisi 12 overlay PNG: 1 sampul, 10 halaman, dan 1 penutup."
      />

      <Suspense fallback={<AdminLoading label="Memuat tipe frame flipbook..." />}>
        <FlipbookFrameList />
      </Suspense>
    </>
  );
}

async function FlipbookFrameList() {
  const frames = await listFlipbookFramesForAdmin();
  return <FlipbookAdminList frames={frames} />;
}
