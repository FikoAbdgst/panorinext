"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

type ThemeKey = "wedding" | "birthday" | "korporat" | "komunitas"
type Triple = readonly [string, string, string]

type Theme = {
  key: ThemeKey
  name: string
  pill: string
  title: readonly [string, string]
  body: string
  filter: string
  photos: Triple
}

// Semua foto dibuat hitam-putih ala photobooth, tiap tema hanya beda nuansa hangat/dinginnya.
const THEMES: Theme[] = [
  {
    key: "wedding",
    name: "Wedding",
    pill: "Cocok untuk Pernikahan",
    title: ["Frame wedding yang", "manis."],
    body: "Nuansa cream, arch, dan cincin untuk momen akad. Tiga frame dalam satu paket, siap dipakai di photobooth.",
    filter: "grayscale-[0.85] sepia-[0.25] contrast-[1.05]",
    photos: ["/images/w1.png", "/images/w2.png", "/images/w3.png"],
  },
  {
    key: "birthday",
    name: "Birthday",
    pill: "Cocok untuk Ulang Tahun",
    title: ["Frame ulang tahun yang", "ceria."],
    body: "Confetti, balon, dan warna hangat. Bikin tiap strip terasa seperti pesta kecil yang bisa dibawa pulang.",
    filter: "grayscale sepia-[0.12] contrast-[1.12]",
    photos: ["/images/b1.png", "/images/b2.png", "/images/b3.png"],
  },
  {
    key: "korporat",
    name: "Korporat",
    pill: "Cocok untuk Acara Kantor",
    title: ["Frame korporat yang", "formal."],
    body: "Garis bersih dan identitas brand yang formal, tanpa kehilangan karakter photobooth yang seru.",
    filter: "grayscale contrast-[1.1]",
    photos: ["/images/r1.png", "/images/r3.png", "/images/r2.png"],
  },
  {
    key: "komunitas",
    name: "Komunitas",
    pill: "Cocok untuk Komunitas",
    title: ["Frame komunitas yang", "solid."],
    body: "Sudut membulat, selotip, dan balon percakapan untuk merayakan kebersamaan satu lingkaran.",
    filter: "grayscale-[0.9] sepia-[0.2] contrast-[1.08]",
    photos: ["/images/o1.png", "/images/o2.png", "/images/o3.png"],
  },
]

/* ------------------------------------------------------------------ */
/* Surface: felt / linen / kraft the photos lie on                     */
/* ------------------------------------------------------------------ */

const SURFACE: Record<ThemeKey, string> = {
  wedding: "#E4D3C2",
  birthday: "#8E1B2B",
  korporat: "#241012",
  komunitas: "#C08A62",
}

const NOISE_OPACITY: Record<ThemeKey, number> = {
  wedding: 0.35,
  birthday: 0.55,
  korporat: 0.45,
  komunitas: 0.4,
}

// Grey fibre noise blended with "overlay": lights and darkens the base colour
// the way felt does, instead of just muddying it.
const NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"

/* ------------------------------------------------------------------ */
/* Scattered objects                                                   */
/* ------------------------------------------------------------------ */

type Shape = "star" | "dot" | "rect" | "petal"

type Piece = {
  shape: Shape
  x: number // left, %
  y: number // top, %
  w: number // px
  h: number // px
  r: number // rotation, deg
  bg: string // untuk star: "warna1,warna2" (gradient holo)
  top?: boolean // berada di atas foto
}

type Group = {
  shape: Shape
  n: number // jumlah di sekeliling foto
  onPhoto?: number // jumlah yang menempel di atas foto
  size: readonly [number, number]
  colors: readonly string[]
}

const SHAPE_CLASS: Record<Exclude<Shape, "star">, string> = {
  dot: "rounded-full",
  rect: "",
  petal: "rounded-[100%_0_100%_0]",
}

