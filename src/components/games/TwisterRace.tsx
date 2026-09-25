"use client";

import { useEffect, useRef, useState } from "react";
import { TWISTERS } from "@/lib/games";
import { Confetti, GameShell, Stat, submitScore } from "./shared";

export default function TwisterRace() {
  const [target, setTarget] = useState("");
  const [typed, setTyped] = useState("");
  const [startAt, setStartAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [result, setResult] = useState<null | { wpm: number; acc: number; ms: number; score: number }>(null);
  const [best, setBest] = useState(0);
  const input = useRef<HTMLTextAreaElement>(null);

  const pick = () => {
    let t = TWISTERS[Math.floor(Math.random() * TWISTERS.length)];
    if (t === target) t = TWISTERS[(TWISTERS.indexOf(t) + 1) % TWISTERS.length];
    setTarget(t);
    setTyped("");
    setStartAt(null);
    setResult(null);
    setTimeout(() => input.current?.focus(), 30);
  };
  useEffect(() => {
    pick();
    setBest(Number(localStorage.getItem("wec:twister-best") || 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!startAt || result) return;
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [startAt, result]);

  function onChange(v: string) {
    if (result) return;
    if (!startAt && v.length) { setStartAt(Date.now()); setNow(Date.now()); }
    const val = v.slice(0, target.length + 5);
    setTyped(val);
    if (val.length >= target.length) finish(val);
  }

  function finish(val: string) {
    const ms = Date.now() - (startAt ?? Date.now());
    let correct = 0;
    for (let i = 0; i < target.length; i++) if (val[i] === target[i]) correct++;
    const acc = Math.round((correct / target.length) * 100);
    const wpm = Math.round((target.length / 5) / Math.max(ms / 60000, 0.001));
    const score = Math.min(3000, Math.round(wpm * acc * 0.4 * (acc >= 90 ? 1.25 : 1)));
    setResult({ wpm, acc, ms, score });
    submitScore("twister", score, ms, acc >= 85, `${wpm}wpm ${acc}%`);
    if (score > best) { setBest(score); localStorage.setItem("wec:twister-best", String(score)); }
  }

  const elapsed = startAt ? ((result ? result.ms : now - startAt) / 1000).toFixed(1) : "0.0";
  const liveErrors = typed.split("").filter((c, i) => c !== target[i]).length;

  return (
    <GameShell title="Tongue Twister Race" icon="👅" gradient="from-pink-500 via-rose-500 to-red-500" stats={<><Stat label="Seconds" value={elapsed} /><Stat label="Errors" value={liveErrors} /><Stat label="Best" value={best} /></>}>
      {result && result.acc >= 95 && <Confetti />}
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
          <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">Type this as fast as you can</p>
          <p className="mt-4 font-display text-3xl leading-relaxed md:text-4xl" onClick={() => input.current?.focus()}>
            {target.split("").map((ch, i) => {
              const t = typed[i];
              const cls = t == null ? (i === typed.length ? "bg-rose-200 rounded" : "text-ink/40") : t === ch ? "text-emerald-600" : "bg-rose-500 text-white rounded";
              return <span key={i} className={`transition-colors ${cls}`}>{ch}</span>;
            })}
          </p>
          <textarea
            ref={input}
            value={typed}
            onChange={(e) => onChange(e.target.value)}
            disabled={!!result}
            rows={2}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            onPaste={(e) => e.preventDefault()}
            className="input mt-6 font-mono"
            placeholder="Start typing — the timer begins with your first key…"
          />
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper">
            <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-red-500 transition-all" style={{ width: `${Math.min(100, (typed.length / Math.max(1, target.length)) * 100)}%` }} />
          </div>
          <div className="mt-4 flex justify-between">
            <button onClick={pick} className="btn-ghost !py-2 text-sm">↻ New twister</button>
            <button onClick={() => { const u = new SpeechSynthesisUtterance(target); u.lang = "en-GB"; u.rate = 0.9; window.speechSynthesis?.speak(u); }} className="btn-ghost !py-2 text-sm">🔊 Hear it</button>
          </div>
        </div>
        {result && (
          <div className="animate-toast mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[["WPM", result.wpm], ["Accuracy", `${result.acc}%`], ["Time", `${(result.ms / 1000).toFixed(1)}s`], ["Score", result.score]].map(([k, v]) => (
              <div key={k as string} className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-black/5">
                <p className="animate-pop font-display text-3xl font-bold text-rose-600">{v}</p>
                <p className="text-xs uppercase tracking-widest text-muted">{k}</p>
              </div>
            ))}
            <div className="col-span-full text-center">
              <p className="text-sm text-muted">{result.acc >= 95 ? "Flawless! Now try saying it out loud 3× fast 😄" : result.acc >= 85 ? "Nice! Aim for 95%+ accuracy for a confetti bonus." : "Slow down a little — accuracy matters more than speed."}</p>
              <button onClick={pick} className="btn-primary mt-4">Next twister →</button>
            </div>
          </div>
        )}
      </div>
    </GameShell>
  );
}
