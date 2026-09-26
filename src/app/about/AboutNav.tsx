"use client";

import { useEffect, useState } from "react";
import Icon, { type IconName } from "@/components/Icon";

const SECTIONS = [
  ["story", "Story", "book"],
  ["history", "History", "clock"],
  ["leaders", "Leaders", "people"],
  ["facilitators", "Facilitators", "user"],
  ["champions", "Champions", "trophy"],
  ["live", "Livestream", "video"],
  ["faq", "FAQ", "help"],
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
      <nav aria-label="About page sections" className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5 py-2 [scrollbar-width:none]">
        {SECTIONS.map(([id, label, icon]) => (
          <a
            key={id}
            href={`#${id}`}
            aria-current={active === id ? "location" : undefined}
            className={`relative inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none sm:px-4 ${active === id ? "bg-ink text-white shadow" : "text-ink/70 hover:bg-black/5"}`}
          >
            <Icon name={icon as IconName} size={16} />
            {label}
            {id === "live" && live && (
              <>
                <span aria-hidden="true" className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 motion-safe:live-glow" />
                <span className="sr-only">Live now</span>
              </>
            )}
          </a>
        ))}
      </nav>
    </div>
  );
}
