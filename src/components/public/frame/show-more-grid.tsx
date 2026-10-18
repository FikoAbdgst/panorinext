"use client";

import AOS from "aos";
import { useEffect, useState } from "react";

import type { CatalogFrame } from "@/lib/frames/types";

import { CatalogFrameCard } from "./catalog-frame-card";

const INITIAL_VISIBLE = 8;

export function ShowMoreGrid({ frames }: { frames: CatalogFrame[] }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = frames.length > INITIAL_VISIBLE;

  useEffect(() => {
    if (hasMore) {
      AOS.refresh();
    }
  }, [expanded, hasMore]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {frames.map((frame, index) => {
          const hidden = hasMore && index >= INITIAL_VISIBLE;
          const extra = hidden ? `hidden-frames${expanded ? " show" : ""}` : "";
          return <CatalogFrameCard key={frame.id} frame={frame} index={index} className={extra} />;
        })}
      </div>

      {hasMore ? (
        <div className="mt-8 text-center">
          <button
            id="showMoreBtn"
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="px-6 py-3 bg-gradient-to-r from-[#BF3131] to-[#F16767] text-white rounded-full font-medium hover:from-[#F16767] hover:to-[#BF3131] transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center mx-auto"
          >
            <span>{expanded ? "Show Less" : "Show More"}</span>
            <svg
              id="showMoreIcon"
              className={`w-5 h-5 ml-2 transform transition-transform duration-300 ${
                expanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      ) : null}
    </>
  );
}
