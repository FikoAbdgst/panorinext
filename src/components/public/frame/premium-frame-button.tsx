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
 * Tombol "Gunakan Premium" pada kartu katalog /frame.
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
      className="mt-2 cursor-pointer inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-full text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 w-full transition-all duration-300 shadow-sm hover:shadow-md"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 mr-2"
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
      Gunakan Premium
    </button>
  );
}
