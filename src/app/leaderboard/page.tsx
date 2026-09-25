import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/db";
import { users, xpLog } from "@/db/schema";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { ensureSeed } from "@/lib/seed";
import { getCurrentUser } from "@/lib/session";
import { levelFromXp, rankTitle } from "@/lib/xp";
import { Avatar } from "@/components/SiteHeader";
import { Reveal } from "@/components/fx/Effects";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Leaderboard" };

type Row = { id: number; displayName: string; username: string; avatarColor: string; country: string | null; xp: number; streak: number; score: number };

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  await ensureSeed();
  const { period } = await searchParams;
  const weekly = period === "week";
  const me = await getCurrentUser();

  let rows: Row[];
  if (weekly) {
    const since = new Date(Date.now() - 7 * 86_400_000);
    rows = await db
      .select({
        id: users.id, displayName: users.displayName, username: users.username, avatarColor: users.avatarColor,
        country: users.country, xp: users.xp, streak: users.streak,
        score: sql<number>`coalesce(sum(${xpLog.amount}), 0)::int`,
      })
      .from(users)
      .innerJoin(xpLog, and(eq(xpLog.userId, users.id), gt(xpLog.createdAt, since)))
      .where(eq(users.banned, false))
      .groupBy(users.id)
      .orderBy(desc(sql`sum(${xpLog.amount})`))
      .limit(50);
  } else {
    rows = (
      await db
        .select({ id: users.id, displayName: users.displayName, username: users.username, avatarColor: users.avatarColor, country: users.country, xp: users.xp, streak: users.streak })
        .from(users)
        .where(eq(users.banned, false))
        .orderBy(desc(users.xp))
        .limit(50)
    ).map((r) => ({ ...r, score: r.xp }));
  }

  const podium = [rows[1], rows[0], rows[2]];
  const heights = ["h-32", "h-44", "h-24"];
  const medals = ["🥈", "🥇", "🥉"];
  const myRank = me ? rows.findIndex((r) => r.id === me.id) + 1 : 0;

  return (
    <div>
      <section className="aurora-bg relative overflow-hidden pb-10 text-white">
        <div className="grid-bg absolute inset-0 opacity-50" />
        <div className="relative mx-auto max-w-5xl px-5 pt-14 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">Hall of fame</p>
          <h1 className="mt-2 font-display text-5xl font-bold md:text-6xl">Leaderboard</h1>
          <div className="mt-6 inline-flex rounded-full bg-white/10 p-1 text-sm font-semibold">
            <Link href="/leaderboard" className={`rounded-full px-5 py-2 ${!weekly ? "bg-white text-ink" : ""}`}>All time</Link>
            <Link href="/leaderboard?period=week" className={`rounded-full px-5 py-2 ${weekly ? "bg-white text-ink" : ""}`}>This week</Link>
          </div>

          <div className="mx-auto mt-12 grid max-w-2xl grid-cols-3 items-end gap-3">
            {podium.map((u, i) =>
              u ? (
                <Reveal key={u.id} delay={i === 1 ? 0 : 250} from="up">
                  <div className="flex flex-col items-center">
                    <span className={`text-4xl ${i === 1 ? "animate-floaty" : ""}`}>{medals[i]}</span>
                    <div className={`mt-2 rounded-full p-1 ${i === 1 ? "bg-gradient-to-br from-gold to-amber-200 shadow-[0_0_40px_rgba(217,164,65,.6)]" : "bg-white/20"}`}>
                      <Avatar name={u.displayName} color={u.avatarColor} size={i === 1 ? 84 : 64} />
                    </div>
                    <p className="mt-2 font-semibold">{u.displayName}</p>
                    <p className="text-xs text-white/60">{u.country}</p>
                    <div className={`glass mt-3 flex w-full flex-col items-center justify-start rounded-t-2xl pt-3 ${heights[i]}`}>
                      <span className="font-display text-2xl font-bold text-gold">{u.score.toLocaleString()}</span>
                      <span className="text-[11px] text-white/60">XP</span>
                    </div>
                  </div>
                </Reveal>
              ) : (
                <div key={i} />
              ),
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-10">
        {me && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink p-4 text-white">
            <span className="flex items-center gap-3"><Avatar name={me.displayName} color={me.avatarColor} size={36} /> Your rank: <strong className="font-display text-2xl text-gold">{myRank ? `#${myRank}` : "—"}</strong></span>
            <span className="text-sm text-white/70">Lv {levelFromXp(me.xp)} {rankTitle(me.xp)} · {me.xp} XP · 🔥 {me.streak}</span>
          </div>
        )}
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper text-xs uppercase tracking-wider text-muted">
              <tr><th className="p-4">Rank</th><th>Member</th><th className="hidden sm:table-cell">Level</th><th className="hidden sm:table-cell">Streak</th><th className="pr-4 text-right">{weekly ? "XP this week" : "Total XP"}</th></tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {rows.map((u, i) => (
                <tr key={u.id} className={`transition hover:bg-cream ${me?.id === u.id ? "bg-gold/10" : ""}`}>
                  <td className="p-4 font-display text-lg font-bold text-muted">{i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${i + 1}`}</td>
                  <td>
                    <span className="flex items-center gap-3">
                      <Avatar name={u.displayName} color={u.avatarColor} size={34} />
                      <span><span className="font-semibold">{u.displayName}</span><span className="block text-xs text-muted">@{u.username}{u.country ? ` · ${u.country}` : ""}</span></span>
                    </span>
                  </td>
                  <td className="hidden sm:table-cell"><span className="rounded-full bg-paper px-2 py-1 text-xs font-semibold">Lv {levelFromXp(u.xp)} · {rankTitle(u.xp)}</span></td>
                  <td className="hidden sm:table-cell">{u.streak ? `🔥 ${u.streak}` : "—"}</td>
                  <td className="pr-4 text-right font-display text-lg font-bold text-brand">{u.score.toLocaleString()}</td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={5} className="p-10 text-center text-muted">No activity yet this week — be the first!</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[["🧠", "Quizzes", "+10 per correct answer, +25 per quiz"], ["🎙️", "Speaking", "+6 per voice turn, up to +12 per drill"], ["📹", "Meetings", "+30 for joining a live room"]].map(([i, t, d]) => (
            <div key={t} className="rounded-2xl bg-white p-4 text-sm ring-1 ring-black/5"><span className="text-2xl">{i}</span><p className="mt-1 font-semibold">{t}</p><p className="text-muted">{d}</p></div>
          ))}
        </div>
      </section>
    </div>
  );
}
