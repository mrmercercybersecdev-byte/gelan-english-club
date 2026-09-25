"use client";

import { useMemo, useState } from "react";
import { CHAMPION_ICONS } from "@/lib/embed";

type C = {
  id: number;
  name: string;
  award: string;
  competition: string;
  category: string;
  place: number;
  season: string;
  year: number;
  country: string | null;
  photoUrl: string | null;
  description: string;
};

const MEDAL = {
  1: { label: "Gold", ring: "from-yellow-300 via-gold to-amber-600", chip: "bg-gold text-ink", emoji: "🥇" },
  2: { label: "Silver", ring: "from-gray-100 via-gray-300 to-gray-500", chip: "bg-gray-300 text-ink", emoji: "🥈" },
  3: { label: "Bronze", ring: "from-orange-200 via-amber-700 to-amber-900", chip: "bg-amber-700 text-white", emoji: "🥉" },
} as Record<number, { label: string; ring: string; chip: string; emoji: string }>;

function Portrait({ c, size = 64 }: { c: C; size?: number }) {
  const m = MEDAL[c.place] ?? MEDAL[3];
  return (
    <span className={`inline-block shrink-0 rounded-full bg-gradient-to-br p-[3px] ${m.ring}`} style={{ width: size, height: size }}>
      {c.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.photoUrl} alt={c.name} className="h-full w-full rounded-full object-cover" />
      ) : (
        <span className="grid h-full w-full place-items-center rounded-full bg-ink font-display font-bold text-white" style={{ fontSize: size * 0.38 }}>
          {c.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
        </span>
      )}
    </span>
  );
}

export default function ChampionsHall({ items }: { items: C[] }) {
  const years = useMemo(() => Array.from(new Set(items.map((c) => c.year))).sort((a, b) => b - a), [items]);
  const cats = useMemo(() => Array.from(new Set(items.map((c) => c.category))), [items]);
  const [year, setYear] = useState<number | "all">("all");
  const [cat, setCat] = useState<string>("all");

  const featured = items.find((c) => c.place === 1);
  const list = items.filter((c) => (year === "all" || c.year === year) && (cat === "all" || c.category === cat));
  const titles = items.filter((c) => c.place === 1).reduce<Record<string, number>>((acc, c) => ((acc[c.name] = (acc[c.name] ?? 0) + 1), acc), {});
  const multi = Object.entries(titles).filter(([, n]) => n > 1);

  return (
    <div>
      {featured && (
        <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0f1424] text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/trophy.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
          <div className="rays" />
          <div className="relative grid items-center gap-8 p-8 md:grid-cols-[auto_1fr] md:p-12">
            <div className="relative mx-auto">
              <div className="absolute inset-0 animate-ping rounded-full bg-gold/20" />
              <Portrait c={featured} size={170} />
              <span className="animate-floaty absolute -right-3 -top-3 text-5xl">👑</span>
            </div>
            <div className="text-center md:text-left">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gold">Reigning champion · {featured.season} {featured.year}</p>
              <h3 className="mt-2 font-display text-5xl font-bold md:text-6xl">{featured.name}</h3>
              <p className="mt-2 text-xl text-white/85">
                {CHAMPION_ICONS[featured.category] ?? "🏆"} {featured.award} — {featured.competition}
              </p>
              <p className="mx-auto mt-4 max-w-xl text-white/65 md:mx-0">{featured.description}</p>
              {featured.country && <p className="mt-3 text-sm text-white/50">Representing {featured.country}</p>}
            </div>
          </div>
        </div>
      )}

      {multi.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
          <span className="font-semibold text-muted">Multi-title legends:</span>
          {multi.map(([n, k]) => (
            <span key={n} className="rounded-full bg-gold/15 px-3 py-1 font-semibold ring-1 ring-gold/30">
              {n} · {"🏆".repeat(k)}
            </span>
          ))}
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["all", ...years] as const).map((y) => (
            <button key={y} onClick={() => setYear(y)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ring-black/10 transition ${year === y ? "bg-ink text-white" : "bg-white hover:bg-paper"}`}>
              {y === "all" ? "All years" : y}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["all", ...cats] as const).map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${cat === c ? "bg-brand text-white" : "bg-paper hover:bg-gold/20"}`}>
              {c === "all" ? "All" : `${CHAMPION_ICONS[c] ?? "🏆"} ${c}`}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => {
          const m = MEDAL[c.place] ?? { label: `#${c.place}`, ring: "from-gray-200 to-gray-400", chip: "bg-paper", emoji: "🎖️" };
          return (
            <div key={c.id} className="animate-toast group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl">
              <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${m.ring}`} />
              <span className="absolute right-4 top-4 text-3xl transition group-hover:scale-125 group-hover:rotate-12">{m.emoji}</span>
              <div className="flex items-center gap-4">
                <Portrait c={c} size={64} />
                <div className="min-w-0">
                  <p className="font-display text-xl font-bold leading-tight">{c.name}</p>
                  <p className="text-xs text-muted">{c.country}</p>
                </div>
              </div>
              <p className="mt-4 font-semibold">{CHAMPION_ICONS[c.category] ?? "🏆"} {c.award}</p>
              <p className="text-sm text-muted">{c.competition}</p>
              {c.description && <p className="mt-3 text-sm leading-relaxed text-ink/80">{c.description}</p>}
              <div className="mt-4 flex items-center gap-2 text-xs">
                <span className={`rounded-full px-2.5 py-0.5 font-bold ${m.chip}`}>{m.label}</span>
                <span className="rounded-full bg-paper px-2.5 py-0.5 font-semibold">{c.season} {c.year}</span>
              </div>
            </div>
          );
        })}
      </div>
      {!list.length && <p className="mt-6 rounded-2xl bg-white p-8 text-center text-muted ring-1 ring-black/5">No champions match this filter.</p>}
    </div>
  );
}