// Seeded random: same layout on server and client, different "toss" per theme.
function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Sebar di sekeliling kolom foto (x 34-66%), plus beberapa yang jatuh
// di atas foto seperti di referensi.
function scatter(seed: number, groups: readonly Group[]): Piece[] {
  const rnd = rng(seed)
  const out: Piece[] = []

  for (const group of groups) {
    const total = group.n + (group.onPhoto ?? 0)
    let placed = 0
    let guard = 0

    while (placed < total && guard < 800) {
      guard++
      const onPhoto = placed >= group.n

      const x = onPhoto ? 36 + rnd() * 28 : 2 + rnd() * 94
      const y = onPhoto ? 12 + rnd() * 76 : 3 + rnd() * 92

      if (!onPhoto && x > 34 && x < 66) continue
      if (out.some((p) => Math.hypot((p.x - x) * 1.5, p.y - y) < 8)) continue

      const w = group.size[0] + rnd() * (group.size[1] - group.size[0])
      const h = group.shape === "rect" ? w * (0.3 + rnd() * 0.5) : w
      const nearPhoto = (x > 29 && x <= 34) || (x >= 66 && x < 71)

      out.push({
        shape: group.shape,
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
        w: Math.round(w * 10) / 10,
        h: Math.round(h * 10) / 10,
        r: Math.round(rnd() * 360),
        bg: group.colors[Math.floor(rnd() * group.colors.length)],
        top: onPhoto || nearPhoto,
      })
      placed++
    }
  }

  return out
}

// Pastel holografik seperti sticker bintang di referensi.
const HOLO = [
  "#F2A3B8,#F6D0BE",
  "#7FB8E6,#B9A6EE",
  "#F7D768,#F4A27E",
  "#7FD6BE,#8DB8EE",
  "#B99AEA,#F2A0C4",
  "#F29A70,#EE6E8C",
  "#C9C2BE,#B7C2E8",
] as const

const PETALS = ["#D98F8A", "#EBB9B3", "#FBF3EC"] as const
const PEARL = "radial-gradient(circle at 35% 30%,#FFFFFF,#EADCCF 70%)"
const METAL = [
  "linear-gradient(135deg,#F3EDE6,#A9A3A0)",
  "linear-gradient(135deg,#F2D9A6,#B98A4E)",
  "linear-gradient(135deg,#F3C9BE,#C98A82)",
] as const

const WASHI_A =
  "repeating-linear-gradient(45deg,rgba(191,49,49,0.78) 0 6px,rgba(254,243,226,0.85) 6px 12px)"
const WASHI_B =
  "repeating-linear-gradient(45deg,rgba(254,243,226,0.9) 0 5px,rgba(122,28,28,0.72) 5px 10px)"

const TAPES: Piece[] = [
  { shape: "rect", x: -3, y: 4, w: 72, h: 18, r: -38, bg: WASHI_A },
  { shape: "rect", x: 88, y: 3, w: 72, h: 18, r: 34, bg: WASHI_B },
  { shape: "rect", x: -2, y: 91, w: 72, h: 18, r: 32, bg: WASHI_B },
  { shape: "rect", x: 87, y: 92, w: 72, h: 18, r: -30, bg: WASHI_A },
]

const PIECES: Record<ThemeKey, Piece[]> = {
  wedding: scatter(11, [
    { shape: "petal", n: 9, onPhoto: 3, size: [16, 26], colors: PETALS },
    { shape: "dot", n: 6, onPhoto: 1, size: [6, 9], colors: [PEARL] },
  ]),
  birthday: scatter(7, [
    { shape: "star", n: 20, onPhoto: 5, size: [16, 24], colors: HOLO },
  ]),
  korporat: scatter(23, [
    { shape: "rect", n: 12, onPhoto: 2, size: [8, 16], colors: METAL },
    { shape: "dot", n: 6, onPhoto: 1, size: [5, 8], colors: METAL },
  ]),
  komunitas: [
    ...TAPES,
    ...scatter(5, [
      {
        shape: "dot",
        n: 6,
        onPhoto: 1,
        size: [18, 28],
        colors: ["#7A1C1C", "#FEF3E2", "#BF3131"],
      },
      {
        shape: "star",
        n: 6,
        onPhoto: 2,
        size: [14, 20],
        colors: ["#FEF3E2", "#BF3131"],
      },
    ]),
  ],
}

