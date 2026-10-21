import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import {
  BoothClient,
  type BoothFrame,
} from "@/components/public/booth/booth-client";
import { FRAME_STANDARD_SIZE } from "@/lib/constants";
import { getApprovedTransaction, getFrameById } from "@/lib/frames/queries";
import { getFramePublicUrl } from "@/lib/frames/url";
import { getPremiumAccessExpiryForFrame } from "@/lib/premium/queries";
import { getPremiumAccessToken } from "@/lib/premium/session";

export const metadata: Metadata = {
  title: "Photo Strip Booth",
};

/**
 * Guard booth membaca `searchParams` + query transaksi (per-request) dan bisa
 * melakukan redirect, jadi halaman ini memang memblokir (bukan shell statis).
 */
export const instant = false;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function BoothPage({ searchParams }: PageProps<"/booth">) {
  const params = await searchParams;
  const frameIdParam = firstValue(params.frame_id);
  const orderIdParam = firstValue(params.order_id);
  const frameId = frameIdParam ? Number(frameIdParam) : Number.NaN;

  if (!frameIdParam || !Number.isInteger(frameId) || frameId <= 0) {
    redirect("/");
  }

  const frame = await getFrameById(frameId);
  if (!frame) {
    notFound();
  }

  const isFree = frame.access_type === "free";
  let accessExpiresAt: string | null = null;

  if (!isFree) {
    const token = await getPremiumAccessToken();
    const packExpiresAt = token
      ? await getPremiumAccessExpiryForFrame(token, frameId)
      : null;
    const hasLegacyAccess = orderIdParam
      ? Boolean(await getApprovedTransaction(orderIdParam, frameId))
      : false;

    if (!packExpiresAt && !hasLegacyAccess) {
      redirect("/premium");
    }

    accessExpiresAt = hasLegacyAccess ? null : packExpiresAt;
  }

  const boothFrame: BoothFrame = {
    id: frame.id,
    name: frame.name,
    imageUrl: frame.image_path ? getFramePublicUrl(frame.image_path) : null,
    width: frame.width || FRAME_STANDARD_SIZE.width,
    height: frame.height || FRAME_STANDARD_SIZE.height,
    slots: frame.slots,
    isFree,
  };

  return (
    <BoothClient
      frame={boothFrame}
      orderId={isFree ? null : (orderIdParam ?? null)}
      accessExpiresAt={accessExpiresAt}
    />
  );
}
