"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/fx/Effects";

type M = { id: number; year: number; month: string | null; title: string; description: string; icon: string; imageUrl: string | null };

export default function Timeline({ items }: { items: M[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const nowYear = new Date().getFullYear();

  useEffect(() => {
    const on = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (vh * 0.6 - r.top) / r.height;
      setProgress(Math.max(0, Math.min(1, p)));
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);

  const currentYear = items.length ? items[Math.min(items.length - 1, Math.floor(progress * items.length))]?.year : nowYear;

  return (
    <div ref={ref} className="relative">
      {/* floating year counter */}
      <div className="pointer-events-none sticky top-32 z-10 hidden h-0 lg:block">
        <div className="absolute -left-2 font-display text-8xl font-bold text-white/[0.07] transition-all duration-500">{currentYear}</div>
      </div>

      {/* spine */}
      <div className="absolute bottom-0 left-6 top-0 w-1 -translate-x-1/2 rounded-full bg-white/10 md:left-1/2" />
      <div
        className="absolute left-6 top-0 w-1 -translate-x-1/2 rounded-full bg-gradient-to-b from-gold via-brand to-violet-500 shadow-[0_0_20px_rgba(217,164,65,.7)] md:left-1/2"
        style={{ height: `${progress * 100}%` }}
      />
      <div
        className="absolute left-6 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_25px_8px_rgba(217,164,65,.6)] md:left-1/2"
        style={{ top: `${progress * 100}%` }}
      />

      <ol className="relative space-y-16 py-6">
        {items.map((m, i) => {
          const left = i % 2 === 0;
          const future = m.year > nowYear;
          const passed = progress >= (i + 0.5) / items.length;
          return (
            <li key={m.id} className="relative md:grid md:grid-cols-2 md:gap-16">
              <span
                className={`absolute left-6 top-6 z-10 grid h-12 w-12 -translate-x-1/2 place-items-center rounded-full text-xl ring-4 ring-[#0f1424] transition-all duration-500 md:left-1/2 ${
                  passed ? "scale-110 bg-gold" : future ? "border-2 border-dashed border-white/30 bg-[#0f1424]" : "bg-white/15"
                }`}
              >
                {m.icon}
              </span>
              <div className={`pl-16 md:pl-0 ${left ? "md:col-start-1 md:text-right" : "md:col-start-2"}`}>
                <Reveal from={left ? "left" : "right"}>
                  <div className={`glass group overflow-hidden rounded-3xl transition hover:bg-white/10 ${future ? "border-dashed" : ""}`}>
                    {m.imageUrl && (
                      <div className="relative h-44 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.imageUrl} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1424] to-transparent" />
                      </div>
                    )}
                    <div className="p-6">
                      <p className="text-sm font-semibold uppercase tracking-widest text-gold">
                        {m.month ? `${m.month} ` : ""}
                        {m.year} {future && <span className="ml-1 rounded-full bg-violet-500/30 px-2 py-0.5 text-[10px] text-violet-200">COMING SOON</span>}
                      </p>
                      <h3 className="mt-1 font-display text-2xl font-bold">{m.title}</h3>
                      <p className="mt-2 text-white/70">{m.description}</p>
                    </div>
                  </div>
                </Reveal>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
