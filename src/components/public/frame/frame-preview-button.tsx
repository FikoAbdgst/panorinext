"use client";

import { useCallback, useState } from "react";

import {
  FramePreviewModal,
  type PreviewFrame,
} from "@/components/public/frame-preview-modal";
import type { CatalogFrame } from "@/lib/frames/types";
import { getFramePublicUrl } from "@/lib/frames/url";

/**
 * Tombol "Preview" pada kartu katalog /frame.
 * Membuka modal preview kamera (bukan /booth) — sama seperti `preview-button`
 * pada frame.blade.php.
 */
export function FramePreviewButton({ frame }: { frame: CatalogFrame }) {
  const [isOpen, setIsOpen] = useState(false);
  const handleClose = useCallback(() => setIsOpen(false), []);

  const previewFrame: PreviewFrame = {
    id: frame.id,
    name: frame.name,
    imageUrl: frame.image_path ? getFramePublicUrl(frame.image_path) : null,
    width: frame.width,
    height: frame.height,
    slots: frame.slots,
    isFree: frame.price <= 0,
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-5 py-2.5 bg-white/95 cursor-pointer text-gray-800 rounded-full font-medium hover:bg-red-50 transition-colors duration-300 transform hover:scale-105 preview-button shadow-md flex items-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path
            fillRule="evenodd"
            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
            clipRule="evenodd"
          />
        </svg>
        Preview
      </button>

      {isOpen ? (
        <FramePreviewModal
          frame={previewFrame}
          onClose={handleClose}
          showAlert={false}
        />
      ) : null}
    </>
  );
}
