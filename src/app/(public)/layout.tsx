import type { ReactNode } from "react";

import { AosProvider } from "@/components/public/aos-provider";
import { Navbar } from "@/components/public/navbar";
import { PageTransition } from "@/components/public/page-transition";
import { SmoothScroll } from "@/components/public/smooth-scroll";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AosProvider />
      <SmoothScroll />
      <Navbar />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
    </>
  );
}
