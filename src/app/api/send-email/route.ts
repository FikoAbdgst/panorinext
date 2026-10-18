import { NextResponse } from "next/server";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/png", "image/jpg", "image/jpeg"];
const ALLOWED_GIF_TYPES = ["image/gif"];

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
Butuh bantuan? Hubungi kami di panoricam.impaxion.my.id
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidFrameId(value: string | null): boolean {
  if (!value) return false;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0;
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal mengirim email: data tidak valid" },
      { status: 400 },
    );
  }

  const email = String(formData.get("email") ?? "").trim();
  const frameId = formData.get("frame_id")?.toString() ?? null;
  const photo = formData.get("photo");
  const gif = formData.get("gif");

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { success: false, message: "Gagal mengirim email: format email tidak valid" },
      { status: 400 },
    );
  }

  if (!isValidFrameId(frameId)) {
    return NextResponse.json(
      { success: false, message: "Gagal mengirim email: frame tidak valid" },
      { status: 400 },
    );
  }

  if (!(photo instanceof File) || !ALLOWED_PHOTO_TYPES.includes(photo.type)) {
    return NextResponse.json(
      { success: false, message: "Gagal mengirim email: foto harus PNG/JPG" },
      { status: 400 },
    );
  }

  if (!(gif instanceof File) || !ALLOWED_GIF_TYPES.includes(gif.type)) {
    return NextResponse.json(
      { success: false, message: "Gagal mengirim email: GIF tidak valid" },
      { status: 400 },
    );
  }

  if (photo.size > MAX_FILE_BYTES || gif.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { success: false, message: "Gagal mengirim email: ukuran file melebihi 10MB" },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Gagal mengirim email: Masalah konfigurasi email server. Silakan hubungi admin.",
      },
      { status: 500 },
    );
  }

  try {
    const [photoBuffer, gifBuffer] = await Promise.all([
      photo.arrayBuffer(),
      gif.arrayBuffer(),
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
      return NextResponse.json(
        {
          success: false,
          message: `Gagal mengirim email: ${detail || "penyedia email menolak permintaan"}`,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Foto HD dan GIF animasi berhasil dikirim ke email ${email}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: `Gagal mengirim email: ${
          error instanceof Error ? error.message : "kesalahan tidak diketahui"
        }`,
      },
      { status: 500 },
    );
  }
}
