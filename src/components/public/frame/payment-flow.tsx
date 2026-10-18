"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type TouchEvent } from "react";
import { useRouter } from "next/navigation";

import { BoothToast, type ToastType } from "@/components/public/booth/booth-toast";

import {
  PREMIUM_FRAME_EVENT,
  type PremiumFrameDetail,
} from "./premium-frame-button";

type PendingPayment = {
  order_id: string;
  frame_id: number;
  timestamp: number;
  status: "pending" | "approved" | "rejected";
};

type PendingPremiumFrame = {
  frame_id: number;
  price: number;
  frame_name: string;
  frame_image: string;
  timestamp: number;
};

type ToastState = { message: string; type: ToastType; duration: number };

const PAYMENT_STATUS_INTERVAL_MS = 5000;
const PREMIUM_FRAME_TTL_MS = 60 * 60 * 1000;
const DANA_NUMBER = "0895413770137";
const WHATSAPP_ADMIN_URL = "https://wa.me/+62882001330851";
const WHATSAPP_ADMIN_LABEL = "0882-0013-30851";

/* Kunci scroll halaman selama ada modal aktif (meniru body.modal-open Laravel).
 * Memakai himpunan id agar modal yang bertumpuk tidak membuka scroll terlalu cepat. */
const openModals = new Set<string>();

function lockBody(id: string) {
  openModals.add(id);
  document.body.classList.add("modal-open");
}

function unlockBody(id: string) {
  openModals.delete(id);
  if (openModals.size === 0) {
    document.body.classList.remove("modal-open");
  }
}

function readPendingPayment(): PendingPayment | null {
  try {
    const raw = window.localStorage.getItem("pendingPayment");
    if (!raw) return null;
    return JSON.parse(raw) as PendingPayment;
  } catch {
    window.localStorage.removeItem("pendingPayment");
    return null;
  }
}

type PushRoute = (href: string) => void;

/** Redirect ke booth bila ada pembayaran yang sudah disetujui di localStorage. */
function redirectIfApproved(push: PushRoute): boolean {
  const pending = readPendingPayment();
  if (
    pending &&
    pending.status === "approved" &&
    pending.frame_id &&
    pending.order_id
  ) {
    push(
      `/booth?frame_id=${encodeURIComponent(pending.frame_id)}&order_id=${encodeURIComponent(
        pending.order_id,
      )}`,
    );
    return true;
  }
  return false;
}

function formatRupiah(price: number): string {
  return new Intl.NumberFormat("id-ID").format(price);
}

