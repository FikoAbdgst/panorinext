import Link from "next/link";

export type CatalogFilterState = {
  sortOptions: {
    label: string;
    href: string;
    active: boolean;
  }[];
  freeHref: string;
  freeActive: boolean;
  slotOptions: {
    value: number | null;
    label: string;
    href: string;
    active: boolean;
  }[];
  activeCount: number;
};

export function FilterControls({ filters }: { filters: CatalogFilterState }) {
  return (
    <details className="group relative">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 border border-[#BF3131]/25 bg-[#FFFBF3]/60 px-3 text-xs font-semibold text-[#5B3A32] transition hover:border-[#BF3131] hover:text-[#BF3131] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2] [&::-webkit-details-marker]:hidden">
        <span>Filter</span>
        {filters.activeCount > 0 ? (
          <span className="flex h-5 min-w-5 items-center justify-center bg-[#BF3131] px-1 text-[9px] font-bold text-[#FEF3E2]">
            {filters.activeCount}
          </span>
        ) : null}
        <span
          aria-hidden="true"
          className="ml-1 text-base font-normal leading-none text-[#BF3131] group-open:hidden"
        >
          +
        </span>
        <span
          aria-hidden="true"
          className="ml-1 hidden text-base font-normal leading-none text-[#BF3131] group-open:inline"
        >
          −
        </span>
      </summary>

      <div className="mt-2 w-[min(20rem,calc(100vw-2rem))] border border-[#BF3131]/20 bg-[#FFFBF3] p-4 shadow-[0_18px_40px_-24px_rgba(42,10,10,0.4)] sm:absolute sm:left-0 sm:top-full sm:z-20">
        <div className="space-y-5">
          <section>
            <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#9A6B5E]">
              Urutkan
            </h3>
            <div className="mt-2">
              {filters.sortOptions.map((option) => (
                <Link
                  key={option.href}
                  href={option.href}
                  aria-current={option.active ? "true" : undefined}
                  className={`flex min-h-10 items-center border-b border-[#BF3131]/10 text-xs transition last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFBF3] ${
                    option.active
                      ? "font-semibold text-[#BF3131]"
                      : "text-[#5B3A32] hover:text-[#BF3131]"
                  }`}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#9A6B5E]">
              Slot foto
            </h3>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {filters.slotOptions.map((option) => (
                <Link
                  key={option.value ?? "all"}
                  href={option.href}
                  aria-current={option.active ? "true" : undefined}
                  className={`inline-flex min-h-10 min-w-10 items-center justify-center border px-2.5 text-xs font-bold tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFBF3] ${
                    option.active
                      ? "border-[#BF3131] bg-[#BF3131] text-[#FEF3E2]"
                      : "border-[#BF3131]/25 bg-transparent text-[#5B3A32] hover:border-[#BF3131] hover:text-[#BF3131]"
                  }`}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </section>

          <Link
            href={filters.freeHref}
            className={`flex min-h-11 items-center justify-between gap-3 border-y border-[#BF3131]/15 py-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFBF3] ${
              filters.freeActive
                ? "text-[#BF3131]"
                : "text-[#5B3A32] hover:text-[#BF3131]"
            }`}
          >
            <span>Hanya frame gratis</span>
            <span
              aria-hidden="true"
              className={`flex h-4 w-4 items-center justify-center border ${
                filters.freeActive
                  ? "border-[#BF3131] bg-[#BF3131]"
                  : "border-[#BF3131]/35 bg-transparent"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 ${
                  filters.freeActive ? "bg-[#FEF3E2]" : "bg-transparent"
                }`}
              />
            </span>
          </Link>
        </div>
      </div>
    </details>
  );
}
