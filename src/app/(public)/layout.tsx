import type { ReactNode } from "react";

import { AosProvider } from "@/components/public/aos-provider";
import { Navbar } from "@/components/public/navbar";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AosProvider />
      <Navbar />
      <main className="flex-1">{children}</main>
    </>
  );
}