export function PaymentFlow() {
  const router = useRouter();
  const [toast, setToast] = useState<ToastState | null>(null);

  const [paymentFrame, setPaymentFrame] = useState<PremiumFrameDetail | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentBackdrop, setPaymentBackdrop] = useState(false);
  const [paymentHidden, setPaymentHidden] = useState(false);

  const [pleaseWait, setPleaseWait] = useState<{ orderId: string } | null>(null);
  const [accept, setAccept] = useState<{ orderId: string; frameId: number } | null>(null);
  const [reject, setReject] = useState<{ orderId: string } | null>(null);
  const [qrisOpen, setQrisOpen] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"" | "bank_transfer" | "qris">("");
  const [proofName, setProofName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const statusIntervalRef = useRef<number | null>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);
  const paymentContentRef = useRef<HTMLDivElement>(null);
  const paymentBackdropRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    startY: 0,
    currentY: 0,
    dragging: false,
    startTime: 0,
  });

  const dismissToast = useCallback(() => setToast(null), []);

  const showToast = useCallback(
    (message: string, type: ToastType, duration = 5000) => {
      setToast({ message, type, duration });
    },
    [],
  );

  /* --- Modal pembayaran -------------------------------------------------- */

  const openPayment = useCallback((frame: PremiumFrameDetail) => {
    const data: PendingPremiumFrame = {
      frame_id: frame.id,
      price: frame.price,
      frame_name: frame.name,
      frame_image: frame.imageUrl,
      timestamp: Date.now(),
    };
    window.localStorage.setItem("pendingPremiumFrame", JSON.stringify(data));

    setPaymentFrame(frame);
    setPaymentOpen(true);
    setPaymentHidden(false);
    setPaymentBackdrop(false);
    lockBody("payment");
    window.setTimeout(() => setPaymentBackdrop(true), 50);
  }, []);

  const closePayment = useCallback(() => {
    setPaymentBackdrop(false);
    setPaymentHidden(true);
    window.setTimeout(() => {
      setPaymentOpen(false);
      setPaymentFrame(null);
      setCustomerName("");
      setWhatsappNumber("");
      setPaymentMethod("");
      setProofName("");
      if (proofInputRef.current) proofInputRef.current.value = "";
      window.localStorage.removeItem("pendingPremiumFrame");
      unlockBody("payment");
    }, 300);
  }, []);

  const openPleaseWait = useCallback((orderId: string) => {
    setPleaseWait({ orderId });
    lockBody("pleaseWait");
  }, []);

  const closePleaseWait = useCallback(() => {
    setPleaseWait(null);
    unlockBody("pleaseWait");
  }, []);

  const openAccept = useCallback((orderId: string, frameId: number) => {
    setAccept({ orderId, frameId });
    lockBody("accept");
  }, []);

  const openReject = useCallback((orderId: string) => {
    setReject({ orderId });
    lockBody("reject");
  }, []);

  const closeReject = useCallback(() => {
    setReject(null);
    unlockBody("reject");
  }, []);

  const openQris = useCallback(() => {
    setQrisOpen(true);
    lockBody("qris");
  }, []);

  const closeQris = useCallback(() => {
    setQrisOpen(false);
    unlockBody("qris");
  }, []);

  /* --- Polling status pembayaran ---------------------------------------- */

  const stopStatusCheck = useCallback(() => {
    if (statusIntervalRef.current !== null) {
      window.clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }
  }, []);

  const startStatusCheck = useCallback(
    (orderId: string, frameId: number) => {
      stopStatusCheck();
      statusIntervalRef.current = window.setInterval(async () => {
        try {
          const response = await fetch(
            `/api/payment-status/${encodeURIComponent(orderId)}`,
            { headers: { Accept: "application/json" } },
          );
          const result = (await response.json()) as { status?: string };

          if (result.status === "approved") {
            stopStatusCheck();
            closePleaseWait();

            const pending = readPendingPayment();
            if (pending) {
              pending.status = "approved";
              window.localStorage.setItem("pendingPayment", JSON.stringify(pending));
            }
            window.localStorage.removeItem("pendingPremiumFrame");

            openAccept(orderId, frameId);
          } else if (result.status === "rejected") {
            stopStatusCheck();
            closePleaseWait();
            window.localStorage.removeItem("pendingPayment");
            window.localStorage.removeItem("pendingPremiumFrame");
            openReject(orderId);
          }
        } catch (error) {
          console.error("Error checking payment status:", error);
        }
      }, PAYMENT_STATUS_INTERVAL_MS);
    },
    [stopStatusCheck, closePleaseWait, openAccept, openReject],
  );

  /* --- Buka kembali modal dari localStorage ----------------------------- */

  const checkAndOpenPaymentModal = useCallback(async () => {
    let data: PendingPremiumFrame;
    try {
      const raw = window.localStorage.getItem("pendingPremiumFrame");
      if (!raw) return;
      data = JSON.parse(raw) as PendingPremiumFrame;
    } catch {
      window.localStorage.removeItem("pendingPremiumFrame");
      return;
    }

    if (!data.frame_id || !data.price || !data.timestamp) {
      window.localStorage.removeItem("pendingPremiumFrame");
      return;
    }
    if (Date.now() - data.timestamp > PREMIUM_FRAME_TTL_MS) {
      window.localStorage.removeItem("pendingPremiumFrame");
      return;
    }

    try {
      const response = await fetch(`/api/frame-status/${data.frame_id}`);
      if (!response.ok) throw new Error(`Frame not found: ${data.frame_id}`);
      const frameData = (await response.json()) as { price?: number };
      if (frameData.price && frameData.price > 0 && String(frameData.price) === String(data.price)) {
        openPayment({
          id: data.frame_id,
          price: data.price,
          name: data.frame_name,
          imageUrl: data.frame_image,
        });
      } else {
        window.localStorage.removeItem("pendingPremiumFrame");
      }
    } catch (error) {
      console.error("Error validating frame status:", error);
      window.localStorage.removeItem("pendingPremiumFrame");
    }
  }, [openPayment]);

  /* --- Siklus hidup ------------------------------------------------------ */

  useEffect(() => {
    function handlePremiumFrame(event: Event) {
      const detail = (event as CustomEvent<PremiumFrameDetail>).detail;
      if (detail) openPayment(detail);
    }
    window.addEventListener(PREMIUM_FRAME_EVENT, handlePremiumFrame);
    return () => window.removeEventListener(PREMIUM_FRAME_EVENT, handlePremiumFrame);
  }, [openPayment]);

  useEffect(() => {
    /* Ditunda satu tick agar setState pertama tidak terjadi di badan effect
     * (aturan react-hooks/set-state-in-effect). */
    const timer = window.setTimeout(() => {
      if (redirectIfApproved((href) => router.push(href))) return;

      const pending = readPendingPayment();
      if (pending && pending.status === "pending" && pending.order_id && pending.frame_id) {
        openPleaseWait(pending.order_id);
        startStatusCheck(pending.order_id, pending.frame_id);
        return;
      }

      void checkAndOpenPaymentModal();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [router, openPleaseWait, startStatusCheck, checkAndOpenPaymentModal]);

  useEffect(() => {
    return () => {
      stopStatusCheck();
      openModals.clear();
      document.body.classList.remove("modal-open");
    };
  }, [stopStatusCheck]);

  /* --- Submit pembayaran ------------------------------------------------- */

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paymentFrame || submitting) return;

    const proof = proofInputRef.current?.files?.[0] ?? null;
    if (!proof) {
      showToast("Bukti pembayaran wajib diunggah.", "error");
      return;
    }

    const frameId = paymentFrame.id;
    const formData = new FormData();
    formData.append("frame_id", String(frameId));
    formData.append("customer_name", customerName);
    formData.append("whatsapp_number", whatsappNumber);
    formData.append("payment_method", paymentMethod);
    formData.append("payment_proof", proof);

    setSubmitting(true);
    try {
      const response = await fetch("/api/payment", { method: "POST", body: formData });
      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
        order_id?: string;
      };

      if (result.success && result.order_id) {
        const pending: PendingPayment = {
          order_id: result.order_id,
          frame_id: frameId,
          timestamp: Date.now(),
          status: "pending",
        };
        window.localStorage.setItem("pendingPayment", JSON.stringify(pending));

        closePayment();
        openPleaseWait(result.order_id);
        startStatusCheck(result.order_id, frameId);
      } else {
        showToast(`Error: ${result.message ?? "Pembayaran gagal diproses."}`, "error");
      }
    } catch (error) {
      showToast(
        `Terjadi kesalahan: ${error instanceof Error ? error.message : "unknown error"}`,
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => showToast("Nomor rekening berhasil disalin!", "success"))
      .catch((error: unknown) => console.error("Could not copy text: ", error));
  }

  function redirectToBooth() {
    if (!accept) return;
    const boothUrl = `/booth?frame_id=${encodeURIComponent(
      accept.frameId,
    )}&order_id=${encodeURIComponent(accept.orderId)}`;
    setAccept(null);
    router.push(boothUrl);
  }

  /* --- Geser ke bawah untuk menutup modal di ponsel --------------------- */

  function handleDragStart(event: TouchEvent<HTMLDivElement>) {
    if (window.innerWidth > 640) return;
    const target = event.target as HTMLElement;
    const isHeaderArea =
      target.closest(".modal-drag-handle") !== null ||
      target.closest(".bg-gradient-to-r") !== null;
    if (!isHeaderArea) return;
    dragRef.current = {
      startY: event.touches[0].clientY,
      currentY: event.touches[0].clientY,
      dragging: true,
      startTime: Date.now(),
    };
  }

  function handleDragMove(event: TouchEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag.dragging) return;
    const content = paymentContentRef.current;
    const backdrop = paymentBackdropRef.current;
    if (!content) return;

    drag.currentY = event.touches[0].clientY;
    const distance = drag.currentY - drag.startY;
    if (distance <= 0) return;

    content.style.transform = `translateY(${distance}px)`;
    const opacity = Math.max(0.5, 1 - distance / 300);
    content.style.opacity = String(opacity);
    if (backdrop) backdrop.style.opacity = String(opacity);
  }

  function handleDragEnd() {
    const drag = dragRef.current;
    if (!drag.dragging) return;
    const content = paymentContentRef.current;
    const backdrop = paymentBackdropRef.current;

    const distance = drag.currentY - drag.startY;
    const duration = Date.now() - drag.startTime;
    const velocity = duration > 0 ? distance / duration : 0;

    if (content) {
      content.style.transform = "";
      content.style.opacity = "";
    }
    if (backdrop) backdrop.style.opacity = "";

    if (distance > 150 || (distance > 50 && velocity > 0.5)) {
      closePayment();
    }

    dragRef.current = { startY: 0, currentY: 0, dragging: false, startTime: 0 };
  }

  const methodDetailsVisible = paymentMethod !== "";

  return (
    <>
      {/* Payment Modal */}
      <div
        id="paymentModal"
        className={`fixed inset-0 z-50 flex items-center justify-center ${paymentOpen ? "show" : ""}`}
      >
        <div
          ref={paymentBackdropRef}
          className={`modal-backdrop absolute inset-0 bg-black/60 backdrop-blur-sm ${paymentBackdrop ? "show" : ""}`}
          onClick={closePayment}
        />
        <div
          ref={paymentContentRef}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          className={`modal-content bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto relative ${paymentHidden ? "hide" : ""}`}
        >
          <div className="bg-gradient-to-r from-[#FEF3E2] to-[#FEF3E2]/70 rounded-t-2xl p-6 border-b-2 border-[#BF3131]/20">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">Pembayaran Premium</h3>
                <p className="text-sm text-gray-600">Upgrade untuk akses frame eksklusif</p>
              </div>
              <button
                type="button"
                onClick={closePayment}
                className="modal-close text-gray-500 hover:text-[#BF3131] transition duration-300 hover:scale-110"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6">
            <form id="paymentForm" encType="multipart/form-data" onSubmit={handleSubmit}>
              <input type="hidden" id="frameId" name="frame_id" value={paymentFrame?.id ?? ""} />

              <div className="mb-6 p-4 bg-gradient-to-r from-[#FEF3E2] to-[#FEF3E2]/50 rounded-xl border-2 border-[#BF3131]/20 relative overflow-hidden">
                <div className="absolute -right-2 -top-2 w-8 h-8 text-[#BF3131] opacity-10">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium" id="frameName">
                      {paymentFrame ? `Frame ${paymentFrame.name}` : "Frame Premium"}
                    </p>
                    <p className="font-bold text-2xl text-[#BF3131]" id="framePrice">
                      Rp {paymentFrame ? formatRupiah(paymentFrame.price) : "0"}
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-[#BF3131]/20 bg-white flex items-center justify-center">
                    {paymentFrame?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        id="framePreview"
                        src={paymentFrame.imageUrl}
                        alt={paymentFrame.name}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <span className="text-2xl">🐾</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-bold text-lg mb-4 text-gray-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-[#BF3131]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Data Pelanggan
                </h4>

                <div className="mb-4">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <svg className="w-4 h-4 mr-2 text-[#BF3131]" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Nama <span className="text-[#BF3131]">*</span>
                  </label>
                  <input
                    type="text"
                    name="customer_name"
                    required
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3131]/50 focus:border-[#BF3131] transition duration-300"
                    placeholder="Masukkan nama Anda"
                  />
                </div>

                <div className="mb-4">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <svg className="w-4 h-4 mr-2 text-[#BF3131]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    Nomor WhatsApp <span className="text-gray-400 text-xs">(Opsional)</span>
                  </label>
                  <input
                    type="number"
                    name="whatsapp_number"
                    value={whatsappNumber}
                    onChange={(event) => setWhatsappNumber(event.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3131]/50 focus:border-[#BF3131] transition duration-300"
                    placeholder="Contoh: 081234567890"
                  />
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Nomor WhatsApp untuk konfirmasi pembayaran (tidak wajib diisi)
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-bold text-lg mb-4 text-gray-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-[#BF3131]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                  </svg>
                  Metode Pembayaran
                </h4>
                <div className="mb-4">
                  <select
                    id="paymentMethod"
                    name="payment_method"
                    required
                    value={paymentMethod}
                    onChange={(event) =>
                      setPaymentMethod(event.target.value as "" | "bank_transfer" | "qris")
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3131]/50 focus:border-[#BF3131] transition duration-300 bg-white"
                  >
                    <option value="">Pilih Metode Pembayaran</option>
                    <option value="bank_transfer">E-Wallet</option>
                    <option value="qris">QRIS</option>
                  </select>
                </div>
                <div id="paymentDetailsContainer" className={methodDetailsVisible ? "" : "hidden"}>
                  <div
                    id="bankTransferDetails"
                    style={{ display: paymentMethod === "bank_transfer" ? "block" : "none" }}
                    className="mb-4 p-4 border-2 border-[#BF3131]/20 rounded-xl bg-gradient-to-r from-[#FEF3E2]/30 to-transparent"
                  >
                    <div className="text-sm text-gray-600 space-y-2">
                      <h5 className="font-bold text-gray-800 text-center flex justify-center items-center text-xl">
                        E-Wallet
                      </h5>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100">
                        <span className="font-medium">Dana:</span>
                        <div className="text-right">
                          <span className="font-mono font-bold text-[#BF3131]">{DANA_NUMBER}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(DANA_NUMBER)}
                            className="ml-2 text-xs text-[#BF3131] hover:text-[#F16767]"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100">
                        <span className="font-medium">A.n:</span>
                        <span className="font-semibold">PANORICAM</span>
                      </div>
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-800">
                          <strong>Instruksi:</strong> Transfer sesuai jumlah yang tertera, lalu upload bukti
                          transfer di bawah.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div
                    id="qrisDetails"
                    style={{ display: paymentMethod === "qris" ? "block" : "none" }}
                    className="mb-4 p-4 border-2 border-[#BF3131]/20 rounded-xl bg-gradient-to-r from-[#FEF3E2]/30 to-transparent"
                  >
                    <div className="flex flex-col items-center">
                      <h5 className="font-bold text-gray-800 text-center flex mb-2 justify-center items-center text-xl">
                        QRIS
                      </h5>
                      <div
                        id="qrisContainer"
                        onClick={openQris}
                        className="w-48 h-48 bg-white rounded-xl border-2 border-dashed border-[#BF3131]/30 flex items-center justify-center mb-3 cursor-pointer"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/qris.jpg" alt="QRIS" className="w-full h-full object-contain" />
                      </div>
                      <p className="text-sm text-gray-600 text-center mb-2">Klik QR untuk memperbesar</p>
                      <div className="w-full p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800 text-center">
                          <strong>Instruksi:</strong> Scan QR Code dengan aplikasi pembayaran digital, lalu
                          upload bukti pembayaran.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <svg className="w-4 h-4 mr-2 text-[#BF3131]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Bukti Pembayaran <span className="text-[#BF3131]">*</span>
                </label>
                <div className="relative">
                  <input
                    ref={proofInputRef}
                    type="file"
                    name="payment_proof"
                    accept="image/*"
                    required
                    onChange={(event) => setProofName(event.target.files?.[0]?.name ?? "")}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3131]/50 focus:border-[#BF3131] transition duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-[#BF3131] file:text-white hover:file:bg-[#F16767]"
                  />
                </div>
                {proofName ? (
                  <p className="text-xs text-gray-500 mt-2 truncate">{proofName}</p>
                ) : null}
                <p className="text-xs text-gray-500 mt-2 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Upload screenshot/foto bukti transfer
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-[#BF3131] to-[#F16767] text-white py-4 px-6 rounded-xl font-semibold hover:from-[#F16767] hover:to-[#BF3131] transition duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {submitting ? "Memproses..." : "Submit Pembayaran"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Accept Modal */}
      <div
        id="acceptModal"
        className={`fixed inset-0 z-50 flex items-center justify-center ${accept ? "show" : ""}`}
      >
        <div className="modal-backdrop absolute inset-0 bg-black/60 backdrop-blur-sm show" />
        <div className="modal-content bg-white rounded-2xl p-6 w-full max-w-md mx-4">
          <div className="text-center">
            <svg
              className="w-16 h-16 text-green-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Pembayaran Disetujui</h3>
            <p className="text-gray-600 mb-4">
              Pembayaran Anda (Order ID: <span id="acceptOrderId">{accept?.orderId ?? ""}</span>) telah
              disetujui. Anda akan diarahkan ke booth.
            </p>
            <button
              type="button"
              onClick={redirectToBooth}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Lanjutkan ke Booth
            </button>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      <div
        id="rejectModal"
        className={`fixed inset-0 z-50 flex items-center justify-center ${reject ? "show" : ""}`}
      >
        <div className="modal-backdrop absolute inset-0 bg-black/60 backdrop-blur-sm show" />
        <div className="modal-content bg-white rounded-2xl p-6 w-full max-w-md mx-4">
          <div className="text-center">
            <svg
              className="w-16 h-16 text-red-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Pembayaran Ditolak</h3>
            <p className="text-gray-600 mb-4">
              Pembayaran Anda (Order ID: <span id="rejectOrderId">{reject?.orderId ?? ""}</span>) ditolak
              oleh admin. Silakan coba lagi.
            </p>
            <button
              type="button"
              onClick={closeReject}
              className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* QRIS Modal */}
      <div
        id="qrisModal"
        className={qrisOpen ? "show" : ""}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeQris();
        }}
      >
        <div id="qrisModalContent">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img id="qrisModalImg" src="/qris.jpg" alt="QRIS" />
        </div>
      </div>

      {/* Please Wait Modal */}
      <div
        id="pleaseWaitModal"
        className={`fixed inset-0 z-50 flex items-center justify-center ${pleaseWait ? "show" : ""}`}
      >
        <div className="modal-content bg-white rounded-2xl p-6 w-full max-w-md mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Menunggu Konfirmasi</h3>
            <p className="text-gray-600 mb-4">
              Pembayaran Anda (Order ID: <span id="waitingOrderId">{pleaseWait?.orderId ?? ""}</span>) sedang
              diproses. Silakan tunggu konfirmasi dari admin.
            </p>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Jika sudah menunggu lama dan belum diterima, silakan hubungi admin melalui WhatsApp:{" "}
                <a href={WHATSAPP_ADMIN_URL} className="font-semibold text-blue-600 hover:text-blue-800">
                  {WHATSAPP_ADMIN_LABEL}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {toast ? (
        <BoothToast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onDone={dismissToast}
        />
      ) : null}
    </>
  );
}
