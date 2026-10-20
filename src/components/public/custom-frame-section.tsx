const WHATSAPP_URL =
  "https://wa.me/62882001330851?text=Halo%2C%20saya%20ingin%20konsultasi%20custom%20frame%20photo%20booth";

const OCCASIONS = ["Wedding", "Ulang tahun", "Korporat", "Komunitas"] as const;

export function CustomFrameSection() {
  return (
    <section
      id="custom-frame"
      className="relative scroll-mt-28 overflow-hidden bg-[#2A0A0A] py-14 font-['Poppins'] sm:py-16"
    >
      <div aria-hidden="true" className="lab-dots-cream absolute inset-0 opacity-30" />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-[#BF3131]" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2
              suppressHydrationWarning
              data-aos="lab-sweep"
              data-aos-duration="1100"
              className="text-balance text-3xl font-extrabold leading-[0.98] tracking-[-0.045em] text-[#FEF3E2] sm:text-5xl"
            >
              Butuh frame custom?
            </h2>
            <p
              suppressHydrationWarning
              data-aos="lab-focus"
              data-aos-duration="1000"
              data-aos-delay="140"
              className="mt-4 max-w-xl text-sm leading-relaxed text-[#FEF3E2]/80 sm:text-base"
            >
              Ceritakan acara, tema, dan jumlah slot. Kami susun frame-nya, lalu
              kirim lewat WhatsApp.
            </p>
          </div>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 w-full items-center justify-between gap-3 bg-[#BF3131] px-4 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-[#FEF3E2] transition hover:bg-[#A02828] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FEF3E2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2A0A0A] md:w-auto"
          >
            Kirim brief via WhatsApp
            <span aria-hidden="true" className="h-px w-6 bg-current" />
          </a>
        </div>

        <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#FEF3E2]/15 pt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#FEF3E2]/55">
          {OCCASIONS.map((occasion) => (
            <span key={occasion}>{occasion}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
