"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/frame", label: "Frame" },
  { href: "/about", label: "About" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      id="navbar"
      className={`bg-[#FEF3E2] font-['Poppins'] w-full z-50 transition-all duration-300 ${
        scrolled
          ? "fixed top-0 left-0 right-0 h-20 shadow-md"
          : "absolute h-24 px-4 sm:px-6 lg:px-8"
      }`}
    >
      <div className="max-w-7xl mx-auto h-full">
        <div className="flex justify-between h-full">
          <div className="flex items-center justify-between w-full">
            <div
              className="flex-shrink-0 flex items-center"
              data-aos="fade-down"
              data-aos-delay="100"
            >
              <Link href="/" className="text-2xl font-bold text-[#BF3131]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="h-12 sm:h-16 md:h-[80px] w-auto mx-auto"
                />
              </Link>
            </div>
            <div
              className="flex items-center gap-2 sm:gap-5"
              data-aos="fade-down"
              data-aos-delay="100"
            >
              {LINKS.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-gray-700 hover:text-[#BF3131] px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium relative group nav-link ${
                      active ? "text-[#BF3131] font-semibold" : ""
                    }`}
                  >
                    {link.label}
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#BF3131] transform scale-x-0 origin-left transition-transform duration-300 ease-in-out group-hover:scale-x-100" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
