import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTrack, TRACKS } from "@/lib/quizzes";
import { getCurrentUser } from "@/lib/session";
import TrackTabs from "./TrackTabs";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ track: string }> }): Promise<Metadata> {
  const { track } = await params;
  return { title: getTrack(track)?.name ?? "Learn" };
}

export default async function TrackPage({ params }: { params: Promise<{ track: string }> }) {
  const { track: id } = await params;
  const track = getTrack(id);
  if (!track) notFound();
  const user = await getCurrentUser();

  return (
    <div>
      <section className={`relative overflow-hidden bg-gradient-to-br ${track.gradient} text-white`}>
        <div className="grid-bg absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-7xl px-5 py-12">
          <Link href="/learn" className="text-sm text-white/80 hover:text-white">← AI Learning Lab</Link>
          <div className="mt-4 flex flex-wrap items-center gap-5">
            <span className="animate-floaty text-6xl">{track.icon}</span>
            <div>
              <h1 className="font-display text-4xl font-bold md:text-5xl">{track.name}</h1>
              <p className="mt-1 text-white/85">{track.tagline}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {TRACKS.filter((t) => t.id !== track.id).map((t) => (
              <Link key={t.id} href={`/learn/${t.id}`} className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold hover:bg-white/25">
                {t.icon} {t.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-5 py-10">
        {!user && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gold/15 p-4 text-sm ring-1 ring-gold/30">
            <span>⚡ You&apos;re practising as a guest. <strong>Sign in to earn XP</strong> and climb the leaderboard.</span>
            <Link href={`/login?next=/learn/${track.id}`} className="btn-primary !py-1.5 text-sm">Sign in</Link>
          </div>
        )}
        <TrackTabs
          track={{
            id: track.id,
            name: track.name,
            tutorMode: track.tutorMode,
            tutorIntro: track.tutorIntro,
            essayPrompts: track.essayPrompts ?? [],
            minWords: track.minWords ?? 150,
            questions: track.questions,
          }}
        />
      </div>
    </div>
  );
}
