"use client";

import { useEffect, useRef, useState } from "react";
import { SCRAMBLE_WORDS, scramble, shuffleWith } from "@/lib/games";
import { Confetti, GameShell, Stat, submitScore } from "./shared";

const ROUND = 60;

export default function Scramble() {
  const [phase, setPhase] = useState<"idle" | "play" | "over">("idle");
  const [queue, setQueue] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState("");
  const [guess, setGuess] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [solved, setSolved] = useState<string[]>([]);
  const [left, setLeft] = useState(ROUND);
  const [flash, setFlash] = useState<"ok" | "bad" | null>(null);
  const [best, setBest] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const startedAt = useRef(0);

  useEffect(() => setBest(Number(localStorage.getItem("wec:scramble-best") || 0)), []);

  useEffect(() => {
    if (phase !== "play") return;
    if (left <= 0) {
      setPhase("over");
      const won = score > 0;
      submitScore("scramble", score, Date.now() - startedAt.current, won, `${solved.length} words`);
      if (score > best) { setBest(score); localStorage.setItem("wec:scramble-best", String(score)); }
      return;
    }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, phase, score, solved.length, best]);

  function start() {
    const q = shuffleWith(SCRAMBLE_WORDS, Math.random);
    setQueue(q);
    setIdx(0);
    setShown(scramble(q[0]));
    setScore(0);
    setStreak(0);
    setSolved([]);
    setLeft(ROUND);
    setGuess("");
    setPhase("play");
    startedAt.current = Date.now();
    setTimeout(() => input.current?.focus(), 30);
  }

  function next(skip = false) {
    const i = idx + 1;
    setIdx(i);
    setShown(scramble(queue[i % queue.length]));
    setGuess("");
    if (skip) { setStreak(0); setLeft((l) => Math.max(1, l - 3)); }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const word = queue[idx % queue.length];
    if (guess.trim().toLowerCase() === word) {
      const gain = word.length * 10 + streak * 15;
      setScore((s) => s + gain);
      setStreak((s) => s + 1);
      setSolved((s) => [...s, word]);
      setLeft((l) => l + 3);
      setFlash("ok");
      next();
    } else {
      setFlash("bad");
      setStreak(0);
    }
    setTimeout(() => setFlash(null), 350);
  }

  const word = queue[idx % queue.length] ?? "";

  return (
    <GameShell title="Word Scramble" icon="🔀" gradient="from-amber-400 via-orange-500 to-rose-500" stats={<><Stat label="Time" value={left} /><Stat label="Score" value={score} /><Stat label="Streak" value={`🔥${streak}`} /><Stat label="Best" value={best} /></>}>
      {phase === "over" && score > best - 1 && score > 0 && <Confetti />}
      <div className="mx-auto max-w-2xl">
        {phase === "idle" && (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
            <p className="text-6xl">🔀</p>
            <h2 className="mt-3 font-display text-3xl font-bold">Unscramble the words!</h2>
            <p className="mt-2 text-muted">{ROUND} seconds. Each correct word gives +3 seconds. Streaks multiply your points. Skipping costs 3 seconds.</p>
            <button onClick={start} className="btn-primary mt-8 !px-10 !py-4 text-lg">Start ▶</button>
          </div>
        )}
        {phase === "play" && (
          <div className={`rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5 transition ${flash === "ok" ? "ring-4 ring-emerald-400" : flash === "bad" ? "animate-[pop_.3s] ring-4 ring-rose-400" : ""}`}>
            <div className="h-2 overflow-hidden rounded-full bg-paper">
              <div className={`h-full rounded-full transition-all duration-1000 ease-linear ${left <= 10 ? "bg-brand" : "bg-gold"}`} style={{ width: `${Math.min(100, (left / ROUND) * 100)}%` }} />
            </div>
            <div key={shown} className="mt-8 flex flex-wrap justify-center gap-2">
              {shown.split("").map((ch, i) => (
                <span key={i} className="animate-toast grid h-14 w-12 place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-orange-500 font-display text-3xl font-bold uppercase text-white shadow-lg" style={{ animationDelay: `${i * 40}ms` }}>
                  {ch}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">{word.length} letters · starts with <strong>{word[0]?.toUpperCase()}</strong></p>
            <form onSubmit={submit} className="mx-auto mt-6 flex max-w-sm gap-2">
              <input ref={input} value={guess} onChange={(e) => setGuess(e.target.value)} autoComplete="off" autoCapitalize="off" spellCheck={false} className="input text-center text-lg font-bold uppercase tracking-widest" placeholder="your answer" />
              <button className="btn-primary">↵</button>
            </form>
            <button onClick={() => next(true)} className="mt-3 text-sm font-semibold text-muted hover:text-ink">Skip (−3s)</button>
          </div>
        )}
        {phase === "over" && (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
            <p className="text-6xl">{score >= best && score > 0 ? "🏆" : "⏰"}</p>
            <h2 className="mt-3 font-display text-3xl font-bold">Time&apos;s up!</h2>
            <p className="animate-pop mt-3 font-display text-6xl font-bold text-orange-500">{score}</p>
            <p className="text-muted">{solved.length} words solved{score >= best && score > 0 ? " · new personal best!" : ""}</p>
            {solved.length > 0 && <div className="mt-5 flex flex-wrap justify-center gap-1.5">{solved.map((w, i) => <span key={i} className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">{w}</span>)}</div>}
            <p className="mt-4 text-sm text-muted">The last word was <strong>{word}</strong>.</p>
            <button onClick={start} className="btn-primary mt-8">Play again ↻</button>
          </div>
        )}
      </div>
    </GameShell>
  );
}
