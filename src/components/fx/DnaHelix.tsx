"use client";

import { useEffect, useRef } from "react";

type Props = {
  className?: string;
  letters?: string;
  colorA?: string;
  colorB?: string;
  rungColor?: string;
  /** How strongly page scroll rotates the helix */
  scrollFactor?: number;
  speed?: number;
  horizontal?: boolean;
  nodes?: number;
  turns?: number;
};

/** A 3D rotating double helix drawn on canvas, with letters as "base pairs". Scroll-reactive. */
export default function DnaHelix({
  className = "",
  letters = "GELANENGLISHCLUBSPEAKLISTENREADWRITE",
  colorA = "#f87171",
  colorB = "#fbbf24",
  rungColor = "rgba(255,255,255,0.18)",
  scrollFactor = 0.004,
  speed = 0.6,
  horizontal = false,
  nodes = 34,
  turns = 2.6,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let scrollBoost = 0;
    let lastScroll = window.scrollY;
    let mouseX = 0;
    let mouseY = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onScroll = () => {
      const d = window.scrollY - lastScroll;
      lastScroll = window.scrollY;
      scrollBoost += d * scrollFactor;
    };
    const onMove = (e: PointerEvent) => {
      mouseX = e.clientX / window.innerWidth - 0.5;
      mouseY = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });

    const start = performance.now();
    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const phase = (reduce ? 0 : t * speed) + scrollBoost + window.scrollY * scrollFactor * 0.5;
      ctx.clearRect(0, 0, w, h);

      const len = horizontal ? w : h;
      const amp = (horizontal ? h : w) * 0.28;
      const center = (horizontal ? h : w) / 2;
      const tilt = mouseX * 0.4;

      type P = { x: number; y: number; z: number; strand: 0 | 1; i: number };
      const pts: P[] = [];
      for (let i = 0; i < nodes; i++) {
        const u = i / (nodes - 1);
        const along = len * 0.04 + u * len * 0.92;
        const ang = u * Math.PI * 2 * turns + phase;
        for (const strand of [0, 1] as const) {
          const a = ang + strand * Math.PI;
          const across = Math.sin(a) * amp;
          const z = Math.cos(a);
          const wob = Math.sin(u * 6 + t) * 6 + mouseY * 20 * z;
          const x = horizontal ? along : center + across + tilt * (along - len / 2) * 0.15;
          const y = horizontal ? center + across + wob : along + wob * 0.2;
          pts.push({ x, y, z, strand, i });
        }
      }

      // rungs
      for (let i = 0; i < nodes; i++) {
        const a = pts[i * 2];
        const b = pts[i * 2 + 1];
        const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        grad.addColorStop(0, colorA);
        grad.addColorStop(0.5, rungColor);
        grad.addColorStop(1, colorB);
        ctx.strokeStyle = grad;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // backbone curves
      for (const strand of [0, 1] as const) {
        ctx.beginPath();
        const s = pts.filter((p) => p.strand === strand);
        s.forEach((p, idx) => (idx ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.strokeStyle = strand ? colorB : colorA;
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // nodes sorted by depth
      const sorted = [...pts].sort((p, q) => p.z - q.z);
      for (const p of sorted) {
        const depth = (p.z + 1) / 2; // 0 back .. 1 front
        const r = 4 + depth * 9;
        const color = p.strand ? colorB : colorA;
        ctx.globalAlpha = 0.25 + depth * 0.75;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8 + depth * 18;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        if (depth > 0.45) {
          const ch = letters[(p.i * 2 + p.strand) % letters.length];
          ctx.fillStyle = "#1d1b18";
          ctx.globalAlpha = depth;
          ctx.font = `700 ${Math.round(r * 1.05)}px ui-sans-serif, system-ui`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(ch, p.x, p.y + 0.5);
        }
      }
      ctx.globalAlpha = 1;
      scrollBoost *= 0.96;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
    };
  }, [letters, colorA, colorB, rungColor, scrollFactor, speed, horizontal, nodes, turns]);

  return <canvas ref={ref} className={`block h-full w-full ${className}`} aria-hidden />;
}
