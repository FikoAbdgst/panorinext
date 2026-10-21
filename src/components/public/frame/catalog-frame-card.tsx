import Link from "next/link";

import type { CatalogFrame } from "@/lib/frames/types";
import { getFramePublicUrl } from "@/lib/frames/url";

import { FramePreviewButton } from "./frame-preview-button";

const SAMPLE_PHOTOS = [
  "/images/m1.jpeg",
  "/images/k2.jpeg",
  "/images/m3.jpeg",
  "/images/k1.jpeg",
  "/images/m2.jpeg",
  "/images/k3.jpeg",
] as const;

export function CatalogFrameCard({
  frame,
  index,
  className = "",
}: {
  frame: CatalogFrame;
  index: number;
  className?: string;
}) {
  const imageUrl = frame.image_path ? getFramePublicUrl(frame.image_path) : null;
  const frameWidth = frame.width > 0 ? frame.width : 4;
  const frameHeight = frame.height > 0 ? frame.height : 5;
  const isPortrait = frameHeight >= frameWidth;

  return (
    <article
      className={`group relative ${className}`}
      data-frame-id={frame.id}
      data-aos="lab-develop"
      suppressHydrationWarning
      data-aos-duration="1000"
      data-aos-delay={(index % 3) * 90}
    >
      <FramePreviewButton
        frame={frame}
        className="relative block w-full overflow-hidden border border-[#BF3131]/20 bg-[#F6E6D8] text-left transition duration-300 hover:border-[#BF3131]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"
      >
        <span className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden p-4 sm:p-5">
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={SAMPLE_PHOTOS[slotIndex % SAMPLE_PHOTOS.length]}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </span>
              ))}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={frame.name}
                loading="lazy"
                className="absolute inset-0 z-10 h-full w-full object-contain transition duration-500 group-hover:scale-[1.02]"
              />
            </span>
          ) : (
            <span className="relative z-10 border border-dashed border-[#BF3131]/35 bg-[#FFFBF3]/80 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#BF3131]">
              Tanpa gambar
            </span>
          )}
        </span>

        <span className="pointer-events-none absolute bottom-3 left-3 z-20 bg-[#2A0A0A]/80 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#FEF3E2]">
          Preview
        </span>
      </FramePreviewButton>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold leading-tight text-[#2A0A0A] transition-colors group-hover:text-[#BF3131]">
            {frame.name}
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-[#7A5A50]">
            {frame.slots.length} slot
            {frame.category_name ? ` · ${frame.category_name}` : ""}
          </p>
        </div>
        <span className="shrink-0 pt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#BF3131]">
          Gratis
        </span>
      </div>

      <div className="mt-3">
        <Link
          href={`/booth?frame_id=${frame.id}`}
          className="inline-flex min-h-11 w-full items-center justify-between gap-3 border border-[#BF3131] px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#BF3131] transition hover:bg-[#BF3131] hover:text-[#FEF3E2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"
        >
          Pakai frame ini
          <span aria-hidden="true" className="h-px w-5 bg-current" />
        </Link>
      </div>
    </article>
  );
}
