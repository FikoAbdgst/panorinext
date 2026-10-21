import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  isSupabaseAdminConfigured,
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

  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return NextResponse.json(
      { success: false, message: "Transaksi tidak ditemukan." },
      { status: 404 },
    );
  }

  try {
    const supabase = createAdminClient();
    const { data: transaction, error } = await supabase
      .from("transactions")
      .select("id, status, pack_id")
      .eq("order_id", orderId)
      .maybeSingle();

    if (error || !transaction) {
      return NextResponse.json(
        { success: false, message: "Transaksi tidak ditemukan." },
        { status: 404 },
      );
    }

    let roomCode: string | null = null;
    let packName: string | null = null;

    if (transaction.status === "approved" && transaction.pack_id !== null) {
      const [{ data: access }, { data: pack }] = await Promise.all([
        supabase
          .from("premium_access")
          .select("code")
          .eq("transaction_id", transaction.id)
          .maybeSingle(),
        supabase
          .from("packs")
          .select("name")
          .eq("id", transaction.pack_id)
          .maybeSingle(),
      ]);
      roomCode = access?.code ?? null;
      packName = pack?.name ?? null;
    }

    return NextResponse.json({
      success: true,
      status: transaction.status,
      room_code: roomCode,
      pack_id: transaction.pack_id,
      pack_name: packName,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Transaksi tidak ditemukan." },
      { status: 404 },
    );
  }
}
