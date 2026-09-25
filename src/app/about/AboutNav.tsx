"use client";

import { useEffect, useState } from "react";

const SECTIONS = [
  ["story", "📖 Story"],
  ["history", "📜 History"],
  ["leaders", "👑 Leaders"],
  ["facilitators", "🧑‍🏫 Facilitators"],
  ["champions", "🏆 Champions"],
  ["live", "🔴 Livestream"],
  ["faq", "❓ FAQ"],
] as const;

export default function AboutNav({ live }: { live: boolean }) {
  const [active, setActive] = useState("story");

  useEffect(() => {
    const els = SECTIONS.map(([id]) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="sticky top-16 z-30 border-b border-black/5 bg-cream/85 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5 py-2 [scrollbar-width:none]">
        {SECTIONS.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className={`relative shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${active === id ? "bg-ink text-white shadow" : "text-ink/70 hover:bg-black/5"}`}
          >
            {label}
            {id === "live" && live && <span className="live-glow absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500" />}
          </a>
        ))}
      </nav>
    </div>
  );
}
