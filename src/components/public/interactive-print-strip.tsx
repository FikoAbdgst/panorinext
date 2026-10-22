"use client"

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef } from "react"

export interface StripImage {
  src: string
  alt: string
}

export interface InteractivePrintStripProps {
  images: ReadonlyArray<StripImage>
  number: string
  baseRotation: number
  className?: string
  phase?: number
}

export function InteractivePrintStrip({
  images,
  number,
  baseRotation,
  className,
  phase = 0,
}: InteractivePrintStripProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    if (prefersReducedMotion) {
      el.style.transform = `rotate(${baseRotation}deg)`
      return
    }

    let isVisible = true
    let mouse: { x: number; y: number } | null = null
    let animId: number

    const current = { x: 0, y: 0, rotate: baseRotation }
    const target = { x: 0, y: 0, rotate: baseRotation }

    const onPointerMove = (e: PointerEvent) => {
      mouse = { x: e.clientX, y: e.clientY }
    }
    const onPointerLeave = () => {
      mouse = null
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("pointerleave", onPointerLeave, { passive: true })
    window.addEventListener("blur", onPointerLeave)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting
        })
      },
      { threshold: 0.05 }
    )
    observer.observe(el)

    const tick = () => {
      if (isVisible) {
        const now = performance.now() * 0.001

        // 1. Ambient darkroom breeze sway
        const ambientAngle = Math.sin(now * 1.15 + phase) * 1.35
        const ambientY = Math.cos(now * 0.95 + phase) * 2.8
        const ambientX = Math.sin(now * 0.8 + phase) * 1.2

        // 2. Cursor proximity evasion (repel smoothly away)
        let repelX = 0
        let repelY = 0
        let repelRotate = 0

        if (mouse) {
          const rect = el.getBoundingClientRect()
          const centerX = rect.left + rect.width / 2
          const centerY = rect.top + rect.height * 0.45

          const dx = centerX - mouse.x
          const dy = centerY - mouse.y
          const distance = Math.hypot(dx, dy)
          const repelRadius = 320

          if (distance < repelRadius && distance > 0) {
            const proximity = 1 - distance / repelRadius
            const force = Math.pow(proximity, 1.4)
            const nx = dx / distance
            const ny = dy / distance

            repelX = nx * force * 42
            repelY = ny * force * 24
            repelRotate = nx * 8.5 * force
          }
        }

        target.x = repelX + ambientX
        target.y = repelY + ambientY
        target.rotate = baseRotation + repelRotate + ambientAngle

        // Smooth spring lerp damping
        const lerp = 0.078
        current.x += (target.x - current.x) * lerp
        current.y += (target.y - current.y) * lerp
        current.rotate += (target.rotate - current.rotate) * lerp

        el.style.transform = `translate3d(${current.x.toFixed(2)}px, ${current.y.toFixed(2)}px, 0) rotate(${current.rotate.toFixed(2)}deg)`

        const shadowX = (-current.x * 0.35).toFixed(1)
        const shadowY = (26 + current.y * 0.25).toFixed(1)
        el.style.boxShadow = `${shadowX}px ${shadowY}px 55px -28px rgba(90, 20, 20, 0.65)`
      }

      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(animId)
      observer.disconnect()
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerleave", onPointerLeave)
      window.removeEventListener("blur", onPointerLeave)
    }
  }, [baseRotation, phase])

  return (
    <div
      ref={containerRef}
      style={{
        transformOrigin: "50% 0px",
        willChange: "transform",
      }}
      className={`group relative select-none transition-[box-shadow] duration-300 ${className ?? ""}`}
    >
      {/* Peg / Clip on line */}
      <div className="absolute -top-4 left-1/2 z-20 h-9 w-7 -translate-x-1/2 rounded-t-[2px] bg-[#BF3131] shadow-[0_4px_10px_rgba(90,20,20,0.25)] ring-1 ring-[#7A1C1C]/40">
        <span className="absolute left-1/2 top-2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#FEF3E2] shadow-inner" />
      </div>

      {/* Photostrip body */}
      <div className="relative overflow-hidden bg-[#FFFBF3] p-2.5 pb-3 shadow-[0_26px_60px_-30px_rgba(90,20,20,0.7)] ring-1 ring-[#BF3131]/20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-full rotate-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"
        />

        <div className="border border-[#BF3131]/35 px-1.5 pb-1.5 pt-1.5">
          <div className="mt-1.5 space-y-1.5">
            {images.map((image) => (
              <img
                key={image.src}
                src={image.src}
                alt={image.alt}
                decoding="async"
                className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              />
            ))}
          </div>

          <div className="flex items-center justify-between px-0.5 pt-1.5 text-[7px] uppercase tracking-[0.18em] text-[#BF3131]/65">
            <span>Panoricam</span>
            <span className="font-mono text-[#BF3131]/45">#{number}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
