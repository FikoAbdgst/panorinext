"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError("Email atau password salah.");
        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Gagal menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7EFE1] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="PanoriCam"
            width={666}
            height={375}
            priority
            className="h-28 w-48 object-contain"
          />
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9A6B5E]">
            Studio console
          </p>
        </div>

        <div className="mt-6 rounded-[3px] border border-[#2A0A0A]/12 bg-[#FFFCF6] p-6 shadow-[0_18px_40px_-28px_rgba(42,10,10,0.45)]">
          <h1 className="text-lg font-bold tracking-[-0.01em] text-[#2A0A0A]">
            Masuk
          </h1>
          <p className="mt-1 text-sm text-[#7A5A50]">
            Gunakan akun administrator.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-medium text-[#5B3A32]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-[3px] border border-[#2A0A0A]/15 bg-white px-3 py-2.5 text-sm text-[#2A0A0A] outline-none transition placeholder:text-[#9A7568] focus:border-[#BF3131] focus:ring-2 focus:ring-[#BF3131]/20"
                placeholder="admin@contoh.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-medium text-[#5B3A32]"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-[3px] border border-[#2A0A0A]/15 bg-white px-3 py-2.5 text-sm text-[#2A0A0A] outline-none transition placeholder:text-[#9A7568] focus:border-[#BF3131] focus:ring-2 focus:ring-[#BF3131]/20"
                placeholder="••••••••"
              />
            </div>

            {error ? (
              <p className="rounded-[3px] border border-[#BF3131]/20 bg-[#BF3131]/8 px-3 py-2 text-sm text-[#8E2323]">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-[3px] bg-[#BF3131] px-4 py-2.5 text-sm font-semibold text-[#FEF3E2] transition hover:bg-[#A02828] disabled:opacity-60"
            >
              {isSubmitting ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-[#9A7568]">
          Akses terbatas untuk administrator.
        </p>
      </div>
    </main>
  );
}
