"use client"

import { useState, type FormEvent } from "react"

import {
  ADMIN_WHATSAPP_DISPLAY,
  buildAdminWhatsappUrl,
  buildCustomFrameRequestMessage,
} from "@/lib/whatsapp"

const OCCASIONS = [
  "Wedding",
  "Ulang tahun",
  "Korporat",
  "Komunitas",
  "Lainnya",
] as const

const LABEL =
  "text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A5A50]"

const FIELD =
  "min-h-11 w-full border border-[#BF3131]/25 bg-[#FEF3E2]/70 px-3 py-2 text-sm text-[#2A0A0A] transition placeholder:text-[#7A5A50]/60 focus:border-[#BF3131] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFBF3]"

function formatEventDate(value: string): string {
  if (!value) {
    return "-"
  }

  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(date)
}

export function CustomFrameSection() {
  const [sent, setSent] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const data = new FormData(event.currentTarget)
    const message = buildCustomFrameRequestMessage({
      name: String(data.get("name") ?? "").trim(),
      whatsapp: String(data.get("whatsapp") ?? "").trim(),
      occasion: String(data.get("occasion") ?? "").trim(),
      eventName: String(data.get("eventName") ?? "").trim(),
      date: formatEventDate(String(data.get("date") ?? "")),
      slots: String(data.get("slots") ?? "").trim(),
      theme: String(data.get("theme") ?? "").trim(),
      reference: String(data.get("reference") ?? "").trim(),
    })

    window.open(
      buildAdminWhatsappUrl(message),
      "_blank",
      "noopener,noreferrer",
    )
    setSent(true)
  }

  return (
    <section
      id="custom-frame"
      aria-labelledby="custom-frame-title"
      className="relative scroll-mt-28 overflow-hidden bg-[#2A0A0A] py-14 font-['Poppins'] sm:py-16"
    >
      <div aria-hidden="true" className="lab-dots-cream absolute inset-0 opacity-30" />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-[#BF3131]" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-12">
          <div className="max-w-xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#FEF3E2]/55">
              Custom frame
            </p>
            <h2
              id="custom-frame-title"
              suppressHydrationWarning
              data-aos="lab-sweep"
              data-aos-duration="1100"
              className="mt-2 text-balance text-3xl font-extrabold leading-[0.98] tracking-[-0.045em] text-[#FEF3E2] sm:text-5xl"
            >
              Butuh frame custom?
            </h2>
            <p
              suppressHydrationWarning
              data-aos="lab-focus"
              data-aos-duration="1000"
              data-aos-delay="140"
              className="mt-4 text-sm leading-relaxed text-[#FEF3E2]/80 sm:text-base"
            >
              Isi brief acara di formulir. Admin cek kebutuhan frame, lalu
              balas lewat WhatsApp.
            </p>

            <ul className="mt-6 flex flex-wrap gap-2">
              {OCCASIONS.map((occasion) => (
                <li
                  key={occasion}
                  className="border border-[#FEF3E2]/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#FEF3E2]/65"
                >
                  {occasion}
                </li>
              ))}
            </ul>

            <p className="mt-6 border-t border-[#FEF3E2]/15 pt-4 text-[11px] leading-relaxed text-[#FEF3E2]/55">
              Brief dikirim ke WhatsApp admin {ADMIN_WHATSAPP_DISPLAY}. Tidak
              perlu akun, cukup isi data acara.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="border border-[#BF3131]/30 bg-[#FFFBF3] p-5 shadow-[0_30px_70px_-45px_rgba(0,0,0,0.9)] sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#BF3131]/15 pb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#BF3131]">
                Brief custom frame
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A5A50]">
                Balasan via WhatsApp
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label htmlFor="cf-name" className="grid gap-1.5">
                <span className={LABEL}>Nama</span>
                <input
                  id="cf-name"
                  name="name"
                  required
                  autoComplete="name"
                  placeholder="Nama kamu"
                  className={FIELD}
                />
              </label>

              <label htmlFor="cf-whatsapp" className="grid gap-1.5">
                <span className={LABEL}>Nomor WhatsApp</span>
                <input
                  id="cf-whatsapp"
                  name="whatsapp"
                  type="tel"
                  inputMode="tel"
                  required
                  autoComplete="tel"
                  placeholder="08xxxxxxxxxx"
                  className={FIELD}
                />
              </label>

              <label htmlFor="cf-occasion" className="grid gap-1.5">
                <span className={LABEL}>Jenis acara</span>
                <select
                  id="cf-occasion"
                  name="occasion"
                  required
                  defaultValue=""
                  className={FIELD}
                >
                  <option value="" disabled>
                    Pilih jenis acara
                  </option>
                  {OCCASIONS.map((occasion) => (
                    <option key={occasion} value={occasion}>
                      {occasion}
                    </option>
                  ))}
                </select>
              </label>

              <label htmlFor="cf-event" className="grid gap-1.5">
                <span className={LABEL}>Nama acara</span>
                <input
                  id="cf-event"
                  name="eventName"
                  required
                  placeholder="Misal: Akad Sarah dan Budi"
                  className={FIELD}
                />
              </label>

              <label htmlFor="cf-date" className="grid gap-1.5">
                <span className={LABEL}>Tanggal acara</span>
                <input
                  id="cf-date"
                  name="date"
                  type="date"
                  required
                  className={FIELD}
                />
              </label>

              <label htmlFor="cf-slots" className="grid gap-1.5">
                <span className={LABEL}>Jumlah frame / slot</span>
                <input
                  id="cf-slots"
                  name="slots"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={12}
                  required
                  defaultValue={4}
                  className={FIELD}
                />
              </label>

              <label htmlFor="cf-theme" className="grid gap-1.5 sm:col-span-2">
                <span className={LABEL}>Tema dan warna</span>
                <input
                  id="cf-theme"
                  name="theme"
                  required
                  placeholder="Misal: cream dan merah, ada nama pengantin"
                  className={FIELD}
                />
              </label>

              <label htmlFor="cf-reference" className="grid gap-1.5 sm:col-span-2">
                <span className={LABEL}>Referensi (opsional)</span>
                <textarea
                  id="cf-reference"
                  name="reference"
                  rows={3}
                  placeholder="Tempel link Google Drive, Instagram, atau jelaskan referensinya"
                  className={`${FIELD} resize-y`}
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-4 inline-flex min-h-12 w-full items-center justify-between gap-3 bg-[#BF3131] px-4 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-[#FEF3E2] transition hover:bg-[#A02828] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFBF3]"
            >
              Kirim brief ke admin
              <span aria-hidden="true" className="h-px w-6 bg-current" />
            </button>

            {sent ? (
              <p
                role="status"
                className="mt-3 border border-[#BF3131]/20 bg-[#FEF3E2] px-3 py-2 text-[11px] leading-relaxed text-[#7A3E32]"
              >
                Brief sudah dibuka di WhatsApp. Kirim pesannya untuk
                menyelesaikan request.
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  )
}
