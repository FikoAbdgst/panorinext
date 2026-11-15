/* eslint-disable @next/next/no-img-element */

import { AspectFit } from "@/components/public/flipbook/aspect-fit";
import type { FlipbookAsset } from "@/lib/flipbook/types";
import { getSlotTransform } from "@/lib/frames/rotation";

/**
 * Foto dengan overlay frame di atasnya. Dipakai di halaman flipbook, viewer,
 * dan thumbnail supaya semua pratinjau menampilkan frame yang sama.
 */
export function FramedPhoto({
  photo,
  asset,
}: {
  photo: string;
  asset: FlipbookAsset;
}) {
  const width = asset.width > 0 ? asset.width : 4;
  const height = asset.height > 0 ? asset.height : 5;

  return (
    <div className="h-full w-full bg-[#FEF3E2]">
      <AspectFit ratio={width / height} boxClassName="bg-[#FFFBF3]">
        {asset.slots.length > 0 ? (
          asset.slots.map((slot, index) => (
            <span
              key={`${asset.id}-slot-${index}`}
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
                src={photo}
                alt=""
                draggable={false}
                className="h-full w-full object-cover"
              />
            </span>
          ))
        ) : (
          <img
            src={photo}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <img
          src={asset.imageUrl}
          alt=""
          draggable={false}
          className="absolute inset-0 z-10 h-full w-full object-cover"
        />
      </AspectFit>
    </div>
  );
}
