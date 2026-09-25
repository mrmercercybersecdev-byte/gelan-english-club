"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Ann = { id: number; title: string; category: string; createdAt: string; pinned: boolean };
type Note = { id: number; title: string; body: string; href: string | null; read: boolean; createdAt: string; kind: string };

function ago(s: string) {
  const m = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
}

export default function NotificationBell({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [ann, setAnn] = useState<Ann[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [unread, setUnread] = useState(0);
  const [lastSeenAnn, setLastSeenAnn] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/notifications", { cache: "no-store" });
      if (!r.ok) return;
      const d = (await r.json()) as { announcements: Ann[]; notifications: Note[]; unread: number };
      setAnn(d.announcements);
      setNotes(d.notifications);
      setUnread(d.unread);
    } catch {}
  }, []);

  useEffect(() => {
    setLastSeenAnn(Number(localStorage.getItem("wec:last-ann") || 0));
    load();
    const t = setInterval(load, 60_000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  useEffect(() => {
    const on = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("click", on);
    return () => document.removeEventListener("click", on);
  }, []);

  const newAnn = ann.filter((a) => a.id > lastSeenAnn).length;
  const badge = unread + newAnn;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      const maxId = Math.max(0, ...ann.map((a) => a.id));
      localStorage.setItem("wec:last-ann", String(maxId));
      setTimeout(() => setLastSeenAnn(maxId), 1500);
      if (unread && loggedIn) {
        fetch("/api/notifications", { method: "POST" }).then(() => setTimeout(() => { setUnread(0); setNotes((n) => n.map((x) => ({ ...x, read: true }))); }, 1500));
      }
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} aria-label="Notifications" className="relative grid h-9 w-9 place-items-center rounded-full bg-white ring-1 ring-black/10 hover:ring-black/20">
        <span className={badge ? "animate-[pop_.6s_ease-out]" : ""}>🔔</span>
        {badge > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">{badge > 9 ? "9+" : badge}</span>}
      </button>
      {open && (
        <div className="animate-toast absolute right-0 mt-2 w-[340px] max-w-[90vw] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
          {loggedIn && (
            <div>
              <p className="border-b border-black/5 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-muted">For you</p>
              <ul className="max-h-60 overflow-y-auto">
                {notes.map((n) => (
                  <li key={n.id}>
                    <Link href={n.href || "#"} onClick={() => setOpen(false)} className={`block px-4 py-2.5 text-sm hover:bg-paper ${n.read ? "" : "bg-gold/10"}`}>
                      <p className="font-semibold">{n.title}</p>
                      {n.body && <p className="line-clamp-2 text-xs text-muted">{n.body}</p>}
                      <p className="mt-0.5 text-[10px] text-muted">{ago(n.createdAt)}</p>
                    </Link>
                  </li>
                ))}
                {!notes.length && <li className="px-4 py-4 text-center text-xs text-muted">No notifications yet.</li>}
              </ul>
            </div>
          )}
          <p className="border-y border-black/5 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-muted">📣 Announcements</p>
          <ul className="max-h-60 overflow-y-auto">
            {ann.map((a) => (
              <li key={a.id}>
                <Link href={`/announcements#a-${a.id}`} onClick={() => setOpen(false)} className={`flex items-start gap-2 px-4 py-2.5 text-sm hover:bg-paper ${a.id > lastSeenAnn ? "bg-sky-50" : ""}`}>
                  {a.pinned && <span>📌</span>}
                  <span className="flex-1 font-medium">{a.title}</span>
                  <span className="text-[10px] text-muted">{ago(a.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/announcements" onClick={() => setOpen(false)} className="block bg-paper py-2.5 text-center text-xs font-bold text-brand hover:bg-gold/20">View all announcements →</Link>
        </div>
      )}
    </div>
  );
}
