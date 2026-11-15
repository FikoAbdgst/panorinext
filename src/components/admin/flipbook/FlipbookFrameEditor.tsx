"use client";

import { updateFlipbookFrameAction } from "@/app/admin/(panel)/flipbook/actions";
import { FLIPBOOK_FRAME_SIZE_LABEL } from "@/lib/flipbook/constants";
import {
  isFlipbookFrameComplete,
  type FlipbookFrame,
} from "@/lib/flipbook/types";

import { FlipbookAssetCard } from "./FlipbookAssetCard";
import { FlipbookFrameForm } from "./FlipbookFrameForm";

export function FlipbookFrameEditor({ frame }: { frame: FlipbookFrame }) {
  const totalAssets =
    (frame.cover ? 1 : 0) +
    frame.pages.filter(Boolean).length +
    (frame.back ? 1 : 0);
  const complete = isFlipbookFrameComplete(frame);

  return (
    <div className="space-y-6">
      <div className="admin-card p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-neutral-800">
              Pengaturan tipe frame
            </h2>
            <p className="text-xs text-neutral-500">
              Nama, slug, urutan, dan status tampil di pemilih frame user.
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              complete
                ? "bg-green-100 text-green-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {totalAssets} / 12 overlay · {complete ? "siap" : "belum lengkap"}
          </span>
        </div>

        <FlipbookFrameForm
          mode="edit"
          frame={{
            id: frame.id,
            name: frame.name,
            slug: frame.slug,
            is_active: frame.isActive,
            sort_order: frame.sortOrder,
          }}
          action={updateFlipbookFrameAction.bind(null, frame.id)}
        />
      </div>

      <div>
        <div className="mb-3">
          <h2 className="text-base font-bold text-neutral-800">12 Overlay PNG</h2>
          <p className="text-xs text-neutral-500">
            Unggah 1 sampul, 10 halaman, dan 1 penutup. Gunakan kanvas{" "}
            {FLIPBOOK_FRAME_SIZE_LABEL} agar frame pas dengan kamera. Setelah
            PNG dipilih, editor terbuka: hapus area putih dengan Magic Wand agar
            area itu menjadi slot foto transparan.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <FlipbookAssetCard
            key={`cover-${frame.cover?.id ?? "empty"}`}
            frameId={frame.id}
            kind="cover"
            pageIndex={0}
            asset={frame.cover}
          />
          {frame.pages.map((asset, index) => (
            <FlipbookAssetCard
              key={`page-${index + 1}-${asset?.id ?? "empty"}`}
              frameId={frame.id}
              kind="page"
              pageIndex={index + 1}
              asset={asset}
            />
          ))}
          <FlipbookAssetCard
            key={`back-${frame.back?.id ?? "empty"}`}
            frameId={frame.id}
            kind="back"
            pageIndex={0}
            asset={frame.back}
          />
        </div>
      </div>
    </div>
  );
}
