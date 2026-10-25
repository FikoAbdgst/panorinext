"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { PREMIUM_PUBLIC_ENABLED } from "@/lib/premium/availability"

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/frame", label: "Frame" },
  { href: "/premium", label: "Premium" },
] as const

const VISIBLE_LINKS = LINKS.filter(
  (link) => link.href !== "/premium" || PREMIUM_PUBLIC_ENABLED,
)

export function Navbar() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 font-['Poppins']">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <nav
          id="navbar"
          aria-label="Navigasi utama"
          className={`pointer-events-auto relative mt-4 flex items-center gap-2.5 rounded-2xl border bg-[#FEF3E2] px-2.5 transition-[height,box-shadow,border-color] duration-300 ease-out sm:mt-5 sm:gap-3 sm:px-4 ${
            scrolled
              ? "h-16 border-[#BF3131]/15 shadow-[0_18px_45px_-26px_rgba(80,20,20,0.55)] sm:h-[72px]"
              : "h-20 border-[#BF3131]/10 shadow-[0_16px_40px_-30px_rgba(80,20,20,0.4)] sm:h-[88px]"
          }`}
        >
          <Link
            href="/"
            aria-label="PanoriCam - Home"
            className="flex min-w-0 flex-shrink-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131]/40 focus-visible:ring-offset-4 focus-visible:ring-offset-[#FEF3E2]"
          >
            <Image
              src="/logo.png"
              alt="PanoriCam"
              width={666}
              height={375}
              priority
              className={`w-auto transition-[height] duration-300 ${
                scrolled ? "h-9 sm:h-12" : "h-10 sm:h-16"
              }`}
            />
          </Link>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1 md:absolute md:left-1/2 md:top-1/2 md:ml-0 md:-translate-x-1/2 md:-translate-y-1/2">
            {VISIBLE_LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname === link.href ||
                    pathname.startsWith(`${link.href}/`)

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full px-1.5 text-[11px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131]/40 min-[380px]:px-2.5 min-[380px]:text-xs sm:px-3.5 sm:text-sm ${
                    active
                      ? "bg-[#BF3131]/10 font-semibold text-[#BF3131]"
                      : "text-gray-700 hover:bg-[#BF3131]/5 hover:text-[#BF3131]"
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          <Link
            href="/frame"
            className="group ml-auto hidden min-h-11 items-center gap-2 rounded-full bg-[#BF3131] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(191,49,49,0.8)] transition duration-300 hover:bg-[#F16767] hover:shadow-[0_12px_24px_-12px_rgba(191,49,49,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2] md:inline-flex"
          >
            <span className="hidden lg:inline">Mulai Photo Booth</span>
            <span className="lg:hidden">Mulai</span>
            <svg
              aria-hidden="true"
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
        </nav>
      </div>
    </header>
  )
}
