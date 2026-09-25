"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function AnnouncementBannerClient({ id, title, icon, gradient, href, label }: { id: number; title: string; icon: string; gradient: string; href: string; label: string }) {
  const key = `wec:dismissed-announcement`;
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    setHidden(localStorage.getItem(key) === String(id));
  }, [id, key]);
  if (hidden) return null;
  return (
    <div className={`animate-gradient-x relative z-[51] bg-gradient-to-r ${gradient} text-white`}>
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-10 py-2 text-sm">
        <span className="text-base">{icon}</span>
        <span className="truncate font-semibold">{title}</span>
        <Link href={href} className="hidden shrink-0 rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold hover:bg-white/30 sm:inline">{label} →</Link>
        <button
          aria-label="Dismiss announcement"
          onClick={() => { localStorage.setItem(key, String(id)); setHidden(true); }}
          className="absolute right-3 rounded-full px-2 text-white/80 hover:bg-white/20 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
