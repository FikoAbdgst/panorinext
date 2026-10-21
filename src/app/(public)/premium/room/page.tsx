import type { Metadata } from "next";
import Link from "next/link";

import { leavePremiumRoomAction } from "@/app/(public)/premium/actions";
import { AosRefresh } from "@/components/public/aos-refresh";
import { Footer } from "@/components/public/footer";
import { PremiumComingSoon } from "@/components/public/premium/premium-coming-soon";
import { PremiumFramePreview } from "@/components/public/premium/frame-preview";
import { RedeemForm } from "@/components/public/premium/redeem-form";
import { PREMIUM_PUBLIC_ENABLED } from "@/lib/premium/availability";
import {
  getActivePremiumAccessByToken,
  listFramesForPremiumAccess,
} from "@/lib/premium/queries";
import { getPremiumAccessToken } from "@/lib/premium/session";
import { formatPremiumCode } from "@/lib/premium/types";
import {
  buildAdminWhatsappUrl,
  WHATSAPP_TEMPLATES,
} from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Ruang Premium",
  description: "Semua frame premium yang terbuka dengan kodemu.",
  robots: PREMIUM_PUBLIC_ENABLED
    ? undefined
    : { index: false, follow: false },
};

export const instant = false;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function PremiumRoomPage() {
  const token = await getPremiumAccessToken();
  const access = await getActivePremiumAccessByToken(token);

  if (!access) {
    return PREMIUM_PUBLIC_ENABLED ? <LockedRoom /> : <PremiumComingSoon />;
  }

  const frames = await listFramesForPremiumAccess(access.id);

  return (
    <div className="min-h-screen bg-[#FEF3E2] font-['Poppins']">
      <section className="relative overflow-hidden pt-28 sm:pt-32">
        <div aria-hidden="true" className="lab-paper absolute inset-0 opacity-60" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 border-b border-[#BF3131]/25 pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#BF3131]">
                Ruang premium aktif
              </p>
              <h1
                suppressHydrationWarning
                data-aos="lab-sweep"
                data-aos-duration="1100"
                className="mt-3 text-balance text-[2.4rem] font-extrabold leading-[0.94] tracking-[-0.05em] text-[#2A0A0A] sm:text-5xl"
              >
                {access.pack_name}
              </h1>
              <p className="mt-3 text-sm text-[#5B3A32]">
                Aktif sampai {formatDate(access.expires_at)}. Semua frame di
                paket ini sudah terbuka.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="border border-[#BF3131]/25 bg-[#FFFBF3] px-4 py-2">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#7A5A50]">
                  Kode
                </p>
                <p className="font-mono text-sm font-bold tracking-[0.14em] text-[#BF3131]">
                  {formatPremiumCode(access.code)}
                </p>
              </div>
              <form action={leavePremiumRoomAction}>
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center border border-[#BF3131]/30 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#BF3131] transition hover:bg-[#BF3131] hover:text-[#FEF3E2]"
                >
                  Keluar ruang
                </button>
              </form>
            </div>
          </div>

          <div className="py-10 sm:py-12">
            {frames.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
                {frames.map((frame, index) => (
                  <article
                    key={frame.id}
                    suppressHydrationWarning
                    data-aos="lab-develop"
                    data-aos-duration="900"
                    data-aos-delay={(index % 4) * 70}
                    className="group"
                  >
                    <PremiumFramePreview frame={frame} watermark={false} />
                    <div className="mt-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-bold text-[#2A0A0A]">
                          {frame.name}
                        </h2>
                        <p className="text-[10px] uppercase tracking-[0.12em] text-[#7A5A50]">
                          {frame.slots.length} slot
                          {frame.category_name ? ` · ${frame.category_name}` : ""}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/booth?frame_id=${frame.id}`}
                      className="mt-3 inline-flex min-h-10 w-full items-center justify-between gap-2 border border-[#BF3131] px-3 py-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[#BF3131] transition hover:bg-[#BF3131] hover:text-[#FEF3E2]"
                    >
                      Pakai frame
                      <span aria-hidden="true" className="h-px w-4 bg-current" />
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-[#BF3131]/30 bg-[#FFFBF3] px-6 py-12 text-center">
                <p className="text-lg font-bold text-[#2A0A0A]">
                  Frame paket belum tersedia.
                </p>
                <p className="mt-2 text-sm text-[#5B3A32]">
                  Hubungi admin agar isi paket bisa diperbarui.
                </p>
              </div>
            )}
          </div>

          <div className="pb-16">
            <Link
              href="/premium"
              className="text-sm font-semibold text-[#BF3131] underline-offset-4 hover:underline"
            >
              ← Kembali ke daftar paket
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <AosRefresh />
    </div>
  );
}

function LockedRoom() {
  return (
    <div className="min-h-screen bg-[#FEF3E2] font-['Poppins']">
      <section className="relative overflow-hidden pt-28 sm:pt-32">
        <div aria-hidden="true" className="lab-paper absolute inset-0 opacity-60" />

        <div className="relative mx-auto max-w-3xl px-4 pb-20 sm:px-6 lg:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#BF3131]">
            Ruang premium
          </p>
          <h1 className="mt-3 text-balance text-4xl font-extrabold leading-[0.95] tracking-[-0.05em] text-[#2A0A0A] sm:text-5xl">
            Masukkan kodemu untuk masuk.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#5B3A32] sm:text-base">
            Kode 8 karakter dikirim lewat WhatsApp setelah pembayaran paket
            disetujui. Kalau belum punya kode, lihat paket yang tersedia dulu.
          </p>

          <div className="mt-8 border border-[#BF3131]/25 bg-[#FFFBF3] p-5 shadow-[6px_6px_0_rgba(191,49,49,0.08)] sm:p-6">
            <RedeemForm />
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold">
            <Link
              href="/premium#paket"
              className="text-[#BF3131] underline-offset-4 hover:underline"
            >
              Lihat paket premium
            </Link>
            <a
              href={buildAdminWhatsappUrl(WHATSAPP_TEMPLATES.premiumRoom)}
              target="_blank"
              rel="noreferrer"
              className="text-[#7A5A50] underline-offset-4 hover:underline"
            >
              Hubungi admin
            </a>
          </div>
        </div>
      </section>

      <Footer />
      <AosRefresh />
    </div>
  );
}
