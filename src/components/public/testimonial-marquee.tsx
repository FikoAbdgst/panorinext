"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { TestimonialItem } from "@/lib/testimonials/types";

const EMOJIS_BY_RATING: Record<number, string[]> = {
  5: ["😍", "🤩", "⭐", "🎉", "💖", "👏"],
  4: ["😊", "👍", "😄", "🙂", "💙"],
  3: ["😐", "👌", "🙂"],
  2: ["😕", "👎"],
  1: ["😞", "👎", "😔"],
};

function pickEmoji(emoji: string | null, rating: number): string {
  if (emoji) return emoji;
  const list = EMOJIS_BY_RATING[rating] ?? EMOJIS_BY_RATING[5];
  return list[0];
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function Stars({ rating }: { rating: number }) {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) =>
        i <= rating ? (
          <i key={i} className="fas fa-star" />
        ) : (
          <i key={i} className="far fa-star text-gray-300" />
        ),
      )}
    </>
  );
}

export function TestimonialMarquee({ items }: { items: TestimonialItem[] }) {
  const router = useRouter();
  const marqueeRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    const marquee = marqueeRef.current;
    if (!marquee) return;
    marquee.style.animationPlayState = selected !== null ? "paused" : "running";
  }, [selected]);

  const closeModal = () => setSelected(null);

  useEffect(() => {
    if (selected === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  const current =
    selected !== null && items.length > 0 ? items[selected % items.length] : null;

  return (
    <>
      <div className="marquee-container relative bg-[#FEF3E2]" data-aos="fade-up">
        <div ref={marqueeRef} className="marquee-content">
          {items.length === 0 ? (
            <div className="text-center py-12 w-full">
              <div className="text-[#BF3131] mb-4">
                <i className="fas fa-comments text-6xl opacity-50" />
              </div>
              <p className="text-gray-500 text-lg">Belum ada testimoni tersedia.</p>
            </div>
          ) : (
            [...items, ...items].map((testimoni, index) => (
              <div
                key={`${testimoni.id}-${index}`}
                className="testimonial-card card-gradient rounded-2xl py-7 px-10 shadow-xl mx-3 relative"
                onClick={() => setSelected(index % items.length)}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="profile-avatar rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {(testimoni.name ?? "A").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg">{testimoni.name}</h4>
                      <p className="text-sm text-gray-500 font-medium" suppressHydrationWarning>
                        {formatDate(testimoni.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="emoji-badge">{pickEmoji(testimoni.emoji, testimoni.rating)}</div>
                </div>
                <div className="flex-grow mb-6">
                  <div className="relative">
                    <i className="fas fa-quote-left text-[#BF3131] text-2xl opacity-30 absolute -top-2 -left-1" />
                    <p className="message-text font-medium pl-6 pr-2 mt-4">{testimoni.message}</p>
                    <i className="fas fa-quote-right text-[#BF3131] text-2xl opacity-30 absolute -bottom-2 -right-1" />
                  </div>
                </div>
                <div className="mt-auto">
                  <div className="flex justify-center items-center mb-4">
                    <div className="flex items-center bg-gradient-to-r from-yellow-50 to-orange-50 rounded-full px-4 py-2 border border-yellow-200 w-fit">
                      <div className="star-rating mr-3">
                        <Stars rating={testimoni.rating} />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        ({testimoni.rating}/5)
                      </span>
                    </div>
                  </div>
                  {testimoni.frame ? (
                    <div
                      className="frame-info-badge"
                      onClick={(event) => {
                        event.stopPropagation();
                        router.push("/frame");
                      }}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <i className="fas fa-image frame-icon text-[#BF3131] transition-colors duration-300" />
                        <span className="text-sm font-semibold frame-text text-gray-700 transition-colors duration-300">
                          Frame: {testimoni.frame.name}
                        </span>
                        <i className="fas fa-check-circle frame-check text-green-500 text-sm transition-colors duration-300" />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div
        id="testimoniModal"
        className={`modal ${current ? "show" : ""}`}
        style={{ display: current ? "flex" : "none" }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeModal();
        }}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="text-2xl font-bold text-gray-800">Testimoni Lengkap</h2>
            <button type="button" className="modal-close" onClick={closeModal}>
              ×
            </button>
          </div>
          <div className="text-center">
            <div className="modal-icon">
              <i className="fas fa-quote-left text-white text-3xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">{current?.name}</h3>
            <p className="text-gray-600 mb-2 leading-relaxed">{current?.message}</p>
            <div className="flex justify-center items-center my-4">
              <div className="flex items-center bg-gradient-to-r from-yellow-50 to-orange-50 rounded-full px-4 py-2 border border-yellow-200 w-fit">
                <div className="star-rating mr-3">
                  {current ? <Stars rating={current.rating} /> : null}
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {current ? `(${current.rating}/5)` : "-"}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500 font-medium" suppressHydrationWarning>
              {current ? formatDate(current.created_at) : ""}
            </p>
          </div>
          <div className="modal-buttons">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Tutup
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
