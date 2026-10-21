"use client";

import { useActionState, useState } from "react";

import {
  redeemPremiumCodeAction,
  type RedeemState,
} from "@/app/(public)/premium/actions";

const INITIAL_STATE: RedeemState = { status: "idle" };

export function RedeemForm({
  compact = false,
  initialCode = "",
}: {
  compact?: boolean;
  initialCode?: string;
}) {
  const [state, formAction, isPending] = useActionState(
    redeemPremiumCodeAction,
    INITIAL_STATE,
  );
  const [code, setCode] = useState(
    initialCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8),
  );

  return (
    <form action={formAction} className={compact ? "space-y-3" : "space-y-4"}>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7A5A50]">
          Kode akses
        </span>
        <input
          name="code"
          value={code}
          onChange={(event) =>
            setCode(
              event.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "")
                .slice(0, 8),
            )
          }
          inputMode="text"
          autoComplete="one-time-code"
          spellCheck={false}
          placeholder="XXXX-XXXX"
          aria-describedby="redeem-help"
          className="mt-2 w-full border border-[#BF3131]/30 bg-[#FFFBF3] px-4 py-3 text-center font-mono text-lg font-bold tracking-[0.24em] text-[#2A0A0A] outline-none transition placeholder:tracking-[0.16em] placeholder:text-[#BF3131]/30 focus:border-[#BF3131] focus:ring-2 focus:ring-[#BF3131]/20"
        />
      </label>

      {state.status === "error" && state.message ? (
        <p className="border border-[#BF3131]/25 bg-[#BF3131]/5 px-3 py-2 text-sm text-[#9B2323]">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || code.length !== 8}
        className="inline-flex min-h-12 w-full items-center justify-center bg-[#BF3131] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-[#FEF3E2] shadow-[4px_4px_0_#7A1C1C] transition hover:-translate-y-0.5 hover:bg-[#A02828] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Membuka ruang..." : "Masuk ruang premium"}
      </button>

      <p id="redeem-help" className="text-xs leading-relaxed text-[#7A5A50]">
        Kode aktif saat pertama kali dipakai. Masa aktif mengikuti paket yang
        kamu beli.
      </p>
    </form>
  );
}
