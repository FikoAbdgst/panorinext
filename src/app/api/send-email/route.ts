import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

import { STORAGE_BUCKETS } from "@/lib/constants"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  isSupabaseAdminConfigured,
  warnSupabaseNotConfigured,
} from "@/lib/supabase/config"

const MAX_FILE_BYTES = 10 * 1024 * 1024

const EMAIL_SUBJECT = "Foto dan GIF kamu dari PanoriCam sudah siap 📸"

const EMAIL_TEXT = `
Hai!

Terima kasih sudah mampir ke PanoriCam. Foto HD dan GIF animasi kamu
sudah kami lampirkan di email ini, tinggal diunduh dan disimpan.

Beberapa ide supaya hasilnya makin berkesan:

• Cetak fotonya. Hasil cetak selalu terasa beda dari sekadar di layar.
• Pakai GIF-nya untuk Instagram Story atau status WhatsApp.
• Kirim ke teman atau keluarga yang ikut di momen itu.
• Simpan cadangannya di Google Drive atau iCloud supaya aman.

Kalau kamu share hasilnya di media sosial, tag kami di @panoricam.
Kami senang sekali bisa lihat momen kamu.

Sampai jumpa di sesi foto berikutnya!

Salam hangat,
Tim PanoriCam

—
Email ini dikirim otomatis, jadi mohon tidak dibalas.
Butuh bantuan? Kunjungi panoricamofficial.com
`

/** Path yang dibuat oleh `/api/send-email/upload-urls`. */
const PHOTO_PATH_PATTERN =
  /^photo-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/
const GIF_PATH_PATTERN =
  /^gif-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.gif$/

type SendEmailPayload = {
  email?: unknown
  frame_id?: unknown
  photo_path?: unknown
  gif_path?: unknown
}

function fail(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status })
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function readPath(value: unknown, pattern: RegExp): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed.length > 200 || trimmed.includes("..")) {
    return null
  }
  return pattern.test(trimmed) ? trimmed : null
}

export async function POST(request: Request) {
  let payload: SendEmailPayload
  try {
    payload = (await request.json()) as SendEmailPayload
  } catch {
    return fail("Gagal mengirim email: data tidak valid", 400)
  }

  const email = typeof payload.email === "string" ? payload.email.trim() : ""
  const frameId = Number(payload.frame_id)
  const photoPath = readPath(payload.photo_path, PHOTO_PATH_PATTERN)
  const gifPath = readPath(payload.gif_path, GIF_PATH_PATTERN)

  if (!isValidEmail(email)) {
    return fail("Gagal mengirim email: format email tidak valid", 400)
  }

  if (!Number.isInteger(frameId) || frameId <= 0) {
    return fail("Gagal mengirim email: frame tidak valid", 400)
  }

  if (!photoPath || !gifPath) {
    return fail("Gagal mengirim email: berkas tidak valid", 400)
  }

  const gmailUser = process.env.GMAIL_USER?.trim()
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "")
  if (!gmailUser || !gmailAppPassword) {
    return fail(
      "Gagal mengirim email: Masalah konfigurasi email server. Silakan hubungi admin.",
      500,
    )
  }

  if (!isSupabaseAdminConfigured()) {
    warnSupabaseNotConfigured()
    return fail("Gagal mengirim email: penyimpanan belum dikonfigurasi.", 503)
  }

  const supabase = createAdminClient()
  const bucket = supabase.storage.from(STORAGE_BUCKETS.photoResults)

  try {
    const [photoDownload, gifDownload] = await Promise.all([
      bucket.download(photoPath),
      bucket.download(gifPath),
    ])

    if (photoDownload.error || !photoDownload.data) {
      return fail("Gagal mengirim email: foto tidak ditemukan.", 400)
    }
    if (gifDownload.error || !gifDownload.data) {
      return fail("Gagal mengirim email: GIF tidak ditemukan.", 400)
    }

    if (
      photoDownload.data.size > MAX_FILE_BYTES ||
      gifDownload.data.size > MAX_FILE_BYTES
    ) {
      return fail("Gagal mengirim email: ukuran file melebihi 10MB", 400)
    }

    const [photoBuffer, gifBuffer] = await Promise.all([
      photoDownload.data.arrayBuffer(),
      gifDownload.data.arrayBuffer(),
    ])

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: gmailUser, pass: gmailAppPassword },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    })

    const from = process.env.EMAIL_FROM?.trim() || `PanoriCam <${gmailUser}>`

    await transporter.sendMail({
      from,
      to: email,
      subject: EMAIL_SUBJECT,
      text: EMAIL_TEXT,
      attachments: [
        {
          filename: "Panoricam💫.png",
          content: Buffer.from(photoBuffer),
          contentType: "image/png",
        },
        {
          filename: "PanoricamGif✨.gif",
          content: Buffer.from(gifBuffer),
          contentType: "image/gif",
        },
      ],
    })

    return NextResponse.json({
      success: true,
      message: `Foto HD dan GIF animasi berhasil dikirim ke email ${email}`,
    })
  } catch (error) {
    return fail(
      `Gagal mengirim email: ${
        error instanceof Error ? error.message : "kesalahan tidak diketahui"
      }`,
      500,
    )
  } finally {
    // photo-results hanya berfungsi sebagai perantara sementara untuk email.
    await bucket.remove([photoPath, gifPath])
  }
}
