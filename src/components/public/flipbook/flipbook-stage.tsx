"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type FlipbookStage =
  | "frame"
  | "tutorial"
  | "capture"
  | "book";

type FlipbookStageContextValue = {
  stage: FlipbookStage;
  setStage: (stage: FlipbookStage) => void;
};

const FlipbookStageContext = createContext<FlipbookStageContextValue | null>(
  null,
);

export function FlipbookStageProvider({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<FlipbookStage>("frame");
  const value = useMemo(() => ({ stage, setStage }), [stage]);

  return (
    <FlipbookStageContext.Provider value={value}>
      {children}
    </FlipbookStageContext.Provider>
  );
}

export function useFlipbookStage(): FlipbookStageContextValue {
  const context = useContext(FlipbookStageContext);
  if (!context) {
    throw new Error(
      "useFlipbookStage harus dipakai di dalam FlipbookStageProvider",
    );
  }
  return context;
}

/**
 * Menyembunyikan hero saat kamera flipbook aktif. Navbar ikut disembunyikan
 * lewat atribut di <html>, jadi hanya disisakan sedikit ruang napas di atas.
 */
export function FlipbookHeroGate({ children }: { children: ReactNode }) {
  const { stage } = useFlipbookStage();

  if (stage === "capture" || stage === "book") {
    return <div aria-hidden="true" className="h-4 sm:h-5" />;
  }

  return <>{children}</>;
}
