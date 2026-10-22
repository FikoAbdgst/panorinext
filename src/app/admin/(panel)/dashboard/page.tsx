import Link from "next/link";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminLoading, AdminSection } from "@/components/admin/ui";
import { getDashboardData } from "@/lib/dashboard/queries";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  approved: "Disetujui",
  rejected: "Ditolak",
};

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700",
};

function formatRupiah(value: number): string {
  return `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminDashboardPage() {
  return (
    <>
      <AdminPageHeader
        title="Ringkasan"
        description="Pantau antrean transaksi, pendapatan, dan testimoni terbaru."
      />

      <Suspense fallback={<AdminLoading label="Memuat ringkasan..." />}>
        <DashboardContent />
      </Suspense>
    </>
  );
}

async function DashboardContent() {
  const data = await getDashboardData();
  const { transactionStats, revenueStats, testimoniStats } = data;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <section className="admin-card flex flex-col justify-between gap-5 p-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A5A50]">
              Perlu tindakan
            </p>
            {transactionStats.pending > 0 ? (
              <>
                <p className="mt-2 text-2xl font-bold tracking-[-0.02em] text-[#2A0A0A]">
                  {transactionStats.pending} transaksi menunggu verifikasi
                </p>
                <p className="mt-1 max-w-md text-sm leading-relaxed text-[#7A5A50]">
                  Buka bukti pembayaran lalu setujui atau tolak agar kode ruang
                  premium bisa dibagikan.
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 text-2xl font-bold tracking-[-0.02em] text-[#2A0A0A]">
                  Antrean bersih
                </p>
                <p className="mt-1 max-w-md text-sm leading-relaxed text-[#7A5A50]">
                  Tidak ada transaksi yang menunggu. Semua pembayaran sudah
                  ditinjau.
                </p>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={{
                pathname: "/admin/transactions",
                query: { status: "pending" },
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-[3px] bg-[#BF3131] px-4 text-sm font-semibold text-[#FEF3E2] transition hover:bg-[#A02828]"
            >
              {transactionStats.pending > 0
                ? `Tinjau ${transactionStats.pending} transaksi`
                : "Buka transaksi"}
            </Link>
            <Link
              href="/admin/rooms"
              className="inline-flex min-h-10 items-center gap-2 rounded-[3px] border border-[#2A0A0A]/15 px-4 text-sm font-semibold text-[#2A0A0A] transition hover:bg-[#2A0A0A]/5"
            >
              Ruang premium
            </Link>
          </div>
        </section>

        <section className="admin-card p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A5A50]">
            Pendapatan
          </p>
          <dl className="mt-3 space-y-2.5">
            <RevenueRow label="Hari ini" value={formatRupiah(revenueStats.today)} />
            <RevenueRow
              label="Bulan ini"
              value={formatRupiah(revenueStats.thisMonth)}
            />
            <RevenueRow
              label="Total"
              value={formatRupiah(revenueStats.total)}
              strong
            />
          </dl>
          <p className="mt-3 border-t border-[#2A0A0A]/8 pt-3 text-xs text-[#7A5A50]">
            Dihitung dari transaksi berstatus disetujui.
          </p>
        </section>
      </div>

      <section className="admin-card px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A5A50]">
          Transaksi
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
          <Metric label="Total" value={String(transactionStats.total)} />
          <Metric label="Pending" value={String(transactionStats.pending)} tone="warning" />
          <Metric
            label="Disetujui"
            value={String(transactionStats.approved)}
            tone="positive"
          />
          <Metric label="Ditolak" value={String(transactionStats.rejected)} tone="negative" />
          <Metric label="Hari ini" value={String(transactionStats.today)} />
          <Metric label="24 jam" value={String(transactionStats.last24h)} />
        </dl>
      </section>

      <AdminSection
        title="Transaksi pending"
        description="Antrean terbaru yang butuh keputusan."
        action={
          <Link
            href={{ pathname: "/admin/transactions", query: { status: "pending" } }}
            className="text-sm font-semibold text-[#BF3131] hover:text-[#7A1C1C]"
          >
            Lihat semua
          </Link>
        }
      >
        <TransactionList
          rows={data.pendingTransactions}
          empty="Tidak ada transaksi pending."
        />
      </AdminSection>

      <AdminSection
        title="Transaksi 24 jam terakhir"
        description="Aktivitas pembayaran terbaru."
      >
        <TransactionList
          rows={data.recentTransactions}
          empty="Belum ada transaksi dalam 24 jam."
        />
      </AdminSection>

      <AdminSection
        title="Testimoni"
        description="Umpan balik pengguna setelah sesi foto."
        action={
          <Link
            href="/admin/testimoni"
            className="text-sm font-semibold text-[#BF3131] hover:text-[#7A1C1C]"
          >
            Kelola testimoni
          </Link>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="admin-card p-5">
            <dl className="grid grid-cols-2 gap-y-4 sm:grid-cols-4">
              <Metric label="Total" value={String(testimoniStats.total)} />
              <Metric label="Rata-rata" value={testimoniStats.average.toFixed(1)} />
              <Metric label="Hari ini" value={String(testimoniStats.today)} />
              <Metric label="24 jam" value={String(testimoniStats.last24h)} />
            </dl>
            <div className="mt-4 space-y-1.5 border-t border-[#2A0A0A]/8 pt-4">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = testimoniStats.byRating[star] ?? 0;
                const percent =
                  testimoniStats.total > 0 ? (count / testimoniStats.total) * 100 : 0;
                return (
                  <div
                    key={star}
                    className="flex items-center gap-2 text-xs text-[#7A5A50]"
                  >
                    <span className="w-7 tabular-nums">{star} ★</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#2A0A0A]/8">
                      <span
                        className="block h-full rounded-full bg-[#BF3131]"
                        style={{ width: `${percent}%` }}
                      />
                    </span>
                    <span className="w-6 text-right tabular-nums text-[#2A0A0A]">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="admin-card p-5">
            {data.recentTestimoni.length === 0 ? (
              <p className="text-sm text-[#7A5A50]">Belum ada testimoni.</p>
            ) : (
              <ul className="space-y-3">
                {data.recentTestimoni.map((item) => (
                  <li
                    key={item.id}
                    className="border-b border-[#2A0A0A]/8 pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-semibold text-[#2A0A0A]">
                        {item.emoji ? `${item.emoji} ` : ""}
                        {item.name ?? "Anonymous"}
                      </span>
                      <span className="shrink-0 text-xs text-amber-500">
                        {"★".repeat(item.rating)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-[#5B3A32]">
                      {item.message ?? "—"}
                    </p>
                    <p className="mt-1 text-xs text-[#9A7568]">
                      {item.frame_name ? `${item.frame_name} · ` : ""}
                      {formatDate(item.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </AdminSection>
    </div>
  );
}

function RevenueRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-sm text-[#7A5A50]">{label}</dt>
      <dd
        className={`tabular-nums ${
          strong
            ? "text-lg font-bold text-[#2A0A0A]"
            : "text-base font-semibold text-[#2A0A0A]"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "warning" | "negative";
}) {
  const toneClass =
    tone === "positive"
      ? "text-[#1F7A45]"
      : tone === "warning"
        ? "text-[#B26A00]"
        : tone === "negative"
          ? "text-[#BF3131]"
          : "text-[#2A0A0A]";
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A5A50]">
        {label}
      </dt>
      <dd className={`mt-0.5 text-lg font-bold tabular-nums ${toneClass}`}>
        {value}
      </dd>
    </div>
  );
}

function TransactionList({
  rows,
  empty,
}: {
  rows: {
    id: number;
    order_id: string;
    customer_name: string;
    frame_name: string | null;
    amount: number;
    status: string;
    created_at: string;
  }[];
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="admin-empty">{empty}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Pemesan</th>
            <th>Paket / Frame</th>
            <th>Jumlah</th>
            <th>Status</th>
            <th>Tanggal</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="font-mono text-xs">{row.order_id}</td>
              <td>{row.customer_name}</td>
              <td>{row.frame_name ?? "—"}</td>
              <td className="tabular-nums">{formatRupiah(row.amount)}</td>
              <td>
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    STATUS_CLASS[row.status] ?? "bg-neutral-100 text-neutral-700"
                  }`}
                >
                  {STATUS_LABEL[row.status] ?? row.status}
                </span>
              </td>
              <td className="text-[#7A5A50]">{formatDate(row.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
