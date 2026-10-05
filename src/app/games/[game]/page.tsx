import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GAMES } from "@/lib/games";
import Crossword from "@/components/games/Crossword";
import Scramble from "@/components/games/Scramble";
import Hangman from "@/components/games/Hangman";
import TwisterRace from "@/components/games/TwisterRace";
import ArcadeChallenge from "@/components/games/ArcadeChallenge";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { levelFromXp } from "@/lib/xp";
import { getGameAvailabilityById } from "@/lib/game-settings";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ game: string }> }): Promise<Metadata> {
  const { game } = await params;
  const g = GAMES.find((x) => x.id === game);
  return { title: g ? `${g.name} · Games` : "Game", description: g?.tagline };
}

export default async function GamePage({ params }: { params: Promise<{ game: string }> }) {
  const { game } = await params;
  const [user, availability] = await Promise.all([getCurrentUser(), getGameAvailabilityById(game)]);
  if (!availability?.published) notFound();
  const level = user ? levelFromXp(user.xp) : 1;
  if (level < availability.minLevel) return <main className="mx-auto max-w-xl px-5 py-20 text-center"><p className="text-5xl">🔒</p><h1 className="mt-4 font-display text-3xl font-bold">This game unlocks at level {availability.minLevel}</h1><p className="mt-2 text-muted">Keep practising and earning XP. You’re level {level} right now.</p><Link className="btn-primary mt-6 inline-flex min-h-11 items-center" href="/games">Back to the games</Link></main>;
  switch (game) {
    case "crossword":
      return <Crossword level={level} />;
    case "scramble":
      return <Scramble level={level} />;
    case "hangman":
      return <Hangman level={level} />;
    case "twister":
      return <TwisterRace level={level} />;
    default:
      if (game.startsWith("idiom-") || ["punctuation-panic", "rhyme-time", "odd-one-out", "emoji-decoder", "verb-vortex", "plural-panic", "polite-or-chaos"].includes(game)) return <ArcadeChallenge gameId={game as import("@/lib/games").GameId} level={level} />;
      notFound();
  }
}
