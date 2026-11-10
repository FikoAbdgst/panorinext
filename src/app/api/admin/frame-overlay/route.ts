import { NextResponse } from "next/server";

import { STORAGE_BUCKETS } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminOrNull } from "@/lib/supabase/auth";

/* Izinkan sub-folder untuk path lama, tetapi tetap tolak traversal. */
const IMAGE_PATH_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]*\.png$/;

/**
 * Proxy same-origin untuk membaca overlay PNG dari bucket privat/publik
 * `frames` atas nama admin yang sedang login.
 *
 * Dipakai form admin agar deteksi slot bisa membaca piksel gambar tanpa
 * terhalang CORS atau gangguan sesaat pada URL publik Supabase.
 */
export async function GET(request: Request) {
  const admin = await getAdminOrNull();
  if (!admin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const path = new URL(request.url).searchParams.get("path") ?? "";
  if (
    path.length === 0 ||
    path.length > 200 ||
    path.includes("..") ||
    !IMAGE_PATH_PATTERN.test(path)
  ) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.frames)
    .download(path);

  if (error || !data) {
    return new NextResponse("Not found", { status: 404 });
  }

  const bytes = new Uint8Array(await data.arrayBuffer());
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "image/png",
      /* Path overlay memakai UUID sehingga isinya tidak berubah; cache singkat
       * aman dan mengurangi panggilan auth saat form/editor dibuka. */
      "Cache-Control": "private, max-age=60",
    },
  });
}
