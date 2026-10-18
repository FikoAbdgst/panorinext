"use client";

import { useState } from "react";

const STEPS = [
  { title: "Langkah 1: Ambil Foto", src: "/step1.jpg" },
  { title: "Langkah 2: Fitur Setting Kamera", src: "/step2.jpg" },
  { title: "Langkah 3: Sesuaikan Foto", src: "/step3.jpg" },
  { title: "Langkah 4: Reset dan Unduh", src: "/step4.jpg" },
];

export function WelcomeModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  return (
    <div
      id="welcomeModal"
      className="fixed top-0 left-0 z-50 flex h-full w-full items-center justify-center overflow-auto bg-black/70"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="welcome-modal relative mx-auto flex w-[90%] flex-col items-center rounded-3xl bg-[#FEF3E2] p-6 shadow-lg sm:w-4/5 sm:p-8">
        <button
          type="button"
          className="absolute top-4 right-4 cursor-pointer border-none bg-transparent text-2xl font-bold text-gray-400 hover:text-black"
          onClick={onClose}
          aria-label="Tutup"
        >
          ×
        </button>

        <div className="flex flex-col items-center">
          <h2 className="mb-4 text-center text-2xl font-bold text-gray-800">
            {STEPS[step].title}
          </h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={STEPS[step].src}
            alt={STEPS[step].title}
            className="mb-6 w-full max-w-[1000px] rounded-lg"
          />
        </div>

        <div className="mb-4 flex justify-center">
          {STEPS.map((entry, index) => (
            <div
              key={entry.src}
              className={`step-indicator ${index === step ? "active" : ""}`}
            />
          ))}
        </div>

        <div className="flex w-full justify-center gap-4">
          {!isFirst ? (
            <button
              type="button"
              className="cursor-pointer rounded-xl border-none bg-gray-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-300 ease-in-out hover:scale-105 hover:bg-gray-600 hover:shadow-lg"
              onClick={() => setStep((current) => current - 1)}
            >
              Sebelumnya
            </button>
          ) : null}
          {!isLast ? (
            <button
              type="button"
              className="cursor-pointer rounded-xl border-none bg-[#BF3131] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#F16767] hover:shadow-lg"
              onClick={() => setStep((current) => current + 1)}
            >
              Selanjutnya
            </button>
          ) : (
            <button
              type="button"
              className="cursor-pointer rounded-xl border-none bg-[#BF3131] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#F16767] hover:shadow-lg"
              onClick={onClose}
            >
              Mulai
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
