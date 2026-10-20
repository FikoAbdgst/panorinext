import { Suspense } from "react";

import { AosRefresh } from "@/components/public/aos-refresh";
import { CustomPacks } from "@/components/public/custom-packs";
import { FeaturedFrames } from "@/components/public/featured-frames";
import { Footer } from "@/components/public/footer";
import { Hero } from "@/components/public/hero";
import { HowItWorks } from "@/components/public/how-it-works";
import { TestimonialsSection } from "@/components/public/testimonials-section";

function FeaturedFramesFallback() {
  return (
    <section className="bg-[#FEF3E2] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-9 w-64 animate-pulse bg-[#BF3131]/10 sm:h-12 sm:w-96" />
        <div className="mt-4 h-4 w-full max-w-xl animate-pulse bg-[#BF3131]/10" />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="border border-[#BF3131]/15 bg-[#FFFBF3] p-3"
            >
              <div className="h-4 w-full animate-pulse bg-[#BF3131]/10" />
              <div className="mt-3 aspect-[4/5] animate-pulse bg-[#BF3131]/10" />
              <div className="mt-3 h-5 w-2/3 animate-pulse bg-[#BF3131]/10" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsFallback() {
  return (
    <section className="bg-[#FEF3E2] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-9 w-72 animate-pulse bg-[#BF3131]/10 sm:h-12 sm:w-96" />
        <div className="mt-4 h-4 w-full max-w-xl animate-pulse bg-[#BF3131]/10" />
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className="border border-[#BF3131]/15 bg-[#FFFBF3] p-5"
            >
              <div className="h-10 w-10 animate-pulse rounded-full bg-[#BF3131]/10" />
              <div className="mt-4 h-4 w-2/3 animate-pulse bg-[#BF3131]/10" />
              <div className="mt-3 h-3 w-full animate-pulse bg-[#BF3131]/10" />
              <div className="mt-2 h-3 w-5/6 animate-pulse bg-[#BF3131]/10" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <AosRefresh />
      <Suspense fallback={<FeaturedFramesFallback />}>
        <FeaturedFrames />
        <AosRefresh />
      </Suspense>
      <HowItWorks />
      <AosRefresh />
      <CustomPacks />
      <AosRefresh />
      <Suspense fallback={<TestimonialsFallback />}>
        <TestimonialsSection />
        <AosRefresh />
      </Suspense>
      <Footer />
      <AosRefresh />
    </>
  );
}
