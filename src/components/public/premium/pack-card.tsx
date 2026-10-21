import Link from "next/link";

import type { Pack } from "@/lib/premium/types";
import { formatDurationDays } from "@/lib/premium/types";

import { PremiumFramePreview } from "./frame-preview";

function formatRupiah(value: number): string {
  return `Rp${new Intl.NumberFormat("id-ID").format(value)}`;
}

export function PackCard({
  pack,
  index,
}: {
  pack: Pack;
  index: number;
}) {
  const previews = pack.frames.slice(0, 3);
  const previewGridClass =
    previews.length <= 1
      ? "grid-cols-1"
      : previews.length === 2
        ? "grid-cols-2"
        : "grid-cols-3";

  return (
    <article
      suppressHydrationWarning
      data-aos="lab-develop"
      data-aos-duration="1000"
      data-aos-delay={(index % 3) * 90}
      className="group relative flex flex-col border border-[#BF3131]/20 bg-[#FFFBF3] p-3 shadow-[6px_6px_0_rgba(191,49,49,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#BF3131]/45 hover:shadow-[9px_9px_0_rgba(191,49,49,0.1)]"
    >
      <Link
        href={`/premium/${pack.slug}`}
        className={`relative grid gap-1.5 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-4 focus-visible:ring-offset-[#FEF3E2] ${previewGridClass}`}
        aria-label={`Lihat paket ${pack.name}`}
      >
        {previews.length > 0 ? (
          previews.map((frame) => (
            <PremiumFramePreview key={frame.id} frame={frame} />
          ))
        ) : (
          <span className="col-span-full flex aspect-[4/5] items-center justify-center border border-dashed border-[#BF3131]/25 bg-[#FEF3E2] text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A5A50]">
            Frame segera hadir
          </span>
        )}
        {pack.frames.length > 3 ? (
          <span className="absolute bottom-2 right-2 z-30 bg-[#2A0A0A]/85 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#FEF3E2]">
            +{pack.frames.length - 3} frame
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col px-1 pb-1 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-xl font-extrabold leading-tight tracking-[-0.03em] text-[#2A0A0A] transition-colors group-hover:text-[#BF3131]">
              {pack.name}
            </h3>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7A5A50]">
              {pack.frames.length} frame · 1 kode ·{" "}
              {formatDurationDays(pack.duration_days)}
            </p>
          </div>
          <p className="shrink-0 text-lg font-extrabold text-[#BF3131]">
            {formatRupiah(pack.price)}
          </p>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[#5B3A32]">
          {pack.description ??
            `Satu kode membuka semua ${pack.frames.length} frame di paket ini.`}
        </p>

        <Link
          href={`/premium/${pack.slug}`}
          className="mt-5 inline-flex min-h-11 items-center justify-between gap-3 border border-[#BF3131] px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#BF3131] transition hover:bg-[#BF3131] hover:text-[#FEF3E2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFBF3]"
        >
          Lihat isi & beli
          <span aria-hidden="true" className="h-px w-5 bg-current" />
        </Link>
      </div>
    </article>
  );
}
