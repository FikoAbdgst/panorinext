"use client";

export function Hero() {
  return (
    <div
      className="py-12 bg-[#FEF3E2] font-['Poppins'] h-screen relative"
      data-aos="fade-in"
      data-aos-duration="1500"
    >
      <div
        className="absolute left-0 top-1/2 transform -translate-y-1/2 z-30 hidden md:block"
        data-aos="slide-right"
        data-aos-duration="1200"
        data-aos-delay="400"
        data-aos-easing="ease-out-back"
      >
        <div className="relative">
          <div
            className="absolute -left-16 -top-20 transform shadow-2xl frame-left-rotate"
            data-aos="zoom-in-right-rotated"
            data-aos-duration="800"
            data-aos-delay="600"
          >
            <div className="w-56 bg-white border-4 border-[#BF3131] rounded-lg relative pt-8 pb-4 shadow-lg">
              <div className="border-2 border-[#BF3131] mx-2">
                <div
                  className="absolute top-2 right-2"
                  data-aos="flip-left"
                  data-aos-duration="600"
                  data-aos-delay="1000"
                >
                  <svg className="w-5 h-5 text-[#BF3131]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-1 px-2">
                <div className="relative" data-aos="fade-right" data-aos-duration="600" data-aos-delay="800">
                  <div className="h-32 overflow-hidden flex justify-center rounded">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/m1.jpeg" alt="Memory placeholder 1" className="object-cover w-full h-full" />
                  </div>
                </div>
                <div className="relative" data-aos="fade-right" data-aos-duration="600" data-aos-delay="900">
                  <div className="h-32 overflow-hidden flex justify-center rounded">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/m2.jpeg" alt="Memory placeholder 2" className="object-cover w-full h-full" />
                  </div>
                </div>
                <div className="relative" data-aos="fade-right" data-aos-duration="600" data-aos-delay="1000">
                  <div className="h-32 overflow-hidden flex justify-center rounded">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/m3.jpeg" alt="Memory placeholder 3" className="object-cover w-full h-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute right-0 top-1/2 transform -translate-y-1/2 z-30 hidden md:block"
        data-aos="slide-left"
        data-aos-duration="1200"
        data-aos-delay="500"
        data-aos-easing="ease-out-back"
      >
        <div className="relative">
          <div
            className="absolute -right-16 -top-20 transform shadow-2xl frame-right-rotate"
            data-aos="zoom-in-left-rotated"
            data-aos-duration="800"
            data-aos-delay="700"
          >
            <div className="w-56 bg-white border-4 border-[#BF3131] rounded-lg relative pt-8 pb-4 shadow-lg">
              <div className="border-2 border-[#BF3131] mx-2">
                <div
                  className="absolute top-2 left-2"
                  data-aos="flip-right"
                  data-aos-duration="600"
                  data-aos-delay="1100"
                >
                  <svg
                    className="w-5 h-5 text-[#BF3131]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-1 px-2">
                <div className="relative" data-aos="fade-left" data-aos-duration="600" data-aos-delay="900">
                  <div className="h-32 overflow-hidden flex justify-center rounded">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/k1.jpeg" alt="Memory placeholder 1" className="object-cover w-full h-full" />
                  </div>
                </div>
                <div className="relative" data-aos="fade-left" data-aos-duration="600" data-aos-delay="1000">
                  <div className="h-32 overflow-hidden flex justify-center rounded">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/k2.jpeg" alt="Memory placeholder 2" className="object-cover w-full h-full" />
                  </div>
                </div>
                <div className="relative" data-aos="fade-left" data-aos-duration="600" data-aos-delay="1100">
                  <div className="h-32 overflow-hidden flex justify-center rounded">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/k3.jpeg" alt="Memory placeholder 3" className="object-cover w-full h-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 z-20">
        <div
          className="absolute top-1/4 left-1/4 w-12 h-12 text-red-500 opacity-20"
          data-aos="zoom-in"
          data-aos-duration="1000"
          data-aos-delay="1500"
          data-aos-easing="ease-out-bounce"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </div>
        <div
          className="absolute bottom-1/4 right-1/4 w-16 h-16 text-red-500 opacity-20"
          data-aos="zoom-in"
          data-aos-duration="1000"
          data-aos-delay="1700"
          data-aos-easing="ease-out-bounce"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>
      </div>

      <div className="max-w-7xl h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center relative z-20">
        <div className="text-center">
          <h1
            className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl"
            data-aos="fade-up"
            data-aos-duration="1000"
            data-aos-delay="200"
            data-aos-easing="ease-out-cubic"
          >
            Photobooth App
          </h1>
          <p
            className="mt-5 max-w-xl mx-auto text-xl text-gray-500"
            data-aos="fade-up"
            data-aos-duration="800"
            data-aos-delay="400"
            data-aos-easing="ease-out-cubic"
          >
            Abadikan momen spesial kamu dengan frame keren dan berbagi dengan teman-teman!
          </p>
          <div
            className="mt-8"
            data-aos="fade-up"
            data-aos-duration="800"
            data-aos-delay="600"
            data-aos-easing="ease-out-back"
          >
            <button
              id="scrollToContentBtn"
              type="button"
              onClick={() => {
                document.querySelector(".content_section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#BF3131] hover:bg-[#F16767] transition duration-300 shadow-sm hover:shadow-lg cursor-pointer hover:scale-105"
              data-aos="pulse"
              data-aos-duration="2000"
              data-aos-delay="1200"
              data-aos-infinite="true"
            >
              Mulai Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
