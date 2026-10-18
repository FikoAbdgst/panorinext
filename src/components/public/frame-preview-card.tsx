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
      <div
        className="frame-card group relative"
        data-frame-id={frame.id}
        data-aos="fade-up"
        data-aos-delay={index * 100}
      >
        <div className={`badge ${isFree ? "badge-free" : "badge-premium"}`}>
          {isFree ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              GRATIS
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              {formatPrice(frame.price)} IDR
            </>
          )}
        </div>

        <div className="frame-image-container">
          <div className="absolute inset-0 flex items-center justify-center p-4 transition-transform duration-500 group-hover:scale-105">
            {imageUrl ? (
              <img src={imageUrl} alt={frame.name} className="frame-image" />
            ) : (
              <div className="text-gray-400 text-5xl">🖼️</div>
            )}
          </div>

          <div className="frame-overlay">
            <button
              type="button"
              className="preview-button cursor-pointer"
              onClick={() => setIsPreviewOpen(true)}
            >
              Preview
            </button>
          </div>
        </div>

        <div className="card-content">
          <div className="flex justify-between items-start">
            <h3 className="frame-title">{frame.name}</h3>
            <div className="category">
              <span>{frame.categoryIcon}</span>
              <span>{frame.categoryName}</span>
            </div>
          </div>
          <div className="border-t border-gray-100 mt-2" />
          <div className="frame-details absolute top-1 bg-red-600 py-2 px-3 rounded-xl">
            <div className="usage-count text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="white"
                viewBox="0 0 576 512"
              >
                <path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z" />
              </svg>
              <p className="text-white"> {frame.used}</p>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/20 to-amber-500/20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300" />
      </div>

      {isPreviewOpen ? (
        <FramePreviewModal frame={previewFrame} onClose={handleClose} />
      ) : null}
    </>
  );
}
