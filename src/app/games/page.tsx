import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/db";
import { gameScores, users } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { GAMES } from "@/lib/games";
import { Avatar } from "@/components/SiteHeader";
import { Reveal, TiltCard } from "@/components/fx/Effects";
import WordGlobe from "@/components/fx/WordGlobe";
import Icon, { type IconName } from "@/components/Icon";
import { getCurrentUser } from "@/lib/session";
import { getGameAvailability } from "@/lib/game-settings";
import { levelFromXp } from "@/lib/xp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Word games", description: "Crossword, word scramble, hangman and tongue twister races — play, learn and earn XP." };

const GAME_DETAILS: Record<string, { icon: IconName; pace: string; howToPlay: string; skill: string }> = {
  crossword: { icon: "book", pace: "Relaxed · no time limit", howToPlay: "Solve the across and down clues. Use hints when you need a nudge.", skill: "Vocabulary" },
  scramble: { icon: "sparkles", pace: "Quick round · 60 seconds", howToPlay: "Rearrange each set of letters. Correct answers add time; skips cost time.", skill: "Word speed" },
  hangman: { icon: "game", pace: "One word at a time", howToPlay: "Guess letters before you run out of seven wrong guesses. A hint costs points.", skill: "Spelling" },
  twister: { icon: "microphone", pace: "Quick typing challenge", howToPlay: "Type the sentence as quickly and accurately as you can. Paste is disabled.", skill: "Typing" },
  "idiom-mixup": { icon: "book", pace: "6–10 quick questions", howToPlay: "Match familiar and surprising idioms to what they really mean.", skill: "Idioms" },
  "punctuation-panic": { icon: "announcement", pace: "6–10 quick questions", howToPlay: "Rescue sentences with the right punctuation mark.", skill: "Punctuation" },
  "rhyme-time": { icon: "microphone", pace: "6–10 quick questions", howToPlay: "Listen for the ending sounds and spot perfect and near-rhymes.", skill: "Sounds & poetry" },
  "odd-one-out": { icon: "help", pace: "6–10 quick questions", howToPlay: "Find the word that does not fit the group. Trust your vocabulary.", skill: "Word groups" },
  "emoji-decoder": { icon: "sparkles", pace: "6–10 quick questions", howToPlay: "Decode emoji clues into idioms. The emojis are confident; occasionally wrong.", skill: "Idioms & inference" },
  "verb-vortex": { icon: "game", pace: "6–10 quick questions", howToPlay: "Choose the verb form that keeps each sentence in orbit.", skill: "Verb forms" },
  "plural-panic": { icon: "people", pace: "6–10 quick questions", howToPlay: "Make singular nouns plural, including a few rule-breakers.", skill: "Nouns & spelling" },
  "polite-or-chaos": { icon: "chat", pace: "6–10 quick questions", howToPlay: "Choose a clear, kind response to everyday situations.", skill: "Conversation" },
};

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
  const [availability, user] = await Promise.all([getGameAvailability(), getCurrentUser()]);
  const level = user ? levelFromXp(user.xp) : 1;
  const released = availability.filter((entry) => entry.published);
  const boards = await Promise.all(released.map((entry) => topFor(entry.id)));
  const boardById = new Map(released.map((entry, index) => [entry.id, boards[index]]));
  const settingsById = new Map(availability.map((entry) => [entry.id, entry]));
  return (
    <div>
      <section className="aurora-bg relative overflow-hidden text-white">
        <div className="grid-bg absolute inset-0 opacity-50" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 py-10 sm:py-14 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-gold"><Icon name="game" size={18} /> English club game room</p>
            <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl md:text-6xl">Play with <span className="text-gradient">words</span></h1>
          <p className="mt-3 max-w-xl text-lg text-white/75">Pick a quick challenge or settle into a puzzle. Build vocabulary, track your best scores and earn XP as you play. New challenges get trickier as you level up.</p>
            <Link href="#choose-game" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-ink shadow-lg transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transform-none motion-reduce:transition-none">
              Explore the games <Icon name="arrow-up-right" size={17} />
            </Link>
          </div>
          <div className="hidden h-72 sm:block"><WordGlobe words={["Crossword", "Scramble", "Hangman", "Twister", "Puzzle", "Clue", "Across", "Down", "Letter", "Guess", "Win", "Play", "Score", "Combo", "Streak", "Word", "Riddle", "Anagram", "Spell", "Quick", "Brain", "Fun", "XP", "Level"]} /></div>
        </div>
      </section>

      <section id="choose-game" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-10 sm:py-12">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">Choose your challenge</p>
          <h2 className="mt-1 font-display text-3xl font-bold sm:text-4xl">The word arcade</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">{released.length} games released · every new challenge adds harder rounds as you level up. Organisers are preparing more releases. {user ? `Your level: ${level}.` : "Sign in to save scores, earn XP, and unlock level-gated games."}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {GAMES.map((g, i) => {
            const setting = settingsById.get(g.id)!;
            const board = boardById.get(g.id) ?? [];
            const unlocked = user && level >= setting.minLevel;
            const playable = setting.published && unlocked;
            const cardHeader = <>
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 transition duration-500 group-hover:scale-150 motion-reduce:transition-none" />
              <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15 sm:h-16 sm:w-16"><Icon name={GAME_DETAILS[g.id]?.icon ?? "game"} size={34} /></span>
              <div className="relative min-w-0"><h3 className="font-display text-2xl font-bold sm:text-3xl">{g.name}</h3><p className="text-sm text-white/85 sm:text-base">{g.tagline}</p></div>
              <span className="relative ml-auto inline-flex min-h-10 shrink-0 items-center gap-1 rounded-full bg-white px-3 py-2 text-sm font-bold text-ink shadow-lg sm:px-4">{!setting.published ? "Coming soon" : unlocked ? "Play" : `Level ${setting.minLevel}`} {playable && <Icon name="arrow-up-right" size={16} />}</span>
            </>;
            return (
            <Reveal key={g.id} delay={i * 90}>
              <TiltCard className="h-full rounded-[2rem]">
                <div className="flex h-full flex-col overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-black/5">
                  {playable ? <Link href={`/games/${g.id}`} aria-label={`Play ${g.name}`} className={`group relative flex min-h-32 items-center gap-4 bg-gradient-to-br ${g.color} p-5 text-white sm:gap-5 sm:p-7`}>{cardHeader}</Link> : <div className={`group relative flex min-h-32 items-center gap-4 bg-gradient-to-br ${g.color} p-5 text-white sm:gap-5 sm:p-7 ${!setting.published ? "grayscale" : ""}`} aria-label={setting.published ? `Locked until level ${setting.minLevel}` : "Coming soon"}>{cardHeader}</div>}
                  <div className="flex-1 p-5 sm:p-6">
                    <div className="mb-5 grid gap-3 rounded-2xl bg-paper/70 p-4 sm:grid-cols-[auto_1fr] sm:gap-x-4">
                      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-brand ring-1 ring-black/5"><Icon name="sparkles" size={14} />{GAME_DETAILS[g.id]?.skill}</span>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-muted"><Icon name="clock" size={14} />{GAME_DETAILS[g.id]?.pace}</span>
                      <p className="text-sm text-ink sm:col-span-2">{GAME_DETAILS[g.id]?.howToPlay}</p>
                    </div>
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted"><Icon name="trophy" size={15} /> Top players · best scores</p>
                    <ol className="mt-3 space-y-2">
                      {board.map((u, k) => (
                        <li key={u.id} className="flex items-center gap-3 text-sm">
                          <span className="w-6 text-center font-display text-xs font-bold text-muted" aria-label={`Rank ${k + 1}`}>#{k + 1}</span>
                          <Avatar name={u.name} color={u.color} size={26} />
                          <span className="flex-1 truncate font-medium">{u.name}</span>
                          <span className="whitespace-nowrap text-xs text-muted">{u.plays} {u.plays === 1 ? "play" : "plays"}</span>
                          <span className="min-w-12 text-right font-display font-bold text-brand">{u.best.toLocaleString()}</span>
                        </li>
                      ))}
                      {!board.length && setting.published && <li className="rounded-xl bg-paper px-3 py-3 text-sm text-muted">No scores yet. Play a round to claim the first spot.</li>}
                    </ol>
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          );})}
        </div>
      </section>
    </div>
  );
}
