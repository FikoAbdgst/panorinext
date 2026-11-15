/* eslint-disable @next/next/no-img-element */

import { AspectFit } from "@/components/public/flipbook/aspect-fit";
import type { FlipbookAsset, FlipbookFrame } from "@/lib/flipbook/types";
import { getSlotTransform } from "@/lib/frames/rotation";

const FRAME_SAMPLE_PHOTO = "/images/m1.jpeg";

/** Thumbnail overlay sampul frame flipbook dengan contoh foto di belakangnya. */
export function FramePickerThumb({ frame }: { frame: FlipbookFrame }) {
  const asset: FlipbookAsset | null = frame.cover ?? frame.pages[0] ?? null;

  if (!asset) {
    return (
      <span className="flex h-full w-full items-center justify-center text-[9px] font-bold uppercase tracking-[0.12em] text-[#BF3131]/55">
        Belum ada aset
      </span>
    );
  }

  const width = asset.width > 0 ? asset.width : 4;
  const height = asset.height > 0 ? asset.height : 5;

  return (
    <AspectFit ratio={width / height} boxClassName="bg-[#FFFBF3]">
      {asset.slots.length > 0 ? (
        asset.slots.map((slot, index) => (
          <span
            key={`${asset.id}-thumb-slot-${index}`}
            className="absolute overflow-hidden"
            style={{
              left: `${(slot.x / width) * 100}%`,
              top: `${(slot.y / height) * 100}%`,
              width: `${(slot.w / width) * 100}%`,
              height: `${(slot.h / height) * 100}%`,
              transform: getSlotTransform(slot),
              transformOrigin: "center",
            }}
          >
            <img
              src={FRAME_SAMPLE_PHOTO}
              alt=""
              draggable={false}
              className="h-full w-full object-cover"
            />
          </span>
        ))
      ) : (
        <img
          src={FRAME_SAMPLE_PHOTO}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <img
        src={asset.imageUrl}
        alt=""
        loading="lazy"
        draggable={false}
        className="absolute inset-0 z-10 h-full w-full object-cover"
      />
    </AspectFit>
  );
}
