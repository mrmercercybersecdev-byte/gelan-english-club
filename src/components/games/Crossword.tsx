"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generateCrossword, type Crossword as CW, type Placed } from "@/lib/games";
import { Confetti, GameShell, Stat, fmtTime, submitScore } from "./shared";

type Dir = "across" | "down";
const KEYS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

export default function Crossword() {
  const [seed, setSeed] = useState<number | null>(null);
  const [cw, setCw] = useState<CW | null>(null);
  const [fill, setFill] = useState<string[][]>([]);
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [sel, setSel] = useState<{ r: number; c: number; dir: Dir }>({ r: 0, c: 0, dir: "across" });
  const [start, setStart] = useState(0);
  const [now, setNow] = useState(0);
  const [done, setDone] = useState<null | { score: number; ms: number }>(null);
  const [penalty, setPenalty] = useState(0);
  const [modal, setModal] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const newGame = useCallback((s?: number) => {
    const sd = s ?? Math.floor(Math.random() * 1e9);
    const c = generateCrossword(sd, 10);
    setSeed(sd);
    setCw(c);
    setFill(c.grid.map((row) => row.map(() => "")));
    setWrong(new Set());
    setRevealed(new Set());
    setPenalty(0);
    setDone(null);
    setModal(false);
    const first = c.words.find((w) => w.num === 1) ?? c.words[0];
    setSel({ r: first.row, c: first.col, dir: first.dir });
    setStart(Date.now());
    setNow(Date.now());
    setTimeout(() => boardRef.current?.focus(), 50);
  }, []);

  useEffect(() => newGame(), [newGame]);
  useEffect(() => {
    if (done || !start) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [done, start]);

  const numbers = useMemo(() => {
    const m = new Map<string, number>();
    cw?.words.forEach((w) => m.set(`${w.row},${w.col}`, w.num));
    return m;
  }, [cw]);

  const cellsOf = (w: Placed) => Array.from({ length: w.word.length }, (_, i) => (w.dir === "across" ? [w.row, w.col + i] : [w.row + i, w.col]) as [number, number]);

  const wordAt = useCallback(
    (r: number, c: number, dir: Dir) => cw?.words.find((w) => w.dir === dir && cellsOf(w).some(([rr, cc]) => rr === r && cc === c)),
    [cw],
  );
  const activeWord = cw ? wordAt(sel.r, sel.c, sel.dir) ?? wordAt(sel.r, sel.c, sel.dir === "across" ? "down" : "across") : undefined;
  const activeCells = new Set(activeWord ? cellsOf(activeWord).map(([r, c]) => `${r},${c}`) : []);

  const isCell = (r: number, c: number) => !!cw?.grid[r]?.[c];

  const checkComplete = useCallback(
    (f: string[][]) => {
      if (!cw) return;
      for (let r = 0; r < cw.rows; r++) for (let c = 0; c < cw.cols; c++) if (cw.grid[r][c] && f[r][c] !== cw.grid[r][c]) return;
      const ms = Date.now() - start;
      const score = Math.max(100, Math.round(2000 - ms / 1000 * 2 - penalty));
      setDone({ score, ms });
      setModal(true);
      submitScore("crossword", score, ms, true, `seed:${seed}`);
    },
    [cw, start, penalty, seed],
  );

  const move = (dr: number, dc: number) => {
    if (!cw) return;
    let r = sel.r + dr, c = sel.c + dc;
    while (r >= 0 && c >= 0 && r < cw.rows && c < cw.cols) {
      if (isCell(r, c)) return setSel((s) => ({ ...s, r, c }));
      r += dr; c += dc;
    }
  };

  const typeLetter = (ch: string) => {
    if (!cw || done) return;
    const k = `${sel.r},${sel.c}`;
    if (revealed.has(k)) return advance();
    const f = fill.map((row) => [...row]);
    f[sel.r][sel.c] = ch;
    setFill(f);
    setWrong((w) => { const n = new Set(w); n.delete(k); return n; });
    advance();
    checkComplete(f);
  };

  const advance = () => {
    const dr = sel.dir === "down" ? 1 : 0, dc = sel.dir === "across" ? 1 : 0;
    if (isCell(sel.r + dr, sel.c + dc)) setSel((s) => ({ ...s, r: s.r + dr, c: s.c + dc }));
  };

  const backspace = () => {
    if (!cw || done) return;
    const f = fill.map((row) => [...row]);
    const k = `${sel.r},${sel.c}`;
    if (f[sel.r][sel.c] && !revealed.has(k)) {
      f[sel.r][sel.c] = "";
      setFill(f);
      return;
    }
    const dr = sel.dir === "down" ? 1 : 0, dc = sel.dir === "across" ? 1 : 0;
    const pr = sel.r - dr, pc = sel.c - dc;
    if (isCell(pr, pc)) {
      if (!revealed.has(`${pr},${pc}`)) f[pr][pc] = "";
      setFill(f);
      setSel((s) => ({ ...s, r: pr, c: pc }));
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (/^[a-zA-Z]$/.test(k)) { e.preventDefault(); typeLetter(k.toUpperCase()); }
    else if (k === "Backspace") { e.preventDefault(); backspace(); }
    else if (k === "ArrowRight") { e.preventDefault(); sel.dir === "across" ? move(0, 1) : setSel((s) => ({ ...s, dir: "across" })); }
    else if (k === "ArrowLeft") { e.preventDefault(); sel.dir === "across" ? move(0, -1) : setSel((s) => ({ ...s, dir: "across" })); }
    else if (k === "ArrowDown") { e.preventDefault(); sel.dir === "down" ? move(1, 0) : setSel((s) => ({ ...s, dir: "down" })); }
    else if (k === "ArrowUp") { e.preventDefault(); sel.dir === "down" ? move(-1, 0) : setSel((s) => ({ ...s, dir: "down" })); }
    else if (k === " " || k === "Tab") { e.preventDefault(); jumpWord(e.shiftKey ? -1 : 1); }
  };

  const ordered = useMemo(() => (cw ? [...cw.words].sort((a, b) => (a.dir === b.dir ? a.num - b.num : a.dir === "across" ? -1 : 1)) : []), [cw]);
  const jumpWord = (d: number) => {
    if (!activeWord) return;
    const i = ordered.indexOf(activeWord);
    const w = ordered[(i + d + ordered.length) % ordered.length];
    setSel({ r: w.row, c: w.col, dir: w.dir });
  };

  const clickCell = (r: number, c: number) => {
    if (!isCell(r, c)) return;
    if (r === sel.r && c === sel.c) {
      const other: Dir = sel.dir === "across" ? "down" : "across";
      if (wordAt(r, c, other)) setSel({ r, c, dir: other });
    } else {
      const dir = wordAt(r, c, sel.dir) ? sel.dir : sel.dir === "across" ? "down" : "across";
      setSel({ r, c, dir });
    }
    boardRef.current?.focus();
  };

  const check = () => {
    if (!cw) return;
    const w = new Set<string>();
    for (let r = 0; r < cw.rows; r++) for (let c = 0; c < cw.cols; c++) if (cw.grid[r][c] && fill[r][c] && fill[r][c] !== cw.grid[r][c]) w.add(`${r},${c}`);
    setWrong(w);
    setPenalty((p) => p + 40);
  };
  const revealLetter = () => {
    if (!cw || done) return;
    const f = fill.map((row) => [...row]);
    f[sel.r][sel.c] = cw.grid[sel.r][sel.c] ?? "";
    setFill(f);
    setRevealed((s) => new Set(s).add(`${sel.r},${sel.c}`));
    setPenalty((p) => p + 100);
    advance();
    checkComplete(f);
  };
  const revealWord = () => {
    if (!cw || !activeWord || done) return;
    const f = fill.map((row) => [...row]);
    const rv = new Set(revealed);
    cellsOf(activeWord).forEach(([r, c]) => { f[r][c] = cw.grid[r][c] ?? ""; rv.add(`${r},${c}`); });
    setFill(f);
    setRevealed(rv);
    setPenalty((p) => p + 250);
    checkComplete(f);
  };

  const filled = cw ? fill.flat().filter(Boolean).length : 0;
  const total = cw ? cw.grid.flat().filter(Boolean).length : 1;
  const elapsed = done ? done.ms : now - start;
  const cellSize = cw ? Math.max(28, Math.min(44, Math.floor(560 / Math.max(cw.cols, cw.rows)))) : 40;

  return (
    <GameShell
      title="Crossword"
      icon="🧩"
      gradient="from-indigo-500 via-violet-600 to-fuchsia-600"
      stats={<><Stat label="Time" value={fmtTime(Math.max(0, elapsed))} /><Stat label="Filled" value={`${Math.round((filled / total) * 100)}%`} /><Stat label="Penalty" value={penalty} /></>}
    >
      {done && modal && <Confetti />}
      {!cw ? (
        <div className="shimmer h-96 rounded-3xl bg-white" />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[auto_1fr]">
          <div>
            {activeWord && (
              <div className="mb-3 rounded-2xl bg-ink px-4 py-3 text-white">
                <span className="mr-2 rounded bg-white/15 px-2 py-0.5 text-xs font-bold">{activeWord.num} {activeWord.dir.toUpperCase()}</span>
                {activeWord.clue} <span className="text-white/50">({activeWord.word.length})</span>
              </div>
            )}
            <div ref={boardRef} tabIndex={0} onKeyDown={onKey} className="inline-block rounded-2xl bg-ink p-2 shadow-2xl outline-none ring-offset-4 focus:ring-4 focus:ring-violet-400/50">
              <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${cw.cols}, ${cellSize}px)` }}>
                {cw.grid.map((row, r) =>
                  row.map((ch, c) => {
                    const k = `${r},${c}`;
                    if (!ch) return <div key={k} style={{ width: cellSize, height: cellSize }} />;
                    const isSel = sel.r === r && sel.c === c;
                    const inWord = activeCells.has(k);
                    return (
                      <button
                        key={k}
                        onClick={() => clickCell(r, c)}
                        tabIndex={-1}
                        style={{ width: cellSize, height: cellSize }}
                        className={`relative grid place-items-center rounded-[4px] font-display font-bold uppercase transition ${
                          isSel ? "scale-105 bg-gold text-ink shadow-lg" : inWord ? "bg-violet-200 text-ink" : "bg-white text-ink hover:bg-violet-50"
                        } ${wrong.has(k) ? "!bg-rose-300" : ""} ${done ? "animate-pop" : ""}`}
                      >
                        {numbers.has(k) && <span className="absolute left-0.5 top-0 text-[9px] font-bold leading-none text-ink/60">{numbers.get(k)}</span>}
                        <span className={`${revealed.has(k) ? "text-violet-700" : ""}`} style={{ fontSize: cellSize * 0.5 }}>{fill[r]?.[c]}</span>
                      </button>
                    );
                  }),
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={check} className="btn-ghost !py-2 text-sm">✔ Check (+40)</button>
              <button onClick={revealLetter} className="btn-ghost !py-2 text-sm">🔤 Reveal letter (+100)</button>
              <button onClick={revealWord} className="btn-ghost !py-2 text-sm">📖 Reveal word (+250)</button>
              <button onClick={() => newGame()} className="btn-primary !py-2 text-sm">↻ New puzzle</button>
            </div>
            <div className="mt-4 space-y-1.5 lg:hidden">
              {KEYS.map((row) => (
                <div key={row} className="flex justify-center gap-1">
                  {row.split("").map((k) => <button key={k} onClick={() => typeLetter(k)} className="h-10 w-8 rounded-lg bg-white font-bold shadow ring-1 ring-black/10 active:bg-gold">{k}</button>)}
                  {row === "ZXCVBNM" && <button onClick={backspace} className="h-10 rounded-lg bg-white px-3 font-bold shadow ring-1 ring-black/10">⌫</button>}
                </div>
              ))}
            </div>
            <p className="mt-3 hidden text-xs text-muted lg:block">Type to fill · arrows to move · click a cell twice to switch direction · Tab/Space for next clue</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {(["across", "down"] as const).map((d) => (
              <div key={d}>
                <h2 className="font-display text-xl font-bold capitalize">{d}</h2>
                <ul className="mt-2 space-y-1">
                  {cw.words.filter((w) => w.dir === d).sort((a, b) => a.num - b.num).map((w) => {
                    const solved = cellsOf(w).every(([r, c]) => fill[r]?.[c] === cw.grid[r][c]);
                    const on = activeWord === w;
                    return (
                      <li key={`${d}${w.num}`}>
                        <button
                          onClick={() => { setSel({ r: w.row, c: w.col, dir: w.dir }); boardRef.current?.focus(); }}
                          className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${on ? "bg-violet-600 text-white shadow" : "hover:bg-white"} ${solved && !on ? "text-muted line-through" : ""}`}
                        >
                          <strong className="mr-1.5">{w.num}.</strong>{w.clue} <span className="opacity-60">({w.word.length})</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {done && modal && (
        <div className="fixed inset-0 z-[65] grid place-items-center bg-ink/60 p-4 backdrop-blur-sm">
          <div className="animate-toast w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl">
            <p className="text-6xl">🏆</p>
            <h2 className="mt-3 font-display text-3xl font-bold">Puzzle solved!</h2>
            <p className="mt-1 text-muted">in {fmtTime(done.ms)}</p>
            <p className="animate-pop mt-4 font-display text-6xl font-bold text-violet-600">{done.score}</p>
            <p className="text-xs uppercase tracking-widest text-muted">points</p>
            <div className="mt-6 flex justify-center gap-2">
              <button onClick={() => newGame()} className="btn-primary">New puzzle</button>
              <button onClick={() => setModal(false)} className="btn-ghost">View grid</button>
            </div>
          </div>
        </div>
      )}
    </GameShell>
  );
}
