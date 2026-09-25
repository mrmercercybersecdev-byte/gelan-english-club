"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { PublicUser } from "@/lib/session";
import { levelFromXp } from "@/lib/xp";
import { logoutUserAction } from "@/app/user-actions";
import NotificationBell from "./NotificationBell";

const NAV = [
  { href: "/events", label: "Events" },
  { href: "/learn", label: "AI Lab" },
  { href: "/games", label: "Games" },
  { href: "/groups", label: "Groups" },
  { href: "/meet", label: "Meet" },
  { href: "/chat", label: "Chat" },
  { href: "/leaderboard", label: "Ranks" },
  { href: "/about", label: "About" },
];
const MORE = [
  { href: "/announcements", label: "📣 Announcements" },
  { href: "/submit", label: "📤 Submit work" },
  { href: "/verify", label: "✅ Verify a certificate" },
  { href: "/speak", label: "🎙️ Speaking Studio" },
  { href: "/blog", label: "📰 Blog" },
  { href: "/about#champions", label: "🏆 Champions" },
  { href: "/about#live", label: "🔴 Livestream" },
  { href: "/board", label: "💡 Phrase Wall" },
  { href: "/join", label: "✨ Membership" },
  { href: "/contact", label: "✉️ Contact" },
  { href: "/admin", label: "🛠️ Organisers" },
];

export function Avatar({ name, color, size = 32 }: { name: string; color: string; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-bold text-white shadow-sm"
      style={{ background: color, width: size, height: size, fontSize: size * 0.42 }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-brand font-display text-lg font-bold text-white shadow-sm transition group-hover:rotate-6">
        G
        <span className="shimmer absolute inset-0" />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-lg font-bold">Gelan</span>
        <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-muted">English Club</span>
      </span>
    </Link>
  );
}

export default function SiteHeader({ user }: { user: PublicUser | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const [menu, setMenu] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const on = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMore(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("click", on);
    return () => document.removeEventListener("click", on);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMore(false);
    setMenu(false);
  }, [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-cream/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3">
        <Logo />
        <nav className="hidden items-center gap-0.5 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative rounded-full px-3.5 py-2 text-sm font-medium transition ${
                isActive(item.href) ? "bg-ink text-white" : "text-ink/75 hover:bg-black/5 hover:text-ink"
              }`}
            >
              {item.label}
              {item.href === "/meet" && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />}
            </Link>
          ))}
          <div className="relative" ref={moreRef}>
            <button onClick={() => setMore((m) => !m)} className="rounded-full px-3.5 py-2 text-sm font-medium text-ink/75 hover:bg-black/5">
              More ▾
            </button>
            {more && (
              <div className="animate-toast absolute right-0 mt-2 max-h-[70vh] w-56 overflow-y-auto rounded-2xl bg-white p-1.5 shadow-xl ring-1 ring-black/5">
                {MORE.map((m) => (
                  <Link key={m.href} href={m.href} className="block rounded-xl px-3 py-2 text-sm hover:bg-paper">
                    {m.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.dispatchEvent(new Event("wec:palette"))}
            className="hidden items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs text-muted hover:border-black/20 md:flex"
          >
            🔍 <kbd className="rounded bg-paper px-1.5 font-sans">Ctrl K</kbd>
          </button>
          <NotificationBell loggedIn={!!user} />
          {user ? (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 ring-1 ring-black/10 hover:ring-black/20">
                <Avatar name={user.displayName} color={user.avatarColor} size={28} />
                <span className="hidden text-left text-xs leading-tight sm:block">
                  <span className="block font-semibold">{user.displayName}</span>
                  <span className="block text-muted">Lv {levelFromXp(user.xp)} · {user.xp} XP{user.streak ? ` · 🔥${user.streak}` : ""}</span>
                </span>
              </button>
              {menu && (
                <div className="animate-toast absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl bg-white p-1.5 shadow-xl ring-1 ring-black/5">
                  <Link href="/profile" className="block rounded-xl px-3 py-2 text-sm hover:bg-paper">👤 My profile</Link>
                  <Link href="/submit" className="block rounded-xl px-3 py-2 text-sm hover:bg-paper">📤 My submissions</Link>
                  <Link href="/groups?mine=1" className="block rounded-xl px-3 py-2 text-sm hover:bg-paper">👥 My groups</Link>
                  <Link href="/leaderboard" className="block rounded-xl px-3 py-2 text-sm hover:bg-paper">🏆 Leaderboard</Link>
                  {user.role === "admin" && <Link href="/admin" className="block rounded-xl px-3 py-2 text-sm hover:bg-paper">🛠️ Admin</Link>}
                  <form action={logoutUserAction}>
                    <button className="block w-full rounded-xl px-3 py-2 text-left text-sm text-brand hover:bg-paper">↪ Log out</button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="btn-primary !px-4 !py-2 text-sm">
              Sign in
            </Link>
          )}
          <button className="rounded-lg p-2 lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <nav className="grid grid-cols-2 gap-1 border-t border-black/5 px-5 pb-4 pt-2 lg:hidden">
          {[...NAV, ...MORE].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium ${isActive(item.href) ? "bg-ink text-white" : "hover:bg-black/5"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
