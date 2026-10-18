import "server-only";

import { connection } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  isSupabaseAdminConfigured,
  warnSupabaseNotConfigured,
} from "@/lib/supabase/config";

export type DashboardTransaction = {
  id: number;
  order_id: string;
  customer_name: string;
  frame_name: string | null;
  amount: number;
  status: string;
  created_at: string;
};

export type DashboardTestimonial = {
  id: number;
  rating: number;
  emoji: string | null;
  name: string | null;
  message: string | null;
  frame_name: string | null;
  created_at: string;
};

export type DashboardData = {
  transactionStats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    today: number;
    last24h: number;
  };
  revenueStats: { today: number; thisMonth: number; total: number };
  recentTransactions: DashboardTransaction[];
  pendingTransactions: DashboardTransaction[];
  testimoniStats: {
    total: number;
    today: number;
    last24h: number;
    average: number;
    byRating: Record<number, number>;
  };
  recentTestimoni: DashboardTestimonial[];
};

function startOfToday(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function emptyData(): DashboardData {
  return {
    transactionStats: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      today: 0,
      last24h: 0,
    },
    revenueStats: { today: 0, thisMonth: 0, total: 0 },
    recentTransactions: [],
    pendingTransactions: [],
    testimoniStats: {
      total: 0,
      today: 0,
      last24h: 0,
      average: 0,
      byRating: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    },
    recentTestimoni: [],
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  await connection();
  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return emptyData();
  }
  const supabase = createAdminClient();

  const [transactionResult, testimonialResult] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, order_id, customer_name, frame_id, amount, status, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("testimonials")
      .select("id, rating, emoji, name, message, frame_id, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const transactions = transactionResult.data ?? [];
  const testimonials = testimonialResult.data ?? [];

  const frameIds = new Set<number>();
  for (const row of transactions) {
    if (row.frame_id !== null) frameIds.add(row.frame_id);
  }
  for (const row of testimonials) {
    if (row.frame_id !== null) frameIds.add(row.frame_id);
  }
  const frameMap = new Map<number, string>();
  if (frameIds.size > 0) {
    const { data: frames } = await supabase
      .from("frames")
      .select("id, name")
      .in("id", Array.from(frameIds));
    for (const frame of frames ?? []) {
      frameMap.set(frame.id, frame.name);
    }
  }

  const now = Date.now();
  const todayStart = startOfToday();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

  const transactionStats = {
    total: transactions.length,
    pending: 0,
    approved: 0,
    rejected: 0,
    today: 0,
    last24h: 0,
  };
  const revenueStats = { today: 0, thisMonth: 0, total: 0 };

  const toDashboardTransaction = (row: (typeof transactions)[number]) => ({
    id: row.id,
    order_id: row.order_id,
    customer_name: row.customer_name,
    frame_name: row.frame_id !== null ? frameMap.get(row.frame_id) ?? null : null,
    amount: Number(row.amount),
    status: row.status,
    created_at: row.created_at,
  });

  const recentTransactions: DashboardTransaction[] = [];
  const pendingTransactions: DashboardTransaction[] = [];

  for (const row of transactions) {
    if (row.status === "pending") transactionStats.pending += 1;
    else if (row.status === "approved") transactionStats.approved += 1;
    else if (row.status === "rejected") transactionStats.rejected += 1;

    const created = new Date(row.created_at).getTime();
    if (created >= todayStart) transactionStats.today += 1;
    if (created >= dayAgo) {
      transactionStats.last24h += 1;
      if (recentTransactions.length < 5) {
        recentTransactions.push(toDashboardTransaction(row));
      }
    }
    if (row.status === "pending" && pendingTransactions.length < 10) {
      pendingTransactions.push(toDashboardTransaction(row));
    }

    if (row.status === "approved") {
      const amount = Number(row.amount);
      revenueStats.total += amount;
      if (created >= todayStart) revenueStats.today += amount;
      if (created >= monthStart) revenueStats.thisMonth += amount;
    }
  }

  const testimoniStats = {
    total: testimonials.length,
    today: 0,
    last24h: 0,
    average: 0,
    byRating: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>,
  };
  let ratingSum = 0;
  const recentTestimoni: DashboardTestimonial[] = [];

  for (const row of testimonials) {
    ratingSum += row.rating;
    testimoniStats.byRating[row.rating] = (testimoniStats.byRating[row.rating] ?? 0) + 1;
    const created = new Date(row.created_at).getTime();
    if (created >= todayStart) testimoniStats.today += 1;
    if (created >= dayAgo) testimoniStats.last24h += 1;
    if (recentTestimoni.length < 5) {
      recentTestimoni.push({
        id: row.id,
        rating: row.rating,
        emoji: row.emoji,
        name: row.name,
        message: row.message,
        frame_name: row.frame_id !== null ? frameMap.get(row.frame_id) ?? null : null,
        created_at: row.created_at,
      });
    }
  }
  testimoniStats.average =
    testimonials.length > 0
      ? Math.round((ratingSum / testimonials.length) * 10) / 10
      : 0;

  return {
    transactionStats,
    revenueStats,
    recentTransactions,
    pendingTransactions,
    testimoniStats,
    recentTestimoni,
  };
}
