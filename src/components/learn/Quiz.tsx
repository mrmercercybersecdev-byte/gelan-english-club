"use client";

import { useEffect, useMemo, useState } from "react";
import type { Question } from "@/lib/quizzes";
import { earnXp } from "@/lib/client-xp";

const PER_Q = 25;

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Confetti() {
  const pieces = useMemo(
    () => Array.from({ length: 60 }, (_, i) => ({ i, left: Math.random() * 100, delay: Math.random() * 0.6, color: ["#b8322a", "#d9a441", "#1f2d4a", "#10b981", "#8b5cf6"][i % 5], rot: Math.random() * 360 })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{`@keyframes fall{to{transform:translateY(520px) rotate(720deg);opacity:0}}`}</style>
      {pieces.map((p) => (
        <span key={p.i} className="absolute top-0 h-3 w-2 rounded-sm" style={{ left: `${p.left}%`, background: p.color, transform: `rotate(${p.rot}deg)`, animation: `fall 2.2s ${p.delay}s ease-in forwards` }} />
      ))}
    </div>
  );
}

export default function Quiz({ questions, trackId }: { questions: Question[]; trackId: string }) {
  const [order, setOrder] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [time, setTime] = useState(PER_Q);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  const q = order[idx];

  useEffect(() => {
    if (!started || done || picked !== null) return;
    if (time <= 0) {
      setPicked(-1);
      setCombo(0);
      return;
    }
    const t = setTimeout(() => setTime((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [time, started, done, picked]);

  function start() {
    setOrder(shuffle(questions));
    setIdx(0);
    setScore(0);
    setCombo(0);
    setPicked(null);
    setTime(PER_Q);
    setDone(false);
    setStarted(true);
  }

  function choose(i: number) {
    if (picked !== null || !q) return;
    setPicked(i);
    if (i === q.answer) {
      setScore((s) => s + 1);
      setCombo((c) => c + 1);
      earnXp("quiz_correct", { meta: trackId }, combo >= 2 ? `🔥 Combo x${combo + 1}!` : "Correct answer");
    } else setCombo(0);
  }

  function next() {
    if (idx + 1 >= order.length) {
      setDone(true);
      earnXp("quiz_complete", { meta: `${trackId}:${score}/${order.length}` }, `Quiz complete: ${score}/${order.length}`);
      return;
    }
    setIdx((i) => i + 1);
    setPicked(null);
    setTime(PER_Q);
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
        <p className="text-6xl">⏱️</p>
        <h2 className="mt-4 font-display text-3xl font-bold">Timed challenge</h2>
        <p className="mt-2 text-muted">{questions.length} questions · {PER_Q} seconds each · build combos for bragging rights.</p>
        <button onClick={start} className="btn-primary mt-8 !px-8 !py-4 text-lg">Start quiz</button>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((score / order.length) * 100);
    return (
      <div className="relative mx-auto max-w-2xl overflow-hidden rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
        {pct >= 70 && <Confetti />}
        <p className="text-6xl">{pct >= 90 ? "🏆" : pct >= 70 ? "🎉" : pct >= 40 ? "💪" : "📚"}</p>
        <h2 className="mt-4 font-display text-4xl font-bold">{score} / {order.length}</h2>
        <p className="mt-1 text-muted">{pct >= 90 ? "Outstanding!" : pct >= 70 ? "Great job!" : pct >= 40 ? "Good effort — keep going!" : "Practice makes perfect."}</p>
        <div className="mx-auto mt-6 h-3 max-w-sm overflow-hidden rounded-full bg-paper">
          <div className="h-full rounded-full bg-gradient-to-r from-brand to-gold transition-all duration-1000" style={{ width: `${pct}%` }} />
        </div>
        <button onClick={start} className="btn-primary mt-8">Play again ↻</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="font-semibold">Question {idx + 1} / {order.length}</span>
        <span className="flex items-center gap-3">
          {combo >= 2 && <span className="animate-pop rounded-full bg-orange-100 px-2 py-0.5 font-bold text-orange-700">🔥 x{combo}</span>}
          <span className="font-semibold">Score {score}</span>
        </span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-white ring-1 ring-black/5">
        <div className={`h-full rounded-full transition-all duration-1000 ease-linear ${time <= 5 ? "bg-brand" : "bg-gold"}`} style={{ width: `${(time / PER_Q) * 100}%` }} />
      </div>
      <div key={idx} className="animate-toast rounded-3xl bg-white p-7 shadow-sm ring-1 ring-black/5">
        <p className="font-display text-2xl font-bold leading-snug">{q.q}</p>
        <div className="mt-6 grid gap-3">
          {q.options.map((o, i) => {
            const state = picked === null ? "idle" : i === q.answer ? "right" : i === picked ? "wrong" : "dim";
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={picked !== null}
                className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-medium transition ${
                  state === "idle" ? "border-black/10 hover:-translate-y-0.5 hover:border-ink" : state === "right" ? "animate-pop border-emerald-500 bg-emerald-50" : state === "wrong" ? "border-rose-500 bg-rose-50" : "border-black/5 opacity-50"
                }`}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-paper text-sm font-bold">{"ABCD"[i]}</span>
                {o}
                {state === "right" && <span className="ml-auto">✅</span>}
                {state === "wrong" && <span className="ml-auto">❌</span>}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <div className="animate-toast mt-5 rounded-2xl bg-paper p-4 text-sm">
            <p className="font-semibold">{picked === -1 ? "⏰ Time's up!" : picked === q.answer ? "✅ Correct!" : "❌ Not quite."}</p>
            <p className="mt-1 text-muted">{q.explain}</p>
            <button onClick={next} className="btn-primary mt-4 !py-2 text-sm">{idx + 1 >= order.length ? "See results" : "Next question →"}</button>
          </div>
        )}
      </div>
    </div>
  );
}
