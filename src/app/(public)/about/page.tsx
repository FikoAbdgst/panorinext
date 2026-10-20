import type { Metadata } from "next";
import Link from "next/link";

import { AosRefresh } from "@/components/public/aos-refresh";

export const metadata: Metadata = {
  title: "Tentang PanoriCam",
  description:
    "PanoriCam adalah photobooth online dengan frame custom dan hasil PNG atau GIF yang bisa langsung dibawa pulang.",
};

/* eslint-disable @next/next/no-img-element */

const PRINCIPLES = [
  {
    label: "Frame",
    title: "Frame yang bikin berani pose.",
    body: "Frame bukan tempelan. Ia yang menentukan mood, dari lucu dan ramai sampai tenang dan editorial.",
  },
  {
    label: "Proses",
    title: "Proses yang nggak ribet.",
    body: "Pilih frame, atur timer, ulangi kalau perlu. Semua jalan di browser tanpa install aplikasi.",
  },
  {
    label: "Hasil",
    title: "Hasil yang langsung jadi milikmu.",
    body: "Photostrip PNG dan GIF bisa diunduh setelah sesi. Kirim ke email juga bisa.",
  },
] as const;

const OCCASIONS = [
  "Wedding",
  "Ulang tahun",
  "Acara korporat",
  "Acara komunitas",
] as const;

const CONTACTS = [
  {
    label: "Instagram",
    value: "@panoricam",
    href: "https://instagram.com/panoricam",
    external: true,
  },
  {
    label: "WhatsApp",
    value: "+62 882-0013-30851",
    href: "https://wa.me/62882001330851",
    external: true,
  },
  {
    label: "Email",
    value: "panoricam5@gmail.com",
    href: "mailto:panoricam5@gmail.com",
    external: false,
  },
] as const;

function Arrow() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
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
  );
}

