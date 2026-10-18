import Link from "next/link";
import { Suspense } from "react";

import { TransactionTable } from "@/components/admin/transactions/TransactionTable";
import {
  countTransactions,
  listTransactions,
  type TransactionCounts,
} from "@/lib/transactions/queries";

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
];

function tabCount(status: string, counts: TransactionCounts): number {
  if (status === "pending") return counts.pending;
  if (status === "approved") return counts.approved;
  if (status === "rejected") return counts.rejected;
  return counts.total;
}

export default function AdminTransactionsPage(
  props: PageProps<"/admin/transactions">,
) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Kelola Transaksi</h1>
        <p className="text-sm text-neutral-500">
          Tinjau bukti pembayaran lalu setujui atau tolak.
        </p>
      </header>

      <Suspense fallback={<p className="text-sm text-neutral-500">Memuat transaksi...</p>}>
        <TransactionsContent searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function TransactionsContent({
  searchParams,
}: Pick<PageProps<"/admin/transactions">, "searchParams">) {
  const params = await searchParams;
  const rawStatus = typeof params.status === "string" ? params.status : "all";
  const activeStatus = STATUS_FILTERS.some((item) => item.value === rawStatus)
    ? rawStatus
    : "all";

  const [transactions, counts] = await Promise.all([
    listTransactions(activeStatus),
    countTransactions(),
  ]);

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => {
          const isActive = filter.value === activeStatus;
          return (
            <Link
              key={filter.value}
              href={{
                pathname: "/admin/transactions",
                query: filter.value === "all" ? undefined : { status: filter.value },
              }}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                isActive
                  ? "border-[#BF3131] bg-[#BF3131] text-white"
                  : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              {filter.label} ({tabCount(filter.value, counts)})
            </Link>
          );
        })}
      </div>

      <TransactionTable transactions={transactions} />
    </>
  );
}
