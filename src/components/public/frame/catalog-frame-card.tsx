import Link from "next/link";
import type { CSSProperties } from "react";

import type { CatalogFrame } from "@/lib/frames/types";
import { getFramePublicUrl } from "@/lib/frames/url";

import { FramePreviewButton } from "./frame-preview-button";
import { PremiumFrameButton } from "./premium-frame-button";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID").format(price);
}

export function CatalogFrameCard({
  frame,
  index,
  className = "",
}: {
  frame: CatalogFrame;
  index: number;
  className?: string;
}) {
  const isFree = frame.price <= 0;

  return (
    <div
      className={`group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 frame-card relative ${className}`}
      data-frame-id={frame.id}
      data-aos="frame-fade-up"
      data-aos-delay={(index % 4) * 100}
      style={{ "--aos-order": index % 4 } as CSSProperties}
    >
      <div className="absolute top-3 right-3 z-10">
        {isFree ? (
          <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            GRATIS
          </span>
        ) : (
          <span className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 mr-1"
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
          </span>
        )}
      </div>

      <div className="relative h-60 bg-gradient-to-br from-gray-100 to-red-50 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center p-4 transition-transform duration-500 group-hover:scale-105">
          {frame.image_path ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getFramePublicUrl(frame.image_path)}
              alt={frame.name}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="text-gray-400 text-5xl">🖼️</div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
          <FramePreviewButton frame={frame} />
        </div>
      </div>

      <div className="p-5 bg-white">
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#BF3131] transition-colors">
              {frame.name}
            </h3>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 rounded-full">
              <span className="text-base">{frame.category_icon}</span>
              <span className="text-xs text-gray-700">{frame.category_name}</span>
            </div>
          </div>

          {frame.avg_rating !== null ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-orange-50 px-3 py-1.5 rounded-lg border border-yellow-200">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 fill-current ${
                        i <= Math.round(frame.avg_rating ?? 0)
                          ? "text-yellow-400 drop-shadow-sm"
                          : "text-gray-300"
                      }`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-800">
                  {frame.avg_rating.toFixed(1)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-500 font-medium">Belum ada rating</span>
            </div>
          )}

          <div className="border-t border-gray-100" />

          {isFree ? (
            <Link
              href={`/booth?frame_id=${frame.id}`}
              className="mt-2 inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-full text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 w-full transition-all duration-300 shadow-sm hover:shadow-md"
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
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                />
              </svg>
              Gunakan Frame
            </Link>
          ) : (
            <PremiumFrameButton frame={frame} />
          )}
        </div>
      </div>

      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/20 to-amber-500/20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300" />
    </div>
  );
}
