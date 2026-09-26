"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HANGMAN_WORDS } from "@/lib/games";
import { Confetti, GameShell, Stat, submitScore } from "./shared";
import Icon from "@/components/Icon";

const MAX_WRONG = 7;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function Hangman() {
  const [entry, setEntry] = useState<(typeof HANGMAN_WORDS)[number] | null>(null);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [hint, setHint] = useState(false);
  const [wins, setWins] = useState(0);
  const [streak, setStreak] = useState(0);
  const [startAt, setStartAt] = useState(0);
  const reported = useRef(false);

  const newWord = useCallback(() => {
    setEntry(HANGMAN_WORDS[Math.floor(Math.random() * HANGMAN_WORDS.length)]);
    setGuessed(new Set());
    setHint(false);
    setStartAt(Date.now());
    reported.current = false;
  }, []);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => newWord());
    return () => window.cancelAnimationFrame(frame);
  }, [newWord]);

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
      if (e.key === "Enter" && over && (e.target as HTMLElement)?.tagName !== "BUTTON") newWord();
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [guess, over, newWord]);

  useEffect(() => {
    if (!over || reported.current) return;
    reported.current = true;
    const score = won ? Math.max(50, (MAX_WRONG - wrong) * 100 + word.length * 10 - (hint ? 150 : 0)) : 0;
    queueMicrotask(() => {
      if (won) { setWins((w) => w + 1); setStreak((s) => s + 1); } else setStreak(0);
    });
    submitScore("hangman", Math.min(1000, score), Date.now() - startAt, won, word);
  }, [over, won, wrong, word, hint, startAt]);

  return (
    <GameShell title="Hangman" icon="game" gradient="from-emerald-500 via-teal-600 to-cyan-600" stats={<><Stat label="Guesses left" value={Math.max(0, MAX_WRONG - wrong)} /><Stat label="Wins" value={wins} /><Stat label="Streak" value={streak} /></>}>
      {won && <Confetti />}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-8">
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6" aria-label="Hangman game status">
          <div className="flex items-center gap-3">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${lost ? "bg-rose-100 text-rose-700" : "bg-teal-50 text-teal-700"}`}><Icon name={lost ? "close" : "game"} size={26} /></span>
            <div>
              <h2 className="font-display text-xl font-bold">Guess the word</h2>
              <p className="text-sm text-muted">{Math.max(0, MAX_WRONG - wrong)} of {MAX_WRONG} wrong guesses remaining</p>
            </div>
          </div>
          <div className="mt-5 flex gap-1.5" role="progressbar" aria-label="Wrong guesses used" aria-valuemin={0} aria-valuemax={MAX_WRONG} aria-valuenow={wrong}>
            {Array.from({ length: MAX_WRONG }, (_, i) => (
              <span key={i} className={`h-2 flex-1 rounded-full ${i < wrong ? (lost ? "bg-rose-500" : "bg-amber-500") : "bg-paper"}`} />
            ))}
          </div>
          <p role="status" aria-live="polite" className="mt-3 text-sm text-muted">{wrong === 0 ? "Guess a letter using your keyboard or the on-screen alphabet." : `${wrong} ${wrong === 1 ? "wrong guess" : "wrong guesses"} used.`}</p>
        </section>
        <div className="min-w-0 text-center lg:text-left">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 lg:justify-start">
            {word.split("").map((l, i) => {
              const show = guessed.has(l) || lost;
              return (
                <span key={i} aria-label={show ? l : "hidden letter"} className={`grid h-14 w-8 place-items-end justify-center border-b-4 pb-1 font-display text-3xl font-bold transition sm:w-10 motion-reduce:transition-none ${show ? (guessed.has(l) ? "border-emerald-500 text-ink" : "border-rose-400 text-rose-500") : "border-ink/30 text-transparent"}`}>
                  <span className={show ? "animate-pop motion-reduce:animate-none" : ""}>{l}</span>
                </span>
              );
            })}
          </div>
          <div className="mt-5">
            {hint ? (
              <p className="inline-flex items-center gap-2 rounded-2xl bg-gold/15 px-4 py-2 text-sm"><Icon name="help" size={16} />{entry?.hint}</p>
            ) : (
              <button type="button" disabled={over} onClick={() => setHint(true)} className="inline-flex min-h-10 items-center gap-1.5 px-2 text-sm font-semibold text-teal-700 hover:underline disabled:opacity-40"><Icon name="help" size={16} />Show hint (−150 pts)</button>
            )}
          </div>
          <p className="mt-4 text-sm text-muted">Choose a letter below or type A–Z. Guessed letters are disabled.</p>
          <div role="group" aria-label="Choose a letter" className="mt-4 flex max-w-xl flex-wrap justify-center gap-1.5 lg:justify-start">
            {ALPHABET.map((l) => {
              const used = guessed.has(l);
              const good = used && word.includes(l);
              return (
                <button type="button" key={l} aria-pressed={used} onClick={() => guess(l)} disabled={used || over} className={`h-11 w-10 rounded-xl font-bold shadow-sm transition motion-reduce:transition-none ${good ? "bg-emerald-500 text-white" : used ? "bg-rose-200 text-rose-800 line-through" : "bg-white ring-1 ring-black/10 hover:-translate-y-0.5 hover:bg-teal-50 motion-reduce:transform-none"} disabled:cursor-default`}>
                  {l}
                </button>
              );
            })}
          </div>
          {over && (
            <div role="status" aria-live="assertive" className="animate-toast mt-8 inline-block rounded-3xl bg-white p-6 text-center shadow-lg ring-1 ring-black/5 motion-reduce:animate-none">
              <Icon name={won ? "check" : "close"} size={36} className={`mx-auto ${won ? "text-emerald-600" : "text-rose-600"}`} />
              <p className="mt-2 font-display text-2xl font-bold">{won ? "You got it!" : "Out of guesses!"}</p>
              <p className="text-sm text-muted"><strong>{word}</strong> — {entry?.hint}</p>
              <button type="button" onClick={newWord} className="btn-primary mt-4 inline-flex min-h-11 items-center gap-2"><Icon name="arrow-up-right" size={17} />Next word <span className="text-xs font-normal opacity-75">(Enter)</span></button>
            </div>
          )}
        </div>
      </div>
    </GameShell>
  );
}
