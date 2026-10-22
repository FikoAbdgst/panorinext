"use client";

import { useEffect, useState, type ReactNode } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

const TONES: Record<
  ToastType,
  { wrap: string; icon: ReactNode }
> = {
  success: {
    wrap: "bg-[#EAF1EC] text-[#2F6B4F]",
    icon: <path d="M5 12.5l4.5 4.5L20 7" />,
  },
  error: {
    wrap: "bg-[#FBEAE7] text-[#BF3131]",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9l6 6M15 9l-6 6" />
      </>
    ),
  },
  warning: {
    wrap: "bg-[#FBF0DC] text-[#8A5A00]",
    icon: (
      <>
        <path d="M12 4l9 16H3z" />
        <path d="M12 10v4" />
        <circle cx="12" cy="17.2" r="0.7" fill="currentColor" stroke="none" />
      </>
    ),
  },
  info: {
    wrap: "bg-[#F6E9E0] text-[#7A3E32]",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5" />
        <circle cx="12" cy="7.8" r="0.8" fill="currentColor" stroke="none" />
      </>
    ),
  },
};

export function BoothToast({
  message,
  type,
  duration,
  onDone,
}: {
  message: string;
  type: ToastType;
  duration: number;
  onDone: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showTimer = window.setTimeout(() => setVisible(true), 60);
    const hideTimer = window.setTimeout(() => setVisible(false), duration);
    const doneTimer = window.setTimeout(onDone, duration + 260);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      window.clearTimeout(doneTimer);
    };
  }, [duration, onDone]);

  const tone = TONES[type];

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 top-4 z-[70] mx-auto flex max-w-md items-start gap-3 border border-[#BF3131]/20 bg-[#FFFBF3] p-3 shadow-[0_18px_40px_-24px_rgba(42,10,10,0.55)] transition-all duration-300 ease-out"
      style={{
        transform: visible
          ? "translateY(0)"
          : "translateY(calc(-100% - 1rem))",
        opacity: visible ? 1 : 0,
      }}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone.wrap}`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {tone.icon}
        </svg>
      </span>
      <p className="min-w-0 flex-1 pt-1 text-sm font-medium leading-snug text-[#2A0A0A]">
        {message}
      </p>
      <button
        type="button"
        aria-label="Tutup notifikasi"
        onClick={onDone}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] text-[#7A5A50] transition hover:bg-[#BF3131]/8 hover:text-[#2A0A0A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131]"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
