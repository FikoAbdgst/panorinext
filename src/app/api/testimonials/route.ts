import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type TestimonialPayload = {
  rating?: unknown;
  emoji?: unknown;
  name?: unknown;
  message?: unknown;
  frame_id?: unknown;
};

function asOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(request: Request) {
  let payload: TestimonialPayload;
  try {
    payload = (await request.json()) as TestimonialPayload;
  } catch {
    return NextResponse.json(
      { success: false, message: "Data tidak valid" },
      { status: 400 },
    );
  }

  const rating = Number(payload.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { success: false, message: "Data tidak valid", errors: { rating: ["rating 1-5 wajib"] } },
      { status: 400 },
    );
  }

  const emoji = asOptionalString(payload.emoji);
  if (emoji && emoji.length > 10) {
    return NextResponse.json(
      { success: false, message: "Data tidak valid", errors: { emoji: ["maksimal 10 karakter"] } },
      { status: 400 },
    );
  }

  const name = asOptionalString(payload.name);
  if (name && name.length > 100) {
    return NextResponse.json(
      { success: false, message: "Data tidak valid", errors: { name: ["maksimal 100 karakter"] } },
      { status: 400 },
    );
  }

  const message = asOptionalString(payload.message);
  if (message && message.length > 500) {
    return NextResponse.json(
      { success: false, message: "Data tidak valid", errors: { message: ["maksimal 500 karakter"] } },
      { status: 400 },
    );
  }

  const frameId =
    payload.frame_id === null || payload.frame_id === undefined || payload.frame_id === ""
      ? null
      : Number(payload.frame_id);
  if (frameId !== null && !Number.isInteger(frameId)) {
    return NextResponse.json(
      { success: false, message: "Data tidak valid", errors: { frame_id: ["frame_id tidak valid"] } },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("testimonials")
      .insert({
        rating,
        emoji,
        name: name ?? "Anonymous",
        message,
        frame_id: frameId,
      })
      .select("id, rating, name")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: "Terjadi kesalahan server", error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Testimoni berhasil disimpan",
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan server",
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
