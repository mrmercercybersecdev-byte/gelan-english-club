"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { earnXp } from "@/lib/client-xp";

const ICE: RTCConfiguration = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }],
};

const TOPICS = [
  "If you could live in any English-speaking city for a year, which would it be and why?",
  "What's a skill you'd love to learn and what's stopping you?",
  "Describe the best meal you've ever had in as much detail as possible.",
  "Is it better to be a big fish in a small pond or a small fish in a big pond?",
  "What's an English word you find funny, and why?",
  "Should homework be banned? Argue for 60 seconds, then switch sides!",
  "Tell the group about a time you got lost somewhere.",
  "What would you do with an extra hour every day?",
  "Which invention changed the world the most?",
  "Pick an idiom and tell a story that uses it.",
];
const REACTIONS = ["👏", "😂", "❤️", "🎉", "👍", "🤯"];

type Remote = { id: string; name: string; stream: MediaStream; mic: boolean; cam: boolean; hand: boolean };
type ChatLine = { id: number; from: string; text: string; system?: boolean; me?: boolean };
type Signal = { id: number; fromPeer: string; toPeer: string; kind: string; payload: string };
type Floating = { id: number; emoji: string; left: number };

function Tile({ stream, name, muted, mirrored, mic, cam, hand, you }: { stream: MediaStream | null; name: string; muted?: boolean; mirrored?: boolean; mic: boolean; cam: boolean; hand: boolean; you?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current && stream && ref.current.srcObject !== stream) ref.current.srcObject = stream;
  }, [stream]);
  return (
    <div className={`group relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 ring-1 ring-white/10 ${hand ? "ring-4 ring-gold" : ""}`}>
      <video ref={ref} autoPlay playsInline muted={muted} className={`h-full w-full object-cover ${mirrored ? "scale-x-[-1]" : ""} ${cam ? "" : "invisible"}`} />
      {!cam && (
        <div className="absolute inset-0 grid place-items-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-brand to-gold font-display text-3xl font-bold text-white">{name.charAt(0).toUpperCase()}</span>
        </div>
      )}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur">
        {!mic && <span title="Muted">🔇</span>}
        {name}{you && " (you)"}
      </div>
      {hand && <div className="animate-pop absolute right-2 top-2 rounded-full bg-gold px-2 py-1 text-lg">✋</div>}
    </div>
  );
}

