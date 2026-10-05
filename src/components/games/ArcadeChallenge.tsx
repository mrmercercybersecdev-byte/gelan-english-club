"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GameId } from "@/lib/games";
import { ARCADE_CHALLENGES, difficultyTier, type Challenge } from "@/lib/games";
import { Confetti, GameShell, Stat, submitScore } from "./shared";

type Card = Omit<Challenge, "options" | "answer"> & { options: string[]; answer: number };
const TITLES: Partial<Record<GameId, string>> = {
  "idiom-mixup": "Idiom Mix-Up", "punctuation-panic": "Punctuation Panic", "rhyme-time": "Rhyme Time",
  "odd-one-out": "Odd Word Out", "emoji-decoder": "Emoji Decoder", "verb-vortex": "Verb Vortex",
  "plural-panic": "Plural Panic", "polite-or-chaos": "Polite or Chaos?",
};
const ICONS: Partial<Record<GameId, string>> = { "idiom-mixup": "🥣", "punctuation-panic": "🚨", "rhyme-time": "🎤", "odd-one-out": "🕵️", "emoji-decoder": "🕵️‍♀️", "verb-vortex": "🌀", "plural-panic": "🐑", "polite-or-chaos": "🎩" };
const GRADIENTS: Partial<Record<GameId, string>> = {
  "idiom-mixup": "from-fuchsia-500 via-purple-600 to-indigo-600", "punctuation-panic": "from-cyan-500 via-sky-600 to-blue-700",
  "rhyme-time": "from-rose-500 via-pink-600 to-violet-700", "odd-one-out": "from-lime-500 via-emerald-600 to-teal-700",
  "emoji-decoder": "from-yellow-400 via-orange-500 to-red-600", "verb-vortex": "from-blue-500 via-indigo-600 to-violet-700",
  "plural-panic": "from-teal-500 via-emerald-600 to-lime-700", "polite-or-chaos": "from-orange-500 via-amber-600 to-yellow-600",
};

function shuffleQuestion(question: Challenge): Card {
  const options = question.options.map((text, index) => ({ text, correct: index === question.answer }));
  for (let i = options.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [options[i], options[j]] = [options[j], options[i]]; }
  return { ...question, options: options.map((item) => item.text), answer: options.findIndex((item) => item.correct) };
}

