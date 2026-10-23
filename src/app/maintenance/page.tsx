import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Sedang Pemeliharaan",
  robots: { index: false, follow: false },
};

export const instant = false;

export default function MaintenancePage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-neutral-50 px-6 py-24 text-center">
      <div className="max-w-md">
        <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#FEF3E2]">
          <Image
            src="/logo-mark.png"
            alt="PanoriCam"
            width={512}
            height={512}
            className="h-10 w-10 object-contain"
          />
        </span>
        <h1 className="text-2xl font-bold text-neutral-800">
          Sedang dalam pemeliharaan
        </h1>
        <p className="mt-3 text-neutral-500">
          Kami akan segera kembali. Terima kasih atas kesabaran Anda.
        </p>
      </div>
    </main>
  );
}
