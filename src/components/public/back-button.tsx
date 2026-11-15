"use client"

import { useRouter } from "next/navigation"

type BackButtonProps = {
  fallbackHref?: string
  label?: string
}

export function BackButton({
  fallbackHref = "/",
  label = "Kembali",
}: BackButtonProps) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back()
          return
        }
        router.push(fallbackHref)
      }}
      className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-[#BF3131]/25 bg-[#FFFBF3]/70 px-4 text-xs font-semibold text-[#7A3E32] transition hover:border-[#BF3131]/60 hover:bg-[#FFFBF3] hover:text-[#BF3131] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 19l-7-7 7-7M3 12h18" />
      </svg>
      {label}
    </button>
  )
}
