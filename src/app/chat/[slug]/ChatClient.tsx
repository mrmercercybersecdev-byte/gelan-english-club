"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Channel } from "@/db/schema";
import type { PublicUser } from "@/lib/session";
import { Avatar } from "@/components/SiteHeader";
import { levelFromXp } from "@/lib/xp";
import { notifyXp } from "@/lib/client-xp";

type Msg = {
  id: number;
  body: string;
  createdAt: string;
  userId: number;
  username: string;
  displayName: string;
  avatarColor: string;
  role: string;
  xp: number;
  pending?: boolean;
};
type Online = { id: number; name: string; color: string };

const EMOJIS = ["😀", "😂", "😍", "🤔", "👍", "👏", "🙏", "🎉", "🔥", "💯", "❤️", "😅", "🤯", "📚", "✍️", "🗣️"];

function fmtTime(s: string) {
  return new Date(s).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function fmtDay(s: string) {
  const d = new Date(s);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const y = new Date(Date.now() - 86_400_000);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

function renderBody(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+|@[a-z0-9_]+)/gi);
  return parts.map((p, i) =>
    /^https?:\/\//.test(p) ? (
      <a key={i} href={p} target="_blank" rel="noreferrer" className="text-brand underline">{p}</a>
    ) : /^@/.test(p) ? (
      <span key={i} className="rounded bg-gold/20 px-1 font-semibold text-ink">{p}</span>
    ) : (
      p
    ),
  );
}

