"use client";

import type { CatalogFrame } from "@/lib/frames/types";
import { getFramePublicUrl } from "@/lib/frames/url";

export const PREMIUM_FRAME_EVENT = "panoricam:premium-frame";

export type PremiumFrameDetail = {
  id: number;
  price: number;
  name: string;
  imageUrl: string;
};

/**
 * Tombol "Beli frame" pada kartu katalog /frame.
 * Kartu dirender di server, sedangkan modal pembayaran adalah komponen client.
 * Karena itu klik tombol dikirim lewat CustomEvent ke `PaymentFlow` di halaman
 * yang sama — meniru `showPremiumModal(...)` pada frame.blade.php.
 */
export function PremiumFrameButton({ frame }: { frame: CatalogFrame }) {
  function handleClick() {
    const detail: PremiumFrameDetail = {
      id: frame.id,
      price: frame.price,
      name: frame.name,
      imageUrl: frame.image_path ? getFramePublicUrl(frame.image_path) : "",
    };
    window.dispatchEvent(
      new CustomEvent<PremiumFrameDetail>(PREMIUM_FRAME_EVENT, { detail }),
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex min-h-11 w-full items-center justify-between gap-3 border border-[#2A0A0A]/40 bg-[#FFFBF3] px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#2A0A0A] transition hover:border-[#BF3131] hover:bg-[#BF3131] hover:text-[#FEF3E2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"
    >
      Beli frame
      <span aria-hidden="true" className="h-px w-5 bg-current" />
    </button>
  );
}
