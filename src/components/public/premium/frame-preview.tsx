import type { PackFrame } from "@/lib/premium/types";
import { getFramePublicUrl } from "@/lib/frames/url";

const SAMPLE_PHOTOS = [
  "/images/m1.jpeg",
  "/images/k2.jpeg",
  "/images/m3.jpeg",
  "/images/k1.jpeg",
  "/images/m2.jpeg",
  "/images/k3.jpeg",
] as const;

export function PremiumFramePreview({
  frame,
  className = "",
  watermark = true,
}: {
  frame: PackFrame;
  className?: string;
  watermark?: boolean;
}) {
  const imageUrl = frame.image_path ? getFramePublicUrl(frame.image_path) : null;
  const frameWidth = frame.width > 0 ? frame.width : 4;
  const frameHeight = frame.height > 0 ? frame.height : 5;
  const isPortrait = frameHeight >= frameWidth;

  return (
    <div
      className={`relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden border border-[#BF3131]/15 bg-[#F6E6D8] p-3 ${className}`}
    >
      {imageUrl ? (
        <div
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
            className="absolute inset-0 z-10 h-full w-full object-contain"
          />
        </div>
      ) : (
        <span className="border border-dashed border-[#BF3131]/35 bg-[#FFFBF3]/80 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#BF3131]">
          Tanpa gambar
        </span>
      )}

      {watermark ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden"
        >
          <span className="-rotate-12 border-y border-[#FEF3E2]/40 bg-[#2A0A0A]/25 px-5 py-1 text-[10px] font-extrabold uppercase tracking-[0.4em] text-[#FEF3E2]/90 backdrop-blur-[1px]">
            Preview
          </span>
        </span>
      ) : null}
    </div>
  );
}
