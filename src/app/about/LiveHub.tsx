"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { thumbnailFor, toEmbed } from "@/lib/embed";

export type StreamDTO = {
  id: number;
  title: string;
  description: string;
  streamUrl: string;
  status: string;
  host: string;
  scheduledAt: string;
};

type ChatMsg = { id: number; body: string; createdAt: string; displayName: string; avatarColor: string };

function useCountdown(target: string | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!target) return null;
  const diff = Math.max(0, new Date(target).getTime() - now);
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff / 3_600_000) % 24),
    m: Math.floor((diff / 60_000) % 60),
    s: Math.floor((diff / 1000) % 60),
    done: diff === 0,
  };
}

function icsHref(s: StreamDTO) {
  const start = new Date(s.scheduledAt);
  const end = new Date(start.getTime() + 60 * 60_000);
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const body = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Gelan English Club//EN", "BEGIN:VEVENT",
    `UID:stream-${s.id}@gelan`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(start)}`, `DTEND:${f(end)}`,
    `SUMMARY:${s.title.replace(/[,;]/g, " ")}`, `DESCRIPTION:${s.description.replace(/[,;\n]/g, " ").slice(0, 300)}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(body)}`;
}

function Digit({ v, label }: { v: number; label: string }) {
  return (
    <div className="text-center">
      <div key={v} className="animate-toast rounded-xl bg-white/10 px-3 py-2 font-mono text-3xl font-bold tabular-nums">{String(v).padStart(2, "0")}</div>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-white/50">{label}</p>
    </div>
  );
}

function Player({ stream, autoplay }: { stream: StreamDTO; autoplay: boolean }) {
  const [host, setHost] = useState("localhost");
  useEffect(() => setHost(window.location.hostname), []);
  const e = toEmbed(stream.streamUrl, host, autoplay);
  const live = stream.status === "live";

  if (e.kind === "iframe") {
    return <iframe key={e.src} src={e.src} title={stream.title} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />;
  }
  if (e.kind === "video") {
    return <video key={e.src} src={e.src} controls autoPlay={autoplay} playsInline className="h-full w-full bg-black" />;
  }
  return (
    <div className="aurora-bg relative grid h-full w-full place-items-center overflow-hidden text-center">
      <div className="grid-bg absolute inset-0 opacity-60" />
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 animate-spin-slow rounded-full border border-dashed border-white/20" />
      <div className="relative px-6">
        <p className="text-6xl">{live ? "🔴" : e.kind === "room" ? "📹" : "📡"}</p>
        <p className="mt-3 font-display text-2xl font-bold md:text-3xl">{stream.title}</p>
        <p className="mt-1 text-sm text-white/70">
          {e.kind === "room" ? "Broadcast inside a Gelan live room — join to watch, react and even take the mic." : e.kind === "link" ? "This stream plays on an external site." : "Stream link coming soon."}
        </p>
        {e.kind === "room" && (
          <Link href={e.href} className={`mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold ${live ? "live-glow bg-red-600" : "bg-white text-ink"}`}>
            {live ? "Join the live room now →" : "Open the studio room →"}
          </Link>
        )}
        {e.kind === "link" && (
          <a href={e.href} target="_blank" rel="noreferrer" className="mt-5 inline-flex rounded-full bg-white px-6 py-3 font-bold text-ink">Watch stream ↗</a>
        )}
      </div>
    </div>
  );
}

function LiveChat({ loggedIn, onCount }: { loggedIn: boolean; onCount: (n: number) => void }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const last = useRef(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let stop = false;
    const poll = async () => {
      try {
        const r = await fetch(`/api/chat/livestream?after=${last.current}`, { cache: "no-store" });
        if (!r.ok) return;
        const d = (await r.json()) as { messages: ChatMsg[]; online: unknown[] };
        if (stop) return;
        if (d.messages.length) {
          last.current = d.messages[d.messages.length - 1].id;
          setMsgs((m) => [...m.filter((x) => x.id > 0), ...d.messages].slice(-150));
        }
        onCount(d.online?.length ?? 0);
      } catch {}
    };
    poll();
    const iv = setInterval(poll, 2000);
    return () => {
      stop = true;
      clearInterval(iv);
    };
  }, [onCount]);

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    const r = await fetch("/api/chat/livestream", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
    if (!r.ok) setErr((await r.json()).error ?? "Failed");
    else setErr("");
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={box} className="flex-1 space-y-2 overflow-y-auto p-4 text-sm">
        {!msgs.length && <p className="pt-10 text-center text-white/40">Chat is quiet… say hi! 👋</p>}
        {msgs.map((m) => (
          <p key={m.id} className="animate-toast leading-snug">
            <span className="font-bold" style={{ color: m.avatarColor === "#1f2d4a" ? "#93c5fd" : m.avatarColor }}>{m.displayName}</span>{" "}
            <span className="text-white/85">{m.body}</span>
          </p>
        ))}
      </div>
      <div className="border-t border-white/10 p-3">
        <div className="mb-2 flex gap-1">
          {["👏", "🔥", "😂", "❤️", "🎉"].map((em) => (
            <button key={em} disabled={!loggedIn} onClick={() => setText((t) => t + em)} className="rounded-lg px-1.5 py-0.5 text-lg transition hover:scale-125 disabled:opacity-40">{em}</button>
          ))}
        </div>
        {loggedIn ? (
          <form onSubmit={send} className="flex gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder="Say something…" className="w-full rounded-full bg-white/10 px-4 py-2 text-sm outline-none placeholder:text-white/40 focus:bg-white/15" />
            <button className="rounded-full bg-red-600 px-4 text-sm font-bold">Send</button>
          </form>
        ) : (
          <Link href="/login?next=/about%23live" className="block rounded-full bg-white/10 py-2 text-center text-sm font-semibold hover:bg-white/15">Sign in to chat</Link>
        )}
        {err && <p className="mt-1 text-xs text-red-300">{err}</p>}
      </div>
    </div>
  );
}

export default function LiveHub({ streams, loggedIn }: { streams: StreamDTO[]; loggedIn: boolean }) {
  const live = streams.find((s) => s.status === "live");
  const upcoming = useMemo(
    () => streams.filter((s) => s.status === "scheduled").sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt)),
    [streams],
  );
  const replays = useMemo(
    () => streams.filter((s) => s.status === "ended").sort((a, b) => +new Date(b.scheduledAt) - +new Date(a.scheduledAt)),
    [streams],
  );
  const [selectedId, setSelectedId] = useState<number | undefined>(live?.id ?? replays[0]?.id ?? upcoming[0]?.id);
  const [autoplay, setAutoplay] = useState(false);
  const [panel, setPanel] = useState<"chat" | "schedule">(live ? "chat" : "schedule");
  const [viewers, setViewers] = useState(0);
  const selected = streams.find((s) => s.id === selectedId);
  const next = upcoming[0];
  const cd = useCountdown(next?.scheduledAt);

  if (!streams.length) {
    return <p className="rounded-3xl bg-white/5 p-10 text-center text-white/60">No broadcasts yet — stay tuned!</p>;
  }

  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="relative aspect-video overflow-hidden rounded-3xl bg-black shadow-2xl ring-1 ring-white/10">
            {selected ? <Player stream={selected} autoplay={autoplay} /> : null}
            {selected?.status === "live" && (
              <span className="live-glow pointer-events-none absolute left-4 top-4 flex items-center gap-1.5 rounded-md bg-red-600 px-2.5 py-1 text-xs font-bold">
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> LIVE
              </span>
            )}
          </div>
          {selected && (
            <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl font-bold">{selected.title}</h3>
                <p className="text-sm text-white/60">
                  Hosted by {selected.host} · {selected.status === "live" ? "Streaming now" : selected.status === "ended" ? `Replay · ${new Date(selected.scheduledAt).toLocaleDateString()}` : `Starts ${new Date(selected.scheduledAt).toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`}
                </p>
                <p className="mt-2 max-w-2xl text-sm text-white/75">{selected.description}</p>
              </div>
              <div className="flex gap-2">
                {selected.status === "live" && <span className="glass rounded-full px-3 py-1.5 text-xs font-semibold">👀 {viewers} in chat</span>}
                {selected.status === "scheduled" && (
                  <a href={icsHref(selected)} download={`gelan-stream-${selected.id}.ics`} className="glass rounded-full px-3 py-1.5 text-xs font-semibold hover:bg-white/15">📅 Add to calendar</a>
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="flex h-[520px] flex-col overflow-hidden rounded-3xl bg-white/5 ring-1 ring-white/10 lg:h-auto">
          <div className="flex border-b border-white/10 text-sm font-semibold">
            {(["chat", "schedule"] as const).map((p) => (
              <button key={p} onClick={() => setPanel(p)} className={`flex-1 py-3 transition ${panel === p ? "bg-white/10 text-white" : "text-white/50 hover:text-white"}`}>
                {p === "chat" ? "💬 Live chat" : "📅 Schedule"}
              </button>
            ))}
          </div>
          {panel === "chat" ? (
            <LiveChat loggedIn={loggedIn} onCount={setViewers} />
          ) : (
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {next && cd && (
                <div className="rounded-2xl bg-gradient-to-br from-red-600/40 via-brand/30 to-violet-600/30 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gold">Next broadcast</p>
                  <p className="mt-1 font-display text-lg font-bold leading-tight">{next.title}</p>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    <Digit v={cd.d} label="days" />
                    <Digit v={cd.h} label="hrs" />
                    <Digit v={cd.m} label="min" />
                    <Digit v={cd.s} label="sec" />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => { setSelectedId(next.id); setAutoplay(false); }} className="flex-1 rounded-full bg-white/15 py-1.5 text-xs font-semibold hover:bg-white/25">Preview</button>
                    <a href={icsHref(next)} download={`gelan-stream-${next.id}.ics`} className="flex-1 rounded-full bg-white py-1.5 text-center text-xs font-bold text-ink">📅 Remind me</a>
                  </div>
                </div>
              )}
              {upcoming.slice(1).map((s) => (
                <button key={s.id} onClick={() => setSelectedId(s.id)} className="block w-full rounded-2xl bg-white/5 p-3 text-left transition hover:bg-white/10">
                  <p className="text-xs text-gold">{new Date(s.scheduledAt).toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-xs text-white/50">with {s.host}</p>
                </button>
              ))}
              {!upcoming.length && <p className="text-center text-sm text-white/50">No upcoming broadcasts scheduled.</p>}
            </div>
          )}
        </aside>
      </div>

      {replays.length > 0 && (
        <div className="mt-12">
          <h3 className="font-display text-2xl font-bold">🎬 Replays</h3>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {replays.map((r) => {
              const thumb = thumbnailFor(r.streamUrl);
              return (
                <button
                  key={r.id}
                  onClick={() => { setSelectedId(r.id); setAutoplay(true); document.getElementById("live")?.scrollIntoView({ behavior: "smooth" }); }}
                  className={`group overflow-hidden rounded-2xl bg-white/5 text-left ring-1 transition hover:-translate-y-1 hover:bg-white/10 ${selectedId === r.id ? "ring-gold" : "ring-white/10"}`}
                >
                  <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-brand/40 to-violet-600/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {thumb && <img src={thumb} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />}
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-black/60 text-xl backdrop-blur transition group-hover:scale-110 group-hover:bg-red-600">▶</span>
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-sm font-semibold">{r.title}</p>
                    <p className="mt-1 text-xs text-white/50">{r.host} · {new Date(r.scheduledAt).toLocaleDateString()}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
