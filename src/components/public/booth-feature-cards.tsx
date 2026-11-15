import Image from "next/image"
import Link from "next/link"

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFBF3]"

const FEATURES = [
  {
    href: "/frame",
    number: "01",
    badge: "Photostrip",
    title: "Foto Frame Slot",
    description:
      "Pilih frame slot favorit, atur pose, lalu simpan photostrip dan GIF-nya.",
    meta: "Banyak frame gratis · PNG / GIF",
  },
  {
    href: "/flipbook",
    number: "02",
    badge: "Buku 3D",
    title: "Flipbook",
    description:
      "Rekam 10 frame berurutan, pilih frame PNG khusus flipbook, lalu putar hasilnya seperti buku sungguhan.",
    meta: "10 frame · Frame PNG · GIF",
  },
] as const

const STRIP_IMAGES = [
  "/images/r1.png",
  "/images/w1.png",
  "/images/b1.png",
] as const

function FrameStripPreview() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden bg-[#2A0A0A]"
    >
      <div className="absolute inset-0 opacity-90 [background-image:radial-gradient(circle_at_16%_10%,rgba(191,49,49,0.72),transparent_48%),radial-gradient(circle_at_88%_92%,rgba(122,28,28,0.82),transparent_52%)]" />
      <div className="absolute -right-8 top-6 h-28 w-28 rounded-full border border-[#FEF3E2]/10" />
      <div className="absolute -left-6 bottom-4 h-20 w-20 rounded-full border border-[#FEF3E2]/10" />

      <div className="absolute left-1/2 top-1/2 w-[31%] min-w-[96px] max-w-[140px] -translate-x-1/2 -translate-y-1/2 -rotate-3 rounded-[2px] bg-[#FEF3E2] p-1.5 shadow-[0_24px_44px_-18px_rgba(0,0,0,0.85)] sm:p-2">
        <div className="flex flex-col gap-1 sm:gap-1.5">
          {STRIP_IMAGES.map((src) => (
            <div
              key={src}
              className="relative aspect-[4/3] overflow-hidden rounded-[1px] bg-[#E7D6C2]"
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="140px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex items-center justify-between px-0.5">
          <span className="text-[5px] font-extrabold tracking-[0.2em] text-[#2A0A0A]">
            PANORICAM
          </span>
          <span className="text-[4px] font-semibold tracking-[0.16em] text-[#7A5A50]">
            PHOTO STRIP
          </span>
        </div>
      </div>

      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full border border-[#FEF3E2]/25 bg-[#2A0A0A]/60 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.18em] text-[#FEF3E2]/85 backdrop-blur">
        3 slot
      </span>
    </div>
  )
}

function FlipbookPreview() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden bg-[#7A1C1C]"
    >
      <div className="absolute inset-0 opacity-90 [background-image:radial-gradient(circle_at_18%_12%,rgba(191,49,49,0.85),transparent_50%),radial-gradient(circle_at_86%_88%,rgba(42,10,10,0.75),transparent_54%)]" />
      <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full border border-[#FEF3E2]/12" />
      <div className="absolute -bottom-6 left-6 h-20 w-20 rounded-full border border-[#FEF3E2]/12" />

      <div className="absolute inset-0 flex items-center justify-center [perspective:900px]">
        <div className="relative aspect-[3/4] w-[42%] max-w-[200px] [transform:rotateY(-18deg)_rotateX(4deg)]">
          <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-[2px] bg-[#FEF3E2]/45" />
          <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[2px] bg-[#FEF3E2]/70" />

          <div className="absolute inset-0 overflow-hidden rounded-[2px] border border-[#FEF3E2]/40 bg-[#2A0A0A] shadow-[0_24px_45px_-20px_rgba(0,0,0,0.85)]">
            <Image
              src="/images/w1.png"
              alt=""
              fill
              sizes="200px"
              className="object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2A0A0A] via-[#2A0A0A]/10 to-transparent" />

            <div className="absolute inset-3 flex flex-col justify-between">
              <span className="text-[5px] font-extrabold tracking-[0.26em] text-[#FEF3E2]">
                PANORICAM
              </span>
              <div>
                <span className="block h-0.5 w-5 bg-[#FEF3E2]" />
                <p className="mt-1 text-[clamp(8px,2vw,13px)] font-extrabold leading-none text-[#FEF3E2]">
                  FLIPBOOK
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full border border-[#FEF3E2]/25 bg-[#2A0A0A]/60 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.18em] text-[#FEF3E2]/85 backdrop-blur">
        10 frame
      </span>
    </div>
  )
}

export function BoothFeatureCards() {
  return (
    <div
      id="pilih-fitur"
      className="mt-8 grid scroll-mt-28 gap-4 sm:mt-10 md:grid-cols-2 md:gap-5"
    >
      {FEATURES.map((feature) => (
        <Link
          key={feature.href}
          href={feature.href}
          className={`group relative flex flex-col overflow-hidden rounded-[3px] border border-[#BF3131]/20 bg-[#FFFBF3] shadow-[0_26px_60px_-42px_rgba(42,10,10,0.75)] transition duration-300 hover:-translate-y-1 hover:border-[#BF3131]/50 hover:shadow-[8px_8px_0_rgba(191,49,49,0.14)] ${FOCUS_RING}`}
        >
          <div className="relative aspect-[4/3] overflow-hidden">
            {feature.href === "/frame" ? (
              <FrameStripPreview />
            ) : (
              <FlipbookPreview />
            )}

            <div className="absolute left-3 top-3 flex items-center gap-2">
              <span className="bg-[#FEF3E2] px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#BF3131]">
                {feature.number}
              </span>
              <span className="border border-[#FEF3E2]/35 bg-[#2A0A0A]/45 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.18em] text-[#FEF3E2] backdrop-blur">
                {feature.badge}
              </span>
            </div>
          </div>

          <div className="flex flex-1 flex-col p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-2xl font-extrabold leading-tight tracking-[-0.04em] text-[#2A0A0A]">
                {feature.title}
              </h2>
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#BF3131]/30 text-[#BF3131] transition duration-300 group-hover:border-[#BF3131] group-hover:bg-[#BF3131] group-hover:text-[#FEF3E2]"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </div>

            <p className="mb-5 mt-2 text-sm leading-relaxed text-[#5B3A32]">
              {feature.description}
            </p>

            <div className="mt-auto flex items-center justify-between gap-3 border-t border-dashed border-[#BF3131]/20 pt-3">
              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#7A5A50]">
                {feature.meta}
              </span>
              <span className="whitespace-nowrap text-xs font-bold text-[#BF3131]">
                Mulai →
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
