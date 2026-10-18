import { Suspense } from "react";

import { FrameAdminList } from "@/components/admin/frames/FrameAdminList";
import { listCategories, listFrames } from "@/lib/frames/queries";

export default function AdminFramesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Kelola Frame</h1>
        <p className="text-sm text-neutral-500">
          Kelola overlay PNG dan slot foto setiap frame.
        </p>
      </header>

      <Suspense fallback={<p className="text-sm text-neutral-500">Memuat daftar frame...</p>}>
        <FrameList />
      </Suspense>
    </main>
  );
}

async function FrameList() {
  const [frames, categories] = await Promise.all([listFrames(), listCategories()]);
  return <FrameAdminList frames={frames} categories={categories} />;
}
