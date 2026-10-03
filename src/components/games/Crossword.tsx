"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generateCrossword, type Crossword as CW, type Placed } from "@/lib/games";
import { Confetti, GameShell, Stat, fmtTime, submitScore } from "./shared";
import Icon from "@/components/Icon";

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
  const [cellSize, setCellSize] = useState(24);
  const boardViewportRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => newGame());
    return () => window.cancelAnimationFrame(frame);
  }, [newGame]);
  useEffect(() => {
    if (done || !start) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [done, start]);

  useEffect(() => {
    const viewport = boardViewportRef.current;
    if (!cw || !viewport) return;

    const updateCellSize = () => {
      const columns = Math.max(cw.cols, cw.rows);
      if (window.innerWidth >= 640) {
        setCellSize(Math.max(24, Math.min(44, Math.floor(Math.min(560, window.innerWidth - 40) / columns))));
        return;
      }

      const availableWidth = viewport.clientWidth - 16;
      const fittedSize = Math.floor((availableWidth - 16 - 2 * (cw.cols - 1)) / cw.cols);
      setCellSize(Math.max(12, Math.min(44, fittedSize)));
    };

    updateCellSize();
    const observer = new ResizeObserver(updateCellSize);
    observer.observe(viewport);
    window.addEventListener("resize", updateCellSize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateCellSize);
    };
  }, [cw]);

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
    (f: string[][], addedPenalty = 0) => {
      if (!cw) return;
      for (let r = 0; r < cw.rows; r++) for (let c = 0; c < cw.cols; c++) if (cw.grid[r][c] && f[r][c] !== cw.grid[r][c]) return;
      const ms = Date.now() - start;
      const score = Math.max(100, Math.round(2000 - ms / 1000 * 2 - penalty - addedPenalty));
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
    setWrong((s) => { const n = new Set(s); n.delete(`${sel.r},${sel.c}`); return n; });
    setPenalty((p) => p + 100);
    advance();
    checkComplete(f, 100);
  };
  const revealWord = () => {
    if (!cw || !activeWord || done) return;
    const f = fill.map((row) => [...row]);
    const rv = new Set(revealed);
    cellsOf(activeWord).forEach(([r, c]) => { f[r][c] = cw.grid[r][c] ?? ""; rv.add(`${r},${c}`); });
    setFill(f);
    setRevealed(rv);
    setWrong((s) => {
      const n = new Set(s);
      cellsOf(activeWord).forEach(([r, c]) => n.delete(`${r},${c}`));
      return n;
    });
    setPenalty((p) => p + 250);
    checkComplete(f, 250);
  };

  const filled = cw ? fill.flat().filter(Boolean).length : 0;
  const total = cw ? cw.grid.flat().filter(Boolean).length : 1;
  const elapsed = done ? done.ms : now - start;
  return (
    <GameShell
      title="Crossword"
      icon="book"
      gradient="from-brand via-emerald-700 to-cyan-800"
      stats={<><Stat label="Time" value={fmtTime(Math.max(0, elapsed))} /><Stat label="Filled" value={`${Math.round((filled / total) * 100)}%`} /><Stat label="Penalty" value={penalty} /></>}
    >
      {done && modal && <Confetti />}
      {!cw ? (
        <div className="shimmer h-96 rounded-3xl bg-white" />
      ) : (
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[auto_1fr]">
          <div className="min-w-0">
            {activeWord && (
              <div aria-live="polite" className="mb-3 rounded-2xl bg-ink px-4 py-3 text-white">
                <span className="mr-2 rounded bg-white/15 px-2 py-0.5 text-xs font-bold">{activeWord.num} {activeWord.dir.toUpperCase()}</span>
                <span className="text-sm sm:text-base">{activeWord.clue} <span className="text-white/50">({activeWord.word.length})</span></span>
              </div>
            )}
            <div ref={boardViewportRef} className="-mx-2 overflow-x-hidden px-2 pb-2 sm:mx-0 sm:px-0">
              <div ref={boardRef} role="group" aria-label="Crossword grid. Use the arrow keys to move, type letters to fill cells, and press Space or Tab for the next clue." tabIndex={0} onKeyDown={onKey} className="inline-block max-w-full rounded-2xl bg-ink p-2 shadow-2xl outline-none ring-offset-4 focus:ring-4 focus:ring-teal-400/50">
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
                          type="button"
                          aria-label={`${numbers.has(k) ? `Clue ${numbers.get(k)}, ` : ""}row ${r + 1}, column ${c + 1}${fill[r]?.[c] ? `, ${fill[r][c]}` : ", blank"}${revealed.has(k) ? ", revealed" : ""}`}
                          aria-current={isSel ? "true" : undefined}
                          onClick={() => clickCell(r, c)}
                          tabIndex={-1}
                          style={{ width: cellSize, height: cellSize }}
                          className={`relative grid place-items-center rounded-[4px] font-display font-bold uppercase transition motion-reduce:transition-none ${
                            isSel ? "scale-105 bg-gold text-ink shadow-lg" : inWord ? "bg-teal-100 text-ink" : "bg-white text-ink hover:bg-teal-50"
                          } ${wrong.has(k) ? "!bg-rose-300" : ""} ${done ? "animate-pop motion-reduce:animate-none" : ""}`}
                        >
                          {numbers.has(k) && <span className="absolute left-0.5 top-0 text-[9px] font-bold leading-none text-ink/60">{numbers.get(k)}</span>}
                          <span className={`${revealed.has(k) ? "text-teal-700" : ""}`} style={{ fontSize: Math.max(8, cellSize * 0.5) }}>{fill[r]?.[c]}</span>
                        </button>
                      );
                    }),
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={check} className="btn-ghost inline-flex min-h-10 items-center gap-1.5 !py-2 text-xs sm:text-sm"><Icon name="check" size={16} /><span className="hidden sm:inline">Check</span> (+40)</button>
              <button type="button" onClick={revealLetter} className="btn-ghost inline-flex min-h-10 items-center gap-1.5 !py-2 text-xs sm:text-sm"><Icon name="sparkles" size={16} /><span className="hidden sm:inline">Reveal</span> (+100)</button>
              <button type="button" onClick={revealWord} className="btn-ghost inline-flex min-h-10 items-center gap-1.5 !py-2 text-xs sm:text-sm"><Icon name="book" size={16} /><span className="hidden sm:inline">Word</span> (+250)</button>
              <button type="button" onClick={() => newGame()} className="btn-primary inline-flex min-h-10 items-center gap-1.5 !py-2 text-xs sm:text-sm"><Icon name="game" size={16} /><span className="hidden sm:inline">New</span></button>
            </div>
            <div className="mt-4 space-y-1.5 lg:hidden">
              {KEYS.map((row) => (
                <div key={row} className="flex justify-center gap-1">
                  {row.split("").map((k) => <button key={k} onClick={() => typeLetter(k)} className="h-9 w-7 rounded-lg bg-white text-xs font-bold shadow ring-1 ring-black/10 active:bg-gold sm:h-10 sm:w-8">{k}</button>)}
                  {row === "ZXCVBNM" && <button onClick={backspace} className="h-9 rounded-lg bg-white px-2 font-bold shadow ring-1 ring-black/10 text-xs sm:h-10 sm:px-3">⌫</button>}
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-muted sm:text-xs">Focus the grid: type letters · arrows to move · Tab/Space for next clue. Touch: use letter keys below.</p>
          </div>

          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
            {(["across", "down"] as const).map((d) => (
              <div key={d}>
                <h2 className="font-display text-lg font-bold capitalize sm:text-xl">{d}</h2>
                <ul className="mt-2 max-h-96 space-y-1 overflow-y-auto">
                  {cw.words.filter((w) => w.dir === d).sort((a, b) => a.num - b.num).map((w) => {
                    const solved = cellsOf(w).every(([r, c]) => fill[r]?.[c] === cw.grid[r][c]);
                    const on = activeWord === w;
                    return (
                      <li key={`${d}${w.num}`}>
                        <button
                          onClick={() => { setSel({ r: w.row, c: w.col, dir: w.dir }); boardRef.current?.focus(); }}
                          className={`w-full rounded-xl px-3 py-2 text-left text-xs sm:text-sm transition ${on ? "bg-brand text-white shadow" : "hover:bg-white"} ${solved && !on ? "text-muted line-through" : ""}`}
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
          <div className="animate-toast w-full max-w-sm rounded-3xl bg-white p-6 sm:p-8 text-center shadow-2xl">
            <Icon name="trophy" size={48} className="mx-auto text-gold" />
            <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">Puzzle solved!</h2>
            <p className="mt-1 text-sm text-muted">in {fmtTime(done.ms)}</p>
            <p className="animate-pop mt-4 font-display text-5xl font-bold sm:text-6xl text-brand">{done.score}</p>
            <p className="text-xs uppercase tracking-widest text-muted">points</p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button onClick={() => newGame()} className="btn-primary">New puzzle</button>
              <button onClick={() => setModal(false)} className="btn-ghost">View grid</button>
            </div>
          </div>
        </div>
      )}
    </GameShell>
  );
}
