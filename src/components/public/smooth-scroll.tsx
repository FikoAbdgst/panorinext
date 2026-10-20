"use client";

import Lenis from "lenis";
import { useEffect } from "react";

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const lenis = new Lenis({
      lerp: 0.075,
      wheelMultiplier: 0.8,
      smoothWheel: true,
      autoRaf: true,
      anchors: { offset: -104, duration: 1.35 },
      respectReducedMotion: true,
    });

    return () => {
      lenis.destroy();
    };
  }, []);

  return null;
}
