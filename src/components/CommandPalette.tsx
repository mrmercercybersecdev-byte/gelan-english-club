"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const COMMANDS = [
  { label: "Home", href: "/", icon: "🏠", k: "home start" },
  { label: "Events calendar", href: "/events", icon: "📅", k: "meetups rsvp" },
  { label: "AI Learning Lab", href: "/learn", icon: "🧠", k: "ai tutor study" },
  { label: "IELTS practice", href: "/learn/ielts", icon: "🎓", k: "exam band essay" },
  { label: "SAT practice", href: "/learn/sat", icon: "📝", k: "exam college" },
  { label: "TOEFL practice", href: "/learn/toefl", icon: "🌍", k: "exam" },
  { label: "Grammar Gym", href: "/learn/grammar", icon: "🏋️", k: "tenses" },
  { label: "Idioms & Slang", href: "/learn/idioms", icon: "🦜", k: "phrases" },
  { label: "Speaking Studio (voice)", href: "/speak", icon: "🎙️", k: "voice pronunciation talk" },
  { label: "Live meeting rooms", href: "/meet", icon: "📹", k: "video call webrtc" },
  { label: "Chat channels", href: "/chat", icon: "💬", k: "messages community" },
  { label: "Leaderboard", href: "/leaderboard", icon: "🏆", k: "ranking xp top" },
  { label: "Blog", href: "/blog", icon: "📰", k: "articles posts" },
  { label: "Phrase Wall", href: "/board", icon: "💡", k: "idioms tips" },
  { label: "My profile", href: "/profile", icon: "👤", k: "account badges" },
  { label: "Announcements", href: "/announcements", icon: "📣", k: "news updates notices" },
  { label: "Submit work for review", href: "/submit", icon: "📤", k: "upload file essay recording homework approve" },
  { label: "Verify a certificate", href: "/verify", icon: "✅", k: "verification code check" },
  { label: "Study groups", href: "/groups", icon: "👥", k: "tongue twister vocabulary debate grammar join" },
  { label: "Games", href: "/games", icon: "🎮", k: "play fun" },
  { label: "Crossword", href: "/games/crossword", icon: "🧩", k: "puzzle game" },
  { label: "Word Scramble", href: "/games/scramble", icon: "🔀", k: "anagram game" },
  { label: "Hangman", href: "/games/hangman", icon: "🪢", k: "guess word game" },
  { label: "Tongue Twister Race", href: "/games/twister", icon: "👅", k: "typing speed game" },
  { label: "Join the club", href: "/join", icon: "✨", k: "membership signup" },
  { label: "About us", href: "/about", icon: "🏛️", k: "story faq" },
  { label: "Leaders", href: "/about#leaders", icon: "👑", k: "team president founder" },
  { label: "Facilitators", href: "/about#facilitators", icon: "🧑‍🏫", k: "team volunteers coaches" },
  { label: "Champions & winners", href: "/about#champions", icon: "🏆", k: "hall of fame debate trophy awards" },
  { label: "Livestream", href: "/about#live", icon: "🔴", k: "live stream broadcast watch replay" },
  { label: "Club history", href: "/about#history", icon: "📜", k: "timeline story milestones" },
  { label: "Contact", href: "/contact", icon: "✉️", k: "message email" },
  { label: "Organiser dashboard", href: "/admin", icon: "🛠️", k: "admin manage" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const openEvt = () => setOpen(true);
    window.addEventListener("keydown", on);
    window.addEventListener("wec:palette", openEvt);
    return () => {
      window.removeEventListener("keydown", on);
      window.removeEventListener("wec:palette", openEvt);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      setTimeout(() => input.current?.focus(), 10);
    }
  }, [open]);

  const list = useMemo(() => {
    const s = q.toLowerCase().trim();
    return s ? COMMANDS.filter((c) => (c.label + " " + c.k).toLowerCase().includes(s)) : COMMANDS;
  }, [q]);

  if (!open) return null;
  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-ink/50 p-4 pt-[12vh] backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="animate-toast w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-black/5 px-4">
          <span className="text-muted">⌘</span>
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(list.length - 1, s + 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
              if (e.key === "Enter" && list[sel]) go(list[sel].href);
            }}
            placeholder="Where do you want to go?"
            className="w-full bg-transparent py-4 outline-none"
          />
          <kbd className="rounded border border-black/10 px-1.5 text-[10px] text-muted">ESC</kbd>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-2">
          {list.map((c, i) => (
            <li key={c.href}>
              <button
                onMouseEnter={() => setSel(i)}
                onClick={() => go(c.href)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${i === sel ? "bg-paper" : ""}`}
              >
                <span className="text-lg">{c.icon}</span>
                <span className="flex-1 font-medium">{c.label}</span>
                {i === sel && <span className="text-xs text-muted">↵</span>}
              </button>
            </li>
          ))}
          {!list.length && <li className="p-6 text-center text-sm text-muted">No results</li>}
        </ul>
      </div>
    </div>
  );
}
