"use client";

import { useCallback, useEffect, useState } from "react";
import { HANGMAN_WORDS } from "@/lib/games";
import { Confetti, GameShell, Stat, submitScore } from "./shared";

const MAX_WRONG = 7;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function Drawing({ wrong }: { wrong: number }) {
  const parts = [
    <line key="base" x1="10" y1="190" x2="130" y2="190" />,
    <line key="pole" x1="40" y1="190" x2="40" y2="20" />,
    <line key="beam" x1="40" y1="20" x2="120" y2="20" />,
    <line key="rope" x1="120" y1="20" x2="120" y2="45" />,
    <circle key="head" cx="120" cy="60" r="15" />,
    <line key="body" x1="120" y1="75" x2="120" y2="125" />,
    <g key="limbs"><line x1="120" y1="90" x2="100" y2="110" /><line x1="120" y1="90" x2="140" y2="110" /><line x1="120" y1="125" x2="105" y2="155" /><line x1="120" y1="125" x2="135" y2="155" /></g>,
  ];
  return (
    <svg viewBox="0 0 160 200" className="h-64 w-52" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
      {parts.map((p, i) => (
        <g key={i} className="transition-all duration-500" style={{ opacity: i < wrong ? 1 : 0.08, stroke: i < wrong ? (wrong >= MAX_WRONG ? "#b8322a" : "#1d1b18") : "#1d1b18" }}>{p}</g>
      ))}
    </svg>
  );
}

export default function Hangman() {
  const [entry, setEntry] = useState<(typeof HANGMAN_WORDS)[number] | null>(null);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [hint, setHint] = useState(false);
  const [wins, setWins] = useState(0);
  const [streak, setStreak] = useState(0);
  const [startAt, setStartAt] = useState(0);
  const [reported, setReported] = useState(false);

  const newWord = useCallback(() => {
    setEntry(HANGMAN_WORDS[Math.floor(Math.random() * HANGMAN_WORDS.length)]);
    setGuessed(new Set());
    setHint(false);
    setStartAt(Date.now());
    setReported(false);
  }, []);
  useEffect(() => newWord(), [newWord]);

  const word = entry?.word ?? "";
  const wrong = [...guessed].filter((l) => !word.includes(l)).length;
  const won = !!word && word.split("").every((l) => guessed.has(l));
  const lost = wrong >= MAX_WRONG;
  const over = won || lost;

  const guess = useCallback(
    (l: string) => {
      if (over || guessed.has(l)) return;
      setGuessed((g) => new Set(g).add(l));
    },
    [over, guessed],
  );

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || (e.target as HTMLElement)?.tagName === "INPUT") return;
      const k = e.key.toUpperCase();
      if (/^[A-Z]$/.test(k)) guess(k);
      if (e.key === "Enter" && over) newWord();
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [guess, over, newWord]);

  useEffect(() => {
    if (!over || reported) return;
    setReported(true);
    const score = won ? Math.max(50, (MAX_WRONG - wrong) * 100 + word.length * 10 - (hint ? 150 : 0)) : 0;
    if (won) { setWins((w) => w + 1); setStreak((s) => s + 1); } else setStreak(0);
    submitScore("hangman", Math.min(1000, score), Date.now() - startAt, won, word);
  }, [over, reported, won, wrong, word, hint, startAt]);

  return (
    <GameShell title="Hangman" icon="🪢" gradient="from-emerald-500 via-teal-600 to-cyan-600" stats={<><Stat label="Lives" value={"❤️".repeat(Math.max(0, MAX_WRONG - wrong)) || "💀"} /><Stat label="Wins" value={wins} /><Stat label="Streak" value={`🔥${streak}`} /></>}>
      {won && <Confetti />}
      <div className="grid items-center gap-8 lg:grid-cols-[auto_1fr]">
        <div className={`mx-auto rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 ${lost ? "animate-[pop_.4s]" : ""}`}>
          <Drawing wrong={wrong} />
        </div>
        <div className="text-center lg:text-left">
          <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
            {word.split("").map((l, i) => {
              const show = guessed.has(l) || lost;
              return (
                <span key={i} className={`grid h-14 w-10 place-items-end justify-center border-b-4 pb-1 font-display text-3xl font-bold transition ${show ? (guessed.has(l) ? "border-emerald-500 text-ink" : "border-rose-400 text-rose-500") : "border-ink/30 text-transparent"}`}>
                  <span className={show ? "animate-pop" : ""}>{l}</span>
                </span>
              );
            })}
          </div>
          <div className="mt-5">
            {hint ? (
              <p className="inline-block rounded-2xl bg-gold/15 px-4 py-2 text-sm">💡 {entry?.hint}</p>
            ) : (
              <button disabled={over} onClick={() => setHint(true)} className="text-sm font-semibold text-teal-700 hover:underline disabled:opacity-40">💡 Show hint (−150 pts)</button>
            )}
          </div>
          <div className="mt-6 flex max-w-xl flex-wrap justify-center gap-1.5 lg:justify-start">
            {ALPHABET.map((l) => {
              const used = guessed.has(l);
              const good = used && word.includes(l);
              return (
                <button key={l} onClick={() => guess(l)} disabled={used || over} className={`h-11 w-10 rounded-xl font-bold shadow-sm transition ${good ? "bg-emerald-500 text-white" : used ? "bg-rose-200 text-rose-800 line-through" : "bg-white ring-1 ring-black/10 hover:-translate-y-0.5 hover:bg-teal-50"} disabled:cursor-default`}>
                  {l}
                </button>
              );
            })}
          </div>
          {over && (
            <div className="animate-toast mt-8 inline-block rounded-3xl bg-white p-6 text-center shadow-lg ring-1 ring-black/5">
              <p className="text-4xl">{won ? "🎉" : "💀"}</p>
              <p className="mt-2 font-display text-2xl font-bold">{won ? "You got it!" : "Out of lives!"}</p>
              <p className="text-sm text-muted"><strong>{word}</strong> — {entry?.hint}</p>
              <button onClick={newWord} className="btn-primary mt-4">Next word ↵</button>
            </div>
          )}
        </div>
      </div>
    </GameShell>
  );
}
