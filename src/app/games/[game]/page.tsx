import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GAMES } from "@/lib/games";
import Crossword from "@/components/games/Crossword";
import Scramble from "@/components/games/Scramble";
import Hangman from "@/components/games/Hangman";
import TwisterRace from "@/components/games/TwisterRace";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ game: string }> }): Promise<Metadata> {
  const { game } = await params;
  const g = GAMES.find((x) => x.id === game);
  return { title: g ? `${g.name} · Games` : "Game", description: g?.tagline };
}

export default async function GamePage({ params }: { params: Promise<{ game: string }> }) {
  const { game } = await params;
  switch (game) {
    case "crossword":
      return <Crossword />;
    case "scramble":
      return <Scramble />;
    case "hangman":
      return <Hangman />;
    case "twister":
      return <TwisterRace />;
    default:
      notFound();
  }
}