export default function ChatClient({ channels, channel, me }: { channels: Channel[]; channel: Channel; me: PublicUser | null }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [online, setOnline] = useState<Online[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);
  const lastId = useRef(0);
  const box = useRef<HTMLDivElement>(null);
  const stick = useRef(true);

  useEffect(() => {
    let stop = false;
    lastId.current = 0;
    setMessages([]);
    setLoaded(false);
    const poll = async () => {
      try {
        const res = await fetch(`/api/chat/${channel.slug}?after=${lastId.current}`, { cache: "no-store" });
        const data = (await res.json()) as { messages: Msg[]; online: Online[] };
        if (stop) return;
        if (data.messages?.length) {
          lastId.current = data.messages[data.messages.length - 1].id;
          setMessages((m) => {
            const known = new Set(m.filter((x) => !x.pending).map((x) => x.id));
            const incoming = data.messages.filter((x) => !known.has(x.id));
            const withoutPending = m.filter((x) => !x.pending || !incoming.some((i) => i.body === x.body && i.userId === x.userId));
            return [...withoutPending, ...incoming];
          });
        }
        setOnline(data.online ?? []);
        setLoaded(true);
      } catch {}
    };
    poll();
    const iv = setInterval(poll, 2000);
    return () => {
      stop = true;
      clearInterval(iv);
    };
  }, [channel.slug]);

  useEffect(() => {
    if (stick.current) box.current?.scrollTo({ top: box.current.scrollHeight, behavior: loaded ? "smooth" : "auto" });
  }, [messages, loaded]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const body = text.trim();
    if (!body || !me) return;
    setText("");
    setShowEmoji(false);
    stick.current = true;
    const temp: Msg = { id: -Date.now(), body, createdAt: new Date().toISOString(), userId: me.id, username: me.username, displayName: me.displayName, avatarColor: me.avatarColor, role: me.role, xp: me.xp, pending: true };
    setMessages((m) => [...m, temp]);
    const res = await fetch(`/api/chat/${channel.slug}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to send");
      setMessages((m) => m.filter((x) => x.id !== temp.id));
    } else {
      setError("");
      notifyXp(data.xp, "Chat message");
    }
  }

  let lastDay = "";
  let lastUser = -1;
  let lastTime = 0;

  return (
    <div className="mx-auto flex h-[calc(100vh-65px)] max-w-7xl">
      {/* channel list */}
      <aside className={`${sideOpen ? "flex" : "hidden"} absolute z-20 h-[calc(100vh-65px)] w-64 flex-col bg-ink text-white md:static md:flex`}>
        <div className="border-b border-white/10 p-4">
          <p className="font-display text-xl font-bold">Gelan Chat</p>
          <p className="text-xs text-white/50">English only, please! 🇬🇧🇺🇸</p>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-widest text-white/40">Channels</p>
          {channels.map((c) => (
            <Link key={c.id} href={`/chat/${c.slug}`} onClick={() => setSideOpen(false)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${c.id === channel.id ? "bg-white/15 font-semibold" : "text-white/70 hover:bg-white/5 hover:text-white"}`}>
              <span>{c.emoji}</span># {c.slug}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          {me ? (
            <div className="flex items-center gap-2">
              <Avatar name={me.displayName} color={me.avatarColor} size={34} />
              <div className="text-xs leading-tight"><p className="font-semibold">{me.displayName}</p><p className="text-white/50">Lv {levelFromXp(me.xp)} · {me.xp} XP</p></div>
            </div>
          ) : (
            <Link href={`/login?next=/chat/${channel.slug}`} className="btn-primary w-full !py-2 text-sm">Sign in to chat</Link>
          )}
        </div>
      </aside>

      {/* messages */}
      <section className="flex min-w-0 flex-1 flex-col bg-white">
        <header className="flex items-center gap-3 border-b border-black/5 px-5 py-3">
          <button className="md:hidden" onClick={() => setSideOpen((s) => !s)}>☰</button>
          <span className="text-2xl">{channel.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold"># {channel.slug}</p>
            <p className="truncate text-xs text-muted">{channel.description}</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />{online.length} online
          </span>
        </header>
        <div
          ref={box}
          onScroll={(e) => {
            const el = e.currentTarget;
            stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
          }}
          className="flex-1 overflow-y-auto px-5 py-4"
        >
          {!loaded && <div className="space-y-3">{[1, 2, 3].map((k) => <div key={k} className="shimmer h-12 rounded-xl bg-paper" />)}</div>}
          {loaded && !messages.length && (
            <div className="grid h-full place-items-center text-center text-muted">
              <div><p className="text-5xl">{channel.emoji}</p><p className="mt-3 font-display text-xl font-bold text-ink">Welcome to #{channel.slug}</p><p className="text-sm">Be the first to say something!</p></div>
            </div>
          )}
          {messages.map((m) => {
            const day = fmtDay(m.createdAt);
            const t = new Date(m.createdAt).getTime();
            const showDay = day !== lastDay;
            const grouped = !showDay && m.userId === lastUser && t - lastTime < 5 * 60_000;
            lastDay = day;
            lastUser = m.userId;
            lastTime = t;
            return (
              <div key={m.id}>
                {showDay && (
                  <div className="my-4 flex items-center gap-3 text-xs font-semibold text-muted"><span className="h-px flex-1 bg-black/10" />{day}<span className="h-px flex-1 bg-black/10" /></div>
                )}
                <div className={`group flex gap-3 rounded-lg px-2 py-0.5 hover:bg-paper/60 ${grouped ? "" : "mt-3"} ${m.pending ? "opacity-60" : ""}`}>
                  <div className="w-9 shrink-0">{!grouped && <Avatar name={m.displayName} color={m.avatarColor} size={36} />}</div>
                  <div className="min-w-0 flex-1">
                    {!grouped && (
                      <p className="text-sm">
                        <span className="font-semibold">{m.displayName}</span>
                        {m.role === "admin" && <span className="ml-1.5 rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">ADMIN</span>}
                        <span className="ml-1.5 rounded bg-paper px-1.5 py-0.5 text-[10px] font-semibold text-muted">Lv {levelFromXp(m.xp)}</span>
                        <span className="ml-2 text-xs text-muted">{fmtTime(m.createdAt)}</span>
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{renderBody(m.body)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="relative border-t border-black/5 p-3">
          {error && <p className="mb-2 text-sm text-rose-700">⚠ {error}</p>}
          {showEmoji && (
            <div className="animate-toast absolute bottom-full left-3 mb-2 grid grid-cols-8 gap-1 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5">
              {EMOJIS.map((e) => <button key={e} onClick={() => setText((t) => t + e)} className="rounded-lg p-1.5 text-xl hover:bg-paper">{e}</button>)}
            </div>
          )}
          {me ? (
            <form onSubmit={send} className="flex items-end gap-2">
              <button type="button" onClick={() => setShowEmoji((s) => !s)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-paper text-xl hover:bg-gold/20">😊</button>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                rows={1}
                maxLength={1000}
                placeholder={`Message #${channel.slug}`}
                className="input max-h-32 min-h-11 resize-none !rounded-2xl"
              />
              <button disabled={!text.trim()} className="btn-primary h-11 shrink-0 !px-5">Send</button>
            </form>
          ) : (
            <Link href={`/login?next=/chat/${channel.slug}`} className="block rounded-2xl bg-paper p-3 text-center text-sm font-semibold hover:bg-gold/20">🔒 Sign in to join the conversation</Link>
          )}
        </div>
      </section>

      {/* online list */}
      <aside className="hidden w-56 border-l border-black/5 bg-cream p-4 xl:block">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Online now — {online.length}</p>
        <ul className="mt-3 space-y-2">
          {online.map((o) => (
            <li key={o.id} className="flex items-center gap-2 text-sm">
              <span className="relative"><Avatar name={o.name} color={o.color} size={28} /><span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-cream bg-emerald-500" /></span>
              {o.name}
            </li>
          ))}
          {!online.length && <li className="text-xs text-muted">Nobody else right now.</li>}
        </ul>
        <div className="mt-8 rounded-2xl bg-white p-3 text-xs text-muted ring-1 ring-black/5">
          <p className="font-semibold text-ink">Chat etiquette</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            <li>Be kind & patient</li>
            <li>Correct gently</li>
            <li>+2 XP per message</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
