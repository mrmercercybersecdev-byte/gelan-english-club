import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/db";
import { users, xpLog } from "@/db/schema";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";
import { ACTIVITIES, BADGES, earnedBadges, levelProgress, rankTitle } from "@/lib/xp";
import { timeAgo } from "@/lib/format";
import { Avatar } from "@/components/SiteHeader";
import ProfileForm from "./ProfileForm";
import { Reveal } from "@/components/fx/Effects";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My profile" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");

  const since = new Date(Date.now() - 84 * 86_400_000);
  const [countsRows, recent, daily, [{ rank }]] = await Promise.all([
    db.select({ activity: xpLog.activity, c: sql<number>`count(*)::int` }).from(xpLog).where(eq(xpLog.userId, user.id)).groupBy(xpLog.activity),
    db.select().from(xpLog).where(eq(xpLog.userId, user.id)).orderBy(desc(xpLog.createdAt)).limit(12),
    db
      .select({ day: sql<string>`to_char(${xpLog.createdAt}, 'YYYY-MM-DD')`, total: sql<number>`sum(${xpLog.amount})::int` })
      .from(xpLog)
      .where(and(eq(xpLog.userId, user.id), gt(xpLog.createdAt, since)))
      .groupBy(sql`1`),
    db.select({ rank: sql<number>`(count(*) + 1)::int` }).from(users).where(and(gt(users.xp, user.xp), eq(users.banned, false))),
  ]);
  const counts = Object.fromEntries(countsRows.map((r) => [r.activity, r.c]));
  const earned = new Set(earnedBadges({ xp: user.xp, streak: user.streak, counts }).map((b) => b.id));
  const prog = levelProgress(user.xp);
  const dayMap = new Map(daily.map((d) => [d.day, d.total]));

  // Heatmap: 12 weeks x 7 days
  const cells: { day: string; v: number }[] = [];
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 83);
  for (let i = 0; i < 84; i++) {
    const d = new Date(start.getTime() + i * 86_400_000).toISOString().slice(0, 10);
    cells.push({ day: d, v: dayMap.get(d) ?? 0 });
  }
  const shade = (v: number) => (v === 0 ? "bg-black/5" : v < 20 ? "bg-emerald-200" : v < 50 ? "bg-emerald-400" : v < 100 ? "bg-emerald-600" : "bg-emerald-800");

  const R = 54, C = 2 * Math.PI * R;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-6">
          <div className="relative overflow-hidden rounded-3xl bg-ink p-7 text-center text-white">
            <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(circle at 50% 0%, ${user.avatarColor}, transparent 70%)` }} />
            <div className="relative mx-auto h-36 w-36">
              <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
                <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="8" />
                <circle cx="60" cy="60" r={R} fill="none" stroke="url(#g)" strokeWidth="8" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - prog.pct / 100)} />
                <defs><linearGradient id="g"><stop offset="0" stopColor="#d9a441" /><stop offset="1" stopColor="#f87171" /></linearGradient></defs>
              </svg>
              <div className="absolute inset-3 grid place-items-center"><Avatar name={user.displayName} color={user.avatarColor} size={100} /></div>
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3 py-0.5 text-xs font-bold text-ink">LV {prog.level}</span>
            </div>
            <h1 className="relative mt-5 font-display text-3xl font-bold">{user.displayName}</h1>
            <p className="relative text-sm text-white/60">@{user.username}{user.country ? ` · ${user.country}` : ""}</p>
            <p className="relative mt-1 text-sm font-semibold text-gold">{rankTitle(user.xp)}</p>
            {user.bio && <p className="relative mt-3 text-sm text-white/80">{user.bio}</p>}
            <div className="relative mt-6 grid grid-cols-3 gap-2">
              {[["XP", user.xp.toLocaleString()], ["Streak", `🔥 ${user.streak}`], ["Rank", `#${rank}`]].map(([k, v]) => (
                <div key={k} className="glass rounded-2xl p-2"><p className="font-display text-xl font-bold">{v}</p><p className="text-[11px] text-white/60">{k}</p></div>
              ))}
            </div>
            <p className="relative mt-4 text-xs text-white/50">{prog.next - user.xp} XP to level {prog.level + 1}</p>
          </div>
          <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5">
            <h2 className="font-display text-xl font-bold">Edit profile</h2>
            <ProfileForm displayName={user.displayName} bio={user.bio ?? ""} country={user.country ?? ""} avatarColor={user.avatarColor} />
          </div>
        </aside>

        <div className="space-y-6">
          <Reveal>
            <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold">Badges</h2>
                <span className="text-sm text-muted">{earned.size} / {BADGES.length} unlocked</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {BADGES.map((b) => {
                  const has = earned.has(b.id);
                  return (
                    <div key={b.id} className={`group rounded-2xl p-4 text-center transition ${has ? "bg-gradient-to-br from-gold/20 to-brand/10 ring-1 ring-gold/40 hover:-translate-y-1" : "bg-paper opacity-50 grayscale"}`}>
                      <span className={`inline-block text-4xl ${has ? "transition group-hover:scale-125 group-hover:rotate-12" : ""}`}>{b.icon}</span>
                      <p className="mt-2 text-sm font-semibold">{b.name}</p>
                      <p className="text-[11px] text-muted">{b.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5">
              <h2 className="font-display text-2xl font-bold">Activity — last 12 weeks</h2>
              <div className="mt-5 overflow-x-auto">
                <div className="grid w-max grid-flow-col grid-rows-7 gap-1">
                  {cells.map((c) => <div key={c.day} title={`${c.day}: ${c.v} XP`} className={`h-4 w-4 rounded-[4px] ${shade(c.v)} transition hover:scale-150`} />)}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] text-muted">Less {["bg-black/5", "bg-emerald-200", "bg-emerald-400", "bg-emerald-600", "bg-emerald-800"].map((s) => <span key={s} className={`h-3 w-3 rounded-sm ${s}`} />)} More</div>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5">
              <h2 className="font-display text-2xl font-bold">Recent XP</h2>
              <ul className="mt-4 divide-y divide-black/5">
                {recent.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span>{ACTIVITIES[r.activity]?.label ?? r.activity}{r.meta ? <span className="text-muted"> · {r.meta}</span> : null}</span>
                    <span className="flex items-center gap-3"><span className="text-xs text-muted">{timeAgo(r.createdAt)}</span><span className="font-bold text-emerald-700">+{r.amount}</span></span>
                  </li>
                ))}
                {!recent.length && <li className="py-6 text-center text-muted">No activity yet — try a quiz!</li>}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
