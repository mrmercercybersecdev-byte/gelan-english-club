"use client";

import { useEffect, useRef } from "react";

const DEFAULT_WORDS = [
  "Hello", "Serendipity", "Eloquent", "Fluency", "IELTS", "SAT", "TOEFL", "Idiom", "Grammar", "Vocabulary",
  "Debate", "Listen", "Speak", "Read", "Write", "Confidence", "Friends", "Culture", "Accent", "Phrasal",
  "Resilient", "Nuance", "Curious", "Brilliant", "Cheers", "Awesome", "Wanderlust", "Articulate", "Story",
  "Podcast", "Book Club", "Mate", "Gorgeous", "Quaint", "Sublime", "Witty", "Candid", "Bold", "Rhythm",
  "Pronounce", "Syllable", "Metaphor", "Dialogue", "Chatter", "Linguist", "Explore", "Imagine", "Laugh",
];

/** Interactive rotating 3D sphere of words (drag to spin). */
export default function WordGlobe({ words = DEFAULT_WORDS, className = "" }: { words?: string[]; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0, h = 0, raf = 0;
    let rotX = 0.3, rotY = 0, velX = 0.002, velY = 0.006;
    let dragging = false, lx = 0, ly = 0;

    const n = words.length;
    const pts = words.map((word, i) => {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = Math.PI * (3 - Math.sqrt(5)) * i;
      return { word, x: Math.cos(theta) * r, y, z: Math.sin(theta) * r };
    });
    const colors = ["#b8322a", "#1f2d4a", "#d9a441", "#0f766e", "#7c3aed", "#db2777"];

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const down = (e: PointerEvent) => { dragging = true; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      velY = (e.clientX - lx) * 0.0008; velX = (e.clientY - ly) * 0.0008;
      lx = e.clientX; ly = e.clientY;
    };
    const up = () => { dragging = false; };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointerleave", up);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      rotX += velX; rotY += velY;
      if (!dragging) { velX += (0.0015 - velX) * 0.02; velY += (0.005 - velY) * 0.02; }
      const R = Math.min(w, h) * 0.4;
      const cx = w / 2, cy = h / 2;
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX), cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const proj = pts.map((p, i) => {
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.x * sinY + p.z * cosY;
        const y1 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;
        return { ...p, sx: cx + x1 * R, sy: cy + y1 * R, depth: (z2 + 1) / 2, i };
      }).sort((a, b) => a.depth - b.depth);

      // faint sphere rings
      ctx.strokeStyle = "rgba(31,45,74,0.08)";
      ctx.lineWidth = 1;
      for (let k = 1; k <= 3; k++) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, R, R * (k / 3.2), rotY % Math.PI, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (const p of proj) {
        const size = 10 + p.depth * 14;
        ctx.globalAlpha = 0.15 + p.depth * 0.85;
        ctx.fillStyle = colors[p.i % colors.length];
        ctx.font = `${p.depth > 0.6 ? 700 : 500} ${size}px "Iowan Old Style", Georgia, serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.word, p.sx, p.sy);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointerleave", up);
    };
  }, [words]);

  return <canvas ref={ref} className={`block h-full w-full cursor-grab touch-none active:cursor-grabbing ${className}`} aria-label="Rotating globe of English words" />;
}
