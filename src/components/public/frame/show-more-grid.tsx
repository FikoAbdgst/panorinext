"use client";

import AOS from "aos";
import { useEffect, useState } from "react";

import type { CatalogFrame } from "@/lib/frames/types";

import { CatalogFrameCard } from "./catalog-frame-card";

const INITIAL_VISIBLE = 9;

export function ShowMoreGrid({ frames }: { frames: CatalogFrame[] }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = frames.length > INITIAL_VISIBLE;
  const remaining = Math.max(frames.length - INITIAL_VISIBLE, 0);

  useEffect(() => {
    AOS.refreshHard();
  }, [expanded, frames]);

  return (
    <>
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {frames.map((frame, index) => {
          const hidden = hasMore && index >= INITIAL_VISIBLE;
          const extra = hidden ? `hidden-frames${expanded ? " show" : ""}` : "";
          return <CatalogFrameCard key={frame.id} frame={frame} index={index} className={extra} />;
        })}
      </div>

      {hasMore ? (
        <div className="mt-10 border-t border-[#BF3131]/25 pt-6 text-center">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="group inline-flex min-h-11 items-center gap-3 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#BF3131] transition hover:text-[#2A0A0A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"
          >
            <span>
              {expanded ? "Tampilkan lebih sedikit" : `Tampilkan ${remaining} frame lagi`}
            </span>
            <span
              aria-hidden="true"
              className="h-px w-7 bg-[#BF3131] transition-all duration-300 group-hover:w-11 group-hover:bg-[#2A0A0A]"
            />
          </button>
        </div>
      ) : null}
    </>
  );
}
