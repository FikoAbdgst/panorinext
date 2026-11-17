"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

type SectionLink = {
  hash: string
  label: string
}

const HOME_LINKS: readonly SectionLink[] = [
  { hash: "#frame-rack", label: "Frame" },
  { hash: "#cara-kerja", label: "Cara Kerja" },
  { hash: "#custom-pack", label: "Paket" },
  { hash: "#testimoni", label: "Testimoni" },
]

const FRAME_LINKS: readonly SectionLink[] = [
  { hash: "#frame-catalog", label: "Katalog" },
  { hash: "#custom-frame", label: "Custom Frame" },
]

const FLIPBOOK_LINKS: readonly SectionLink[] = []

export function Navbar() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpenPath, setMobileOpenPath] = useState<string | null>(null)
  const navRef = useRef<HTMLElement>(null)
  const menuToggleRef = useRef<HTMLButtonElement>(null)

  const closeMobileMenu = useCallback(() => setMobileOpenPath(null), [])

  const mobileOpen = mobileOpenPath === pathname
  const linksPage =
    pathname === "/frame" || pathname === "/flipbook" ? pathname : "/"
  const sectionLinks =
    linksPage === "/frame"
      ? FRAME_LINKS
      : linksPage === "/flipbook"
        ? FLIPBOOK_LINKS
        : HOME_LINKS
  const onLinksPage = linksPage === pathname
  const isFeaturePage = pathname === "/frame" || pathname === "/flipbook"

  const hrefFor = (hash: string) =>
    onLinksPage ? hash : `${linksPage}${hash}`

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return

    const onPointerDown = (event: PointerEvent) => {
      if (navRef.current?.contains(event.target as Node)) return
      setMobileOpenPath(null)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setMobileOpenPath(null)
      menuToggleRef.current?.focus()
    }

    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [mobileOpen])

  return (
    <header
      data-site-navbar
      className="pointer-events-none fixed inset-x-0 top-0 z-50 font-['Poppins']"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <nav
          id="navbar"
          ref={navRef}
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
            onClick={closeMobileMenu}
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

          {sectionLinks.length > 0 ? (
            <div className="hidden items-center gap-0.5 md:absolute md:left-1/2 md:top-1/2 md:flex md:-translate-x-1/2 md:-translate-y-1/2">
              {sectionLinks.map((link) => (
                <Link
                  key={link.hash}
                  href={hrefFor(link.hash)}
                  className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full px-3 text-xs font-medium text-gray-700 transition-colors duration-200 hover:bg-[#BF3131]/5 hover:text-[#BF3131] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131]/40 sm:px-3.5 sm:text-sm"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ) : null}

          <div className="ml-auto flex items-center gap-1.5">
            <Link
              href="/fitur"
              className={`group inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3.5 text-xs font-semibold transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2] sm:text-sm md:px-4 ${
                isFeaturePage
                  ? "border border-[#BF3131]/30 bg-[#FFFBF3]/70 text-[#BF3131] hover:border-[#BF3131] hover:bg-[#BF3131] hover:text-[#FEF3E2]"
                  : "bg-[#BF3131] text-white shadow-[0_8px_20px_-10px_rgba(191,49,49,0.8)] hover:bg-[#F16767] hover:shadow-[0_12px_24px_-12px_rgba(191,49,49,0.9)]"
              }`}
            >
              <span className="hidden lg:inline">
                {isFeaturePage ? "Kembali ke Fitur" : "Mulai Photo Booth"}
              </span>
              <span className="lg:hidden">
                {isFeaturePage ? "Kembali" : "Mulai"}
              </span>
              <svg
                aria-hidden="true"
                className={`h-4 w-4 transition-transform duration-300 ${
                  isFeaturePage
                    ? "group-hover:-translate-x-0.5"
                    : "group-hover:translate-x-0.5"
                }`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={
                    isFeaturePage
                      ? "M10 19l-7-7 7-7M3 12h18"
                      : "M14 5l7 7m0 0l-7 7m7-7H3"
                  }
                />
              </svg>
            </Link>

            {sectionLinks.length > 0 ? (
              <button
                ref={menuToggleRef}
                type="button"
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav-menu"
                aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
                onClick={() => setMobileOpenPath(mobileOpen ? null : pathname)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#BF3131]/20 text-[#7A3E32] transition hover:border-[#BF3131]/50 hover:bg-[#BF3131]/5 hover:text-[#BF3131] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131]/40 md:hidden"
              >
                {mobileOpen ? (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                ) : (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 7h16M4 12h16M4 17h16" />
                  </svg>
                )}
              </button>
            ) : null}
          </div>

          {mobileOpen && sectionLinks.length > 0 ? (
            <div
              id="mobile-nav-menu"
              className="absolute inset-x-0 top-full z-50 mt-2 rounded-2xl border border-[#BF3131]/15 bg-[#FEF3E2] p-2 shadow-[0_24px_60px_-28px_rgba(80,20,20,0.55)] md:hidden"
            >
              <p className="px-3 pb-1 pt-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#7A5A50]">
                {onLinksPage ? "Di halaman ini" : "Jelajahi halaman"}
              </p>
              {sectionLinks.map((link) => (
                <Link
                  key={link.hash}
                  href={hrefFor(link.hash)}
                  onClick={closeMobileMenu}
                  className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-3 text-sm font-semibold text-[#2A0A0A] transition hover:bg-[#BF3131]/5 hover:text-[#BF3131] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131]/40"
                >
                  {link.label}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4 text-[#BF3131]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14M6 13l6 6 6-6" />
                  </svg>
                </Link>
              ))}
            </div>
          ) : null}
        </nav>
      </div>
    </header>
  )
}
