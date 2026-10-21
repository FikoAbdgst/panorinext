import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { AosRefresh } from "@/components/public/aos-refresh";
import { Footer } from "@/components/public/footer";
import { PackCheckout } from "@/components/public/premium/pack-checkout";
import { PremiumComingSoon } from "@/components/public/premium/premium-coming-soon";
import { PremiumFramePreview } from "@/components/public/premium/frame-preview";
import { getPackBySlug } from "@/lib/packs/queries";
import { PREMIUM_PUBLIC_ENABLED } from "@/lib/premium/availability";
import { getActivePremiumAccessByToken } from "@/lib/premium/queries";
import { getPremiumAccessToken } from "@/lib/premium/session";
import { formatDurationDays } from "@/lib/premium/types";

export const metadata: Metadata = {
  title: PREMIUM_PUBLIC_ENABLED
    ? "Paket Premium"
    : "Ruang Premium - Segera Hadir",
  description: PREMIUM_PUBLIC_ENABLED
    ? "Lihat isi paket frame premium PanoriCam, durasi akses, dan cara membukanya dengan satu kode."
    : "Ruang Premium PanoriCam sedang disiapkan.",
  robots: PREMIUM_PUBLIC_ENABLED
    ? undefined
    : { index: false, follow: false },
};

export const instant = false;

function formatRupiah(value: number): string {
  return `Rp${new Intl.NumberFormat("id-ID").format(value)}`;
}

