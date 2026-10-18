import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  isSupabaseConfigured,
  warnSupabaseNotConfigured,
} from "@/lib/supabase/config";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/payment-status/[orderId]">,
) {
  const { orderId } = await params;

  if (!orderId) {
    return NextResponse.json(
      { success: false, message: "Transaksi tidak ditemukan." },
      { status: 404 },
    );
  }

  if (!isSupabaseConfigured()) {
    warnSupabaseNotConfigured();
    return NextResponse.json(
      { success: false, message: "Transaksi tidak ditemukan." },
      { status: 404 },
    );
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_transaction_status", {
      p_order_id: orderId,
    });

    if (error) {
      return NextResponse.json(
        { success: false, message: "Transaksi tidak ditemukan." },
        { status: 404 },
      );
    }
    if (!data) {
      return NextResponse.json(
        { success: false, message: "Transaksi tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, status: data });
  } catch {
    return NextResponse.json(
      { success: false, message: "Transaksi tidak ditemukan." },
      { status: 404 },
    );
  }
}
