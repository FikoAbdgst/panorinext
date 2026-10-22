import type { ReactNode } from "react";

import { connection } from "next/server";

import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/supabase/auth";
import { countTransactions } from "@/lib/transactions/queries";

// Seluruh panel admin butuh sesi (cookies) sehingga tidak bisa diprerender.
export const instant = false;

export default async function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  await connection();
  const admin = await requireAdmin();
  const counts = await countTransactions();

  return (
    <AdminShell adminName={admin.name} pendingCount={counts.pending}>
      {children}
    </AdminShell>
  );
}
