"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

const ALERT_ICON: Record<ToastType, string> = {
  success: "✅",
  error: "❌",
  warning: "⚠️",
  info: "ℹ️",
};

const ALERT_COLOR: Record<ToastType, string> = {
  success: "bg-gradient-to-r from-green-500 to-green-600 text-white border-l-4 border-green-700",
  error: "bg-gradient-to-r from-red-500 to-red-600 text-white border-l-4 border-red-700",
  warning: "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-l-4 border-yellow-700",
  info: "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-l-4 border-blue-700",
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
    const showTimer = window.setTimeout(() => setVisible(true), 100);
    const hideTimer = window.setTimeout(() => setVisible(false), duration);
    const doneTimer = window.setTimeout(onDone, duration + 300);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      window.clearTimeout(doneTimer);
    };
  }, [duration, onDone]);

  return (
    <div
      className={`custom-alert fixed top-4 left-1/2 z-[70] w-[90%] max-w-md rounded-xl px-6 py-4 shadow-2xl transition-all duration-300 ease-in-out ${ALERT_COLOR[type]}`}
      style={{
        transform: visible ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(-100%)",
        opacity: visible ? 1 : 0,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="mr-3 animate-bounce text-2xl">{ALERT_ICON[type]}</span>
          <span className="text-sm font-semibold">{message}</span>
        </div>
      </div>
    </div>
  );
}
