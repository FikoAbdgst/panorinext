import { listCustomFrames } from "@/lib/frames/queries";
import { getFramePublicUrl } from "@/lib/frames/url";

export async function CustomFrameSection() {
  const customFrames = await listCustomFrames(4);

  return (
    <div className="py-16 bg-[#FEF3E2] font-['Poppins'] relative overflow-hidden">
      <div
        className="absolute top-0 left-0 w-32 h-32 bg-[#F16767] opacity-10 rounded-full -translate-x-16 -translate-y-16"
        data-aos="fade-right" suppressHydrationWarning
        data-aos-duration="1000"
      />
      <div
        className="absolute bottom-0 right-0 w-40 h-40 bg-[#BF3131] opacity-10 rounded-full translate-x-20 translate-y-20"
        data-aos="fade-left" suppressHydrationWarning
        data-aos-duration="1000"
        data-aos-delay="200"
      />
      <div
        className="absolute top-1/2 left-10 w-6 h-6 bg-[#F16767] opacity-30 rounded-full float-animation"
        data-aos="zoom-in" suppressHydrationWarning
        data-aos-duration="800"
        data-aos-delay="400"
      />
      <div
        className="absolute top-1/4 right-20 w-4 h-4 bg-[#BF3131] opacity-40 rounded-full float-animation"
        style={{ animationDelay: "1s" }}
        data-aos="zoom-in" suppressHydrationWarning
        data-aos-duration="800"
        data-aos-delay="600"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12" data-aos="fade-up" suppressHydrationWarning data-aos-duration="800">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">Butuh Frame Khusus?</h2>
          <div
            className="w-24 h-1 bg-[#BF3131] mx-auto rounded-full mb-4"
            data-aos="scale-x-0" suppressHydrationWarning
            data-aos-duration="600"
            data-aos-delay="200"
          />
          <p
            className="max-w-2xl mx-auto text-lg text-gray-600"
            data-aos="fade-up" suppressHydrationWarning
            data-aos-duration="800"
            data-aos-delay="300"
          >
            Kami bisa membuatkan frame custom sesuai tema acara atau keinginan Anda
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8" data-aos="fade-right" suppressHydrationWarning data-aos-duration="1000" data-aos-delay="400">
            <div className="space-y-6">
              <div className="flex items-start space-x-4" data-aos="fade-up" suppressHydrationWarning data-aos-duration="800" data-aos-delay="500">
                <div className="flex-shrink-0">
                  <div
                    className="w-12 h-12 bg-[#BF3131] rounded-full flex items-center justify-center shadow-lg"
                    data-aos="zoom-in" suppressHydrationWarning
                    data-aos-duration="600"
                    data-aos-delay="600"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Desain Sesuai Keinginan</h3>
                  <p className="text-gray-600">
                    Frame custom dibuat khusus untuk acara pernikahan, ulang tahun, wisuda, atau event spesial lainnya
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4" data-aos="fade-up" suppressHydrationWarning data-aos-duration="800" data-aos-delay="700">
                <div className="flex-shrink-0">
                  <div
                    className="w-12 h-12 bg-[#F16767] rounded-full flex items-center justify-center shadow-lg"
                    data-aos="zoom-in" suppressHydrationWarning
                    data-aos-duration="600"
                    data-aos-delay="800"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Proses Cepat</h3>
                  <p className="text-gray-600">Konsultasi melalui WhatsApp dan frame siap dalam 1-2 hari kerja</p>
                </div>
              </div>

              <div className="flex items-start space-x-4" data-aos="fade-up" suppressHydrationWarning data-aos-duration="800" data-aos-delay="900">
                <div className="flex-shrink-0">
                  <div
                    className="w-12 h-12 bg-[#BF3131] rounded-full flex items-center justify-center shadow-lg"
                    data-aos="zoom-in" suppressHydrationWarning
                    data-aos-duration="600"
                    data-aos-delay="1000"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Kualitas Premium</h3>
                  <p className="text-gray-600">
                    Desain berkualitas tinggi dengan resolusi terbaik untuk hasil foto yang sempurna
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative" data-aos="fade-left" suppressHydrationWarning data-aos-duration="1000" data-aos-delay="400">
            <div
              className="absolute inset-0 gradient-bg rounded-3xl transform rotate-3 opacity-10"
              data-aos="rotate-in" suppressHydrationWarning
              data-aos-duration="1200"
              data-aos-delay="600"
            />

            <div className="relative bg-white rounded-2xl p-8 custom-shadow" data-aos="zoom-in" suppressHydrationWarning data-aos-duration="800" data-aos-delay="800">
              <div className="text-center">
                <div className="relative inline-block mb-6" data-aos="bounce" suppressHydrationWarning data-aos-duration="1000" data-aos-delay="1000">
                  <div className="absolute inset-0 bg-green-400 rounded-full pulse-ring opacity-25" />
                  <div className="relative w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
                    </svg>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4" data-aos="fade-up" suppressHydrationWarning data-aos-duration="600" data-aos-delay="1200">
                  Konsultasi Gratis
                </h3>
                <p className="text-gray-600 mb-6" data-aos="fade-up" suppressHydrationWarning data-aos-duration="600" data-aos-delay="1300">
                  Ceritakan konsep frame impian Anda dan kami akan membuatkannya dengan sempurna
                </p>

                <a
                  href="https://wa.me/62882001330851?text=Halo,%20saya%20ingin%20konsultasi%20untuk%20custom%20frame%20photo%20booth"
                  className="inline-flex items-center px-8 py-4 gradient-bg text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group"
                  data-aos="fade-up" suppressHydrationWarning
                  data-aos-duration="600"
                  data-aos-delay="1400"
                >
                  <svg className="w-5 h-5 mr-3 group-hover:animate-bounce" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
                  </svg>
                  Hubungi via WhatsApp
                </a>

                <div
                  className="mt-6 flex items-center justify-center space-x-4 text-sm text-gray-500"
                  data-aos="fade-up" suppressHydrationWarning
                  data-aos-duration="600"
                  data-aos-delay="1500"
                >
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                    Respon cepat
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-[#BF3131] rounded-full mr-2" />
                    Gratis konsultasi
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <div className="text-center mb-8" data-aos="fade-up" suppressHydrationWarning data-aos-duration="800" data-aos-delay="200">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Contoh Frame Custom</h3>
            <p className="text-gray-600">Beberapa desain yang pernah kami buat</p>
          </div>

          {customFrames.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {customFrames.map((frame) => (
                <div key={frame.id} className="group" data-aos="flip-left" suppressHydrationWarning data-aos-duration="800" data-aos-delay="300">
                  <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      {frame.image_path ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getFramePublicUrl(frame.image_path)}
                          alt={frame.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-2xl">🖼️</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-700 text-center">{frame.name}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <div className="inline-block text-5xl mb-4">😞</div>
              <p className="text-lg text-gray-600">Belum ada frame custom tersedia saat ini.</p>
              <p className="text-sm text-gray-500 mt-2">Hubungi kami untuk membuat frame custom Anda!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
