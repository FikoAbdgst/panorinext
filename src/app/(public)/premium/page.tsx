import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AosRefresh } from "@/components/public/aos-refresh";
import { Footer } from "@/components/public/footer";
import { PackCard } from "@/components/public/premium/pack-card";
import { PremiumComingSoon } from "@/components/public/premium/premium-coming-soon";
import { RedeemForm } from "@/components/public/premium/redeem-form";
import { listPacks } from "@/lib/packs/queries";
import { PREMIUM_PUBLIC_ENABLED } from "@/lib/premium/availability";
import { getActivePremiumAccessByToken } from "@/lib/premium/queries";
import { getPremiumAccessToken } from "@/lib/premium/session";
import {
  buildAdminWhatsappUrl,
  WHATSAPP_TEMPLATES,
} from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: PREMIUM_PUBLIC_ENABLED
    ? "Ruang Premium"
    : "Ruang Premium - Segera Hadir",
  description: PREMIUM_PUBLIC_ENABLED
    ? "Buka satu paket frame premium PanoriCam dengan satu kode. Berlaku untuk kamera photo booth dan hasil tanpa watermark."
    : "Ruang Premium PanoriCam sedang disiapkan.",
  robots: PREMIUM_PUBLIC_ENABLED
    ? undefined
    : { index: false, follow: false },
};

const STEPS = [
  {
    number: "01",
    title: "Pilih paket",
    body: "Setiap paket berisi beberapa frame dengan satu tema. Lihat preview-nya dulu sebelum membeli.",
  },
  {
    number: "02",
    title: "Bayar & unggah bukti",
    body: "Pembayaran lewat e-wallet atau QRIS. Admin memeriksa bukti transfer secara manual.",
  },
  {
    number: "03",
    title: "Terima kode",
    body: "Setelah disetujui, kode 8 karakter muncul di status pembayaran dan dikirim lewat WhatsApp.",
  },
  {
    number: "04",
    title: "Masuk ruang",
    body: "Kode aktif saat pertama dipakai. Semua frame di paket itu terbuka sampai masa aktif habis.",
  },
] as const;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function PacksFallback() {
  return (
    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="animate-pulse border border-[#BF3131]/10 bg-[#FFFBF3] p-3"
        >
          <div className="grid grid-cols-3 gap-1.5">
            {[0, 1, 2].map((preview) => (
              <div key={preview} className="aspect-[4/5] bg-[#BF3131]/10" />
            ))}
          </div>
          <div className="mt-4 h-6 w-2/3 bg-[#BF3131]/10" />
          <div className="mt-2 h-3 w-1/2 bg-[#BF3131]/10" />
          <div className="mt-5 h-11 w-full bg-[#BF3131]/10" />
        </div>
      ))}
    </div>
  );
}

