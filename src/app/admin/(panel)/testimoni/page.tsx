import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { TestimoniTable, type TestimoniRow } from "@/components/admin/testimoni/TestimoniTable";
import { AdminLoading } from "@/components/admin/ui";
import {
  getTestimonialStats,
  listAdminTestimonials,
  type TestimonialLandingFilter,
} from "@/lib/testimonials/queries";
import { LANDING_TESTIMONIAL_LIMIT } from "@/lib/testimonials/constants";

export default async function AdminTestimoniPage(
  props: PageProps<"/admin/testimoni">,
) {
  const params = await props.searchParams;
  const ratingValue = typeof params.rating === "string" ? params.rating : "";
  const searchValue = typeof params.search === "string" ? params.search : "";
  const rating = ratingValue ? Number(ratingValue) : undefined;
  const landingValue = typeof params.landing === "string" ? params.landing : "";
  const landing: TestimonialLandingFilter | undefined =
    landingValue === "featured" ||
    landingValue === "unfeatured" ||
    landingValue === "no-consent"
      ? landingValue
      : undefined;

  const exportQuery = new URLSearchParams();
  if (ratingValue) {
    exportQuery.set("rating", ratingValue);
  }
  if (landing) {
    exportQuery.set("landing", landing);
  }
  if (searchValue) {
    exportQuery.set("search", searchValue);
  }
  const exportHref = `/admin/testimoni/export${
    exportQuery.size > 0 ? `?${exportQuery.toString()}` : ""
  }`;

  return (
    <>
      <AdminPageHeader
        title="Testimoni"
        description="Tinjau testimoni pengguna dan pilih yang tampil di landing page."
        actions={
          <a
            href={exportHref}
            className="rounded-[3px] border border-[#2A0A0A]/15 px-4 py-2 text-sm font-semibold text-[#2A0A0A] transition hover:bg-[#2A0A0A]/5"
          >
            Export CSV
          </a>
        }
      />

      <form
        method="get"
        action="/admin/testimoni"
        className="admin-card mb-6 flex flex-wrap items-end gap-3 p-4"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Rating</span>
          <select
            name="rating"
            defaultValue={ratingValue}
            className="rounded-lg border border-neutral-300 px-3 py-2"
          >
            <option value="">Semua</option>
            <option value="5">5 bintang</option>
            <option value="4">4 bintang</option>
            <option value="3">3 bintang</option>
            <option value="2">2 bintang</option>
            <option value="1">1 bintang</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Landing page</span>
          <select
            name="landing"
            defaultValue={landingValue}
            className="rounded-lg border border-neutral-300 px-3 py-2"
          >
            <option value="">Semua</option>
            <option value="featured">Tampil di landing</option>
            <option value="unfeatured">Belum tampil</option>
            <option value="no-consent">Tanpa izin foto</option>
          </select>
        </label>

        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Cari (nama / pesan)</span>
          <input
            name="search"
            defaultValue={searchValue}
            className="rounded-lg border border-neutral-300 px-3 py-2"
            placeholder="mis. keren"
          />
        </label>

        <button
          type="submit"
          className="rounded-lg bg-[#BF3131] px-4 py-2 text-sm font-medium text-white hover:bg-[#a52929]"
        >
          Terapkan
        </button>
        <a
          href="/admin/testimoni"
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Reset
        </a>
      </form>

      <Suspense fallback={<AdminLoading label="Memuat testimoni..." />}>
        <TestimoniContent
          rating={rating && Number.isInteger(rating) ? rating : undefined}
          search={searchValue || undefined}
          landing={landing}
        />
      </Suspense>
    </>
  );
}

async function TestimoniContent({
  rating,
  search,
  landing,
}: {
  rating: number | undefined;
  search: string | undefined;
  landing: TestimonialLandingFilter | undefined;
}) {
  const [testimonials, stats] = await Promise.all([
    listAdminTestimonials({ rating, search, landing }),
    getTestimonialStats(),
  ]);

  const rows: TestimoniRow[] = testimonials.map((item) => ({
    id: item.id,
    rating: item.rating,
    emoji: item.emoji,
    name: item.name,
    message: item.message,
    created_at: item.created_at,
    frame_name: item.frame?.name ?? null,
    photo_url: item.photo_url,
    photo_consent: item.photo_consent,
    is_featured: item.is_featured,
  }));

  return (
    <div className="space-y-6">
      <div className="admin-card px-5 py-4">
        <div className="grid grid-cols-2 gap-y-4 sm:grid-cols-4">
          <TestimoniMetric label="Total testimoni" value={String(stats.total)} />
          <TestimoniMetric label="Rata-rata rating" value={stats.average.toFixed(1)} />
          <TestimoniMetric label="Berizin foto" value={String(stats.consented)} />
          <TestimoniMetric
            label="Tampil di landing"
            value={`${stats.featured}/${LANDING_TESTIMONIAL_LIMIT}`}
          />
        </div>
      </div>

      <div className="admin-card p-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A5A50]">
          Distribusi rating
        </p>
        <div className="space-y-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.byRating[star] ?? 0;
            const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;
            return (
              <div
                key={star}
                className="flex items-center gap-2 text-xs text-[#7A5A50]"
              >
                <span className="w-8 tabular-nums">{star} ★</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#2A0A0A]/8">
                  <span
                    className="block h-full rounded-full bg-[#BF3131]"
                    style={{ width: `${percent}%` }}
                  />
                </span>
                <span className="w-8 text-right tabular-nums text-[#2A0A0A]">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="admin-empty">Tidak ada testimoni yang cocok.</p>
      ) : (
        <TestimoniTable rows={rows} />
      )}
    </div>
  );
}

function TestimoniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A5A50]">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-[#2A0A0A]">{value}</p>
    </div>
  );
}
