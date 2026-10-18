import type { ReactNode } from "react";

import { connection } from "next/server";

import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/supabase/auth";

// Seluruh panel admin butuh sesi (cookies) sehingga tidak bisa diprerender.
export const instant = false;

export default async function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  await connection();
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-neutral-100">
      <AdminNav adminName={admin.name} />
      {children}
    </div>
  );
}
