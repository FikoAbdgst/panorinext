import { NextResponse } from "next/server";

import { STORAGE_BUCKETS } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isSupabaseAdminConfigured,
  warnSupabaseNotConfigured,
} from "@/lib/supabase/config";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const EMAIL_SUBJECT = "🎉 Kenangan Indah Anda Siap Disimpan! - PanoriCam";

/**
 * Body email plain text, disalin apa adanya dari
 * `App\Http\Controllers\DriveController::getEmailTemplateText()`.
 */
const EMAIL_TEXT = `
╔══════════════════════════════════════════╗
║   🎊 KENANGAN INDAH ANDA TELAH SIAP! 🎊   ║
╚══════════════════════════════════════════╝

Hai!

Yeay! Momen spesial Anda telah berhasil kami proses dengan sempurna!
Foto berkualitas tinggi dan GIF animasi Anda sudah siap untuk disimpan
dan dibagikan kepada orang-orang terkasih. ✨



🌟 REKOMENDASI DARI KAMI:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Cetak foto untuk hasil maksimal dengan kualitas premium
• Upload GIF ke Instagram Story dengan musik favorit
• Kirim ke keluarga & teman sebagai kejutan manis
• Backup file ke Google Drive atau iCloud
• Tag kami saat share di social media!📱(@panoricam && @csa_stimikmi)


Terima kasih sudah mempercayai PanoriCam untuk mengabadikan
momen berharga Anda. Kami senang bisa menjadi bagian dari
kenangan indah Anda! 💖

💡 PanoriCam merupakan salah satu project
dari anggota UKM Creative Student Association (CSA)
Follow Instagram: @csa_stmikmi


Sampai jumpa di momen spesial berikutnya!


Dengan cinta,
Tim PanoriCam 📷✨


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email ini dikirim otomatis. Mohon tidak membalas.
Butuh bantuan? Hubungi kami di panoricamofficial.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

/** Path yang dibuat oleh `/api/send-email/upload-urls`. */
const PHOTO_PATH_PATTERN =
  /^photo-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/;
const GIF_PATH_PATTERN =
  /^gif-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.gif$/;

type SendEmailPayload = {
  email?: unknown;
  frame_id?: unknown;
  photo_path?: unknown;
  gif_path?: unknown;
};

function fail(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function readPath(value: unknown, pattern: RegExp): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 200 || trimmed.includes("..")) {
    return null;
  }
  return pattern.test(trimmed) ? trimmed : null;
}

export async function POST(request: Request) {
  let payload: SendEmailPayload;
  try {
    payload = (await request.json()) as SendEmailPayload;
  } catch {
    return fail("Gagal mengirim email: data tidak valid", 400);
  }

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const frameId = Number(payload.frame_id);
  const photoPath = readPath(payload.photo_path, PHOTO_PATH_PATTERN);
  const gifPath = readPath(payload.gif_path, GIF_PATH_PATTERN);

  if (!isValidEmail(email)) {
    return fail("Gagal mengirim email: format email tidak valid", 400);
  }

  if (!Number.isInteger(frameId) || frameId <= 0) {
    return fail("Gagal mengirim email: frame tidak valid", 400);
  }

  if (!photoPath || !gifPath) {
    return fail("Gagal mengirim email: berkas tidak valid", 400);
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return fail(
      "Gagal mengirim email: Masalah konfigurasi email server. Silakan hubungi admin.",
      500,
    );
  }

  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured();
    return fail("Gagal mengirim email: penyimpanan belum dikonfigurasi.", 503);
  }

  const supabase = createAdminClient();
  const bucket = supabase.storage.from(STORAGE_BUCKETS.photoResults);

  try {
    const [photoDownload, gifDownload] = await Promise.all([
      bucket.download(photoPath),
      bucket.download(gifPath),
    ]);

    if (photoDownload.error || !photoDownload.data) {
      return fail("Gagal mengirim email: foto tidak ditemukan.", 400);
    }
    if (gifDownload.error || !gifDownload.data) {
      return fail("Gagal mengirim email: GIF tidak ditemukan.", 400);
    }

    if (
      photoDownload.data.size > MAX_FILE_BYTES ||
      gifDownload.data.size > MAX_FILE_BYTES
    ) {
      return fail("Gagal mengirim email: ukuran file melebihi 10MB", 400);
    }

    const [photoBuffer, gifBuffer] = await Promise.all([
      photoDownload.data.arrayBuffer(),
      gifDownload.data.arrayBuffer(),
    ]);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "PanoriCam <onboarding@resend.dev>",
        to: [email],
        subject: EMAIL_SUBJECT,
        text: EMAIL_TEXT,
        attachments: [
          {
            filename: "Panoricam💫.png",
            content: Buffer.from(photoBuffer).toString("base64"),
          },
          {
            filename: "PanoricamGif✨.gif",
            content: Buffer.from(gifBuffer).toString("base64"),
          },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return fail(
        `Gagal mengirim email: ${detail || "penyedia email menolak permintaan"}`,
        500,
      );
    }

    return NextResponse.json({
      success: true,
      message: `Foto HD dan GIF animasi berhasil dikirim ke email ${email}`,
    });
  } catch (error) {
    return fail(
      `Gagal mengirim email: ${
        error instanceof Error ? error.message : "kesalahan tidak diketahui"
      }`,
      500,
    );
  } finally {
    // photo-results hanya berfungsi sebagai perantara sementara untuk email.
    await bucket.remove([photoPath, gifPath]);
  }
}
