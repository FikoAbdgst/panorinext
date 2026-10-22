"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

import { createClient } from "@/lib/supabase/client";

type IconName =
  | "grid"
  | "receipt"
  | "box"
  | "key"
  | "frame"
  | "tag"
  | "star"
  | "external"
  | "logout"
  | "menu"
  | "close"
  | "chevron";

const NAV_GROUPS: {
  label: string;
  items: { href: string; label: string; icon: IconName; badge?: boolean }[];
}[] = [
  {
    label: "Operasional",
    items: [
      { href: "/admin/dashboard", label: "Ringkasan", icon: "grid" },
      { href: "/admin/transactions", label: "Transaksi", icon: "receipt", badge: true },
    ],
  },
  {
    label: "Penjualan",
    items: [
      { href: "/admin/packs", label: "Paket", icon: "box" },
      { href: "/admin/rooms", label: "Ruang Premium", icon: "key" },
    ],
  },
  {
    label: "Katalog",
    items: [
      { href: "/admin/frames", label: "Frame", icon: "frame" },
      { href: "/admin/categories", label: "Kategori", icon: "tag" },
    ],
  },
  {
    label: "Umpan balik",
    items: [{ href: "/admin/testimoni", label: "Testimoni", icon: "star" }],
  },
];

const SECTION_TITLES: { prefix: string; title: string }[] = [
  { prefix: "/admin/dashboard", title: "Ringkasan" },
  { prefix: "/admin/transactions", title: "Transaksi" },
  { prefix: "/admin/packs", title: "Paket" },
  { prefix: "/admin/rooms", title: "Ruang Premium" },
  { prefix: "/admin/frames", title: "Frame" },
  { prefix: "/admin/categories", title: "Kategori" },
  { prefix: "/admin/testimoni", title: "Testimoni" },
];

const STORAGE_KEY = "panoricam-admin-rail";

const railListeners = new Set<() => void>();

function subscribeRail(listener: () => void) {
  railListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    railListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getRailSnapshot(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "collapsed";
  } catch {
    return false;
  }
}

function setRailCollapsed(next: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "collapsed" : "expanded");
  } catch {
    // Penyimpanan tidak tersedia; preferensi hanya berlaku untuk sesi ini.
  }
  railListeners.forEach((listener) => listener());
}

