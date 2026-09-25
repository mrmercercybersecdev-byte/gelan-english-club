"use client";

import { useEffect, useState } from "react";

type Toast = { id: number; amount: number; label?: string; streak?: number };

export default function XpToaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail as Toast;
      const id = Date.now() + Math.random();
      setToasts((t) => [...t.slice(-3), { ...d, id }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
    };
    window.addEventListener("wec:xp", on);
    return () => window.removeEventListener("wec:xp", on);
  }, []);
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[80] flex flex-col items-end gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="animate-toast flex items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-white shadow-2xl ring-1 ring-white/10">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-gold to-brand text-lg">⚡</span>
          <div>
            <p className="font-display text-lg font-bold leading-none text-gold">+{t.amount} XP</p>
            <p className="text-xs text-white/70">
              {t.label ?? "Nice work!"}
              {t.streak ? ` · 🔥 ${t.streak}-day streak` : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
