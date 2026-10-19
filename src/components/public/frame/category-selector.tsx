import Link from "next/link";

import type { CategoryOption } from "@/lib/frames/queries";

export function CategorySelector({
  categories,
  selectedCategoryId,
}: {
  categories: CategoryOption[];
  selectedCategoryId: number | null;
}) {
  const isAll = selectedCategoryId === null;

  return (
    <div className="mb-8 bg-transparent rounded-xl p-4 sm:p-6">
      <div className="block sm:hidden mb-4">
        <div className="category-scroll-mobile" style={{ scrollSnapType: "x mandatory" }}>
          <Link
            href="/frame"
            className="category-btn-mobile group flex-shrink-0"
            style={{ scrollSnapAlign: "start" }}
          >
            <div className={`category-icon-mobile ${isAll ? "active" : ""}`}>
              <span>🏠</span>
            </div>
            <span className="category-label-mobile">Semua</span>
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/frame?category=${category.id}`}
              className="category-btn-mobile group flex-shrink-0"
              style={{ scrollSnapAlign: "start" }}
            >
              <div
                className={`category-icon-mobile ${
                  selectedCategoryId === category.id ? "active" : ""
                }`}
              >
                <span>{category.icon}</span>
              </div>
              <span className="category-label-mobile">{category.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="hidden sm:flex justify-center items-center" data-aos="fade-up" suppressHydrationWarning data-aos-delay="300">
        <div className="w-4/5 category-scroll-desktop">
          <Link
            href="/frame"
            className="category-btn group flex-shrink-0"
            style={{ scrollSnapAlign: "start" }}
            data-aos="zoom-in" suppressHydrationWarning
            data-aos-delay="400"
          >
            <div className={`category-icon ${isAll ? "active" : ""}`}>
              <span className="text-lg">🏠</span>
            </div>
            <span className="category-label">Semua</span>
          </Link>
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/frame?category=${category.id}`}
              className="category-btn group flex-shrink-0"
              style={{ scrollSnapAlign: "start" }}
              data-aos="zoom-in" suppressHydrationWarning
              data-aos-delay={400 + index * 100}
            >
              <div
                className={`category-icon ${
                  selectedCategoryId === category.id ? "active" : ""
                }`}
              >
                <span className="text-lg">{category.icon}</span>
              </div>
              <span className="category-label">{category.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
