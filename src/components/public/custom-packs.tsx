const OCCASIONS = [
  {
    name: "Wedding",
    note: "Satu tema untuk area resepsi, meja tamu, dan photobooth.",
  },
  {
    name: "Birthday party",
    note: "Ulang tahun anak atau dewasa, bisa pakai nama dan tanggal.",
  },
  {
    name: "Acara korporat",
    note: "Branding perusahaan, peluncuran produk, atau gathering tim.",
  },
  {
    name: "Acara komunitas",
    note: "Bazar, reuni, konser kecil, atau perayaan sekolah.",
  },
] as const

import {
  buildAdminWhatsappUrl,
  WHATSAPP_TEMPLATES,
} from "@/lib/whatsapp";

const WHATSAPP_URL = buildAdminWhatsappUrl(WHATSAPP_TEMPLATES.customPack);

export function CustomPacks() {
  return (
    <section
      id="custom-pack"
      className="relative overflow-hidden bg-[#FEF3E2] py-16 font-['Poppins'] sm:py-20"
    >
      <div
        aria-hidden="true"
        className="lab-paper absolute inset-0 opacity-60"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-14">
          <div>
            <h2
              suppressHydrationWarning
              data-aos="lab-sweep"
              data-aos-duration="1100"
              className="max-w-2xl text-balance text-3xl font-extrabold leading-[0.98] tracking-[-0.045em] text-[#2A0A0A] sm:text-5xl"
            >
              Satu pack frame,{" "}
              <span className="text-[#BF3131]">satu tema untuk acaramu.</span>
            </h2>
            <p
              suppressHydrationWarning
              data-aos="lab-focus"
              data-aos-duration="1000"
              data-aos-delay="140"
              className="mt-4 max-w-xl text-sm leading-relaxed text-[#5B3A32] sm:text-base"
            >
              Kalau frame yang tersedia belum cocok, kami susun pack custom
              dengan satu tema yang jalan di semua slot. Cocok untuk acara yang
              ingin terasa utuh dari undangan sampai hasil foto.
            </p>

            <dl className="mt-8 divide-y divide-dashed divide-[#BF3131]/20 border-y border-dashed border-[#BF3131]/25">
              {OCCASIONS.map((item, index) => (
                <div
                  key={item.name}
                  suppressHydrationWarning
                  data-aos="lab-focus"
                  data-aos-duration="900"
                  data-aos-delay={120 + index * 90}
                  className="grid gap-1 py-4 sm:grid-cols-[9.5rem_1fr] sm:items-baseline sm:gap-4"
                >
                  <dt className="text-sm font-bold uppercase tracking-[0.16em] text-[#BF3131]">
                    {item.name}
                  </dt>
                  <dd className="text-sm leading-relaxed text-[#5B3A32]">
                    {item.note}
                  </dd>
                </div>
              ))}
            </dl>

            <div
              suppressHydrationWarning
              data-aos="lab-pop"
              data-aos-duration="1000"
              data-aos-delay="420"
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[2px] bg-[#BF3131] px-6 py-3.5 text-sm font-semibold text-[#FEF3E2] shadow-[4px_4px_0_#7A1C1C] transition duration-300 hover:-translate-y-0.5 hover:bg-[#A02828] hover:shadow-[5px_5px_0_#7A1C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2]"
              >
                Konsultasi pack custom
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
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
              </a>
              <p className="text-[10px] font-semibold uppercase leading-relaxed tracking-[0.18em] text-[#7A5A50]">
                Konsultasi lewat WhatsApp
              </p>
            </div>
          </div>

          <div
            suppressHydrationWarning
            data-aos="lab-develop"
            data-aos-duration="1200"
            data-aos-delay="180"
            className="relative mx-auto w-full max-w-md"
          >
            <div className="relative border border-[#BF3131]/30 bg-[#FFFBF3] p-6 shadow-[10px_10px_0_rgba(191,49,49,0.1)] sm:p-8">
              <span
                aria-hidden="true"
                className="absolute left-3 top-3 h-4 w-4 border-l border-t border-[#BF3131]/40"
              />
              <span
                aria-hidden="true"
                className="absolute right-3 top-3 h-4 w-4 border-r border-t border-[#BF3131]/40"
              />
              <span
                aria-hidden="true"
                className="absolute bottom-3 left-3 h-4 w-4 border-b border-l border-[#BF3131]/40"
              />
              <span
                aria-hidden="true"
                className="absolute bottom-3 right-3 h-4 w-4 border-b border-r border-[#BF3131]/40"
              />

              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9A6B5E]">
                Tema acara
              </p>
              <ul className="mt-3 space-y-3">
                {OCCASIONS.map((item, index) => (
                  <li key={item.name} className="flex items-center gap-3">
                    <span
                      className={`flex h-5 w-5 items-center justify-center border ${
                        index === 0
                          ? "border-[#BF3131] bg-[#BF3131] text-[#FEF3E2]"
                          : "border-[#BF3131]/30 bg-transparent text-transparent"
                      }`}
                    >
                      <svg
                        aria-hidden="true"
                        className="h-3 w-3"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                    <span className="text-sm font-semibold text-[#2A0A0A]">
                      {item.name}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 border-t border-dashed border-[#BF3131]/25 pt-4">
                <p className="text-xs leading-relaxed text-[#6B4A40]">
                  Kirim referensi warna, logo, atau mood acara. Kami susun
                  pack-nya.
                </p>
              </div>

              <span className="absolute -bottom-4 -right-4 -rotate-[8deg] border-2 border-[#BF3131] bg-[#FEF3E2] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#BF3131] shadow-[3px_3px_0_rgba(191,49,49,0.15)]">
                Custom
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
