import type { FrameSlot } from "@/lib/frames/types";

export const PREMIUM_ACCESS_COOKIE = "panoricam_premium";

export type PackFrame = {
  id: number;
  name: string;
  slug: string;
  image_path: string | null;
  width: number;
  height: number;
  slots: FrameSlot[];
  category_id: number | null;
  category_name: string | null;
};

export type Pack = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  duration_days: number;
  is_active: boolean;
  sort_order: number;
  frames: PackFrame[];
};

export type PremiumAccessStatus = "unused" | "active" | "expired" | "revoked";

export type PremiumAccessRow = {
  id: number;
  transaction_id: number | null;
  pack_id: number;
  code: string;
  customer_name: string | null;
  whatsapp_number: string | null;
  first_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
  pack_name: string;
  pack_slug: string | null;
};

export type ActivePremiumAccess = {
  id: number;
  pack_id: number;
  pack_name: string;
  code: string;
  expires_at: string;
};

export function getPremiumAccessStatus(
  access: Pick<PremiumAccessRow, "first_used_at" | "expires_at" | "revoked_at">,
  now = Date.now(),
): PremiumAccessStatus {
  if (access.revoked_at) return "revoked";
  if (!access.first_used_at || !access.expires_at) return "unused";
  if (new Date(access.expires_at).getTime() <= now) return "expired";
  return "active";
}

export function normalizePremiumCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function formatPremiumCode(value: string): string {
  const normalized = normalizePremiumCode(value);
  return normalized.length === 8
    ? `${normalized.slice(0, 4)}-${normalized.slice(4)}`
    : normalized;
}

export function formatDurationDays(days: number): string {
  if (days === 1) return "1 hari";
  return `${days} hari`;
}
