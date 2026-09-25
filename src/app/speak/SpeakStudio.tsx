"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PRONUNCIATION_SENTENCES, SPEAKING_SCENARIOS } from "@/lib/quizzes";
import { earnXp, notifyXp } from "@/lib/client-xp";

/* ---- Minimal Web Speech API typings ---- */
type SRResult = { isFinal: boolean; 0: { transcript: string; confidence: number } };
type SREvent = { resultIndex: number; results: ArrayLike<SRResult> };
interface SR {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: SREvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}
type SRCtor = new () => SR;

function getSR(): SRCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function speak(text: string, lang: string, rate = 1, onEnd?: () => void) {
  if (!("speechSynthesis" in window)) return onEnd?.();
  window.speechSynthesis.cancel();
  const clean = text.replace(/[*_#>`]/g, "").replace(/💡[\s\S]*$/, "").trim();
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = lang;
  u.rate = rate;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang === lang) ?? window.speechSynthesis.getVoices().find((v) => v.lang.startsWith("en"));
  if (voice) u.voice = voice;
  u.onend = () => onEnd?.();
  window.speechSynthesis.speak(u);
}

/* ---- Live mic visualizer ---- */
function useMicLevel(active: boolean) {
  const [levels, setLevels] = useState<number[]>(Array(32).fill(0.05));
  useEffect(() => {
    if (!active) {
      setLevels(Array(32).fill(0.05));
      return;
    }
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let raf = 0;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        ctx = new AudioContext();
        const src = ctx.createMediaStreamSource(stream);
        const an = ctx.createAnalyser();
        an.fftSize = 128;
        src.connect(an);
        const data = new Uint8Array(an.frequencyBinCount);
        const loop = () => {
          an.getByteFrequencyData(data);
          const out: number[] = [];
          for (let i = 0; i < 32; i++) out.push(Math.max(0.05, data[i + 2] / 255));
          setLevels(out);
          raf = requestAnimationFrame(loop);
        };
        loop();
      } catch {
        /* mic denied */
      }
    })();
    return () => {
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      ctx?.close();
    };
  }, [active]);
  return levels;
}

function Visualizer({ levels, color = "from-brand to-gold" }: { levels: number[]; color?: string }) {
  return (
    <div className="flex h-20 items-center justify-center gap-1">
      {levels.map((l, i) => (
        <span key={i} className={`w-1.5 rounded-full bg-gradient-to-t ${color} transition-[height] duration-75`} style={{ height: `${Math.round(l * 100)}%` }} />
      ))}
    </div>
  );
}

