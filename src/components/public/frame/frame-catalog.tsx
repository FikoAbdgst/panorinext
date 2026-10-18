import { listCatalogFrames, listCategories } from "@/lib/frames/queries";

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

  const frames = await listCatalogFrames({
    categoryId: selected?.id ?? null,
    freeOnly,
    sortRating,
    sortPopular,
  });

  const base = new URLSearchParams();
  if (selected) base.set("category", String(selected.id));
  if (freeOnly) base.set("free", "true");

  const withParam = (extra: Record<string, string>): string => {
    const search = new URLSearchParams(base);
    for (const [key, value] of Object.entries(extra)) search.set(key, value);
    const qs = search.toString();
    return qs ? `/frame?${qs}` : "/frame";
  };

  const freeSearch = new URLSearchParams();
  if (selected) freeSearch.set("category", String(selected.id));
  if (!freeOnly) freeSearch.set("free", "true");
  if (sortRating) freeSearch.set("sort_rating", sortRating);
  if (sortPopular) freeSearch.set("sort_popular", sortPopular);
  const freeQuery = freeSearch.toString();

  const filters: CatalogFilterState = {
    activeSort: Boolean(sortRating || sortPopular),
    ratingHref: withParam({ sort_rating: sortRating === "desc" ? "asc" : "desc" }),
    ratingLabel:
      sortRating === "desc"
        ? "Tinggi ke Rendah"
        : sortRating === "asc"
          ? "Rendah ke Tinggi"
          : "",
    ratingActive: Boolean(sortRating),
    ratingIconPath: sortRating === "desc" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7",
    popularHref: withParam({ sort_popular: sortPopular === "desc" ? "asc" : "desc" }),
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
    defaultHref: withParam({}),
    defaultActive: !sortRating && !sortPopular,
    freeHref: freeQuery ? `/frame?${freeQuery}` : "/frame",
    freeActive: freeOnly,
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
