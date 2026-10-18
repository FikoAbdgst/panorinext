import { TestimonialMarquee } from "@/components/public/testimonial-marquee";
import { listTestimonials } from "@/lib/testimonials/queries";

export async function TestimonialsSection() {
  const items = await listTestimonials(50);

  return (
    <div className="hero-bg min-h-screen">
      <div className="text-center header-section bg-[#FEF3E2] py-20 relative" data-aos="fade-up">
        <div className="floating-elements">
          <i className="floating-star fas fa-star" style={{ top: "20%", left: "10%", animationDelay: "0s" }} />
          <i className="floating-star fas fa-heart" style={{ top: "30%", right: "15%", animationDelay: "2s" }} />
          <i className="floating-star fas fa-camera" style={{ bottom: "40%", left: "20%", animationDelay: "4s" }} />
          <i className="floating-star fas fa-smile" style={{ top: "60%", right: "20%", animationDelay: "6s" }} />
        </div>

        <h1 className="text-6xl font-extrabold text-gray-900 mb-8 tracking-tight" data-aos="fade-up">
          Apa Kata Mereka?
        </h1>
        <p className="text-gray-600 text-xl max-w-4xl mx-auto px-6 leading-relaxed" data-aos="fade-up">
          Kepuasan kamu adalah tujuan utama kami. Lihat cerita seru dari pengguna yang sudah mencoba PhotoBooth ini
          dan punya pengalaman seru yang nggak terlupakan!
        </p>
        <div className="mt-8" data-aos="fade-up">
          <div className="inline-flex items-center space-x-2 bg-white rounded-full px-6 py-3 shadow-lg border-2 border-[#BF3131]">
            <i className="fas fa-users text-[#BF3131]" />
            <span className="font-semibold text-gray-700">1000+ Pelanggan Puas</span>
            <i className="fas fa-heart text-red-500" />
          </div>
        </div>
      </div>

      <TestimonialMarquee items={items} />

      <div className="relative bg-gradient-to-br bg-[#FEF3E2] overflow-hidden" data-aos="fade-up">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-gradient-to-br from-[#BF3131] to-[#F16767] rounded-full opacity-5 animate-pulse" />
          <div
            className="absolute -bottom-32 -right-32 w-80 h-80 bg-gradient-to-bl from-[#F16767] to-[#BF3131] rounded-full opacity-5 animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute top-1/2 left-1/4 w-4 h-4 bg-[#BF3131] rounded-full opacity-20 animate-bounce"
            style={{ animationDelay: "0.5s" }}
          />
          <div
            className="absolute top-1/3 right-1/3 w-3 h-3 bg-[#F16767] rounded-full opacity-20 animate-bounce"
            style={{ animationDelay: "1.5s" }}
          />
          <div
            className="absolute bottom-1/4 left-1/2 w-5 h-5 bg-[#BF3131] rounded-full opacity-20 animate-bounce"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <div className="relative z-10 text-center py-16">
          <div className="max-w-6xl mx-auto px-6">
            <div className="mb-16">
              <div
                className="inline-flex items-center justify-center mb-6"
                data-aos="flip-up"
                data-aos-duration="800"
                data-aos-delay="100"
              >
                <div
                  className="h-px bg-gradient-to-r from-transparent via-[#BF3131] to-transparent w-32"
                  data-aos="slide-right"
                  data-aos-delay="200"
                />
                <div
                  className="mx-4 bg-white border-2 border-[#BF3131] rounded-full px-4 py-2"
                  data-aos="rotate-in"
                  data-aos-duration="800"
                  data-aos-delay="300"
                >
                  <i className="fas fa-camera text-[#BF3131] text-lg" />
                </div>
                <div
                  className="h-px bg-gradient-to-l from-transparent via-[#BF3131] to-transparent w-32"
                  data-aos="slide-left"
                  data-aos-delay="400"
                />
              </div>
              <p
                className="text-2xl font-semibold text-gray-700 mb-2"
                data-aos="slide-up"
                data-aos-duration="800"
                data-aos-delay="500"
              >
                &quot;Setiap detik adalah kenangan, setiap foto adalah cerita&quot;
              </p>
              <p
                className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed"
                data-aos="slide-up"
                data-aos-duration="800"
                data-aos-delay="700"
              >
                Photobooth terdepan yang menghadirkan teknologi canggih dengan sentuhan kreativitas untuk menciptakan
                momen tak terlupakan
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
