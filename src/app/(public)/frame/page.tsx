import { Suspense } from "react";

import { AosRefresh } from "@/components/public/aos-refresh";
import { CustomFrameSection } from "@/components/public/custom-frame-section";
import { FrameCatalog } from "@/components/public/frame/frame-catalog";
import { PaymentFlow } from "@/components/public/frame/payment-flow";

function CatalogFallback() {
  return (
    <div id="frames-loading-overlay" className="relative">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-2xl" />
      <div className="relative z-20 text-center py-32 bg-[#FEF3E2]">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200" />
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#BF3131] border-t-transparent absolute top-0 left-0" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-800">Memuat frame...</h3>
        </div>
      </div>
    </div>
  );
}

export default function FramePage({ searchParams }: PageProps<"/frame">) {
  return (
    <div className="page-frame">
      <div className="py-16 bg-[#FEF3E2] content_section pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="text-3xl font-bold text-gray-900 inline-block relative"
              data-aos="fade-up" suppressHydrationWarning
              data-aos-delay="100"
            >
              <span className="bg-clip-text text-transparent bg-[#BF3131]">Pilih Frame Terbaikmu</span>
              <div
                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-[#BF3131] rounded-full"
                data-aos="fade-right" suppressHydrationWarning
                data-aos-delay="300"
              />
            </h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto" data-aos="fade-up" suppressHydrationWarning data-aos-delay="200">
              Temukan koleksi frame eksklusif untuk menciptakan kenangan yang tak terlupakan
            </p>
          </div>

          <Suspense fallback={<CatalogFallback />}>
            <FrameCatalog searchParams={searchParams} />
            <AosRefresh />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={null}>
        <CustomFrameSection />
        <AosRefresh />
      </Suspense>

      <PaymentFlow />
      <AosRefresh />
    </div>
  );
}