export default async function PackDetailPage({
  params,
}: PageProps<"/premium/[slug]">) {
  await connection();

  if (!PREMIUM_PUBLIC_ENABLED) {
    return <PremiumComingSoon />;
  }

  const { slug } = await params;
  const pack = await getPackBySlug(slug, { activeOnly: true });

  if (!pack) {
    notFound();
  }

  const token = await getPremiumAccessToken();
  const access = await getActivePremiumAccessByToken(token);
  const alreadyActive = access?.pack_id === pack.id;

  return (
    <div className="min-h-screen bg-[#FEF3E2] font-['Poppins']">
      <section className="relative overflow-hidden pt-28 sm:pt-32">
        <div aria-hidden="true" className="lab-paper absolute inset-0 opacity-60" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A5A50]"
          >
            <Link href="/premium" className="transition hover:text-[#BF3131]">
              Ruang Premium
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-[#BF3131]">{pack.name}</span>
          </nav>

          <div className="mt-6 grid gap-12 pb-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
            <div>
              <h1
                suppressHydrationWarning
                data-aos="lab-sweep"
                data-aos-duration="1100"
                className="text-balance text-[2.5rem] font-extrabold leading-[0.94] tracking-[-0.055em] text-[#2A0A0A] min-[380px]:text-[2.8rem] sm:text-6xl"
              >
                {pack.name}
              </h1>
              <p
                suppressHydrationWarning
                data-aos="lab-focus"
                data-aos-duration="1000"
                data-aos-delay="140"
                className="mt-5 max-w-xl text-pretty text-sm leading-relaxed text-[#5B3A32] sm:text-base"
              >
                {pack.description ??
                  "Satu kode membuka semua frame di paket ini. Preview di bawah diberi watermark, hasil foto asli tetap bersih."}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A5A50]">
                <span>{pack.frames.length} frame</span>
                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[#BF3131]/50" />
                <span>{formatDurationDays(pack.duration_days)}</span>
                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[#BF3131]/50" />
                <span>Mulai pemakaian pertama</span>
              </div>

              <div className="mt-10 flex flex-wrap items-end justify-between gap-3 border-b border-[#BF3131]/25 pb-3">
                <div>
                  <h2 className="text-xl font-extrabold tracking-[-0.03em] text-[#2A0A0A]">
                    Isi paket
                  </h2>
                  <p className="mt-1 text-xs text-[#7A5A50]">
                    Semua frame di bawah terbuka dengan 1 kode yang sama.
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#BF3131]">
                  {pack.frames.length} frame
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {pack.frames.map((frame, index) => (
                  <div
                    key={frame.id}
                    suppressHydrationWarning
                    data-aos="lab-develop"
                    data-aos-duration="900"
                    data-aos-delay={(index % 3) * 80}
                  >
                    <PremiumFramePreview frame={frame} />
                    <div className="mt-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#2A0A0A]">
                          {frame.name}
                        </p>
                        <p className="text-[10px] uppercase tracking-[0.12em] text-[#7A5A50]">
                          {frame.slots.length} slot
                          {frame.category_name ? ` · ${frame.category_name}` : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {pack.frames.length === 0 ? (
                <p className="mt-8 border border-dashed border-[#BF3131]/25 bg-[#FFFBF3] px-4 py-6 text-sm text-[#7A5A50]">
                  Frame paket ini belum tersedia. Hubungi admin untuk info
                  terbaru.
                </p>
              ) : null}
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="border border-[#BF3131]/25 bg-[#FFFBF3] p-5 shadow-[8px_8px_0_rgba(191,49,49,0.08)] sm:p-6">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#7A5A50]">
                  Paket premium
                </p>
                <p className="mt-2 text-3xl font-extrabold tracking-[-0.04em] text-[#BF3131]">
                  {formatRupiah(pack.price)}
                </p>
                <p className="mt-1 text-sm text-[#5B3A32]">
                  {formatDurationDays(pack.duration_days)} sejak kode pertama
                  dipakai
                </p>

                <ul className="mt-5 space-y-2 border-t border-dashed border-[#BF3131]/25 pt-4 text-sm text-[#5B3A32]">
                  <li className="flex items-center justify-between gap-3">
                    <span>Frame dalam paket</span>
                    <span className="font-bold text-[#2A0A0A]">
                      {pack.frames.length}
                    </span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span>Kode akses</span>
                    <span className="font-bold text-[#2A0A0A]">1 kode</span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span>Hasil foto</span>
                    <span className="font-bold text-[#2A0A0A]">
                      PNG / GIF
                    </span>
                  </li>
                </ul>

                <div className="mt-6">
                  {alreadyActive ? (
                    <Link
                      href="/premium/room"
                      className="inline-flex min-h-12 w-full items-center justify-center bg-[#BF3131] px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[#FEF3E2] shadow-[4px_4px_0_#7A1C1C] transition hover:-translate-y-0.5 hover:bg-[#A02828]"
                    >
                      Buka ruang premium
                    </Link>
                  ) : (
                    <PackCheckout pack={pack} />
                  )}
                </div>

                <p className="mt-4 text-[11px] leading-relaxed text-[#7A5A50]">
                  Setelah pembayaran disetujui, kode muncul di status pembayaran
                  dan dikirim lewat WhatsApp. Simpan kode sampai masa aktif
                  selesai.
                </p>
              </div>

              <div className="mt-6 border border-[#BF3131]/20 bg-[#FEF3E2] p-4 text-sm leading-relaxed text-[#5B3A32]">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#BF3131]">
                  Catatan
                </p>
                <p className="mt-2">
                  Kode bisa dipakai di beberapa perangkat selama masa aktif.
                  Jangan bagikan kode ke orang lain.
                </p>
              </div>
            </aside>
          </div>

          <div className="h-px w-full bg-[#BF3131]/25" />
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                title: "Bayar sekali",
                body: "Satu pembayaran untuk satu paket, bukan per frame.",
              },
              {
                title: "Satu kode",
                body: "Kode yang sama membuka semua frame di paket ini.",
              },
              {
                title: "Mulai saat dipakai",
                body: "Masa aktif tidak berkurang sebelum kode pertama dipakai.",
              },
            ].map((item, index) => (
              <div
                key={item.title}
                suppressHydrationWarning
                data-aos="lab-focus"
                data-aos-duration="900"
                data-aos-delay={index * 80}
                className="border-t border-[#BF3131]/25 pt-4"
              >
                <h2 className="text-lg font-bold tracking-[-0.02em] text-[#2A0A0A]">
                  {item.title}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-[#5B3A32]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <AosRefresh />
    </div>
  );
}
