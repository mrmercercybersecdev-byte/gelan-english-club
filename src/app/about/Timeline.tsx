"use client";

import { useEffect, useRef, useState } from "react";
import Icon, { toIconName } from "@/components/Icon";

type M = { id: number; year: number; month: string | null; title: string; description: string; icon: string; imageUrl: string | null };

export default function Timeline({ items }: { items: M[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const [currentYear, setCurrentYear] = useState(items[0]?.year ?? new Date().getFullYear());
  const lastYearRef = useRef(currentYear);
  const nowYear = new Date().getFullYear();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let frame = 0;
    let milestones: { center: number; year: number }[] = [];
    const measureMilestones = () => {
      const bounds = el.getBoundingClientRect();
      milestones = Array.from(el.querySelectorAll<HTMLElement>("[data-timeline-item]"), (milestone, index) => ({
        center: milestone.getBoundingClientRect().top - bounds.top + milestone.offsetHeight / 2,
        year: items[index]?.year ?? nowYear,
      }));
    };
    const update = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const bounds = el.getBoundingClientRect();
        const anchor = window.innerHeight * 0.58;
        const progress = bounds.height > 0 ? Math.max(0, Math.min(1, (anchor - bounds.top) / bounds.height)) : 0;

        if (progressRef.current) progressRef.current.style.height = `${progress * 100}%`;
        if (markerRef.current) markerRef.current.style.top = `${progress * 100}%`;

        const position = anchor - bounds.top;
        let year = items[0]?.year ?? nowYear;
        for (const milestone of milestones) {
          if (milestone.center > position) break;
          year = milestone.year;
        }
        if (year !== lastYearRef.current) {
          lastYearRef.current = year;
          setCurrentYear(year);
        }
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", measureMilestones);
    window.addEventListener("resize", update);
    measureMilestones();
    const resizeObserver = new ResizeObserver(() => {
      measureMilestones();
      update();
    });
    resizeObserver.observe(el);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", measureMilestones);
      window.removeEventListener("resize", update);
      resizeObserver.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [items, nowYear]);

  return (
    <div ref={ref} className="relative isolate">
      <div className="pointer-events-none sticky top-32 z-10 hidden h-0 lg:block" aria-live="polite" aria-atomic="true">
        <div className="absolute -left-2 font-display text-8xl font-bold tracking-tight text-white/[0.07]">{currentYear}</div>
      </div>

      <div aria-hidden="true" className="absolute bottom-0 left-6 top-0 w-px -translate-x-1/2 bg-white/15 md:left-1/2" />
      <div
        ref={progressRef}
        aria-hidden="true"
        className="absolute left-6 top-0 w-[3px] -translate-x-1/2 rounded-full bg-gradient-to-b from-gold via-brand to-violet-400 shadow-[0_0_24px_rgba(217,164,65,.6)] md:left-1/2 motion-reduce:shadow-none"
      />
      <div
        ref={markerRef}
        aria-hidden="true"
        className="absolute left-6 z-20 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#0f1424] bg-gold shadow-[0_0_0_5px_rgba(217,164,65,.18),0_0_24px_8px_rgba(217,164,65,.45)] md:left-1/2 motion-safe:animate-pulse motion-reduce:shadow-none"
      />

      <ol className="relative space-y-12 py-6 sm:space-y-16">
        {items.map((m, i) => {
          const left = i % 2 === 0;
          const future = m.year > nowYear;
          return (
            <li key={m.id} data-timeline-item className="relative md:grid md:grid-cols-2 md:gap-16">
              <span
                aria-hidden="true"
                className={`absolute left-6 top-6 z-10 grid h-11 w-11 -translate-x-1/2 place-items-center rounded-full border border-white/15 text-[11px] font-bold tracking-widest text-white ring-4 ring-[#0f1424] md:left-1/2 ${
                  future ? "border-dashed bg-[#0f1424] text-violet-200" : "bg-[#182035]"
                }`}
              >
                <Icon name={toIconName(m.icon)} size={19} />
              </span>
              <div className={`min-w-0 pl-16 md:pl-0 ${left ? "md:col-start-1 md:text-right" : "md:col-start-2"}`}>
                <article className={`glass overflow-hidden rounded-3xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,.16)] transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/10 motion-reduce:transform-none motion-reduce:transition-none ${future ? "border-dashed" : ""}`}>
                  {m.imageUrl && (
                    <div className="relative h-40 overflow-hidden sm:h-48">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.imageUrl} alt={m.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none" />
                      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0f1424]/80 via-transparent to-transparent" />
                    </div>
                  )}
                  <div className="p-5 sm:p-7">
                    <div className={`flex flex-wrap items-center gap-2 ${left ? "md:justify-end" : ""}`}>
                      <time dateTime={String(m.year)} className="text-xs font-bold uppercase tracking-[0.18em] text-gold sm:text-sm">
                        {m.month ? `${m.month} ` : ""}{m.year}
                      </time>
                      {future && <span className="rounded-full border border-violet-300/25 bg-violet-400/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-violet-200">COMING SOON</span>}
                    </div>
                    <h3 className="mt-2 font-display text-xl font-bold leading-snug sm:text-2xl">{m.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/70 sm:text-base">{m.description}</p>
                  </div>
                </article>
              </div>
            </li>
          );
        })}
      </ol>
      {!items.length && <p className="py-10 pl-16 text-center text-white/60 md:pl-0">Our story is still being written.</p>}
    </div>
  );
}
