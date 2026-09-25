import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/db";
import { gameScores, users } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { GAMES } from "@/lib/games";
import { Avatar } from "@/components/SiteHeader";
import { Reveal, TiltCard } from "@/components/fx/Effects";
import WordGlobe from "@/components/fx/WordGlobe";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Word games", description: "Crossword, word scramble, hangman and tongue twister races — play, learn and earn XP." };

async function topFor(game: string) {
  // best score per user
  return db
    .select({ id: users.id, name: users.displayName, color: users.avatarColor, best: sql<number>`max(${gameScores.score})::int`, plays: sql<number>`count(*)::int` })
    .from(gameScores)
    .innerJoin(users, eq(users.id, gameScores.userId))
    .where(and(eq(gameScores.game, game), eq(users.banned, false)))
    .groupBy(users.id)
    .orderBy(sql`max(${gameScores.score}) desc`)
    .limit(5);
}

export default async function GamesPage() {
  const boards = await Promise.all(GAMES.map((g) => topFor(g.id)));
  return (
    <div>
      <section className="aurora-bg relative overflow-hidden text-white">
        <div className="grid-bg absolute inset-0 opacity-50" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 py-14 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-gold">🎮 Game room</p>
            <h1 className="mt-2 font-display text-5xl font-bold md:text-6xl">Play with <span className="text-gradient">words</span></h1>
            <p className="mt-3 max-w-xl text-lg text-white/75">Crosswords, scrambles, hangman and tongue-twister races. Every win earns XP and a spot on the game leaderboards.</p>
          </div>
          <div className="h-72"><WordGlobe words={["Crossword", "Scramble", "Hangman", "Twister", "Puzzle", "Clue", "Across", "Down", "Letter", "Guess", "Win", "Play", "Score", "Combo", "Streak", "Word", "Riddle", "Anagram", "Spell", "Quick", "Brain", "Fun", "XP", "Level"]} /></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="grid gap-6 md:grid-cols-2">
          {GAMES.map((g, i) => (
            <Reveal key={g.id} delay={i * 90}>
              <TiltCard className="h-full rounded-[2rem]">
                <div className="flex h-full flex-col overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-black/5">
                  <Link href={`/games/${g.id}`} className={`group relative flex items-center gap-5 bg-gradient-to-br ${g.color} p-7 text-white`}>
                    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 transition duration-500 group-hover:scale-150" />
                    <span className="relative text-6xl transition group-hover:rotate-12 group-hover:scale-110">{g.icon}</span>
                    <div className="relative">
                      <h2 className="font-display text-3xl font-bold">{g.name}</h2>
                      <p className="text-white/85">{g.tagline}</p>
                    </div>
                    <span className="relative ml-auto rounded-full bg-white px-5 py-2 text-sm font-bold text-ink shadow-lg transition group-hover:scale-110">Play ▶</span>
                  </Link>
                  <div className="flex-1 p-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted">🏆 Top players</p>
                    <ol className="mt-3 space-y-2">
                      {boards[i].map((u, k) => (
                        <li key={u.id} className="flex items-center gap-3 text-sm">
                          <span className="w-6 text-center">{["🥇", "🥈", "🥉"][k] ?? `#${k + 1}`}</span>
                          <Avatar name={u.name} color={u.color} size={26} />
                          <span className="flex-1 truncate font-medium">{u.name}</span>
                          <span className="text-xs text-muted">{u.plays} plays</span>
                          <span className="font-display font-bold text-brand">{u.best.toLocaleString()}</span>
                        </li>
                      ))}
                      {!boards[i].length && <li className="text-sm text-muted">No scores yet — be the first champion!</li>}
                    </ol>
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
