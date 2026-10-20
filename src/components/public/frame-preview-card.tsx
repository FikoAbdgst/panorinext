"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useState } from "react";

import {
  FramePreviewModal,
  type PreviewFrame,
} from "@/components/public/frame-preview-modal";
import type { FrameSlot } from "@/lib/frames/types";
import { getFramePublicUrl } from "@/lib/frames/url";

export type FeaturedFrameCardData = {
  id: number;
  name: string;
  imagePath: string | null;
  price: number;
  used: number;
  categoryIcon: string | null;
  categoryName: string | null;
  width: number;
  height: number;
  slots: FrameSlot[];
};

const SAMPLE_PHOTOS = [
  "/images/m1.jpeg",
  "/images/k2.jpeg",
  "/images/m3.jpeg",
  "/images/k1.jpeg",
  "/images/m2.jpeg",
  "/images/k3.jpeg",
] as const;

function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID").format(price);
}

export function FeaturedFrameCard({
  frame,
  index,
}: {
  frame: FeaturedFrameCardData;
  index: number;
}) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const handleClose = useCallback(() => setIsPreviewOpen(false), []);

  const isFree = frame.price <= 0;
  const imageUrl = frame.imagePath ? getFramePublicUrl(frame.imagePath) : null;
  const frameWidth = frame.width > 0 ? frame.width : 4;
  const frameHeight = frame.height > 0 ? frame.height : 5;
  const isPortrait = frameHeight >= frameWidth;

  const previewFrame: PreviewFrame = {
    id: frame.id,
    name: frame.name,
    imageUrl,
    width: frame.width,
    height: frame.height,
    slots: frame.slots,
    isFree,
  };

  return (
    <>
      <article className="group relative">
        <div className="relative border border-[#BF3131]/25 bg-[#FFFBF3] p-3 shadow-[8px_8px_0_rgba(191,49,49,0.08)] transition duration-300 group-hover:-translate-y-1 group-hover:border-[#BF3131]/55 group-hover:shadow-[10px_10px_0_rgba(191,49,49,0.14)]">
          <div className="flex items-center justify-between border-b border-dashed border-[#BF3131]/25 pb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#BF3131]/70">
            <span>No. {String(index + 1).padStart(2, "0")}</span>
            <span>{frame.slots.length} slot</span>
            <span>{isFree ? "Gratis" : `Rp${formatPrice(frame.price)}`}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            aria-label={`Preview frame ${frame.name}`}
            suppressHydrationWarning
            data-aos="lab-frame"
            data-aos-duration="1100"
            data-aos-delay={240 + index * 120}
            className="relative mt-3 block w-full overflow-hidden bg-[#F3D8C8] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFBF3]"
          >
            <span aria-hidden="true" className="lab-dots absolute inset-0 opacity-70" />
            <span className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden p-4">
              {imageUrl ? (
                <span
                  className="relative block max-h-full max-w-full bg-[#FFFBF3]"
                  style={{
                    aspectRatio: `${frameWidth} / ${frameHeight}`,
                    ...(isPortrait ? { height: "100%" } : { width: "100%" }),
                  }}
                >
                  {frame.slots.map((slot, slotIndex) => (
                    <span
                      key={`${frame.id}-slot-${slotIndex}`}
                      className="absolute overflow-hidden"
                      style={{
                        left: `${(slot.x / frameWidth) * 100}%`,
                        top: `${(slot.y / frameHeight) * 100}%`,
                        width: `${(slot.w / frameWidth) * 100}%`,
                        height: `${(slot.h / frameHeight) * 100}%`,
                      }}
                    >
                      <img
                        src={SAMPLE_PHOTOS[slotIndex % SAMPLE_PHOTOS.length]}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </span>
                  ))}
                  <img
                    src={imageUrl}
                    alt={frame.name}
                    loading="lazy"
                    className="absolute inset-0 z-10 h-full w-full object-contain transition duration-500 group-hover:scale-[1.03]"
                  />
                </span>
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-5xl text-[#BF3131]/30">
                  +
                </span>
              )}
            </span>

            <span className="absolute inset-x-3 bottom-3 z-20 flex items-center justify-between gap-2">
              <span className="bg-[#BF3131] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.22em] text-[#FEF3E2] shadow-[3px_3px_0_rgba(122,28,28,0.7)]">
                Preview
              </span>
              <span className="border border-[#BF3131]/20 bg-[#FFFBF3]/90 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#BF3131]">
                #{frame.id}
              </span>
            </span>
          </button>

          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold leading-tight text-[#2A0A0A] transition-colors group-hover:text-[#BF3131]">
                {frame.name}
              </h3>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-[#7A5A50]">
                {frame.categoryIcon ? (
                  <span aria-hidden="true">{frame.categoryIcon}</span>
                ) : null}
                <span className="truncate">{frame.categoryName ?? "Frame"}</span>
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-[#BF3131]/55">
                {frame.used > 0 ? "Dipakai" : "Status"}
              </p>
              <p className="text-sm font-bold text-[#BF3131]">
                {frame.used > 0 ? `${frame.used}x` : "Baru"}
              </p>
            </div>
          </div>
        </div>
      </article>

      {isPreviewOpen ? (
        <FramePreviewModal frame={previewFrame} onClose={handleClose} />
      ) : null}
    </>
  );
}