export default function ArcadeChallenge({ gameId, level }: { gameId: GameId; level: number }) {
  const tier = difficultyTier(level);
  const set = ARCADE_CHALLENGES[gameId];
  const bank = useMemo(() => set ? [set.easy, ...(tier >= 2 ? [set.medium] : []), ...(tier >= 3 ? [set.hard] : [])].flat() : [], [set, tier]);
  const roundSize = Math.min(10, 4 + tier * 2);
  const seconds = 45 + tier * 15;
  const [phase, setPhase] = useState<"ready" | "playing" | "done">("ready");
  const [deck, setDeck] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(seconds);
  const [feedback, setFeedback] = useState("");
  const [hint, setHint] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [answering, setAnswering] = useState(false);
  const [best, setBest] = useState(0);
  const scoreRef = useRef(0);
  const startedAt = useRef(0);
  const answered = useRef(false);
  const reported = useRef(false);
  const game = ARCADE_CHALLENGES[gameId];
  const active = deck[index];
  const hintsAllowed = level >= 7 ? 2 : level >= 2 ? 1 : 0;

  useEffect(() => { const frame = window.requestAnimationFrame(() => setBest(Number(localStorage.getItem(`wec:best:${gameId}`) || 0))); return () => window.cancelAnimationFrame(frame); }, [gameId]);
  useEffect(() => {
    if (phase !== "playing") return;
    const timer = window.setInterval(() => setLeft((current) => { if (current <= 1) { window.clearInterval(timer); setPhase("done"); return 0; } return current - 1; }), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);
  useEffect(() => {
    if (phase !== "done" || reported.current) return;
    reported.current = true;
    const finalScore = scoreRef.current;
    void submitScore(gameId, finalScore, startedAt.current ? Date.now() - startedAt.current : 0, finalScore > 0, `tier ${tier} · ${Math.floor(finalScore / 100)}/${roundSize}`);
    if (finalScore > best) { setBest(finalScore); localStorage.setItem(`wec:best:${gameId}`, String(finalScore)); }
  }, [phase, gameId, tier, roundSize, best]);

  function start() {
    const pool = [...bank];
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    setDeck(pool.slice(0, roundSize).map(shuffleQuestion)); setIndex(0); setScore(0); scoreRef.current = 0;
    setLeft(seconds); setFeedback(""); setHint(false); setHintsUsed(0); setAnswering(false); answered.current = false; reported.current = false;
    startedAt.current = Date.now(); setPhase("playing");
  }

  function choose(optionIndex: number) {
    if (!active || phase !== "playing" || answered.current) return;
    answered.current = true;
    setAnswering(true);
    const correct = optionIndex === active.answer;
    if (correct) { scoreRef.current += 100; setScore(scoreRef.current); }
    setFeedback(`${correct ? "✅ Correct!" : "🙈 Almost!"} ${active.explain}`);
    window.setTimeout(() => {
      if (index + 1 >= deck.length) setPhase("done");
      else { setIndex((current) => current + 1); setHint(false); setFeedback(""); setAnswering(false); answered.current = false; }
    }, 850);
  }

  if (!game || !bank.length) return null;
  return <GameShell title={TITLES[gameId] ?? "Word challenge"} icon="sparkles" gradient={GRADIENTS[gameId] ?? "from-violet-500 to-indigo-600"} stats={<><Stat label="Level" value={level} /><Stat label="Difficulty" value={tier === 1 ? "Easy" : tier === 2 ? "Tricky" : "Expert"} /><Stat label="Score" value={score} /><Stat label="Best" value={best} /></>}>
    {phase === "done" && score >= 500 && <Confetti />}
    <div className="mx-auto max-w-2xl">
      {phase === "ready" && <section className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5 sm:p-10"><span className="text-5xl" aria-hidden="true">{ICONS[gameId]}</span><h2 className="mt-3 font-display text-3xl font-bold">Ready for {TITLES[gameId]}?</h2><p className="mt-2 text-muted">{roundSize} questions · {seconds} seconds · 100 points per correct answer. Unlock harder questions by levelling up.</p><p className="mt-3 text-sm text-muted">{hintsAllowed ? `You have ${hintsAllowed} clue ${hintsAllowed === 1 ? "hint" : "hints"} this round.` : "Reach level 2 to unlock a hint."}</p><button type="button" onClick={start} className="btn-primary mt-7 min-h-12 !px-10 text-lg">Start round</button></section>}
      {phase === "playing" && active && <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-8">
        <div className="flex items-center justify-between gap-3 text-sm font-semibold"><span>Question {index + 1} / {deck.length}</span><span className={left <= 10 ? "text-rose-700" : "text-muted"}>⏱ {left}s</span></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${left / seconds * 100}%` }} /></div>
        <h2 className="mt-7 font-display text-2xl font-bold leading-snug sm:text-3xl">{active.prompt}</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">{active.options.map((option, optionIndex) => <button key={`${index}-${option}`} type="button" disabled={answering} onClick={() => choose(optionIndex)} className="min-h-14 rounded-2xl border border-black/10 bg-paper/60 px-4 py-3 text-left text-base font-semibold transition hover:border-brand hover:bg-brand/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-60">{option}</button>)}</div>
        {hintsAllowed > hintsUsed && <div className="mt-4"><button type="button" onClick={() => { setHint(true); setHintsUsed((value) => value + 1); }} className="min-h-11 rounded-full px-4 text-sm font-semibold ring-1 ring-black/15">💡 Use a hint ({hintsAllowed - hintsUsed} left)</button>{hint && <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">{active.hint}</p>}</div>}
        <p role="status" aria-live="polite" className="mt-4 min-h-12 text-sm font-semibold text-muted">{feedback}</p>
      </section>}
      {phase === "done" && <section className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5 sm:p-10"><span className="text-5xl" aria-hidden="true">{score >= 500 ? "🏆" : "😅"}</span><h2 className="mt-3 font-display text-3xl font-bold">{score >= 500 ? "Word wizardry!" : "The words fought back."}</h2><p className="mt-3 font-display text-6xl font-bold text-brand">{score}</p><p className="text-muted">{Math.floor(score / 100)} / {deck.length} correct · {score > 0 && score >= best ? "New personal best!" : "Every round is practice."}</p><p className="mt-2 text-sm text-muted">{tier < 3 ? `Reach level ${tier * 2 + 1} for the next difficulty.` : level < 10 ? `Reach level 10 for bonus game XP.` : "Level 10 perk active: 50% bonus XP for a won game."}</p><button type="button" onClick={start} className="btn-primary mt-7 min-h-12 !px-8">Play again</button></section>}
    </div>
  </GameShell>;
}
