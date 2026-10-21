"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";

import type { Pack } from "@/lib/premium/types";
import { formatDurationDays } from "@/lib/premium/types";
import {
  buildAdminWhatsappUrl,
  buildPendingPackMessage,
  buildRejectedPackMessage,
} from "@/lib/whatsapp";

import { RedeemForm } from "./redeem-form";

const PENDING_KEY = "pendingPackPayment";
const APPROVED_KEY = "approvedPackPayment";
const POLL_INTERVAL_MS = 5000;
const PENDING_TTL_MS = 24 * 60 * 60 * 1000;
const DANA_NUMBER = "0895413770137";
const PROOF_TYPES = new Set(["image/jpeg", "image/jpg", "image/png"]);
const MAX_PROOF_BYTES = 2 * 1024 * 1024;

type Phase = "closed" | "form" | "pending" | "approved" | "rejected";

type PendingPack = {
  orderId: string;
  packId: number;
  timestamp: number;
};

type ApprovedInfo = {
  roomCode: string;
  packName: string | null;
};

type ApprovedStored = ApprovedInfo & {
  packId: number;
  timestamp: number;
};

function formatRupiah(value: number): string {
  return `Rp${new Intl.NumberFormat("id-ID").format(value)}`;
}

function readPending(): PendingPack | null {
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingPack;
    if (!parsed.orderId || !parsed.packId || !parsed.timestamp) return null;
    if (Date.now() - parsed.timestamp > PENDING_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function readApproved(): ApprovedStored | null {
  try {
    const raw = window.localStorage.getItem(APPROVED_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ApprovedStored;
    if (!parsed.roomCode || !parsed.packId || !parsed.timestamp) return null;
    if (Date.now() - parsed.timestamp > PENDING_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function PackCheckout({ pack }: { pack: Pack }) {
  const [phase, setPhase] = useState<Phase>("closed");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [approved, setApproved] = useState<ApprovedInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"" | "bank_transfer" | "qris">("");
  const [proofName, setProofName] = useState("");
  const proofInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<number | null>(null);
  const pendingWhatsappUrl = buildAdminWhatsappUrl(
    buildPendingPackMessage({
      customerName,
      packName: pack.name,
      orderId: orderId ?? "-",
    }),
  );
  const rejectedWhatsappUrl = buildAdminWhatsappUrl(
    buildRejectedPackMessage({
      customerName,
      packName: pack.name,
      orderId: orderId ?? "-",
    }),
  );

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const applyStatus = useCallback(
    (result: {
      status?: string;
      room_code?: string | null;
      pack_name?: string | null;
    }) => {
      if (result.status === "approved" && result.room_code) {
        stopPolling();
        const nextApproved = {
          roomCode: result.room_code,
          packName: result.pack_name ?? null,
        };
        window.localStorage.removeItem(PENDING_KEY);
        window.localStorage.setItem(
          APPROVED_KEY,
          JSON.stringify({
            ...nextApproved,
            packId: pack.id,
            timestamp: Date.now(),
          }),
        );
        setApproved(nextApproved);
        setPhase("approved");
      } else if (result.status === "rejected") {
        stopPolling();
        window.localStorage.removeItem(PENDING_KEY);
        window.localStorage.removeItem(APPROVED_KEY);
        setPhase("rejected");
      }
    },
    [pack.id, stopPolling],
  );

  const checkStatus = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(
          `/api/payment-status/${encodeURIComponent(id)}`,
          { headers: { Accept: "application/json" } },
        );
        const result = (await response.json()) as {
          status?: string;
          room_code?: string | null;
          pack_name?: string | null;
        };
        applyStatus(result);
      } catch {
        /* biarkan polling mencoba lagi */
      }
    },
    [applyStatus],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedApproved = readApproved();
      if (storedApproved?.packId === pack.id) {
        setApproved({
          roomCode: storedApproved.roomCode,
          packName: storedApproved.packName,
        });
        return;
      }

      const pending = readPending();
      if (!pending || pending.packId !== pack.id) return;
      setOrderId(pending.orderId);
      setPhase("pending");
      void checkStatus(pending.orderId);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pack.id, checkStatus]);

  useEffect(() => {
    if (phase !== "pending" || !orderId) {
      stopPolling();
      return;
    }
    pollRef.current = window.setInterval(() => {
      void checkStatus(orderId);
    }, POLL_INTERVAL_MS);
    return stopPolling;
  }, [phase, orderId, checkStatus, stopPolling]);

  useEffect(() => stopPolling, [stopPolling]);

  useEffect(() => {
    if (phase === "closed") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [phase]);

  function open() {
    setError(null);
    setPhase(approved ? "approved" : "form");
  }

  function close() {
    setPhase("closed");
  }

  function startOver() {
    window.localStorage.removeItem(APPROVED_KEY);
    setApproved(null);
    setPhase("form");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const proof = proofInputRef.current?.files?.[0] ?? null;
    if (!proof) {
      setError("Bukti pembayaran wajib diunggah.");
      return;
    }
    if (!PROOF_TYPES.has(proof.type)) {
      setError("Bukti pembayaran harus berupa gambar JPG atau PNG.");
      return;
    }
    if (proof.size > MAX_PROOF_BYTES) {
      setError("Ukuran bukti pembayaran maksimal 2 MB.");
      return;
    }
    if (!paymentMethod) {
      setError("Pilih metode pembayaran dulu.");
      return;
    }

    const formData = new FormData();
    formData.append("pack_id", String(pack.id));
    formData.append("customer_name", customerName);
    formData.append("whatsapp_number", whatsappNumber);
    formData.append("payment_method", paymentMethod);
    formData.append("payment_proof", proof);

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/payment", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
        order_id?: string;
      };

      if (!result.success || !result.order_id) {
        setError(result.message ?? "Pembayaran gagal diproses.");
        return;
      }

      const pending: PendingPack = {
        orderId: result.order_id,
        packId: pack.id,
        timestamp: Date.now(),
      };
      window.localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
      setOrderId(result.order_id);
      setPhase("pending");
    } catch (caught) {
      const isNetworkError =
        caught instanceof TypeError &&
        (caught.message === "Failed to fetch" ||
          caught.message === "NetworkError when attempting to fetch resource." ||
          caught.message === "Load failed");
      setError(
        isNetworkError
          ? "Gagal menghubungi server. Periksa koneksi lalu coba lagi."
          : caught instanceof Error
            ? caught.message
            : "Pembayaran gagal diproses.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="inline-flex min-h-12 w-full items-center justify-between gap-3 bg-[#BF3131] px-5 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-[#FEF3E2] shadow-[4px_4px_0_#7A1C1C] transition hover:-translate-y-0.5 hover:bg-[#A02828] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFBF3]"
      >
        <span>Beli paket · {formatRupiah(pack.price)}</span>
        <span aria-hidden="true" className="h-px w-6 bg-current" />
      </button>

      {phase !== "closed"
        ? createPortal(
            <div
              className="fixed inset-0 z-[60] flex items-start justify-center overflow-x-hidden overflow-y-auto overscroll-contain bg-[#2A0A0A]/70 p-3 backdrop-blur-sm sm:items-center sm:p-8"
              role="presentation"
              onMouseDown={close}
            >
              <div
                className="relative my-3 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-xl flex-col border border-[#BF3131]/25 bg-[#FFFBF3] shadow-[12px_12px_0_rgba(42,10,10,0.35)] sm:my-8 sm:max-h-[calc(100dvh-4rem)]"
                role="dialog"
                aria-modal="true"
                aria-label={`Beli paket ${pack.name}`}
                onMouseDown={(event) => event.stopPropagation()}
              >
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#BF3131]/20 bg-[#FEF3E2] px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#BF3131]">
                      Checkout paket
                    </p>
                    <h2 className="mt-1 break-words text-xl font-extrabold tracking-[-0.03em] text-[#2A0A0A]">
                      {pack.name}
                    </h2>
                    <p className="text-xs text-[#7A5A50]">
                      {pack.frames.length} frame · {formatDurationDays(pack.duration_days)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    className="shrink-0 text-2xl leading-none text-[#7A5A50] transition hover:text-[#BF3131]"
                    aria-label="Tutup"
                  >
                    ×
                  </button>
                </div>

            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-5 py-5">
              {phase === "form" ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="flex items-center justify-between border border-[#BF3131]/20 bg-[#FEF3E2] px-4 py-3">
                    <span className="text-sm font-semibold text-[#5B3A32]">
                      Total pembayaran
                    </span>
                    <span className="text-xl font-extrabold text-[#BF3131]">
                      {formatRupiah(pack.price)}
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-semibold text-[#5B3A32]">
                        Nama <span className="text-[#BF3131]">*</span>
                      </span>
                      <input
                        required
                        value={customerName}
                        onChange={(event) => setCustomerName(event.target.value)}
                        placeholder="Nama kamu"
                        className="border border-[#BF3131]/25 bg-white px-3 py-2.5 outline-none focus:border-[#BF3131] focus:ring-2 focus:ring-[#BF3131]/15"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-semibold text-[#5B3A32]">
                        WhatsApp <span className="text-[#7A5A50]">(opsional)</span>
                      </span>
                      <input
                        value={whatsappNumber}
                        onChange={(event) => setWhatsappNumber(event.target.value)}
                        placeholder="081234567890"
                        inputMode="tel"
                        className="border border-[#BF3131]/25 bg-white px-3 py-2.5 outline-none focus:border-[#BF3131] focus:ring-2 focus:ring-[#BF3131]/15"
                      />
                    </label>
                  </div>

                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-semibold text-[#5B3A32]">
                      Metode pembayaran <span className="text-[#BF3131]">*</span>
                    </span>
                    <select
                      required
                      value={paymentMethod}
                      onChange={(event) =>
                        setPaymentMethod(
                          event.target.value as "" | "bank_transfer" | "qris",
                        )
                      }
                      className="border border-[#BF3131]/25 bg-white px-3 py-2.5 outline-none focus:border-[#BF3131] focus:ring-2 focus:ring-[#BF3131]/15"
                    >
                      <option value="">Pilih metode</option>
                      <option value="bank_transfer">E-Wallet (DANA)</option>
                      <option value="qris">QRIS</option>
                    </select>
                  </label>

                  {paymentMethod === "bank_transfer" ? (
                    <div className="border border-[#BF3131]/20 bg-[#FEF3E2] p-4 text-sm">
                      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#7A5A50]">
                        Transfer ke
                      </p>
                      <p className="mt-1 font-mono text-lg font-bold text-[#BF3131]">
                        {DANA_NUMBER}
                      </p>
                      <p className="text-xs text-[#5B3A32]">a.n. PANORICAM</p>
                    </div>
                  ) : null}

                  {paymentMethod === "qris" ? (
                    <div className="flex flex-col items-center border border-[#BF3131]/20 bg-[#FEF3E2] p-4">
                      <a href="/qris.jpg" target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/qris.jpg"
                          alt="QRIS PanoriCam"
                          className="h-48 w-48 object-contain"
                        />
                      </a>
                      <p className="mt-2 text-xs text-[#5B3A32]">
                        Klik QR untuk memperbesar.
                      </p>
                    </div>
                  ) : null}

                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-semibold text-[#5B3A32]">
                      Bukti pembayaran <span className="text-[#BF3131]">*</span>
                    </span>
                    <input
                      ref={proofInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      required
                      onChange={(event) =>
                        setProofName(event.target.files?.[0]?.name ?? "")
                      }
                      className="border border-[#BF3131]/25 bg-white px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-[#BF3131] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                    />
                    {proofName ? (
                      <span className="truncate text-xs text-[#7A5A50]">
                        {proofName}
                      </span>
                    ) : null}
                  </label>

                  {error ? (
                    <p className="border border-[#BF3131]/25 bg-[#BF3131]/5 px-3 py-2 text-sm text-[#9B2323]">
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex min-h-12 w-full items-center justify-center bg-[#BF3131] px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[#FEF3E2] transition hover:bg-[#A02828] disabled:opacity-60"
                  >
                    {submitting ? "Mengirim..." : "Kirim pembayaran"}
                  </button>
                  <p className="text-center text-[11px] leading-relaxed text-[#7A5A50]">
                    Admin memeriksa bukti secara manual. Kode dikirim lewat
                    WhatsApp setelah disetujui.
                  </p>
                </form>
              ) : null}

              {phase === "pending" ? (
                <div className="py-4 text-center">
                  <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-[#BF3131]/20 border-t-[#BF3131]" />
                  <h3 className="mt-5 text-xl font-extrabold text-[#2A0A0A]">
                    Menunggu konfirmasi admin
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#5B3A32]">
                    Pembayaranmu sedang diperiksa. Halaman ini otomatis
                    memperbarui status setiap beberapa detik.
                  </p>
                  {orderId ? (
                    <p className="mt-4 font-mono text-xs text-[#7A5A50]">
                      Order ID: {orderId}
                    </p>
                  ) : null}
                  <a
                    href={pendingWhatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex min-h-11 items-center justify-center border border-[#BF3131]/35 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#BF3131] transition hover:bg-[#BF3131] hover:text-[#FEF3E2]"
                  >
                    Hubungi admin
                  </a>
                </div>
              ) : null}

              {phase === "approved" && approved ? (
                <div className="space-y-5">
                  <div className="text-center">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#BF3131]">
                      Pembayaran disetujui
                    </p>
                    <h3 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-[#2A0A0A]">
                      Kode ruangmu sudah siap.
                    </h3>
                    <p className="mt-1 text-sm text-[#5B3A32]">
                      {approved.packName ?? pack.name}
                    </p>
                  </div>

                  <div className="border border-[#BF3131]/25 bg-[#FEF3E2] px-4 py-5 text-center">
                    <p className="font-mono text-3xl font-extrabold tracking-[0.18em] text-[#BF3131]">
                      {approved.roomCode.replace(
                        /^(.{4})(.{4})$/,
                        "$1-$2",
                      )}
                    </p>
                  </div>

                  <div className="border-t border-dashed border-[#BF3131]/25 pt-4">
                    <p className="mb-3 text-xs leading-relaxed text-[#7A5A50]">
                      Kode sudah terisi di bawah. Klik masuk untuk membuka ruang
                      premium di perangkat ini.
                    </p>
                    <RedeemForm compact initialCode={approved.roomCode} />
                    <button
                      type="button"
                      onClick={startOver}
                      className="mt-4 text-xs font-semibold text-[#7A5A50] underline underline-offset-4 transition hover:text-[#BF3131]"
                    >
                      Beli paket lagi
                    </button>
                  </div>
                </div>
              ) : null}

              {phase === "rejected" ? (
                <div className="py-4 text-center">
                  <h3 className="text-xl font-extrabold text-[#2A0A0A]">
                    Pembayaran ditolak
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#5B3A32]">
                    Bukti pembayaran belum bisa diverifikasi. Hubungi admin agar
                    bisa dicek ulang.
                  </p>
                  <a
                    href={rejectedWhatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex min-h-11 items-center justify-center bg-[#BF3131] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#FEF3E2]"
                  >
                    Hubungi admin
                  </a>
                </div>
              ) : null}
            </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
