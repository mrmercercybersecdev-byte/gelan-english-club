"use client";

import { useEffect, useState } from "react";
import Markdown from "@/components/Markdown";
import { notifyXp } from "@/lib/client-xp";
import type { EssayAnalysis } from "@/lib/ai";

function Radar({ bands }: { bands: EssayAnalysis["bands"] }) {
  const labels: [keyof EssayAnalysis["bands"], string][] = [
    ["task", "Task"],
    ["coherence", "Coherence"],
    ["lexical", "Lexical"],
    ["grammar", "Grammar"],
  ];
  const [k, setK] = useState(0);
  useEffect(() => {
    let raf = 0;
    const s = performance.now();
    const step = (n: number) => {
      const p = Math.min(1, (n - s) / 900);
      setK(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [bands]);
  const c = 110, R = 85;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / labels.length;
    const r = (v / 9) * R;
    return [c + Math.cos(a) * r, c + Math.sin(a) * r];
  };
  const poly = labels.map(([key], i) => pt(i, bands[key] * k).join(",")).join(" ");
  return (
    <svg viewBox="0 0 220 220" className="h-56 w-56">
      {[3, 5, 7, 9].map((lvl) => (
        <polygon key={lvl} points={labels.map((_, i) => pt(i, lvl).join(",")).join(" ")} fill="none" stroke="#e5dccd" />
      ))}
      {labels.map((_, i) => {
        const [x, y] = pt(i, 9);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="#e5dccd" />;
      })}
      <polygon points={poly} fill="rgba(184,50,42,.25)" stroke="#b8322a" strokeWidth="2" />
      {labels.map(([key, label], i) => {
        const [x, y] = pt(i, 10.4);
        return (
          <text key={key} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-ink text-[10px] font-semibold">
            {label} {bands[key]}
          </text>
        );
      })}
    </svg>
  );
}

export default function EssayGrader({ prompts, minWords }: { prompts: string[]; minWords: number }) {
  const [promptIdx, setPromptIdx] = useState(0);
  const [essay, setEssay] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState<{ analysis: EssayAnalysis; feedback: string | null } | null>(null);
  const [seconds, setSeconds] = useState(40 * 60);
  const [timerOn, setTimerOn] = useState(false);

  useEffect(() => {
    if (!timerOn) return;
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [timerOn]);

  const words = essay.trim() ? essay.trim().split(/\s+/).length : 0;

  async function grade() {
    setErr("");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "essay", essay, prompt: prompts[promptIdx], minWords }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult({ analysis: data.analysis, feedback: data.feedback });
      notifyXp(data.xp, `Essay graded: band ${data.analysis.overall}`);
      setTimerOn(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">Prompt {promptIdx + 1}/{prompts.length}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setTimerOn((o) => !o)} className={`rounded-full px-3 py-1 font-mono text-sm font-bold ${timerOn ? "bg-brand text-white" : "bg-paper"}`}>
              ⏱ {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
            </button>
            {prompts.length > 1 && (
              <button onClick={() => setPromptIdx((i) => (i + 1) % prompts.length)} className="rounded-full bg-paper px-3 py-1 text-sm">New prompt ↻</button>
            )}
          </div>
        </div>
        <p className="mt-3 rounded-2xl bg-paper p-4 font-display text-lg leading-snug">{prompts[promptIdx]}</p>
        <textarea
          value={essay}
          onChange={(e) => { setEssay(e.target.value); if (!timerOn && e.target.value.length === 1) setTimerOn(true); }}
          rows={16}
          className="input mt-4 font-serif text-[15px] leading-relaxed"
          placeholder="Start writing your response here… (the timer starts automatically)"
        />
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            <span className={`font-semibold ${words >= minWords ? "text-emerald-700" : "text-muted"}`}>{words} / {minWords} words</span>
            <div className="h-2 w-32 overflow-hidden rounded-full bg-paper">
              <div className="h-full rounded-full bg-gradient-to-r from-gold to-emerald-500 transition-all" style={{ width: `${Math.min(100, (words / minWords) * 100)}%` }} />
            </div>
          </div>
          <button onClick={grade} disabled={loading || words < 20} className="btn-primary">{loading ? "Grading…" : "Grade my essay"}</button>
        </div>
        {err && <p className="mt-3 text-sm text-rose-700">⚠ {err}</p>}
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        {!result && !loading && (
          <div className="grid h-full place-items-center text-center text-muted">
            <div>
              <p className="text-6xl">📊</p>
              <p className="mt-3 font-display text-xl font-bold text-ink">Your results appear here</p>
              <p className="mt-1 text-sm">Band estimate, criteria radar, corrections and tips.</p>
            </div>
          </div>
        )}
        {loading && (
          <div className="space-y-3">
            {[80, 60, 90, 70, 50].map((w, i) => <div key={i} className="shimmer h-5 rounded bg-paper" style={{ width: `${w}%` }} />)}
          </div>
        )}
        {result && (
          <div className="animate-toast">
            <div className="flex flex-wrap items-center gap-6">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted">Overall band</p>
                <p className="animate-pop font-display text-7xl font-bold text-brand">{result.analysis.overall}</p>
              </div>
              <Radar bands={result.analysis.bands} />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
              {[["Words", result.analysis.words], ["Paragraphs", result.analysis.paragraphs], ["Avg sentence", result.analysis.avgSentence], ["Diversity", `${Math.round(result.analysis.lexicalDiversity * 100)}%`]].map(([k, v]) => (
                <div key={k as string} className="rounded-xl bg-paper p-2"><p className="font-display text-lg font-bold">{v}</p><p className="text-muted">{k}</p></div>
              ))}
            </div>
            <h3 className="mt-5 font-semibold">🎯 Priority improvements</h3>
            <ul className="mt-2 space-y-1.5 text-sm">
              {result.analysis.tips.map((t, i) => <li key={i} className="rounded-lg bg-gold/10 px-3 py-2">{t}</li>)}
            </ul>
            {result.analysis.corrections.length > 0 && (
              <>
                <h3 className="mt-5 font-semibold">✏️ Corrections</h3>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {result.analysis.corrections.map((c, i) => (
                    <li key={i}><span className="text-rose-700 line-through">{c.found}</span> → <strong className="text-emerald-700">{c.suggestion}</strong> <span className="text-muted">— {c.why}</span></li>
                  ))}
                </ul>
              </>
            )}
            {result.analysis.linkers.length > 0 && (
              <p className="mt-4 text-sm"><strong>Linkers used:</strong> {result.analysis.linkers.map((l) => <span key={l} className="mr-1 inline-block rounded bg-emerald-50 px-1.5 text-emerald-800">{l}</span>)}</p>
            )}
            {result.feedback && (
              <div className="mt-6 rounded-2xl bg-cream p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-brand">Examiner feedback (AI)</p>
                <Markdown text={result.feedback} className="text-sm" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
