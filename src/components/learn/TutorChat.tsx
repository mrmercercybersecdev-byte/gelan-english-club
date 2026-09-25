"use client";

import { useEffect, useRef, useState } from "react";
import Markdown from "@/components/Markdown";
import { notifyXp } from "@/lib/client-xp";

type Msg = { role: "user" | "assistant"; content: string };
type Correction = { found: string; suggestion: string; why: string };

const STARTERS: Record<string, string[]> = {
  "ielts-speaking": ["ready", "What are the band descriptors for speaking?", "Give me a Part 2 cue card"],
  sat: ["Give me a practice question", "What does 'ephemeral' mean?", "How do I approach transition questions?"],
  toefl: ["How should I structure the academic discussion task?", "Give me an integrated speaking template", "Tips for note-taking"],
  grammar: ["She don't like coffee and i am agree with her.", "I have been to London last year.", "Explain me the present perfect"],
  conversation: ["Let's talk about travel!", "Teach me an idiom about food", "What's your favourite movie?"],
};

export default function TutorChat({ mode, intro, title }: { mode: string; intro: string; title: string }) {
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: intro }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [lastCorrections, setLastCorrections] = useState<Correction[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || loading) return;
    const next = [...messages, { role: "user" as const, content: t }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, messages: next }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply ?? "Sorry, something went wrong." }]);
      setSource(data.source);
      setLastCorrections(data.corrections ?? []);
      notifyXp(data.xp, "Tutor practice");
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "⚠️ Network error — please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="flex h-[600px] flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="relative grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand to-gold text-lg">🤖
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
            </span>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="text-xs text-muted">{source === "ai" ? "LLM-powered" : source === "offline" ? "Built-in tutor engine" : "Online"}</p>
            </div>
          </div>
          <button onClick={() => { setMessages([{ role: "assistant", content: intro }]); setLastCorrections([]); }} className="text-xs font-semibold text-muted hover:text-ink">↺ Reset</button>
        </div>
        <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-cream/50 to-white p-5">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`animate-toast max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] ${m.role === "user" ? "rounded-br-sm bg-ink text-white" : "rounded-bl-sm bg-white shadow-sm ring-1 ring-black/5"}`}>
                {m.role === "assistant" ? <Markdown text={m.content} className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0" /> : m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-1.5 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/5 w-fit">
              {[0, 1, 2].map((k) => <span key={k} className="h-2 w-2 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${k * 0.15}s` }} />)}
            </div>
          )}
        </div>
        <div className="border-t border-black/5 p-3">
          <div className="mb-2 flex flex-wrap gap-2">
            {(STARTERS[mode] ?? STARTERS.conversation).map((s) => (
              <button key={s} onClick={() => send(s)} className="rounded-full bg-paper px-3 py-1 text-xs hover:bg-gold/20">{s}</button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} className="input !rounded-full" placeholder="Type your answer or question…" maxLength={2000} />
            <button disabled={loading || !input.trim()} className="btn-primary !px-5">Send</button>
          </form>
        </div>
      </div>
      <aside className="space-y-4">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="font-display text-lg font-bold">🔍 Live grammar check</p>
          <p className="text-xs text-muted">Your last message, analysed</p>
          {lastCorrections.length ? (
            <ul className="mt-3 space-y-2">
              {lastCorrections.map((c, i) => (
                <li key={i} className="rounded-xl bg-rose-50 p-3 text-sm">
                  <span className="text-rose-700 line-through">{c.found}</span> → <span className="font-semibold text-emerald-700">{c.suggestion}</span>
                  <p className="mt-1 text-xs text-muted">{c.why}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">✓ No common errors detected yet.</p>
          )}
        </div>
        <div className="rounded-3xl bg-ink p-5 text-sm text-white/80">
          <p className="font-display text-lg font-bold text-white">How to get the most out of it</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Answer in full sentences</li>
            <li>Ask &ldquo;why?&rdquo; when you don&apos;t understand a correction</li>
            <li>Every message = +3 XP</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
