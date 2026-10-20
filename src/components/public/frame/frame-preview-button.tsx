"use client";

import type { ReactNode } from "react";
import { useCallback, useState } from "react";

import {
  FramePreviewModal,
  type PreviewFrame,
} from "@/components/public/frame-preview-modal";
import type { CatalogFrame } from "@/lib/frames/types";
import { getFramePublicUrl } from "@/lib/frames/url";

/**
 * Tombol preview pada kartu katalog /frame.
 * Bisa membungkus thumbnail sehingga seluruh area cetak menjadi target klik,
 * lalu membuka modal kamera yang sama dengan `preview-button` frame.blade.php.
 */
export function FramePreviewButton({
  frame,
  children,
  className = "",
}: {
  frame: CatalogFrame;
  children?: ReactNode;
  className?: string;
}) {
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
        aria-label={`Preview frame ${frame.name}`}
        className={className}
      >
        {children}
      </button>

      {isOpen ? (
        <FramePreviewModal frame={previewFrame} onClose={handleClose} showAlert={false} />
      ) : null}
    </>
  );
}
