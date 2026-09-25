import type { Metadata } from "next";
import Link from "next/link";
import SpeakStudio from "./SpeakStudio";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Speaking Studio" };

export default async function SpeakPage() {
  const user = await getCurrentUser();
  return (
    <div>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="grid-bg absolute inset-0 opacity-40" />
        <div className="absolute -left-20 top-0 h-80 w-80 rounded-full bg-violet-600/30 blur-3xl" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-brand/30 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-5 py-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">Voice lab</p>
          <h1 className="mt-2 font-display text-5xl font-bold md:text-6xl">Speaking <span className="text-gradient">Studio</span></h1>
          <p className="mt-4 max-w-2xl text-lg text-white/70">
            Talk out loud with Wordy, your AI conversation partner, role-play real-life scenarios, and get your pronunciation
            scored word by word. Works best in Chrome or Edge with a microphone.
          </p>
          {!user && (
            <p className="mt-5 text-sm text-white/60">
              <Link href="/login?next=/speak" className="font-semibold text-gold underline">Sign in</Link> to earn XP for every spoken turn.
            </p>
          )}
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-5 py-10">
        <SpeakStudio />
      </div>
    </div>
  );
}
