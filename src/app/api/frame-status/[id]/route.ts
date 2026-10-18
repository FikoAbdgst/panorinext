import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  isSupabaseAdminConfigured,
  warnSupabaseNotConfigured,
} from "@/lib/supabase/config";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/frame-status/[id]">,
) {
  const { id } = await params;
  const frameId = Number(id);

  if (!Number.isInteger(frameId) || frameId <= 0) {
    return NextResponse.json(
      { success: false, message: "Frame tidak ditemukan." },
      { status: 404 },
    );
  }

  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return NextResponse.json(
      { success: false, message: "Frame tidak ditemukan." },
      { status: 404 },
    );
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("frames")
      .select("id, price")
      .eq("id", frameId)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        { success: false, message: "Frame tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: data.id,
      price: data.price,
      isFree: data.price <= 0,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Frame tidak ditemukan." },
      { status: 404 },
    );
  }
}
