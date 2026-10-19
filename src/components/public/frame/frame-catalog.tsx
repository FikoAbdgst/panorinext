import {
  listCatalogFrames,
  listCategories,
  listFrameSlotCounts,
} from "@/lib/frames/queries";

import { CategorySelector } from "./category-selector";
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
  const ratingParam = first(raw.sort_rating);
  const popularParam = first(raw.sort_popular);
  const slotParam = first(raw.slot);

  const categories = await listCategories("idDesc");

  const requestedCategoryId = categoryParam ? Number(categoryParam) : NaN;
  const selected =
    Number.isFinite(requestedCategoryId)
      ? categories.find((item) => item.id === requestedCategoryId) ?? null
      : null;

  const sortRating = ratingParam === "asc" || ratingParam === "desc" ? ratingParam : null;
  const sortPopular =
    popularParam === "asc" || popularParam === "desc" ? popularParam : null;
  const freeOnly = freeParam === "true";

  const requestedSlots = slotParam ? Number(slotParam) : NaN;
  const selectedSlots =
    Number.isInteger(requestedSlots) && requestedSlots > 0 ? requestedSlots : null;

  const [frames, slotCounts] = await Promise.all([
    listCatalogFrames({
      categoryId: selected?.id ?? null,
      freeOnly,
      sortRating,
      sortPopular,
      slots: selectedSlots,
    }),
    listFrameSlotCounts(),
  ]);

  const href = (overrides: Record<string, string | null>): string => {
    const search = new URLSearchParams();
    if (selected) search.set("category", String(selected.id));
    if (freeOnly) search.set("free", "true");
    if (selectedSlots) search.set("slot", String(selectedSlots));
    if (sortRating) search.set("sort_rating", sortRating);
    if (sortPopular) search.set("sort_popular", sortPopular);
    for (const [key, value] of Object.entries(overrides)) {
      if (value === null) search.delete(key);
      else search.set(key, value);
    }
    const qs = search.toString();
    return qs ? `/frame?${qs}` : "/frame";
  };

  const filters: CatalogFilterState = {
    activeSort: Boolean(sortRating || sortPopular),
    ratingHref: href({ sort_rating: sortRating === "desc" ? "asc" : "desc" }),
    ratingLabel:
      sortRating === "desc"
        ? "Tinggi ke Rendah"
        : sortRating === "asc"
          ? "Rendah ke Tinggi"
          : "",
    ratingActive: Boolean(sortRating),
    ratingIconPath: sortRating === "desc" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7",
    popularHref: href({ sort_popular: sortPopular === "desc" ? "asc" : "desc" }),
    popularLabel:
      sortPopular === "desc"
        ? "Tinggi ke Rendah"
        : sortPopular === "asc"
          ? "Rendah ke Tinggi"
          : "",
    popularActive: Boolean(sortPopular),
    popularIconPath:
      sortPopular === "desc"
        ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6",
    defaultHref: href({ sort_rating: null, sort_popular: null }),
    defaultActive: !sortRating && !sortPopular,
    freeHref: href({ free: freeOnly ? null : "true" }),
    freeActive: freeOnly,
    slotActive: selectedSlots !== null,
    slotOptions: [
      { value: null, label: "Semua", href: href({ slot: null }), active: selectedSlots === null },
      ...slotCounts.map((count) => ({
        value: count,
        label: `${count} Slot`,
        href: href({ slot: String(count) }),
        active: selectedSlots === count,
      })),
    ],
    frameCount: frames.length,
  };

  return (
    <>
      <CategorySelector categories={categories} selectedCategoryId={selected?.id ?? null} />
      <FilterControls filters={filters} />

      <div className="mt-12">
        {frames.length > 0 ? (
          <ShowMoreGrid frames={frames} />
        ) : (
          <div className="text-center py-20 bg-[#FEF3E2]">
            <div className="inline-block text-7xl mb-6">😥</div>
            <p className="text-xl text-gray-600 font-light">
              Tidak ada frame yang tersedia untuk kategori {selected ? `"${selected.name}"` : "ini"}.
            </p>
            <p className="mt-3 text-gray-500">Silakan pilih kategori lain atau kembali lagi nanti.</p>
          </div>
        )}
      </div>
    </>
  );
}