export default function MeetRoom({ code, title, host, defaultName, loggedIn }: { code: string; title: string; host: string; defaultName: string; loggedIn: boolean }) {
  const [phase, setPhase] = useState<"prejoin" | "live" | "left">("prejoin");
  const [name, setName] = useState(defaultName);
  const [local, setLocal] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState("");
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [hand, setHand] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [remotes, setRemotes] = useState<Record<string, Remote>>({});
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [draft, setDraft] = useState("");
  const [panel, setPanel] = useState<"chat" | "people" | null>("chat");
  const [floating, setFloating] = useState<Floating[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);
  const [unread, setUnread] = useState(0);

  const peerId = useRef<string>("");
  const pcs = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingIce = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const after = useRef(0);
  const localRef = useRef<MediaStream | null>(null);
  const screenTrack = useRef<MediaStreamTrack | null>(null);
  const stateRef = useRef({ mic: true, cam: true, hand: false, name: "" });
  const panelRef = useRef(panel);
  panelRef.current = panel;
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    peerId.current = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  }, []);

  /* ---------- preview media ---------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: { echoCancellation: true, noiseSuppression: true } });
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        localRef.current = s;
        setLocal(s);
      } catch {
        try {
          const s = await navigator.mediaDevices.getUserMedia({ audio: true });
          localRef.current = s;
          setLocal(s);
          setCam(false);
          setMediaError("No camera found — joining with audio only.");
        } catch {
          setCam(false);
          setMic(false);
          setMediaError("Camera & microphone unavailable — you can still watch, listen and chat.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    localRef.current?.getAudioTracks().forEach((t) => (t.enabled = mic));
    if (!sharing) localRef.current?.getVideoTracks().forEach((t) => (t.enabled = cam));
    stateRef.current = { ...stateRef.current, mic, cam, hand };
    if (phase === "live") signal("*", "state", { mic, cam: cam || sharing, hand });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mic, cam, hand, sharing]);

  const signal = useCallback(async (to: string, kind: string, payload: unknown) => {
    await fetch(`/api/meet/${code}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "signal", peerId: peerId.current, to, kind, payload }),
    }).catch(() => {});
  }, [code]);

  const upsertRemote = useCallback((id: string, patch: Partial<Remote>) => {
    setRemotes((r) => {
      const cur = r[id] ?? { id, name: "Guest", stream: new MediaStream(), mic: true, cam: true, hand: false };
      return { ...r, [id]: { ...cur, ...patch } };
    });
  }, []);

  const removePeer = useCallback((id: string) => {
    pcs.current.get(id)?.close();
    pcs.current.delete(id);
    setRemotes((r) => {
      const n = { ...r };
      delete n[id];
      return n;
    });
  }, []);

  const attachLocal = (pc: RTCPeerConnection) => {
    const s = localRef.current;
    for (const tr of pc.getTransceivers()) {
      const kind = tr.receiver.track.kind;
      let track: MediaStreamTrack | null = null;
      if (kind === "video") track = screenTrack.current ?? s?.getVideoTracks()[0] ?? null;
      else track = s?.getAudioTracks()[0] ?? null;
      tr.direction = "sendrecv";
      tr.sender.replaceTrack(track).catch(() => {});
    }
  };

  const createPc = useCallback((id: string, name: string, initiator: boolean) => {
    const existing = pcs.current.get(id);
    if (existing) return existing;
    const pc = new RTCPeerConnection(ICE);
    pcs.current.set(id, pc);
    const stream = new MediaStream();
    upsertRemote(id, { name, stream });
    if (initiator) {
      pc.addTransceiver("audio", { direction: "sendrecv" });
      pc.addTransceiver("video", { direction: "sendrecv" });
      attachLocal(pc);
    }
    pc.onicecandidate = (e) => {
      if (e.candidate) signal(id, "ice", e.candidate.toJSON());
    };
    pc.ontrack = (e) => {
      stream.getTracks().filter((t) => t.kind === e.track.kind).forEach((t) => stream.removeTrack(t));
      stream.addTrack(e.track);
      upsertRemote(id, { stream: new MediaStream(stream.getTracks()) });
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") removePeer(id);
    };
    return pc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signal, upsertRemote, removePeer]);

  const flushIce = async (id: string, pc: RTCPeerConnection) => {
    const q = pendingIce.current.get(id) ?? [];
    pendingIce.current.delete(id);
    for (const c of q) await pc.addIceCandidate(c).catch(() => {});
  };

  const handleSignal = useCallback(async (s: Signal) => {
    let payload: Record<string, unknown> = {};
    try { payload = JSON.parse(s.payload); } catch {}
    const from = s.fromPeer;
    switch (s.kind) {
      case "join":
        upsertRemote(from, { name: String(payload.name ?? "Guest") });
        setChat((c) => [...c, { id: s.id, from: "", text: `${payload.name ?? "Someone"} joined 👋`, system: true }]);
        signal(from, "state", { mic: stateRef.current.mic, cam: stateRef.current.cam, hand: stateRef.current.hand });
        break;
      case "offer": {
        let pc = pcs.current.get(from);
        if (pc && pc.signalingState === "have-local-offer") {
          if (peerId.current > from) return; // we win the glare; they will answer ours
          await pc.setLocalDescription({ type: "rollback" }).catch(() => {});
        }
        pc = pc ?? createPc(from, String(payload.name ?? "Guest"), false);
        await pc.setRemoteDescription(payload.sdp as RTCSessionDescriptionInit);
        attachLocal(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        signal(from, "answer", { sdp: pc.localDescription });
        await flushIce(from, pc);
        break;
      }
      case "answer": {
        const pc = pcs.current.get(from);
        if (pc && pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(payload.sdp as RTCSessionDescriptionInit);
          await flushIce(from, pc);
        }
        break;
      }
      case "ice": {
        const pc = pcs.current.get(from);
        if (pc && pc.remoteDescription) await pc.addIceCandidate(payload as RTCIceCandidateInit).catch(() => {});
        else pendingIce.current.set(from, [...(pendingIce.current.get(from) ?? []), payload as RTCIceCandidateInit]);
        break;
      }
      case "leave":
        setRemotes((r) => {
          if (r[from]) setChat((c) => [...c, { id: s.id, from: "", text: `${r[from].name} left`, system: true }]);
          return r;
        });
        removePeer(from);
        break;
      case "state":
        upsertRemote(from, { mic: Boolean(payload.mic), cam: Boolean(payload.cam), hand: Boolean(payload.hand) });
        break;
      case "chat":
        setChat((c) => [...c, { id: s.id, from: String(payload.name ?? "Guest"), text: String(payload.text ?? ""), system: Boolean(payload.system) }]);
        if (panelRef.current !== "chat") setUnread((u) => u + 1);
        break;
      case "reaction":
        pop(String(payload.emoji ?? "👏"));
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createPc, removePeer, signal, upsertRemote]);

  /* ---------- polling loop ---------- */
  useEffect(() => {
    if (phase !== "live") return;
    let stop = false;
    let busy = false;
    const tick = async () => {
      if (busy || stop) return;
      busy = true;
      try {
        const res = await fetch(`/api/meet/${code}?peer=${peerId.current}&after=${after.current}`, { cache: "no-store" });
        const data = (await res.json()) as { peers: { id: string; name: string }[]; signals: Signal[] };
        for (const s of data.signals ?? []) {
          after.current = Math.max(after.current, s.id);
          await handleSignal(s);
        }
        const alive = new Set((data.peers ?? []).map((p) => p.id));
        for (const id of pcs.current.keys()) if (!alive.has(id)) removePeer(id);
      } catch {}
      busy = false;
    };
    const iv = setInterval(tick, 900);
    tick();
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      stop = true;
      clearInterval(iv);
      clearInterval(t);
    };
  }, [phase, code, handleSignal, removePeer]);

  useEffect(() => {
    const onUnload = () => {
      if (phase === "live") navigator.sendBeacon(`/api/meet/${code}`, new Blob([JSON.stringify({ action: "leave", peerId: peerId.current })], { type: "application/json" }));
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [phase, code]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  async function join() {
    const n = name.trim() || "Guest";
    stateRef.current.name = n;
    const res = await fetch(`/api/meet/${code}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join", peerId: peerId.current, name: n }),
    });
    const data = (await res.json()) as { peers: { id: string; name: string }[]; after: number };
    after.current = data.after ?? 0;
    setPhase("live");
    setChat([{ id: 0, from: "", text: `Welcome to “${title}”. Share the link to invite others!`, system: true }]);
    for (const p of data.peers ?? []) {
      const pc = createPc(p.id, p.name, true);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      signal(p.id, "offer", { sdp: pc.localDescription, name: n });
    }
    signal("*", "state", { mic, cam, hand });
    if (loggedIn) earnXp("meeting_join", { meta: code }, "Joined a live room");
  }

  async function leave() {
    await fetch(`/api/meet/${code}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "leave", peerId: peerId.current }) }).catch(() => {});
    pcs.current.forEach((pc) => pc.close());
    pcs.current.clear();
    localRef.current?.getTracks().forEach((t) => t.stop());
    screenTrack.current?.stop();
    setRemotes({});
    setPhase("left");
  }

  async function toggleShare() {
    if (sharing) {
      screenTrack.current?.stop();
      return;
    }
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const track = display.getVideoTracks()[0];
      screenTrack.current = track;
      pcs.current.forEach((pc) => pc.getTransceivers().filter((t) => t.receiver.track.kind === "video").forEach((t) => t.sender.replaceTrack(track).catch(() => {})));
      setSharing(true);
      track.onended = () => {
        screenTrack.current = null;
        const cam = localRef.current?.getVideoTracks()[0] ?? null;
        pcs.current.forEach((pc) => pc.getTransceivers().filter((t) => t.receiver.track.kind === "video").forEach((t) => t.sender.replaceTrack(cam)));
        setSharing(false);
      };
    } catch {}
  }

  function pop(emoji: string) {
    const id = Date.now() + Math.random();
    setFloating((f) => [...f, { id, emoji, left: 10 + Math.random() * 80 }]);
    setTimeout(() => setFloating((f) => f.filter((x) => x.id !== id)), 2600);
  }

  function react(emoji: string) {
    pop(emoji);
    signal("*", "reaction", { emoji });
  }

  function sendChat(text: string, system = false) {
    const t = text.trim();
    if (!t) return;
    const n = stateRef.current.name || name || "Guest";
    setChat((c) => [...c, { id: Date.now(), from: n, text: t, me: !system, system }]);
    signal("*", "chat", { name: n, text: t, system });
  }

  function dealTopic() {
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    sendChat(`🎲 Topic from ${stateRef.current.name || "host"}: ${topic}`, true);
  }

  const localDisplay = sharing && screenTrack.current ? new MediaStream([screenTrack.current]) : local;
  const remoteList = Object.values(remotes);
  const count = remoteList.length + 1;
  const gridCols = count <= 1 ? "grid-cols-1" : count <= 4 ? "grid-cols-1 sm:grid-cols-2" : count <= 9 ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-3 lg:grid-cols-4";
  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;

  if (phase === "left") {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <p className="text-6xl">👋</p>
        <h1 className="mt-4 font-display text-4xl font-bold">You left the room</h1>
        <p className="mt-2 text-muted">Great practice! Come back any time.</p>
        <div className="mt-8 flex justify-center gap-3">
          <button onClick={() => window.location.reload()} className="btn-primary">Rejoin</button>
          <Link href="/meet" className="btn-ghost">All rooms</Link>
        </div>
      </div>
    );
  }

  if (phase === "prejoin") {
    return (
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <Tile stream={local} name={name || "You"} muted mirrored mic={mic} cam={cam} hand={false} you />
          <div className="mt-4 flex justify-center gap-3">
            <button onClick={() => setMic((m) => !m)} className={`grid h-12 w-12 place-items-center rounded-full text-xl ${mic ? "bg-white ring-1 ring-black/10" : "bg-brand text-white"}`}>{mic ? "🎙️" : "🔇"}</button>
            <button onClick={() => setCam((c) => !c)} className={`grid h-12 w-12 place-items-center rounded-full text-xl ${cam ? "bg-white ring-1 ring-black/10" : "bg-brand text-white"}`}>{cam ? "📷" : "🚫"}</button>
          </div>
          {mediaError && <p className="mt-3 text-center text-sm text-muted">{mediaError}</p>}
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">Ready to join?</p>
          <h1 className="mt-2 font-display text-4xl font-bold">{title}</h1>
          <p className="mt-1 text-muted">Hosted by {host} · <code className="rounded bg-paper px-1.5">{code}</code></p>
          <label className="label mt-6" htmlFor="nm">Your name</label>
          <input id="nm" value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Enter your name" maxLength={60} />
          <button onClick={join} className="btn-primary mt-4 w-full !py-4 text-lg">Join now</button>
          <p className="mt-3 text-xs text-muted">Peer-to-peer video works best with up to ~6 people. {loggedIn ? "+30 XP for joining!" : "Sign in to earn XP."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-65px)] flex-col bg-[#0b0f1a] text-white">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />LIVE</span>
          <p className="truncate font-semibold">{title}</p>
          <span className="font-mono text-sm text-white/50">{mmss}</span>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="glass rounded-full px-3 py-1 text-xs font-semibold hover:bg-white/15"
        >
          {copied ? "✓ Link copied" : `🔗 Invite · ${code}`}
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1">
        <div className="relative flex-1 overflow-y-auto p-4">
          <div className={`mx-auto grid max-w-6xl gap-3 ${gridCols}`}>
            <Tile stream={localDisplay} name={name || "You"} muted mirrored={!sharing} mic={mic} cam={cam || sharing} hand={hand} you />
            {remoteList.map((r) => <Tile key={r.id} stream={r.stream} name={r.name} mic={r.mic} cam={r.cam} hand={r.hand} />)}
          </div>
          {remoteList.length === 0 && (
            <div className="mx-auto mt-6 max-w-md rounded-2xl bg-white/5 p-5 text-center text-sm text-white/70">
              You&apos;re the only one here. Share the invite link — or open it in another tab to test!
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <style>{`@keyframes floatUp{0%{transform:translateY(0) scale(.6);opacity:0}15%{opacity:1;transform:translateY(-40px) scale(1.2)}100%{transform:translateY(-420px) scale(1);opacity:0}}`}</style>
            {floating.map((f) => (
              <span key={f.id} className="absolute bottom-4 text-5xl" style={{ left: `${f.left}%`, animation: "floatUp 2.6s ease-out forwards" }}>{f.emoji}</span>
            ))}
          </div>
        </div>

        {panel && (
          <aside className="flex w-full max-w-sm flex-col border-l border-white/10 bg-[#111827] max-md:absolute max-md:inset-y-0 max-md:right-0 max-md:z-10">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex gap-1 text-sm">
                {(["chat", "people"] as const).map((p) => (
                  <button key={p} onClick={() => { setPanel(p); if (p === "chat") setUnread(0); }} className={`rounded-full px-3 py-1 font-semibold ${panel === p ? "bg-white/10" : "text-white/50"}`}>
                    {p === "chat" ? "💬 Chat" : `👥 People (${count})`}
                  </button>
                ))}
              </div>
              <button onClick={() => setPanel(null)} className="text-white/50 hover:text-white">✕</button>
            </div>
            {panel === "chat" ? (
              <>
                <div className="flex-1 space-y-2 overflow-y-auto p-4 text-sm">
                  {chat.map((c) =>
                    c.system ? (
                      <p key={c.id} className="rounded-lg bg-gold/10 px-3 py-2 text-center text-xs text-gold">{c.text}</p>
                    ) : (
                      <div key={c.id} className={c.me ? "text-right" : ""}>
                        <p className="text-[11px] text-white/40">{c.from}</p>
                        <p className={`inline-block max-w-[90%] rounded-2xl px-3 py-2 text-left ${c.me ? "bg-brand" : "bg-white/10"}`}>{c.text}</p>
                      </div>
                    ),
                  )}
                  <div ref={chatEnd} />
                </div>
                <div className="border-t border-white/10 p-3">
                  <button onClick={dealTopic} className="mb-2 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2 text-xs font-bold">🎲 Deal a conversation topic to everyone</button>
                  <form onSubmit={(e) => { e.preventDefault(); sendChat(draft); setDraft(""); }} className="flex gap-2">
                    <input value={draft} onChange={(e) => setDraft(e.target.value)} className="w-full rounded-full bg-white/10 px-4 py-2 text-sm outline-none placeholder:text-white/40 focus:bg-white/15" placeholder="Message everyone…" maxLength={500} />
                    <button className="rounded-full bg-brand px-4 text-sm font-bold">↑</button>
                  </form>
                </div>
              </>
            ) : (
              <ul className="flex-1 space-y-1 overflow-y-auto p-3 text-sm">
                <li className="flex items-center gap-3 rounded-xl p-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-brand font-bold">{(name || "Y").charAt(0)}</span><span className="flex-1">{name || "You"} (you)</span>{hand && "✋"}{!mic && "🔇"}</li>
                {remoteList.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/5"><span className="grid h-8 w-8 place-items-center rounded-full bg-navy font-bold">{r.name.charAt(0)}</span><span className="flex-1">{r.name}</span>{r.hand && "✋"}{!r.mic && "🔇"}</li>
                ))}
              </ul>
            )}
          </aside>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-white/10 px-4 py-3">
        <CtlBtn on={mic} onClick={() => setMic((m) => !m)} label={mic ? "Mute" : "Unmute"} icon={mic ? "🎙️" : "🔇"} disabled={!local?.getAudioTracks().length} />
        <CtlBtn on={cam} onClick={() => setCam((c) => !c)} label={cam ? "Stop video" : "Start video"} icon={cam ? "📷" : "🚫"} disabled={!local?.getVideoTracks().length} />
        <CtlBtn on={!sharing} onClick={toggleShare} label={sharing ? "Stop share" : "Share screen"} icon="🖥️" />
        <CtlBtn on={!hand} onClick={() => setHand((h) => !h)} label={hand ? "Lower hand" : "Raise hand"} icon="✋" />
        <div className="glass flex items-center gap-1 rounded-full px-2 py-1">
          {REACTIONS.map((r) => <button key={r} onClick={() => react(r)} className="rounded-full p-1.5 text-xl transition hover:scale-125">{r}</button>)}
        </div>
        <button onClick={() => { setPanel(panel === "chat" ? null : "chat"); setUnread(0); }} className="relative grid h-12 w-12 place-items-center rounded-full bg-white/10 text-xl hover:bg-white/20">
          💬{unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold">{unread}</span>}
        </button>
        <button onClick={leave} className="rounded-full bg-red-600 px-6 py-3 text-sm font-bold hover:bg-red-700">Leave</button>
      </div>
    </div>
  );
}

function CtlBtn({ on, onClick, label, icon, disabled }: { on: boolean; onClick: () => void; label: string; icon: string; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} title={label} className={`grid h-12 w-12 place-items-center rounded-full text-xl transition disabled:opacity-30 ${on ? "bg-white/10 hover:bg-white/20" : "bg-brand hover:bg-brand-dark"}`}>
      {icon}
    </button>
  );
}
