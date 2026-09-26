"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { notifyXp } from "@/lib/client-xp";
import Icon, { type IconName } from "@/components/Icon";

export async function submitScore(game: string, score: number, timeMs: number, won: boolean, meta?: string) {
  try {
    const r = await fetch("/api/games/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game, score, timeMs, won, meta }),
    });
    const d = await r.json();
    notifyXp(d.xp, won ? "Game won!" : undefined);
    return d as { saved?: boolean; loggedIn?: boolean };
  } catch {
    return null;
  }
}

export function GameShell({ title, icon, gradient, children, stats }: { title: string; icon: IconName; gradient: string; children: ReactNode; stats?: ReactNode }) {
  return (
    <div>
      <section className={`relative overflow-hidden bg-gradient-to-br ${gradient} text-white`}>
        <div className="grid-bg absolute inset-0 opacity-40" />
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6 sm:py-8">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link href="/games" className="glass inline-flex min-h-10 shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              <Icon name="arrow-up-right" size={15} className="rotate-[-135deg]" />Games
            </Link>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 sm:h-14 sm:w-14"><Icon name={icon} size={30} /></span>
            <h1 className="min-w-0 font-display text-2xl font-bold sm:text-4xl">{title}</h1>
          </div>
          {stats && <div className="flex w-full flex-wrap gap-2 sm:w-auto">{stats}</div>}
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-5 py-8">{children}</div>
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="glass min-w-[84px] rounded-2xl px-4 py-2 text-center">
      <p className="font-display text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-white/70">{label}</p>
    </div>
  );
}

export function Confetti() {
  const pieces = useMemo(
    () => Array.from({ length: 80 }, (_, i) => ({ i, left: (i * 37.7) % 100, delay: ((i * 17) % 80) / 100, color: ["#b8322a", "#d9a441", "#1f2d4a", "#10b981", "#8b5cf6", "#ec4899"][i % 6], rot: (i * 137) % 360, dur: 2 + ((i * 23) % 150) / 100 })),
    [],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden="true">
      <style>{`@keyframes wecfall{to{transform:translateY(110vh) rotate(900deg);opacity:.2}}@media(prefers-reduced-motion:reduce){.wec-confetti-piece{animation:none!important;display:none}}`}</style>
      {pieces.map((p) => (
        <span key={p.i} className="wec-confetti-piece absolute -top-4 h-3 w-2 rounded-sm" style={{ left: `${p.left}%`, background: p.color, transform: `rotate(${p.rot}deg)`, animation: `wecfall ${p.dur}s ${p.delay}s ease-in forwards` }} />
      ))}
    </div>
  );
}

export function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
