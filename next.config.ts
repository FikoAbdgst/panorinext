import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return [{ source: "/about", destination: "/premium", permanent: true }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fhnziwsuhwasefzkkmpr.supabase.co",
        pathname: "/storage/v1/object/**",
      },
      {
        protocol: "https",
        hostname: "fhnziwsuhwasefzkkmpr.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
    ],
  },
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Buang work yang tak terjangkau dari memori + cache persisten Turbopack
    // selama sesi dev panjang, supaya server tidak makin berat seiring waktu.
    turbopackGc: true,
    turbopackMemoryEviction: "auto",
  },
};

export default nextConfig;