export default function PremiumPage() {
  if (!PREMIUM_PUBLIC_ENABLED) {
    return <PremiumComingSoon />;
  }

  return (
    <div id="top" className="min-h-screen bg-[#FEF3E2] font-['Poppins']">
      <section className="relative overflow-hidden pt-28 sm:pt-32">
        <div aria-hidden="true" className="lab-paper absolute inset-0 opacity-60" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 pb-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-center lg:gap-16 sm:pb-16">
            <div>
              <p
                suppressHydrationWarning
                data-aos="lab-focus"
                data-aos-duration="900"
                className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#BF3131]"
              >
                Ruang premium / PanoriCam
              </p>
              <h1
                suppressHydrationWarning
                data-aos="lab-sweep"
                data-aos-duration="1100"
                className="mt-4 text-balance text-[2.6rem] font-extrabold leading-[0.93] tracking-[-0.055em] text-[#2A0A0A] min-[380px]:text-[2.9rem] sm:text-6xl lg:text-[4.2rem]"
              >
                Satu kode.
                <br />
                <span className="text-[#BF3131]">Semua frame di paketmu.</span>
              </h1>
              <p
                suppressHydrationWarning
                data-aos="lab-focus"
                data-aos-duration="1000"
                data-aos-delay="140"
                className="mt-6 max-w-xl text-pretty text-sm leading-relaxed text-[#5B3A32] sm:text-base"
              >
                Beli paket frame premium, terima satu kode, lalu pakai semua
                frame di dalamnya. Kode aktif saat pertama kali dipakai dan
                berlaku sampai masa aktif paket habis.
              </p>

              <div
                suppressHydrationWarning
                data-aos="lab-pop"
                data-aos-duration="1000"
                data-aos-delay="240"
                className="mt-8 flex flex-wrap items-center gap-4"
              >
                <a
                  href="#paket"
                  className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#BF3131] px-6 py-3.5 text-sm font-semibold text-[#FEF3E2] shadow-[4px_4px_0_#7A1C1C] transition duration-300 hover:-translate-y-0.5 hover:bg-[#A02828] hover:shadow-[5px_5px_0_#7A1C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"
                >
                  Lihat paket
                  <span aria-hidden="true" className="h-px w-5 bg-current" />
                </a>
                <a
                  href="#masuk"
                  className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#BF3131]/35 px-5 py-3.5 text-sm font-semibold text-[#BF3131] transition duration-300 hover:border-[#BF3131] hover:bg-[#BF3131]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"
                >
                  Sudah punya kode
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A5A50]">
                <span>Tanpa watermark</span>
                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[#BF3131]/50" />
                <span>PNG / GIF</span>
                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[#BF3131]/50" />
                <span>Multi-perangkat</span>
              </div>
            </div>

            <div
              id="masuk"
              suppressHydrationWarning
              data-aos="lab-develop"
              data-aos-duration="1200"
              data-aos-delay="180"
              className="relative mx-auto w-full max-w-md scroll-mt-28 lg:mx-0 lg:justify-self-end"
            >
              <div
                aria-hidden="true"
                className="absolute -left-3 top-8 h-full w-full border border-[#BF3131]/20 bg-[#BF3131]/5"
              />
              <div className="relative border border-[#BF3131]/30 bg-[#FFFBF3] p-5 shadow-[8px_8px_0_rgba(122,28,28,0.12)] sm:p-7">
                <div className="flex items-center justify-between border-b border-dashed border-[#BF3131]/25 pb-3 text-[9px] font-bold uppercase tracking-[0.18em] text-[#7A5A50]">
                  <span>Tiket ruang premium</span>
                  <span className="text-[#BF3131]">PanoriCam</span>
                </div>

                <Suspense fallback={<p className="mt-5 text-sm text-[#7A5A50]">Memeriksa akses...</p>}>
                  <AccessPanel />
                </Suspense>

                <div className="mt-6 border-t border-dashed border-[#BF3131]/25 pt-4 text-xs leading-relaxed text-[#7A5A50]">
                  Kode bisa dipakai di beberapa perangkat selama masa aktif masih
                  berjalan. Jangan bagikan kode ke orang lain.
                </div>
              </div>

              <span
                aria-hidden="true"
                className="absolute -bottom-3 -right-2 -rotate-6 border border-[#BF3131] bg-[#FEF3E2] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#BF3131] shadow-[3px_3px_0_rgba(191,49,49,0.16)]"
              >
                Private access
              </span>
            </div>
          </div>

          <div className="h-px w-full bg-[#BF3131]/25" />
        </div>
      </section>

      <section id="paket" className="relative scroll-mt-24 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                suppressHydrationWarning
                data-aos="lab-sweep"
                data-aos-duration="1100"
                className="text-3xl font-extrabold leading-[0.96] tracking-[-0.045em] text-[#2A0A0A] sm:text-5xl"
              >
                Pilih paketmu.
              </h2>
              <p
                suppressHydrationWarning
                data-aos="lab-focus"
                data-aos-duration="1000"
                data-aos-delay="120"
                className="mt-3 max-w-xl text-sm leading-relaxed text-[#5B3A32]"
              >
                Satu paket berisi beberapa frame. Semua frame di paket itu
                terbuka dengan kode yang sama.
              </p>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A5A50]">
              Preview diberi watermark
            </p>
          </div>

          <Suspense fallback={<PacksFallback />}>
            <PackGrid />
          </Suspense>
        </div>
      </section>

      <section className="relative border-y border-[#BF3131]/20 bg-[#FFFBF3] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <h2
                suppressHydrationWarning
                data-aos="lab-sweep"
                data-aos-duration="1100"
                className="max-w-md text-balance text-3xl font-extrabold leading-[0.96] tracking-[-0.045em] text-[#2A0A0A] sm:text-5xl"
              >
                Dari kode
                <br />
                <span className="text-[#BF3131]">sampai pose.</span>
              </h2>
              <p
                suppressHydrationWarning
                data-aos="lab-focus"
                data-aos-duration="1000"
                data-aos-delay="140"
                className="mt-4 max-w-sm text-sm leading-relaxed text-[#5B3A32]"
              >
                Prosesnya singkat. Admin memeriksa pembayaran, lalu kode dikirim
                lewat WhatsApp dan muncul di halaman status.
              </p>
            </div>

            <ol className="border-t border-[#BF3131]/25">
              {STEPS.map((step, index) => (
                <li
                  key={step.number}
                  suppressHydrationWarning
                  data-aos="lab-focus"
                  data-aos-duration="900"
                  data-aos-delay={100 + index * 80}
                  className="grid gap-2 border-b border-[#BF3131]/25 py-5 sm:grid-cols-[3.5rem_1fr] sm:gap-6 sm:py-6"
                >
                  <span className="font-mono text-xs font-bold text-[#BF3131]">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold tracking-[-0.02em] text-[#2A0A0A]">
                      {step.title}
                    </h3>
                    <p className="mt-1 max-w-lg text-sm leading-relaxed text-[#5B3A32]">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#2A0A0A] py-16 text-[#FEF3E2] sm:py-20">
        <div aria-hidden="true" className="lab-dots-cream absolute inset-0 opacity-30" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16">
            <div>
              <h2
                suppressHydrationWarning
                data-aos="lab-sweep"
                data-aos-duration="1100"
                className="max-w-2xl text-balance text-3xl font-extrabold leading-[0.96] tracking-[-0.045em] sm:text-5xl"
              >
                Butuh paket dengan tema sendiri?
              </h2>
              <p
                suppressHydrationWarning
                data-aos="lab-focus"
                data-aos-duration="1000"
                data-aos-delay="140"
                className="mt-4 max-w-xl text-sm leading-relaxed text-[#FEF3E2]/80 sm:text-base"
              >
                Kirim tema, warna, dan jumlah frame. Kami susun paket custom
                untuk acara atau brand kamu.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a
                href={buildAdminWhatsappUrl(WHATSAPP_TEMPLATES.premiumPack)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#BF3131] px-6 py-3.5 text-sm font-semibold text-[#FEF3E2] shadow-[4px_4px_0_#7A1C1C] transition duration-300 hover:-translate-y-0.5 hover:bg-[#A02828] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FEF3E2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2A0A0A]"
              >
                Konsultasi paket custom
              </a>
              <Link
                href="/frame"
                className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#FEF3E2]/40 px-6 py-3.5 text-sm font-semibold text-[#FEF3E2] transition duration-300 hover:bg-[#FEF3E2]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FEF3E2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2A0A0A]"
              >
                Lihat frame gratis
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <AosRefresh />
    </div>
  );
}

async function AccessPanel() {
  const token = await getPremiumAccessToken();
  const access = await getActivePremiumAccessByToken(token);

  if (access) {
    return (
      <div className="mt-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#BF3131]">
          Ruang aktif
        </p>
        <p className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-[#2A0A0A]">
          {access.pack_name}
        </p>
        <p className="mt-1 text-sm text-[#5B3A32]">
          Aktif sampai {formatDate(access.expires_at)}
        </p>
        <Link
          href="/premium/room"
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center bg-[#BF3131] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-[#FEF3E2] shadow-[4px_4px_0_#7A1C1C] transition hover:-translate-y-0.5 hover:bg-[#A02828]"
        >
          Buka ruang premium
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <RedeemForm compact />
    </div>
  );
}

async function PackGrid() {
  const packs = await listPacks({ activeOnly: true });

  if (packs.length === 0) {
    return (
      <div className="mt-10 border border-dashed border-[#BF3131]/30 bg-[#FFFBF3] px-6 py-12 text-center">
        <p className="text-lg font-bold text-[#2A0A0A]">
          Paket premium belum tersedia.
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#5B3A32]">
          Sementara ini kamu bisa memakai frame gratis, atau tanyakan paket
          custom lewat WhatsApp.
        </p>
        <a
          href={buildAdminWhatsappUrl(WHATSAPP_TEMPLATES.premiumHelp)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex min-h-11 items-center justify-center border border-[#BF3131] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#BF3131] transition hover:bg-[#BF3131] hover:text-[#FEF3E2]"
        >
          Tanya admin
        </a>
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {packs.map((pack, index) => (
        <PackCard key={pack.id} pack={pack} index={index} />
      ))}
    </div>
  );
}