export default function AboutPage() {
  return (
    <div
      id="top"
      className="page-about relative min-h-screen overflow-hidden bg-[#FEF3E2] font-['Poppins']"
    >
      <section className="relative overflow-hidden pt-28 sm:pt-32">
        <div
          aria-hidden="true"
          className="lab-paper absolute inset-0 opacity-60"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-center lg:gap-16">
            <div>
              <h1
                suppressHydrationWarning
                data-aos="lab-sweep"
                data-aos-duration="1100"
                className="text-balance text-[2.6rem] font-extrabold leading-[0.93] tracking-[-0.055em] text-[#2A0A0A] min-[380px]:text-[2.9rem] sm:text-6xl lg:text-[4rem]"
              >
                Momen lewat.
                <br />
                <span className="text-[#BF3131]">Frame-nya tinggal.</span>
              </h1>

              <p
                suppressHydrationWarning
                data-aos="lab-focus"
                data-aos-duration="1000"
                data-aos-delay="140"
                className="mt-6 max-w-xl text-pretty text-sm leading-relaxed text-[#5B3A32] sm:text-base"
              >
                PanoriCam adalah photobooth online untuk acara dan momen
                sehari-hari. Pilih frame, pose di depan kamera, lalu bawa pulang
                photostrip atau GIF langsung dari browser.
              </p>

              <div
                suppressHydrationWarning
                data-aos="lab-focus"
                data-aos-duration="900"
                data-aos-delay="220"
                className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A5A50]"
              >
                <span>Photo lab</span>
                <span
                  aria-hidden="true"
                  className="h-1 w-1 rounded-full bg-[#BF3131]/50"
                />
                <span>Online</span>
                <span
                  aria-hidden="true"
                  className="h-1 w-1 rounded-full bg-[#BF3131]/50"
                />
                <span>Banjar, Jawa Barat</span>
              </div>

              <div
                suppressHydrationWarning
                data-aos="lab-pop"
                data-aos-duration="1000"
                data-aos-delay="320"
                className="mt-8 flex flex-wrap items-center gap-4"
              >
                <Link
                  href="/frame"
                  className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#BF3131] px-6 py-3.5 text-sm font-semibold text-[#FEF3E2] shadow-[4px_4px_0_#7A1C1C] transition duration-300 hover:-translate-y-0.5 hover:bg-[#A02828] hover:shadow-[5px_5px_0_#7A1C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"
                >
                  Pilih frame
                  <Arrow />
                </Link>
                <a
                  href="https://instagram.com/panoricam"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#BF3131]/35 px-5 py-3.5 text-sm font-semibold text-[#BF3131] transition duration-300 hover:border-[#BF3131] hover:bg-[#BF3131]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"
                >
                  Sapa @panoricam
                </a>
              </div>
            </div>

            <div
              suppressHydrationWarning
              data-aos="lab-develop"
              data-aos-duration="1200"
              data-aos-delay="180"
              className="relative mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end"
            >
              <div
                aria-hidden="true"
                className="absolute -left-3 top-8 h-full w-full border border-[#BF3131]/20 bg-[#BF3131]/5"
              />

              <figure className="relative -rotate-[1.2deg] border border-[#BF3131]/30 bg-[#FFFBF3] p-3 shadow-[8px_8px_0_rgba(122,28,28,0.12)] sm:p-4">
                <div className="flex items-center justify-between border-b border-dashed border-[#BF3131]/25 pb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#7A5A50]">
                  <span>Lembar kontak</span>
                  <span className="text-[#BF3131]">001 / 002</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <div className="border border-[#BF3131]/20 bg-[#FEF3E2] p-1">
                      <img
                        src="/contoh.png"
                        alt="Contoh frame photostrip bertema ulang tahun dengan tulisan Happy Birthday"
                        className="aspect-[2/3] w-full object-cover"
                      />
                    </div>
                    <p className="mt-2 text-[8px] font-bold uppercase tracking-[0.14em] text-[#7A5A50]">
                      Contoh frame ulang tahun
                    </p>
                  </div>

                  <div>
                    <div className="border border-[#BF3131]/20 bg-[#FEF3E2] p-1">
                      <img
                        src="/contoh2.png"
                        alt="Contoh frame photostrip untuk acara komunitas dengan tulisan Oswaru 2025"
                        className="aspect-[2/3] w-full object-cover"
                      />
                    </div>
                    <p className="mt-2 text-[8px] font-bold uppercase tracking-[0.14em] text-[#7A5A50]">
                      Contoh frame acara
                    </p>
                  </div>
                </div>

                <figcaption className="mt-3 flex items-center justify-between gap-4 border-t border-dashed border-[#BF3131]/25 pt-2 text-[8px] font-semibold uppercase tracking-[0.14em] text-[#7A5A50]">
                  <span>Contoh frame dari katalog</span>
                  <span className="text-[#BF3131]">PanoriCam</span>
                </figcaption>
              </figure>

              <span
                aria-hidden="true"
                className="absolute -bottom-3 -right-2 -rotate-6 border border-[#BF3131] bg-[#FEF3E2] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#BF3131] shadow-[3px_3px_0_rgba(191,49,49,0.16)]"
              >
                Online
              </span>
            </div>
          </div>

          <div className="mt-14 h-px w-full bg-[#BF3131]/25 sm:mt-16" />
        </div>
      </section>

      <section className="relative border-b border-[#BF3131]/20 bg-[#FFFBF3] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <h2
                suppressHydrationWarning
                data-aos="lab-sweep"
                data-aos-duration="1100"
                className="max-w-md text-balance text-3xl font-extrabold leading-[0.96] tracking-[-0.045em] text-[#2A0A0A] sm:text-5xl"
              >
                Photobooth,
                <br />
                <span className="text-[#BF3131]">tanpa booth.</span>
              </h2>

              <div
                suppressHydrationWarning
                data-aos="lab-develop"
                data-aos-duration="1100"
                data-aos-delay="180"
                className="relative mt-8 max-w-xs border border-[#BF3131]/25 bg-[#FEF3E2] p-4"
              >
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#BF3131]">
                  Catatan lab
                </p>
                <ul className="mt-3 space-y-2 border-t border-dashed border-[#BF3131]/25 pt-3 text-sm font-semibold text-[#2A0A0A]">
                  <li>Tanpa install</li>
                  <li>Tanpa antre</li>
                  <li>Bisa dari HP atau laptop</li>
                </ul>
                <img
                  src="/panor.png"
                  alt="Ilustrasi karakter PanoriCam"
                  loading="lazy"
                  className="mt-4 w-full"
                />
              </div>
            </div>

            <div
              suppressHydrationWarning
              data-aos="lab-focus"
              data-aos-duration="1000"
              data-aos-delay="120"
              className="max-w-2xl lg:pt-2"
            >
              <p className="text-pretty text-2xl font-semibold leading-[1.25] tracking-[-0.025em] text-[#2A0A0A] sm:text-3xl">
                Kami bawa bilik photobooth ke browser.
              </p>
              <div className="mt-6 space-y-5 text-sm leading-relaxed text-[#5B3A32] sm:text-base">
                <p>
                  PanoriCam dibuat dengan ide sederhana: photobooth nggak harus
                  berupa bilik besar di sudut acara. Kamu bisa mulai dari HP
                  atau laptop, pilih frame yang paling cocok, dan langsung punya
                  hasil digital.
                </p>
                <p>
                  Frame jadi bagian utama, bukan tempelan. Ada frame gratis
                  untuk coba-coba, frame premium untuk momen yang lebih
                  spesial, dan frame custom untuk acara yang ingin terasa utuh.
                </p>
                <p>
                  Semua hasil bisa diunduh sebagai PNG atau GIF. Kalau mau
                  menyimpannya lebih rapi, kirim juga ke email setelah sesi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2
              suppressHydrationWarning
              data-aos="lab-sweep"
              data-aos-duration="1100"
              className="text-3xl font-extrabold leading-[0.96] tracking-[-0.045em] text-[#2A0A0A] sm:text-5xl"
            >
              Yang kami jaga.
            </h2>
            <p
              suppressHydrationWarning
              data-aos="lab-focus"
              data-aos-duration="1000"
              data-aos-delay="120"
              className="max-w-sm text-sm leading-relaxed text-[#5B3A32]"
            >
              Tiga hal yang bikin sesi foto terasa ringan, dari frame pertama
              sampai hasil di tanganmu.
            </p>
          </div>

          <div className="mt-8 border-t border-[#BF3131]/25">
            {PRINCIPLES.map((item, index) => (
              <article
                key={item.label}
                suppressHydrationWarning
                data-aos="lab-focus"
                data-aos-duration="900"
                data-aos-delay={120 + index * 100}
                className="grid gap-3 border-b border-[#BF3131]/25 py-6 sm:grid-cols-[7rem_1fr_1.15fr] sm:items-baseline sm:gap-8 sm:py-7"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#BF3131]">
                  {item.label}
                </p>
                <h3 className="text-balance text-xl font-bold leading-tight tracking-[-0.025em] text-[#2A0A0A] sm:text-2xl">
                  {item.title}
                </h3>
                <p className="max-w-lg text-sm leading-relaxed text-[#5B3A32]">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#2A0A0A] py-16 text-[#FEF3E2] sm:py-20">
        <div
          aria-hidden="true"
          className="lab-dots-cream absolute inset-0 opacity-30"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-[#BF3131]"
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-16">
            <div>
              <h2
                suppressHydrationWarning
                data-aos="lab-sweep"
                data-aos-duration="1100"
                className="max-w-2xl text-balance text-3xl font-extrabold leading-[0.96] tracking-[-0.045em] sm:text-5xl"
              >
                Frame custom, untuk acara yang nggak mau sama.
              </h2>
              <p
                suppressHydrationWarning
                data-aos="lab-focus"
                data-aos-duration="1000"
                data-aos-delay="140"
                className="mt-4 max-w-xl text-sm leading-relaxed text-[#FEF3E2]/80 sm:text-base"
              >
                Wedding, ulang tahun, acara kantor, atau komunitas. Kirim tema
                dan jumlah slot, kami susun frame-nya.
              </p>

              <a
                href="https://wa.me/62882001330851?text=Halo%2C%20saya%20ingin%20konsultasi%20custom%20frame%20untuk%20acara"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 bg-[#BF3131] px-6 py-3.5 text-sm font-semibold text-[#FEF3E2] transition duration-300 hover:bg-[#A02828] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FEF3E2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2A0A0A]"
              >
                Konsultasi frame custom
                <Arrow />
              </a>
            </div>

            <div
              suppressHydrationWarning
              data-aos="lab-focus"
              data-aos-duration="1000"
              data-aos-delay="220"
              className="border-y border-[#FEF3E2]/20 py-4"
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#FEF3E2]/55">
                Biasanya dipakai untuk
              </p>
              <ul className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3 text-sm font-semibold">
                {OCCASIONS.map((occasion) => (
                  <li key={occasion}>{occasion}</li>
                ))}
              </ul>
              <p className="mt-5 border-t border-[#FEF3E2]/15 pt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#FEF3E2]/55">
                Bisa juga untuk tema lain.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="kontak"
        className="relative overflow-hidden py-16 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <h2
                suppressHydrationWarning
                data-aos="lab-sweep"
                data-aos-duration="1100"
                className="max-w-lg text-balance text-3xl font-extrabold leading-[0.96] tracking-[-0.045em] text-[#2A0A0A] sm:text-5xl"
              >
                Mampir, tanya, atau ajak kolaborasi.
              </h2>
              <p
                suppressHydrationWarning
                data-aos="lab-focus"
                data-aos-duration="1000"
                data-aos-delay="140"
                className="mt-4 max-w-md text-sm leading-relaxed text-[#5B3A32] sm:text-base"
              >
                Kalau kamu di sekitar Banjar, Jawa Barat, atau mau bahas frame
                custom, kami senang mendengar ceritanya.
              </p>

              <img
                src="/panor.png"
                alt="Ilustrasi karakter PanoriCam"
                loading="lazy"
                className="mt-8 w-44 -rotate-2 sm:w-56"
              />

              <p className="mt-8 text-sm text-[#5B3A32]">
                Belum lihat frame-nya?{" "}
                <Link
                  href="/frame"
                  className="font-semibold text-[#BF3131] underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"
                >
                  Buka katalog frame
                </Link>
              </p>
            </div>

            <div
              suppressHydrationWarning
              data-aos="lab-focus"
              data-aos-duration="1000"
              data-aos-delay="180"
              className="border-t border-[#BF3131]/25"
            >
              {CONTACTS.map((contact) => (
                <a
                  key={contact.label}
                  href={contact.href}
                  {...(contact.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="group flex min-h-14 items-center justify-between gap-4 border-b border-[#BF3131]/25 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"
                >
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#7A5A50]">
                      {contact.label}
                    </span>
                    <span className="truncate text-lg font-semibold tracking-[-0.02em] text-[#2A0A0A] transition group-hover:text-[#BF3131]">
                      {contact.value}
                    </span>
                  </span>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#BF3131]/25 text-[#BF3131] transition group-hover:border-[#BF3131] group-hover:bg-[#BF3131] group-hover:text-[#FEF3E2]">
                    <Arrow />
                  </span>
                </a>
              ))}

              <div className="flex min-h-14 items-center justify-between gap-4 border-b border-[#BF3131]/25 py-4">
                <span className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#7A5A50]">
                    Lokasi
                  </span>
                  <span className="text-lg font-semibold tracking-[-0.02em] text-[#2A0A0A]">
                    Banjar, Jawa Barat
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#BF3131]/15 text-[#BF3131]/45"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AosRefresh />
    </div>
  );
}
