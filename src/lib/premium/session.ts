import "server-only";

import { cookies } from "next/headers";

import { PREMIUM_ACCESS_COOKIE } from "@/lib/premium/types";

export async function getPremiumAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(PREMIUM_ACCESS_COOKIE)?.value ?? null;
}

export async function setPremiumAccessCookie(
  token: string,
  expiresAt: string,
): Promise<void> {
  const cookieStore = await cookies();
  const expiry = new Date(expiresAt).getTime();
  const maxAge = Number.isFinite(expiry)
    ? Math.max(0, Math.floor((expiry - Date.now()) / 1000))
    : 60 * 60 * 24;

  cookieStore.set(PREMIUM_ACCESS_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function clearPremiumAccessCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PREMIUM_ACCESS_COOKIE);
}
