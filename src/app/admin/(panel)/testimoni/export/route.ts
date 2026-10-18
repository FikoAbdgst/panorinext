import { NextResponse } from "next/server";

import { getAdminOrNull } from "@/lib/supabase/auth";
import { listAdminTestimonials } from "@/lib/testimonials/queries";

function csvCell(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

export async function GET(request: Request) {
  const admin = await getAdminOrNull();
  if (!admin) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const { searchParams } = new URL(request.url);
  const ratingRaw = searchParams.get("rating");
  const rating = ratingRaw ? Number(ratingRaw) : undefined;
  const search = searchParams.get("search") ?? undefined;

  const testimonials = await listAdminTestimonials({
    rating: rating && Number.isInteger(rating) ? rating : undefined,
    search: search || undefined,
  });

  const lines = ["\uFEFFNama,Rating,Pesan,Tanggal"];
  for (const item of testimonials) {
    lines.push(
      [
        csvCell(item.name ?? "Anonymous"),
        String(item.rating),
        csvCell(item.message),
        csvCell(formatDate(item.created_at)),
      ].join(","),
    );
  }

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="testimoni_${stamp}.csv"`,
    },
  });
}
