import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";

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
      <body className="min-h-full flex flex-col">
        {children}
        <Script id="refresh-scroll-restore" strategy="beforeInteractive">
          {`
            try {
              var navigationEntry = performance.getEntriesByType("navigation")[0];
              if (navigationEntry && navigationEntry.type === "reload") {
                if ("scrollRestoration" in history) history.scrollRestoration = "manual";
                var resetScroll = function () {
                  if (!window.location.hash) window.scrollTo(0, 0);
                };
                if (document.readyState === "complete") resetScroll();
                else window.addEventListener("load", resetScroll, { once: true });
              }
            } catch (error) {}
          `}
        </Script>
      </body>
    </html>
  );
}
