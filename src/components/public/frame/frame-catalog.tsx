import Link from "next/link";

import {
  listCatalogFrames,
  listCategories,
  listFrameCategoryIds,
  listFrameSlotCounts,
} from "@/lib/frames/queries";

import { CategorySelector, type CategoryFilterOption } from "./category-selector";
import { FilterControls, type CatalogFilterState } from "./filter-controls";
import { ShowMoreGrid } from "./show-more-grid";

type RawSearchParams = { [key: string]: string | string[] | undefined };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function FrameCatalog({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const raw = await searchParams;
  const categoryParam = first(raw.category);
  const freeParam = first(raw.free);
  const popularParam = first(raw.sort_popular);
  const slotParam = first(raw.slot);

  const [categories, usedCategoryIds, slotCounts] = await Promise.all([
    listCategories("idDesc"),
    listFrameCategoryIds(),
    listFrameSlotCounts(),
  ]);

  const requestedCategoryId = categoryParam ? Number(categoryParam) : NaN;
  const selected =
    Number.isFinite(requestedCategoryId)
      ? categories.find((item) => item.id === requestedCategoryId) ?? null
      : null;

  const visibleCategories = categories.filter((category) =>
    usedCategoryIds.includes(category.id),
  );
  const selectedIsVisible =
    selected !== null && visibleCategories.some((category) => category.id === selected.id);

  const sortPopular = popularParam === "desc" ? "desc" : null;
  const freeOnly = freeParam === "true";

  const requestedSlots = slotParam ? Number(slotParam) : NaN;
  const selectedSlots =
    Number.isInteger(requestedSlots) && requestedSlots > 0 ? requestedSlots : null;

  const frames = await listCatalogFrames({
    categoryId: selected?.id ?? null,
    freeOnly,
    sortPopular,
    slots: selectedSlots,
  });

  const href = (overrides: Record<string, string | null>): string => {
    const search = new URLSearchParams();
    if (selected) search.set("category", String(selected.id));
    if (freeOnly) search.set("free", "true");
    if (selectedSlots) search.set("slot", String(selectedSlots));
    if (sortPopular) search.set("sort_popular", sortPopular);
    for (const [key, value] of Object.entries(overrides)) {
      if (value === null) search.delete(key);
      else search.set(key, value);
    }
    const qs = search.toString();
    return qs ? `/frame?${qs}` : "/frame";
  };

  const resetHref = href({
    category: null,
    free: null,
    slot: null,
    sort_popular: null,
  });

  const categoryOptions: CategoryFilterOption[] = [
    {
      label: "Semua frame",
      href: href({ category: null }),
      active: selected === null,
    },
    ...visibleCategories.map((category) => ({
      label: category.name,
      href: href({ category: String(category.id) }),
      active: selected?.id === category.id,
    })),
    ...(selected && !selectedIsVisible
      ? [
          {
            label: selected.name,
            href: href({ category: String(selected.id) }),
            active: true,
          },
        ]
      : []),
  ];

  const filters: CatalogFilterState = {
    sortOptions: [
      {
        label: "Terbaru",
        href: href({ sort_popular: null }),
        active: sortPopular === null,
      },
      {
        label: "Terpopuler",
        href: href({ sort_popular: "desc" }),
        active: sortPopular === "desc",
      },
    ],
    freeHref: href({ free: freeOnly ? null : "true" }),
    freeActive: freeOnly,
    slotOptions: [
      { value: null, label: "Semua", href: href({ slot: null }), active: selectedSlots === null },
      ...slotCounts.map((count) => ({
        value: count,
        label: String(count),
        href: href({ slot: String(count) }),
        active: selectedSlots === count,
      })),
    ],
    activeCount: [freeOnly, Boolean(selectedSlots), Boolean(sortPopular)].filter(Boolean)
      .length,
  };

  const hasActiveFilters = Boolean(
    selected || freeOnly || selectedSlots || sortPopular,
  );

  return (
    <div className="min-w-0">
      <CategorySelector options={categoryOptions} />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#BF3131]/25 pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <FilterControls filters={filters} />
          {hasActiveFilters ? (
            <Link
              href={resetHref}
              className="inline-flex min-h-11 items-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A5A50] underline-offset-4 transition hover:text-[#BF3131] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"
            >
              Reset
            </Link>
          ) : null}
        </div>

        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A5A50]">
          <span className="mr-1 text-sm tabular-nums text-[#BF3131]">
            {frames.length}
          </span>
          frame
        </p>
      </div>

      <section aria-label="Daftar frame" className="mt-7">
        {frames.length > 0 ? (
          <ShowMoreGrid frames={frames} />
        ) : (
          <div className="border border-dashed border-[#BF3131]/35 bg-[#FFFBF3] px-6 py-16 text-center sm:py-20">
            <h3 className="text-xl font-bold text-[#2A0A0A]">
              Belum ada frame di filter ini.
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#6B4A40]">
              Coba pilih kategori lain atau tampilkan semua frame yang tersedia.
            </p>
            <Link
              href={resetHref}
              className="mt-6 inline-flex min-h-11 items-center gap-3 border border-[#BF3131] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-[#BF3131] transition hover:bg-[#BF3131] hover:text-[#FEF3E2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFBF3]"
            >
              Tampilkan semua frame
              <span aria-hidden="true" className="h-px w-5 bg-current" />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
