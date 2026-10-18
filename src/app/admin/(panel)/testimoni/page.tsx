import { Suspense } from "react";

import { TestimoniTable, type TestimoniRow } from "@/components/admin/testimoni/TestimoniTable";
import {
  getTestimonialStats,
  listAdminTestimonials,
} from "@/lib/testimonials/queries";

export default async function AdminTestimoniPage(
  props: PageProps<"/admin/testimoni">,
) {
  const params = await props.searchParams;
  const ratingValue = typeof params.rating === "string" ? params.rating : "";
  const searchValue = typeof params.search === "string" ? params.search : "";
  const rating = ratingValue ? Number(ratingValue) : undefined;

  const exportQuery = new URLSearchParams();
  if (ratingValue) {
    exportQuery.set("rating", ratingValue);
  }
  if (searchValue) {
    exportQuery.set("search", searchValue);
  }
  const exportHref = `/admin/testimoni/export${
    exportQuery.size > 0 ? `?${exportQuery.toString()}` : ""
  }`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Kelola Testimoni</h1>
          <p className="text-sm text-neutral-500">
            Tinjau, cari, dan hapus testimoni pengguna.
          </p>
        </div>
        <a
          href={exportHref}
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Export CSV
        </a>
      </header>

      <form
        method="get"
        action="/admin/testimoni"
        className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4"
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

      <Suspense fallback={<p className="text-sm text-neutral-500">Memuat testimoni...</p>}>
        <TestimoniContent
          rating={rating && Number.isInteger(rating) ? rating : undefined}
          search={searchValue || undefined}
        />
      </Suspense>
    </main>
  );
}

async function TestimoniContent({
  rating,
  search,
}: {
  rating: number | undefined;
  search: string | undefined;
}) {
  const [testimonials, stats] = await Promise.all([
    listAdminTestimonials({ rating, search }),
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
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Testimoni" value={String(stats.total)} />
        <StatCard label="Rata-rata Rating" value={stats.average.toFixed(1)} />
        <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:col-span-2">
          <p className="mb-2 text-sm font-medium text-neutral-700">Distribusi Rating</p>
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.byRating[star] ?? 0;
              const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs text-neutral-600">
                  <span className="w-10">{star} ★</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                    <span
                      className="block h-full rounded-full bg-amber-400"
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                  <span className="w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-500">
          Tidak ada testimoni yang cocok.
        </p>
      ) : (
        <TestimoniTable rows={rows} />
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-neutral-900">{value}</p>
    </div>
  );
}
