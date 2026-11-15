import type { ReactNode } from "react";

import { FLIPBOOK_FRAME_ASPECT } from "@/lib/flipbook/constants";

/**
 * Menjaga rasio aset di dalam area yang tersedia tanpa memotong atau
 * meregangkan. Container query units dipakai supaya tetap presisi di
 * thumbnail kecil maupun halaman penuh.
 */
export function AspectFit({
  ratio,
  className,
  boxClassName,
  children,
}: {
  ratio: number;
  className?: string;
  boxClassName?: string;
  children: ReactNode;
}) {
  const safeRatio =
    Number.isFinite(ratio) && ratio > 0 ? ratio : FLIPBOOK_FRAME_ASPECT;

  return (
    <span
      className={`grid h-full w-full place-items-center ${className ?? ""}`}
      style={{ containerType: "size" }}
    >
      <span
        className={`relative block ${boxClassName ?? ""}`}
        style={{
          width: `min(100cqw, calc(${safeRatio} * 100cqh))`,
          height: `min(100cqh, calc(100cqw / ${safeRatio}))`,
        }}
      >
        {children}
      </span>
    </span>
  );
}
