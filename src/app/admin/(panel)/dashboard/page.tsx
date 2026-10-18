import Link from "next/link";
import { Suspense } from "react";

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
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500">Ringkasan transaksi dan testimoni.</p>
      </header>

      <Suspense fallback={<p className="text-sm text-neutral-500">Memuat dashboard...</p>}>
        <DashboardContent />
      </Suspense>
    </main>
  );
}

async function DashboardContent() {
  const data = await getDashboardData();
  const { transactionStats, revenueStats, testimoniStats } = data;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-semibold text-neutral-800">Transaksi</h2>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total" value={String(transactionStats.total)} />
          <StatCard label="Pending" value={String(transactionStats.pending)} accent="amber" />
          <StatCard label="Disetujui" value={String(transactionStats.approved)} accent="green" />
          <StatCard label="Ditolak" value={String(transactionStats.rejected)} accent="red" />
          <StatCard label="Hari Ini" value={String(transactionStats.today)} />
          <StatCard label="24 Jam" value={String(transactionStats.last24h)} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-neutral-800">Pendapatan</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Hari Ini" value={formatRupiah(revenueStats.today)} />
          <StatCard label="Bulan Ini" value={formatRupiah(revenueStats.thisMonth)} />
          <StatCard label="Total" value={formatRupiah(revenueStats.total)} accent="green" />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-800">Transaksi Pending</h2>
          <Link
            href={{ pathname: "/admin/transactions", query: { status: "pending" } }}
            className="text-sm text-[#BF3131] underline"
          >
            Lihat semua
          </Link>
        </div>
        <TransactionList rows={data.pendingTransactions} empty="Tidak ada transaksi pending." />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-neutral-800">Transaksi 24 Jam Terakhir</h2>
        <TransactionList rows={data.recentTransactions} empty="Belum ada transaksi dalam 24 jam." />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold text-neutral-800">Testimoni</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Total" value={String(testimoniStats.total)} />
            <StatCard label="Rata-rata" value={testimoniStats.average.toFixed(1)} />
            <StatCard label="Hari Ini" value={String(testimoniStats.today)} />
            <StatCard label="24 Jam" value={String(testimoniStats.last24h)} />
          </div>
          <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
            <p className="mb-2 text-sm font-medium text-neutral-700">Distribusi Rating</p>
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = testimoniStats.byRating[star] ?? 0;
                const percent =
                  testimoniStats.total > 0 ? (count / testimoniStats.total) * 100 : 0;
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

        <div>
          <h2 className="mb-3 text-lg font-semibold text-neutral-800">Testimoni Terbaru</h2>
          {data.recentTestimoni.length === 0 ? (
            <p className="rounded-lg border border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-500">
              Belum ada testimoni.
            </p>
          ) : (
            <ul className="space-y-3">
              {data.recentTestimoni.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-neutral-200 bg-white p-4 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-neutral-800">
                      {item.emoji ? `${item.emoji} ` : ""}
                      {item.name ?? "Anonymous"}
                    </span>
                    <span className="text-amber-500">{"★".repeat(item.rating)}</span>
                  </div>
                  <p className="mt-1 text-neutral-600">{item.message ?? "—"}</p>
                  <p className="mt-1 text-xs text-neutral-400">
                    {item.frame_name ? `${item.frame_name} · ` : ""}
                    {formatDate(item.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
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
    return (
      <p className="rounded-lg border border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-500">
        {empty}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
      <table className="min-w-full divide-y divide-neutral-200 text-sm">
        <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
          <tr>
            <th className="px-4 py-3">Order ID</th>
            <th className="px-4 py-3">Pemesan</th>
            <th className="px-4 py-3">Frame</th>
            <th className="px-4 py-3">Jumlah</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Tanggal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3 font-mono text-xs text-neutral-700">{row.order_id}</td>
              <td className="px-4 py-3 text-neutral-700">{row.customer_name}</td>
              <td className="px-4 py-3 text-neutral-600">{row.frame_name ?? "—"}</td>
              <td className="px-4 py-3 text-neutral-700">{formatRupiah(row.amount)}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    STATUS_CLASS[row.status] ?? "bg-neutral-100 text-neutral-700"
                  }`}
                >
                  {STATUS_LABEL[row.status] ?? row.status}
                </span>
              </td>
              <td className="px-4 py-3 text-neutral-500">{formatDate(row.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "amber" | "green" | "red";
}) {
  const accentClass =
    accent === "amber"
      ? "text-amber-600"
      : accent === "green"
        ? "text-green-600"
        : accent === "red"
          ? "text-red-600"
          : "text-neutral-900";

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accentClass}`}>{value}</p>
    </div>
  );
}