function sectionTitle(pathname: string): string {
  const match = SECTION_TITLES.filter((item) => pathname.startsWith(item.prefix)).sort(
    (a, b) => b.prefix.length - a.prefix.length,
  )[0];
  if (!match) return "Studio console";
  return pathname.includes("/edit") ? `Edit ${match.title}` : match.title;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function Icon({ name, className }: { name: IconName; className?: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  if (name === "grid") {
    return (
      <svg {...common}>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
      </svg>
    );
  }
  if (name === "receipt") {
    return (
      <svg {...common}>
        <path d="M6 3.5h12v16.2l-3-1.7-3 1.7-3-1.7-3 1.7z" />
        <path d="M9 8.5h6M9 12h6M9 15.5h3" />
      </svg>
    );
  }
  if (name === "box") {
    return (
      <svg {...common}>
        <path d="M12 3.6 20 8v8l-8 4.4L4 16V8z" />
        <path d="M4 8l8 4.4L20 8M12 12.4V20.4" />
      </svg>
    );
  }
  if (name === "key") {
    return (
      <svg {...common}>
        <circle cx="8" cy="15" r="3.6" />
        <path d="M10.6 12.4 19 4M15.5 7.5l2 2M13.5 9.5l1.6 1.6" />
      </svg>
    );
  }
  if (name === "frame") {
    return (
      <svg {...common}>
        <rect x="4" y="3.5" width="16" height="17" rx="1.4" />
        <rect x="7.5" y="7" width="9" height="10" rx="0.8" strokeDasharray="2.4 2.2" />
      </svg>
    );
  }
  if (name === "tag") {
    return (
      <svg {...common}>
        <path d="M4 11.5V5.2A1.2 1.2 0 0 1 5.2 4h6.3l8.2 8.2a1.4 1.4 0 0 1 0 2L12.6 21a1.4 1.4 0 0 1-2 0z" />
        <circle cx="8.2" cy="8.2" r="1.3" />
      </svg>
    );
  }
  if (name === "star") {
    return (
      <svg {...common}>
        <path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" />
      </svg>
    );
  }
  if (name === "external") {
    return (
      <svg {...common}>
        <path d="M14 4h6v6M20 4l-8.5 8.5" />
        <path d="M18 14.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4.5" />
      </svg>
    );
  }
  if (name === "logout") {
    return (
      <svg {...common}>
        <path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3" />
        <path d="M10 8 6 12l4 4M6 12h9" />
      </svg>
    );
  }
  if (name === "menu") {
    return (
      <svg {...common}>
        <path d="M4 6.5h16M4 12h16M4 17.5h16" />
      </svg>
    );
  }
  if (name === "close") {
    return (
      <svg {...common}>
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M14.5 5.5 8 12l6.5 6.5" />
    </svg>
  );
}

function BrandMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[21px] w-[21px]"
      aria-hidden="true"
    >
      <path d="M4 9a2.5 2.5 0 0 1 2.5-2.5h1L8.7 4.9h6.6l1.2 1.6h1A2.5 2.5 0 0 1 20 9v6.5A2.5 2.5 0 0 1 17.5 18h-11A2.5 2.5 0 0 1 4 15.5z" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

export function AdminShell({
  adminName,
  pendingCount,
  children,
}: {
  adminName: string;
  pendingCount: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const collapsed = useSyncExternalStore(subscribeRail, getRailSnapshot, () => false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  const toggleCollapsed = () => {
    setRailCollapsed(!collapsed);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      router.replace("/");
      router.refresh();
    }
  };

  return (
    <div
      className="admin-shell"
      data-collapsed={collapsed ? "true" : "false"}
      data-mobile-open={mobileOpen ? "true" : "false"}
    >
      {mobileOpen ? (
        <div
          className="admin-drawer-overlay lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <aside className="admin-sidebar" aria-label="Navigasi admin">
        <div className="admin-brand">
          <span className="admin-brand-mark">
            <BrandMark />
          </span>
          <span className="admin-brand-text min-w-0 flex-1">
            <span className="admin-brand-name block leading-tight">PanoriCam</span>
            <span className="admin-brand-sub block">Studio console</span>
          </span>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="admin-sidebar-action w-auto! hidden! lg:inline-flex!"
            aria-label={collapsed ? "Perluas sidebar" : "Ringkas sidebar"}
            title={collapsed ? "Perluas sidebar" : "Ringkas sidebar"}
          >
            <span className={collapsed ? "rotate-180 transition" : "transition"}>
              <Icon name="chevron" className="h-4 w-4" />
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="admin-sidebar-action w-auto! lg:hidden!"
            aria-label="Tutup menu"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>

        <nav className="admin-sidebar-scroll">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="admin-nav-group">
              <p className="admin-nav-group-label">{group.label}</p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href} className="admin-nav-item">
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        title={item.label}
                        onClick={() => setMobileOpen(false)}
                        className="admin-nav-link"
                      >
                        <span className="admin-nav-icon">
                          <Icon name={item.icon} className="h-5 w-5" />
                        </span>
                        <span className="admin-label truncate">{item.label}</span>
                        {item.badge && pendingCount > 0 ? (
                          <span className="admin-nav-count">{pendingCount}</span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-foot">
          <Link
            href="/"
            target="_blank"
            rel="noreferrer"
            onClick={() => setMobileOpen(false)}
            className="admin-sidebar-action"
          >
            <Icon name="external" className="h-4 w-4" />
            <span className="admin-label">Buka situs</span>
          </Link>
          <div className="admin-user mt-2">
            <span className="admin-avatar" aria-hidden="true">
              {initials(adminName) || "AD"}
            </span>
            <span className="admin-user-text min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-[#FEF3E2]">
                {adminName}
              </span>
              <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-[#FEF3E2]/50">
                Administrator
              </span>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="admin-sidebar-action !w-auto"
              aria-label="Keluar"
              title="Keluar"
            >
              <Icon name="logout" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="admin-content">
        <header className="admin-topbar">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[3px] text-[#5B3A32] transition hover:bg-[#2A0A0A]/5 lg:hidden"
            aria-label="Buka menu"
            aria-expanded={mobileOpen}
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>

          <p className="text-sm font-semibold text-[#2A0A0A]">
            {sectionTitle(pathname)}
          </p>

          <div className="ml-auto flex items-center gap-2">
            {pendingCount > 0 ? (
              <Link
                href="/admin/transactions?status=pending"
                className="inline-flex items-center gap-1.5 rounded-[3px] bg-[#BF3131] px-2.5 py-1.5 text-xs font-semibold text-[#FEF3E2] transition hover:bg-[#A02828]"
              >
                <span className="tabular-nums">{pendingCount}</span>
                <span className="hidden sm:inline">pending</span>
              </Link>
            ) : null}
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-[3px] px-2.5 py-1.5 text-xs font-semibold text-[#7A3E32] transition hover:bg-[#2A0A0A]/5 hover:text-[#2A0A0A] sm:inline-flex"
            >
              Lihat situs
              <Icon name="external" className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        <div className="admin-workspace">{children}</div>
      </div>
    </div>
  );
}
