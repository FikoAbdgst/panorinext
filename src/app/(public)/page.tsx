import { Suspense } from "react";

import { AosRefresh } from "@/components/public/aos-refresh";
import { FeaturedFrames } from "@/components/public/featured-frames";
import { Footer } from "@/components/public/footer";
import { Hero } from "@/components/public/hero";
import { HowItWorks } from "@/components/public/how-it-works";
import { TestimonialsSection } from "@/components/public/testimonials-section";

function FeaturedFramesFallback() {
  return (
    <div className="py-16 bg-[#FEF3E2] content_section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-16">
          {[0, 1, 2].map((index) => (
            <div key={index} className="frame-card-skeleton">
              <div className="skeleton-image" />
              <div className="skeleton-content">
                <div className="skeleton-title" />
                <div className="skeleton-details">
                  <div className="skeleton-category" />
                  <div className="skeleton-usage" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TestimonialsFallback() {
  return (
    <div className="hero-bg min-h-screen">
      <div className="marquee-container relative bg-[#FEF3E2]">
        <div className="flex justify-center items-center w-full">
          <div className="loading-spinner" />
          <p className="ml-4 text-[#BF3131] font-semibold">Memuat testimoni...</p>
        </div>
      </div>
    </div>
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
      <Suspense fallback={<TestimonialsFallback />}>
        <TestimonialsSection />
        <AosRefresh />
      </Suspense>
      <Footer />
    </>
  );
}
