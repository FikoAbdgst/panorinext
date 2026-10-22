"use client"

import { useState } from "react"

import { TestimonialMarquee } from "@/components/public/testimonial-marquee"
import type { TestimonialItem } from "@/lib/testimonials/types"

type FilterKey = "photo" | "note"

export function TestimonialGallery({ items }: { items: TestimonialItem[] }) {
  const photoItems = items.filter((item) => Boolean(item.photo_url))
  const noteItems = items.filter((item) => !item.photo_url)

  const allTabs: Array<{
    key: FilterKey
    label: string
    count: number
    items: TestimonialItem[]
  }> = [
    {
      key: "photo",
      label: "Fotostrip",
      count: photoItems.length,
      items: photoItems,
    },
    {
      key: "note",
      label: "Catatan",
      count: noteItems.length,
      items: noteItems,
    },
  ]
  const tabs = allTabs.filter((tab) => tab.count > 0)

  const [filter, setFilter] = useState<FilterKey>(tabs[0]?.key ?? "photo")
  const active = tabs.find((tab) => tab.key === filter) ?? tabs[0]

  if (!active) return null

  const showTabs = tabs.length > 1

  return (
    <div className="mt-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={`flex flex-col gap-4 sm:flex-row sm:items-end ${
            showTabs ? "sm:justify-between" : "sm:justify-end"
          }`}
        >
          {showTabs ? (
            <div
              role="tablist"
              aria-label="Filter testimoni"
              className="flex flex-wrap gap-1 border border-[#BF3131]/25 bg-[#FFFBF3] p-1"
            >
              {tabs.map((tab) => {
                const isActive = tab.key === active.key
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    id={`testimoni-tab-${tab.key}`}
                    aria-selected={isActive}
                    aria-controls="testimoni-panel"
                    onClick={() => setFilter(tab.key)}
                    className={`inline-flex min-h-10 items-center gap-2 px-4 text-[10px] font-bold uppercase tracking-[0.18em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2] ${
                      isActive
                        ? "bg-[#BF3131] text-[#FEF3E2] shadow-[2px_2px_0_#7A1C1C]"
                        : "text-[#7A5A50] hover:bg-[#BF3131]/10 hover:text-[#2A0A0A]"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] tracking-normal ${
                        isActive
                          ? "bg-[#FEF3E2]/20 text-[#FEF3E2]"
                          : "bg-[#BF3131]/10 text-[#BF3131]"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : null}

          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#9A6B5E]">
            Hover untuk lambat
          </p>
        </div>
      </div>

      <div
        id="testimoni-panel"
        role="tabpanel"
        aria-labelledby={showTabs ? `testimoni-tab-${active.key}` : undefined}
        className="mt-4 w-full"
      >
        <TestimonialMarquee key={active.key} items={active.items} />
      </div>
    </div>
  )
}
