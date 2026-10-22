import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FrameAdminList } from "@/components/admin/frames/FrameAdminList";
import { AdminLoading } from "@/components/admin/ui";
import { listCategories, listFrames } from "@/lib/frames/queries";
import { listFramePackMemberships } from "@/lib/packs/queries";

export default function AdminFramesPage() {
  return (
    <>
      <AdminPageHeader
        title="Frame"
        description="Kelola overlay PNG dan slot foto setiap frame. Frame premium bisa dimasukkan ke satu atau beberapa paket."
      />

      <Suspense fallback={<AdminLoading label="Memuat daftar frame..." />}>
        <FrameList />
      </Suspense>
    </>
  );
}

async function FrameList() {
  const [frames, categories, memberships] = await Promise.all([
    listFrames(),
    listCategories(),
    listFramePackMemberships(),
  ]);
  return (
    <FrameAdminList
      frames={frames}
      categories={categories}
      memberships={memberships}
    />
  );
}
