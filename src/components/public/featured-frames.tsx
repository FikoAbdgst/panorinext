import Link from "next/link";

import { FeaturedFrameCard } from "@/components/public/frame-preview-card";
import { listTopFrames } from "@/lib/frames/queries";

export async function FeaturedFrames() {
  const topFrames = await listTopFrames(3);

  return (
    <div className="py-16 bg-[#FEF3E2] content_section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16" data-aos="fade-up" suppressHydrationWarning>
          <h2 className="text-3xl font-bold text-gray-900 inline-block relative">
            <span className="bg-clip-text text-transparent bg-[#BF3131]">Frame Unggulan</span>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-[#BF3131] rounded-full" />
          </h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Frame paling populer yang banyak digunakan untuk momen spesial Anda
          </p>
        </div>

        {topFrames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-16">
            {topFrames.map((frame, index) => (
              <FeaturedFrameCard
                key={frame.id}
                index={index}
                frame={{
                  id: frame.id,
                  name: frame.name,
                  imagePath: frame.image_path,
                  price: frame.price,
                  used: frame.used,
                  categoryIcon: frame.category_icon,
                  categoryName: frame.category_name,
                  width: frame.width,
                  height: frame.height,
                  slots: frame.slots,
                }}
              />
            ))}
          </div>
        ) : (
          <div
            className="text-center py-12 bg-gradient-to-r from-red-50 to-red-50 rounded-2xl shadow-inner mb-16"
            data-aos="fade-up" suppressHydrationWarning
          >
            <div className="inline-block text-7xl mb-6 animate-pulse">🖼️</div>
            <p className="text-xl text-gray-600 font-light">Belum ada frame unggulan saat ini.</p>
            <p className="mt-3 text-gray-500">Coba lagi nanti atau jelajahi kategori lainnya.</p>
          </div>
        )}

        <div className="mt-16 text-center" data-aos="fade-up" suppressHydrationWarning data-aos-delay="100">
          <Link
            href="/frame"
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#BF3131] hover:bg-[#F16767] transition duration-300 shadow-md hover:shadow-lg"
          >
            Mulai Mencoba
            <svg
              className="ml-2 w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
