import { formatPremiumCode } from "@/lib/premium/types";

export const ADMIN_WHATSAPP_NUMBER = "62882001330851";
export const ADMIN_WHATSAPP_DISPLAY = "+62 882-0013-30851";

export function normalizeWhatsappNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
}

export function buildWhatsappUrl(number: string, message: string): string {
  const normalized = normalizeWhatsappNumber(number);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function buildAdminWhatsappUrl(message: string): string {
  return buildWhatsappUrl(ADMIN_WHATSAPP_NUMBER, message);
}

export const WHATSAPP_TEMPLATES = {
  footer: [
    "Halo admin PanoriCam, saya ingin bertanya.",
    "",
    "Nama:",
    "Kebutuhan:",
  ].join("\n"),
  customFrame: [
    "Halo admin PanoriCam, saya ingin konsultasi custom frame.",
    "",
    "Nama:",
    "Acara:",
    "Tanggal:",
    "Tema/warna:",
    "Jumlah frame/slot:",
    "Referensi (link/foto):",
  ].join("\n"),
  customPack: [
    "Halo admin PanoriCam, saya ingin konsultasi paket frame custom.",
    "",
    "Nama:",
    "Acara:",
    "Tanggal:",
    "Jumlah frame:",
    "Tema/warna:",
    "Referensi (link/foto):",
  ].join("\n"),
  premiumPack: [
    "Halo admin PanoriCam, saya ingin tanya paket premium.",
    "",
    "Nama:",
    "Paket/acara yang diinginkan:",
    "Pertanyaan:",
  ].join("\n"),
  premiumHelp: [
    "Halo admin PanoriCam, saya ingin tanya paket premium.",
    "",
    "Saat ini belum ada paket yang tampil di halaman premium.",
    "Nama:",
    "Kebutuhan:",
  ].join("\n"),
  premiumRoom: [
    "Halo admin PanoriCam, saya butuh bantuan masuk Ruang Premium.",
    "",
    "Nama:",
    "Kode/Order ID:",
    "Kendala:",
  ].join("\n"),
} as const;

type PackMessageInput = {
  customerName: string;
  packName: string;
  orderId: string;
};

function greeting(customerName: string): string {
  return customerName ? `Halo kak ${customerName}, ` : "Halo kak, ";
}

export function buildPendingPackMessage({
  customerName,
  packName,
  orderId,
}: PackMessageInput): string {
  return [
    "Halo admin PanoriCam, saya sudah mengirim bukti pembayaran.",
    "",
    `Order ID: ${orderId}`,
    `Paket: ${packName}`,
    `Nama: ${customerName || "-"}`,
    "",
    "Mohon dicek ya. Terima kasih.",
  ].join("\n");
}

export function buildRejectedPackMessage({
  customerName,
  packName,
  orderId,
}: PackMessageInput): string {
  return [
    "Halo admin PanoriCam, pembayaran saya ditolak.",
    "",
    `Order ID: ${orderId}`,
    `Paket: ${packName}`,
    `Nama: ${customerName || "-"}`,
    "",
    "Mohon dibantu cek ulang. Terima kasih.",
  ].join("\n");
}

export function buildPremiumAccessMessage({
  customerName,
  packName,
  code,
  origin,
}: {
  customerName: string;
  packName: string;
  code: string;
  origin: string;
}): string {
  return [
    `Halo kak ${customerName}, pembayaran paket ${packName} sudah kami setujui.`,
    "",
    `Kode akses Ruang Premium: *${formatPremiumCode(code)}*`,
    `Buka: ${origin}/premium/room`,
    "",
    "Kode aktif saat pertama kali dipakai dan berlaku sesuai durasi paket.",
    "Simpan kode ini ya, kak.",
  ].join("\n");
}

export function buildTransactionStatusMessage({
  status,
  customerName,
  packName,
  orderId,
  roomCode,
}: {
  status: "pending" | "approved" | "rejected";
  customerName: string;
  packName: string | null;
  orderId: string;
  roomCode: string | null;
}): string {
  const product = packName ?? "premium";

  if (status === "approved") {
    const codeLine = roomCode
      ? `Kode akses Ruang Premium: *${formatPremiumCode(roomCode)}*`
      : "Kode akses Ruang Premium akan kami kirimkan.";
    return [
      `${greeting(customerName)}pembayaran paket ${product} sudah kami setujui.`,
      "",
      `Order ID: ${orderId}`,
      codeLine,
      "",
      "Buka menu Ruang Premium di website PanoriCam dan masukkan kode tersebut ya.",
    ].join("\n");
  }

  if (status === "rejected") {
    return [
      `${greeting(customerName)}bukti pembayaran untuk pesanan ${orderId} belum bisa kami verifikasi.`,
      "",
      `Paket: ${product}`,
      "",
      "Mohon kirim ulang bukti pembayaran yang lebih jelas ya.",
    ].join("\n");
  }

  return [
    `${greeting(customerName)}terima kasih sudah melakukan pembayaran paket ${product}.`,
    "",
    `Order ID: ${orderId}`,
    "Pesanan sedang kami periksa. Kalau ada pertanyaan, balas chat ini ya.",
  ].join("\n");
}

export function buildRoomMessage({
  customerName,
  packName,
  code,
}: {
  customerName: string | null;
  packName: string;
  code: string;
}): string {
  return [
    `Halo kak ${customerName || "PanoriCam"}, berikut kode Ruang Premium untuk paket ${packName}:`,
    "",
    `*${formatPremiumCode(code)}*`,
    "",
    "Buka menu Ruang Premium di website PanoriCam, lalu masukkan kode tersebut.",
  ].join("\n");
}
