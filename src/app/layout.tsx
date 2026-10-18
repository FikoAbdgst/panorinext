import type { Metadata } from "next";
import { Poppins } from "next/font/google";

import "@fortawesome/fontawesome-free/css/all.min.css";
import "aos/dist/aos.css";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "PanoriCam - Photobooth Online",
  description:
    "PanoriCam: photobooth online. Pilih frame, ambil foto, lalu terima hasil PNG dan GIF lewat email.",
  icons: { icon: "/panor.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