// Bintang 5 sudut dengan ujung membulat (stroke round-join), bukan clip-path runcing.
const STAR_POINTS =
  "50,6 64.1,32.6 93.7,37.8 72.8,59.4 77,89.2 50,76 23,89.2 27.2,59.4 6.3,37.8 35.9,32.6"

function PieceView({ piece, pid }: { piece: Piece; pid: string }) {
  const { shape, x, y, w, h, r, bg } = piece
  const base = {
    left: `${x}%`,
    top: `${y}%`,
    width: w,
    height: h,
    transform: `rotate(${r}deg)`,
  }
  const z = piece.top ? "z-30" : "z-0"

  if (shape === "star") {
    const [c1, c2 = c1] = bg.split(",")
    return (
      <span
        aria-hidden="true"
        className={`absolute ${z}`}
        style={{ ...base, filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.28))" }}
      >
        <svg viewBox="0 0 100 100" className="block h-full w-full">
          <defs>
            <linearGradient id={pid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={c1} />
              <stop offset="100%" stopColor={c2} />
            </linearGradient>
          </defs>
          <polygon
            points={STAR_POINTS}
            fill={`url(#${pid})`}
            stroke={`url(#${pid})`}
            strokeWidth="9"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      className={`absolute ${SHAPE_CLASS[shape]} ${z}`}
      style={{
        ...base,
        background: bg,
        boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
      }}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Photos: 3 foto polos tersusun vertikal, tanpa frame dekoratif       */
/* ------------------------------------------------------------------ */

const TILT = [-1.2, 0.9, -0.6] as const
const SHIFT = [-3, 4, -2] as const

function PhotoColumn({ images, filter }: { images: Triple; filter: string }) {
  return (
    <div className="absolute left-1/2 top-1/2 z-20 flex w-[34%] max-w-[170px] -translate-x-1/2 -translate-y-1/2 flex-col gap-2">
      {images.map((src, index) => (
        <Image
          key={`${src}-${index}`}
          src={src}
          alt=""
          width={640}
          height={480}
          sizes="(max-width: 640px) 34vw, 170px"
          loading="lazy"
          decoding="async"
          style={{
            transform: `translateX(${SHIFT[index]}px) rotate(${TILT[index]}deg)`,
          }}
          // border tipis = pinggir cetakan photobooth seperti di referensi.
          // Hapus "border-[3px] border-[#141010]" kalau mau benar-benar tanpa pinggir.
          className={`aspect-[4/3] w-full border-[3px] border-[#141010] object-cover shadow-[2px_4px_6px_-1px_rgba(0,0,0,0.45)] ${filter}`}
        />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

function ThemeScene({ theme }: { theme: Theme }) {
  const key = theme.key

  return (
    <div className="absolute inset-0" style={{ backgroundColor: SURFACE[key] }}>
      <span
        aria-hidden="true"
        className="absolute inset-0 mix-blend-overlay"
        style={{ backgroundImage: NOISE, opacity: NOISE_OPACITY[key] }}
      />
      <span
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg,rgba(255,255,255,0.08),transparent 40%,rgba(0,0,0,0.12))",
        }}
      />

      {PIECES[key].map((piece, index) => (
        <PieceView key={index} piece={piece} pid={`star-${key}-${index}`} />
      ))}

      <PhotoColumn images={theme.photos} filter={theme.filter} />
    </div>
  )
}

export function CustomPacks() {
  const [active, setActive] = useState(0)
  const theme = THEMES[active]

  return (
    <section
      id="custom-pack"
      className="relative overflow-hidden bg-[#FEF3E2] pb-16 pt-10 font-['Poppins'] sm:pb-20 sm:pt-14"
    >
      <div
        aria-hidden="true"
        className="lab-paper absolute inset-0 opacity-60"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <h2
            suppressHydrationWarning
            data-aos="lab-sweep"
            data-aos-duration="1100"
            className="text-balance text-3xl font-extrabold leading-[0.95] tracking-[-0.035em] text-[#2A0A0A] sm:text-5xl"
          >
            Satu tema,
            <br />
            <span className="text-[#BF3131]">semua frame.</span>
          </h2>
          <p
            suppressHydrationWarning
            data-aos="lab-focus"
            data-aos-duration="1000"
            data-aos-delay="140"
            className="mt-4 max-w-md text-sm leading-relaxed text-[#5B3A32] sm:text-base"
          >
            Pilih temanya, lihat frame yang cocok untuk acaramu.
          </p>
        </div>

        <div
          role="group"
          aria-label="Pilih tema custom pack"
          className="mx-auto mt-7 grid w-full max-w-md grid-cols-2 gap-2 sm:flex sm:max-w-2xl sm:flex-wrap sm:items-center sm:justify-center"
        >
          {THEMES.map((item, index) => {
            const isActive = index === active
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActive(index)}
                aria-pressed={isActive}
                className={`min-h-11 rounded-full border px-4 py-2.5 text-xs font-semibold transition duration-200 sm:px-5 sm:text-sm ${
                  isActive
                    ? "border-[#2A0A0A] bg-[#2A0A0A] text-[#FEF3E2] shadow-[0_10px_24px_-14px_rgba(42,10,10,0.8)]"
                    : "border-[#2A0A0A]/20 bg-transparent text-[#5B3A32] hover:border-[#2A0A0A]/50 hover:text-[#2A0A0A]"
                }`}
              >
                {item.name}
              </button>
            )
          })}
        </div>

        <div className="mx-auto mt-9 w-full max-w-6xl overflow-hidden rounded-[26px] border border-[#BF3131]/15 bg-[#FFFBF3] shadow-[0_34px_90px_-46px_rgba(80,20,20,0.5)]">
          <div className="grid grid-cols-1 lg:grid-cols-[0.92fr_1.08fr]">
            <div
              key={`copy-${theme.key}`}
              className="pack-card-enter flex min-w-0 flex-col justify-center p-6 sm:p-9 lg:p-12"
            >
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#BF3131]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A1C1C] sm:text-[11px]">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-[#BF3131]"
                />
                {theme.pill}
              </span>

              <h3 className="mt-5 text-balance text-3xl font-extrabold leading-[0.98] tracking-[-0.04em] text-[#2A0A0A] sm:text-4xl">
                {theme.title[0]}{" "}
                <span className="text-[#BF3131]">{theme.title[1]}</span>
              </h3>

              <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#5B3A32] sm:text-base">
                {theme.body}
              </p>

              <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#9A6B5E]">
                3 frame · PNG + GIF · Email
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                <span
                  aria-disabled="true"
                  className="inline-flex min-h-11 items-center rounded-[2px] border border-dashed border-[#BF3131]/40 bg-[#FEF3E2]/60 px-4 py-2.5 text-sm font-semibold text-[#9A6B5E]"
                >
                  Segera dibuka
                </span>
                <Link
                  href="/frame"
                  className="text-sm font-semibold text-[#BF3131] underline decoration-dashed underline-offset-4 transition-colors hover:text-[#A02828] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFBF3]"
                >
                  Pakai frame gratis
                </Link>
              </div>
            </div>

            <div className="min-w-0 p-3 pt-0 sm:p-4 sm:pt-0 lg:p-6 lg:pl-0">
              <div
                key={`art-${theme.key}`}
                className="pack-card-enter relative h-full min-h-[340px] overflow-hidden rounded-[20px] sm:min-h-[400px] lg:min-h-[460px]"
              >
                <ThemeScene theme={theme} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