/* ---- Word alignment for pronunciation scoring ---- */
function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9'\s-]/g, "").replace(/-/g, " ").split(/\s+/).filter(Boolean);
}
function scoreWords(target: string, said: string) {
  const t = norm(target);
  const s = norm(said);
  // LCS table
  const dp = Array.from({ length: t.length + 1 }, () => Array(s.length + 1).fill(0));
  for (let i = 1; i <= t.length; i++)
    for (let j = 1; j <= s.length; j++) dp[i][j] = t[i - 1] === s[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  const hit = new Set<number>();
  let i = t.length, j = s.length;
  while (i > 0 && j > 0) {
    if (t[i - 1] === s[j - 1]) { hit.add(i - 1); i--; j--; }
    else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
    else j--;
  }
  return { words: t.map((w, k) => ({ w, ok: hit.has(k) })), score: t.length ? Math.round((hit.size / t.length) * 100) : 0 };
}

type Msg = { role: "user" | "assistant"; content: string };

export default function SpeakStudio() {
  const [tab, setTab] = useState<"talk" | "drill">("talk");
  const [supported, setSupported] = useState(true);
  const [accent, setAccent] = useState("en-GB");
  useEffect(() => {
    setSupported(Boolean(getSR()));
    window.speechSynthesis?.getVoices();
  }, []);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-white p-1 shadow-sm ring-1 ring-black/5">
          {([["talk", "🗣️ Conversation"], ["drill", "🎯 Pronunciation drill"]] as const).map(([id, l]) => (
            <button key={id} onClick={() => setTab(id)} className={`rounded-full px-5 py-2 text-sm font-semibold ${tab === id ? "bg-ink text-white" : "text-muted"}`}>{l}</button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          Accent
          <select value={accent} onChange={(e) => setAccent(e.target.value)} className="rounded-full border border-black/10 bg-white px-3 py-1.5">
            <option value="en-GB">🇬🇧 British</option>
            <option value="en-US">🇺🇸 American</option>
            <option value="en-AU">🇦🇺 Australian</option>
            <option value="en-IN">🇮🇳 Indian</option>
          </select>
        </label>
      </div>
      {!supported && (
        <p className="mb-6 rounded-2xl bg-gold/15 p-4 text-sm ring-1 ring-gold/30">
          🎤 Your browser doesn&apos;t support speech recognition. You can still type your replies and hear Wordy speak — for full voice mode use Chrome or Edge.
        </p>
      )}
      {tab === "talk" ? <Conversation accent={accent} supported={supported} /> : <Drill accent={accent} supported={supported} />}
    </div>
  );
}

function Conversation({ accent, supported }: { accent: string; supported: boolean }) {
  const [scenario, setScenario] = useState(SPEAKING_SCENARIOS[0]);
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: SPEAKING_SCENARIOS[0].opener }]);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [typed, setTyped] = useState("");
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [stats, setStats] = useState({ turns: 0, words: 0, fixes: 0 });
  const recRef = useRef<SR | null>(null);
  const finalRef = useRef("");
  const scroller = useRef<HTMLDivElement>(null);
  const levels = useMicLevel(listening);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, interim, thinking]);

  const send = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t) return;
      const next = [...messages, { role: "user" as const, content: t }];
      setMessages(next);
      setThinking(true);
      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "conversation", messages: next, scenario: scenario.title, source: "voice" }),
        });
        const data = await res.json();
        const reply = String(data.reply ?? "Sorry, could you say that again?");
        setMessages((m) => [...m, { role: "assistant", content: reply }]);
        setStats((s) => ({ turns: s.turns + 1, words: s.words + t.split(/\s+/).length, fixes: s.fixes + (data.corrections?.length ?? 0) }));
        notifyXp(data.xp, "Speaking turn");
        if (autoSpeak) {
          setSpeaking(true);
          speak(reply, accent, 1, () => setSpeaking(false));
        }
      } finally {
        setThinking(false);
      }
    },
    [messages, scenario, accent, autoSpeak],
  );

  function toggleMic() {
    const Ctor = getSR();
    if (!Ctor) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    window.speechSynthesis?.cancel();
    const rec = new Ctor();
    rec.lang = accent;
    rec.continuous = true;
    rec.interimResults = true;
    finalRef.current = "";
    rec.onresult = (e) => {
      let inter = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current += r[0].transcript + " ";
        else inter += r[0].transcript;
      }
      setInterim((finalRef.current + inter).trim());
    };
    rec.onend = () => {
      setListening(false);
      const said = finalRef.current.trim() || interim;
      setInterim("");
      if (said) send(said);
    };
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  function pickScenario(s: (typeof SPEAKING_SCENARIOS)[number]) {
    setScenario(s);
    setMessages([{ role: "assistant", content: s.opener }]);
    setStats({ turns: 0, words: 0, fixes: 0 });
    if (autoSpeak) speak(s.opener, accent);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr_260px]">
      <aside className="space-y-2">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">Scenarios</p>
        {SPEAKING_SCENARIOS.map((s) => (
          <button key={s.id} onClick={() => pickScenario(s)} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${scenario.id === s.id ? "bg-ink text-white shadow-lg" : "bg-white ring-1 ring-black/5 hover:-translate-y-0.5"}`}>
            <span className="text-xl">{s.icon}</span>{s.title}
          </button>
        ))}
      </aside>

      <div className="flex h-[640px] flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
        <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto p-5">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : ""}`}>
              <div className={`animate-toast max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5 ${m.role === "user" ? "rounded-br-sm bg-ink text-white" : "rounded-bl-sm bg-paper"}`}>
                {m.content}
                {m.role === "assistant" && (
                  <button onClick={() => speak(m.content, accent)} className="ml-2 align-middle text-xs opacity-60 hover:opacity-100" title="Play">🔊</button>
                )}
              </div>
            </div>
          ))}
          {interim && <div className="flex justify-end"><div className="max-w-[80%] rounded-2xl rounded-br-sm bg-ink/60 px-4 py-2.5 italic text-white">{interim}…</div></div>}
          {thinking && <div className="w-fit rounded-2xl bg-paper px-4 py-3 text-sm text-muted">Wordy is thinking…</div>}
        </div>
        <div className="border-t border-black/5 bg-gradient-to-b from-white to-cream p-5">
          {speaking ? (
            <div className="flex h-20 items-center justify-center gap-1">
              {Array.from({ length: 32 }).map((_, i) => (
                <span key={i} className="wave-bar w-1.5 rounded-full bg-gradient-to-t from-violet-500 to-sky-400" style={{ height: `${30 + ((i * 53) % 70)}%`, animationDelay: `${(i % 8) * 0.09}s` }} />
              ))}
            </div>
          ) : (
            <Visualizer levels={levels} />
          )}
          <div className="mt-3 flex items-center justify-center gap-4">
            {supported && (
              <button
                onClick={toggleMic}
                className={`relative grid h-20 w-20 place-items-center rounded-full text-3xl text-white shadow-xl transition ${listening ? "scale-110 bg-brand" : "bg-ink hover:scale-105"}`}
                aria-label={listening ? "Stop" : "Speak"}
              >
                {listening && <span className="absolute inset-0 animate-ping rounded-full bg-brand/40" />}
                {listening ? "■" : "🎤"}
              </button>
            )}
          </div>
          <p className="mt-2 text-center text-xs text-muted">{listening ? "Listening… tap to send" : supported ? "Tap the mic and speak" : "Type below"}</p>
          <form onSubmit={(e) => { e.preventDefault(); send(typed); setTyped(""); }} className="mt-3 flex gap-2">
            <input value={typed} onChange={(e) => setTyped(e.target.value)} className="input !rounded-full !py-2" placeholder="…or type your reply" />
            <button className="btn-primary !py-2" disabled={!typed.trim()}>Send</button>
          </form>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl bg-ink p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">Session stats</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[["Turns", stats.turns], ["Words", stats.words], ["Fixes", stats.fixes]].map(([k, v]) => (
              <div key={k as string}><p className="font-display text-3xl font-bold">{v}</p><p className="text-[11px] text-white/60">{k}</p></div>
            ))}
          </div>
        </div>
        <label className="flex items-center justify-between rounded-2xl bg-white p-4 text-sm ring-1 ring-black/5">
          🔊 Read replies aloud
          <input type="checkbox" checked={autoSpeak} onChange={(e) => setAutoSpeak(e.target.checked)} className="h-5 w-5 accent-brand" />
        </label>
        <div className="rounded-3xl bg-white p-5 text-sm ring-1 ring-black/5">
          <p className="font-semibold">Pro tips</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            <li>Aim for 2–3 sentences per turn</li>
            <li>Watch for the 💡 quick fixes</li>
            <li>Switch accents to train your ear</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function Drill({ accent, supported }: { accent: string; supported: boolean }) {
  const [idx, setIdx] = useState(0);
  const [listening, setListening] = useState(false);
  const [said, setSaid] = useState("");
  const [result, setResult] = useState<ReturnType<typeof scoreWords> | null>(null);
  const [best, setBest] = useState<Record<number, number>>({});
  const levels = useMicLevel(listening);
  const sentence = PRONUNCIATION_SENTENCES[idx];

  function record() {
    const Ctor = getSR();
    if (!Ctor || listening) return;
    window.speechSynthesis?.cancel();
    const rec = new Ctor();
    rec.lang = accent;
    rec.continuous = false;
    rec.interimResults = true;
    let finalText = "";
    rec.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      finalText = t;
      setSaid(t);
    };
    rec.onend = () => {
      setListening(false);
      if (!finalText) return;
      const r = scoreWords(sentence, finalText);
      setResult(r);
      setBest((b) => ({ ...b, [idx]: Math.max(b[idx] ?? 0, r.score) }));
      earnXp("pronunciation", { score: r.score, meta: `${r.score}%` }, `Pronunciation ${r.score}%`);
    };
    rec.onerror = () => setListening(false);
    setSaid("");
    setResult(null);
    rec.start();
    setListening(true);
  }

  const color = !result ? "" : result.score >= 90 ? "text-emerald-600" : result.score >= 60 ? "text-gold" : "text-brand";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between text-sm text-muted">
          <span>Sentence {idx + 1} / {PRONUNCIATION_SENTENCES.length}</span>
          <div className="flex gap-2">
            <button onClick={() => { setIdx((i) => (i - 1 + PRONUNCIATION_SENTENCES.length) % PRONUNCIATION_SENTENCES.length); setResult(null); setSaid(""); }} className="rounded-full bg-paper px-3 py-1">←</button>
            <button onClick={() => { setIdx((i) => (i + 1) % PRONUNCIATION_SENTENCES.length); setResult(null); setSaid(""); }} className="rounded-full bg-paper px-3 py-1">→</button>
          </div>
        </div>
        <p className="mt-6 text-center font-display text-3xl font-bold leading-snug md:text-4xl">
          {result
            ? result.words.map((w, i) => (
                <span key={i} className={`mr-2 inline-block rounded px-1 transition ${w.ok ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700 underline decoration-wavy"}`}>{w.w}</span>
              ))
            : sentence}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => speak(sentence, accent, 0.95)} className="btn-ghost text-sm">🔊 Listen</button>
          <button onClick={() => speak(sentence, accent, 0.6)} className="btn-ghost text-sm">🐢 Slow</button>
        </div>
        <Visualizer levels={levels} />
        <div className="flex flex-col items-center">
          <button
            onClick={record}
            disabled={!supported}
            className={`relative grid h-24 w-24 place-items-center rounded-full text-4xl text-white shadow-xl transition disabled:opacity-40 ${listening ? "scale-110 bg-brand" : "bg-ink hover:scale-105"}`}
          >
            {listening && <span className="absolute inset-0 animate-ping rounded-full bg-brand/40" />}🎤
          </button>
          <p className="mt-2 text-sm text-muted">{listening ? "Speak now…" : "Tap and read the sentence aloud"}</p>
          {said && <p className="mt-3 text-center text-sm italic text-muted">Heard: “{said}”</p>}
        </div>
        {result && (
          <div className="animate-toast mt-6 text-center">
            <p className={`animate-pop font-display text-7xl font-bold ${color}`}>{result.score}%</p>
            <p className="text-muted">{result.score >= 90 ? "Native-like! 🌟" : result.score >= 60 ? "Nice — polish the red words." : "Keep practising — try the slow version first."}</p>
          </div>
        )}
      </div>
      <aside className="rounded-3xl bg-white p-5 ring-1 ring-black/5">
        <p className="font-display text-lg font-bold">Your best scores</p>
        <ul className="mt-3 space-y-2">
          {PRONUNCIATION_SENTENCES.map((s, i) => (
            <li key={i}>
              <button onClick={() => { setIdx(i); setResult(null); setSaid(""); }} className={`w-full rounded-xl p-2 text-left text-xs ${i === idx ? "bg-paper" : "hover:bg-paper/60"}`}>
                <span className="line-clamp-1">{s}</span>
                <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-black/5">
                  <span className="block h-full rounded-full bg-gradient-to-r from-brand to-emerald-500" style={{ width: `${best[i] ?? 0}%` }} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
