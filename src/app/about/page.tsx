import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/db";
import { champions, events, livestreams, milestones, teamMembers, users, xpLog } from "@/db/schema";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { ensureSeed } from "@/lib/seed";
import { getCurrentUser } from "@/lib/session";
import DnaHelix from "@/components/fx/DnaHelix";
import { Counter, Reveal } from "@/components/fx/Effects";
import { Avatar } from "@/components/SiteHeader";
import Icon, { type IconName } from "@/components/Icon";
import AboutNav from "./AboutNav";
import Timeline from "./Timeline";
import ChampionsHall from "./ChampionsHall";
import LiveHub from "./LiveHub";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "About us",
  description: "Meet the leaders, facilitators and champions of Gelan English Club, watch our livestreams and explore our history.",
};

const SCHEDULE = [
  ["Tue", "Coffee & Conversation Circle", "18:30"],
  ["Thu", "Book Club (bi-weekly)", "19:00"],
  ["Fri", "Debate, Open Mic or Movie Night", "18:00"],
  ["Sat", "Workshops & Bootcamps", "10:00"],
];

const VALUES: readonly (readonly [IconName, string, string])[] = [
  ["check", "Kindness first", "We correct gently, listen patiently and celebrate progress."],
  ["microphone", "Everyone speaks", "Facilitators make sure quieter voices get space too."],
  ["globe", "Curiosity", "We learn about each other's cultures as much as the language."],
  ["sparkles", "Always improving", "From café tables to AI tutors — we keep reinventing how to learn."],
];

const FAQ = [
  ["Do I need a certain level of English to join?", "Not at all. We have activities for every level, from beginners to near-native speakers. Each event shows a recommended level."],
  ["How much does it cost?", "Membership, events, the AI Lab and live rooms are all free. Some venues are cafés, so buying a drink is appreciated but never required."],
  ["How do I become a facilitator?", "Be an active member for a few months, then message us. We run a short training with Daniel and pair you with an experienced facilitator for your first sessions."],
  ["How can I compete in the championships?", "Our Debate Championship runs every spring, the Public Speaking Cup in summer and the Spelling Bee in winter. Watch the events calendar — sign-ups open 6 weeks before."],
  ["Where can I watch the livestreams?", "Right here on this page! Live broadcasts show up at the top of the Livestream section with a live chat. Replays stay available afterwards."],
];

function initials(n: string) {
  return n.split(" ").map((p) => p[0]).slice(0, 2).join("");
}

export default async function AboutPage() {
  await ensureSeed();
  const [team, champs, history, streams, xpChamps, [ev], [us], me] = await Promise.all([
    db.select().from(teamMembers).where(eq(teamMembers.active, true)).orderBy(asc(teamMembers.sortOrder), asc(teamMembers.id)),
    db.select().from(champions).orderBy(desc(champions.year), asc(champions.place), desc(champions.id)),
    db.select().from(milestones).orderBy(asc(milestones.year), asc(milestones.sortOrder), asc(milestones.id)),
    db.select().from(livestreams).orderBy(desc(livestreams.scheduledAt)),
    db
      .select({ id: users.id, displayName: users.displayName, avatarColor: users.avatarColor, country: users.country, total: sql<number>`sum(${xpLog.amount})::int` })
      .from(xpLog)
      .innerJoin(users, eq(users.id, xpLog.userId))
      .where(and(sql`${xpLog.createdAt} > now() - interval '30 days'`, eq(users.banned, false)))
      .groupBy(users.id)
      .orderBy(desc(sql`sum(${xpLog.amount})`))
      .limit(3),
    db.select({ c: sql<number>`count(*)::int` }).from(events),
    db.select({ c: sql<number>`count(*)::int` }).from(users),
    getCurrentUser(),
  ]);

  let xpLabel = "XP Champions — last 30 days";
  let xpTop = xpChamps;
  if (!xpTop.length) {
    xpLabel = "All-time XP legends";
    xpTop = (
      await db
        .select({ id: users.id, displayName: users.displayName, avatarColor: users.avatarColor, country: users.country, total: users.xp })
        .from(users)
        .where(eq(users.banned, false))
        .orderBy(desc(users.xp))
        .limit(3)
    ).filter((u) => u.total > 0);
  }

  const leaders = team.filter((t) => t.group === "leader");
  const facilitators = team.filter((t) => t.group !== "leader");
  const firstYear = history[0]?.year ?? 2019;
  const liveNow = streams.some((s) => s.status === "live");
  const streamDTO = streams.map((s) => ({ id: s.id, title: s.title, description: s.description, streamUrl: s.streamUrl, status: s.status, host: s.host, scheduledAt: s.scheduledAt.toISOString() }));
  const countries = new Set(team.map((t) => t.country).filter(Boolean)).size;

  return (
    <div>
      {/* ================= HERO ================= */}
      <section className="aurora-bg relative overflow-hidden text-white">
        <div className="grid-bg absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="absolute inset-y-0 right-0 hidden w-1/2 opacity-80 lg:block">
          <DnaHelix colorA="#fbbf24" colorB="#f87171" letters="LEADERSCHAMPIONSHISTORYLIVE" speed={0.35} />
        </div>
        <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 lg:pt-24">
          <Reveal>
            <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
              <Icon name="people" size={16} /> About Gelan English Club {liveNow && <span className="flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />LIVE NOW</span>}
            </span>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="mt-6 max-w-3xl font-display text-5xl font-bold leading-[1.02] md:text-7xl">
              The people, the champions &amp; the <span className="text-gradient">story</span> behind the club.
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-6 max-w-xl text-lg text-white/75">
              From six friends at a café table to a global community with live rooms, AI tutors and championship trophies.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <dl className="mt-12 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-4">
              {[
                ["Years", new Date().getFullYear() - firstYear, ""],
                ["Leaders & facilitators", team.length, ""],
                ["Events hosted", 1000 + ev.c, "+"],
                ["Members", 320 + us.c, "+"],
              ].map(([k, v, s]) => (
                <div key={k as string}>
                  <dt className="text-[11px] uppercase tracking-wider text-white/50">{k}</dt>
                  <dd className="font-display text-4xl font-bold"><Counter to={v as number} suffix={s as string} /></dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <AboutNav live={liveNow} />

      {/* ================= STORY ================= */}
      <section id="story" className="scroll-mt-32">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-2">
          <Reveal from="left">
            <div className="relative">
              <div className="absolute -left-4 -top-4 h-full w-full rotate-[-3deg] rounded-[2rem] bg-gold/30" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/history.jpg" alt="A community English club meetup" className="relative aspect-[4/3] w-full rounded-[2rem] object-cover shadow-2xl" />
              <div className="animate-floaty absolute -bottom-6 -right-4 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">Est.</p>
                <p className="font-display text-3xl font-bold">{firstYear}</p>
              </div>
            </div>
          </Reveal>
          <div>
            <Reveal>
              <p className="text-sm font-semibold uppercase tracking-widest text-brand">Our story</p>
              <h2 className="mt-2 font-display text-4xl font-bold md:text-5xl">It started with a handwritten sign.</h2>
              <p className="mt-5 text-lg leading-relaxed text-muted">
                In {firstYear}, a handful of friends — some learning English, some native speakers — propped up a paper sign that read
                &ldquo;English Club&rdquo; against a teapot. Strangers sat down. They kept coming back.
              </p>
              <p className="mt-4 leading-relaxed text-muted">
                Today Gelan English Club is run by {leaders.length} leaders and {facilitators.length} volunteer facilitators from {countries} countries, and our mission
                hasn&apos;t changed: a safe, fun and free place to practise real English with real people.
              </p>
            </Reveal>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {VALUES.map(([icon, t, d], k) => (
                <Reveal key={t} delay={k * 80}>
                  <div className="h-full rounded-2xl bg-white p-4 ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md">
                    <p className="flex items-center gap-2 font-semibold"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><Icon name={icon} size={18} /></span>{t}</p>
                    <p className="mt-1 text-sm text-muted">{d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {SCHEDULE.map(([d, w, t]) => (
                <span key={d} className="rounded-full bg-paper px-3 py-1.5 text-xs"><strong>{d}</strong> · {w} · {t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= HISTORY ================= */}
      <section id="history" className="scroll-mt-28 bg-[#0f1424] py-24 text-white">
        <div className="mx-auto max-w-6xl px-5">
          <div>
            <p className="text-center text-sm font-semibold uppercase tracking-widest text-gold">Our history</p>
            <h2 className="mt-2 text-center font-display text-4xl font-bold md:text-5xl">{firstYear} → today → tomorrow</h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-white/60">Scroll through the moments that shaped the club. The line lights up as you travel through time.</p>
          </div>
          <div className="mt-16">
            <Timeline items={history.map((m) => ({ id: m.id, year: m.year, month: m.month, title: m.title, description: m.description, icon: m.icon, imageUrl: m.imageUrl }))} />
          </div>
        </div>
      </section>

      {/* ================= LEADERS ================= */}
      <section id="leaders" className="scroll-mt-28 py-24">
        <div className="mx-auto max-w-7xl px-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand">Leadership team</p>
            <h2 className="mt-2 font-display text-4xl font-bold md:text-5xl">Meet the leaders</h2>
            <p className="mt-3 max-w-2xl text-muted">The team shaping the club, building welcoming spaces and helping our community grow.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {leaders.map((l) => (
                <article key={l.id} aria-labelledby={`leader-${l.id}`} className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-[0_14px_50px_rgba(20,27,44,.08)] ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(20,27,44,.14)] motion-reduce:transform-none motion-reduce:transition-none">
                  <div className="relative h-56 overflow-hidden bg-ink sm:h-64">
                    {l.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.photoUrl} alt="" loading="lazy" className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none" />
                    ) : (
                      <div className="grid h-full place-items-center font-display text-7xl font-bold text-white" style={{ background: `linear-gradient(145deg, ${l.color}, #0f1424)` }}>{initials(l.name)}</div>
                    )}
                    <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
                      <span className="inline-flex rounded-full px-3 py-1 text-[11px] font-bold tracking-wide" style={{ background: l.color }}>{l.title}</span>
                      <h3 id={`leader-${l.id}`} className="mt-3 font-display text-2xl font-bold leading-tight sm:text-3xl">{l.name}</h3>
                      <p className="mt-1 text-sm text-white/75">{l.country}{l.joinedYear ? ` · since ${l.joinedYear}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <p className="font-display text-lg font-semibold leading-snug text-ink">&ldquo;{l.quote}&rdquo;</p>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{l.bio}</p>
                    <div className="mt-auto flex flex-wrap gap-2 pt-5">
                      {l.specialties.split(",").filter(Boolean).map((s) => (
                        <span key={s} className="rounded-full bg-paper px-3 py-1.5 text-xs font-semibold text-ink/75">{s.trim()}</span>
                      ))}
                    </div>
                  </div>
                </article>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FACILITATORS ================= */}
      <section id="facilitators" className="scroll-mt-28 bg-paper py-24">
        <div className="mx-auto max-w-7xl px-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand">The heart of every session</p>
            <h2 className="mt-2 font-display text-4xl font-bold md:text-5xl">Our facilitators</h2>
            <p className="mt-3 max-w-2xl text-muted">Volunteers who guide conversations, run workshops and make every newcomer feel at home.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {facilitators.map((f) => (
                <article key={f.id} aria-labelledby={`facilitator-${f.id}`} className="group h-full rounded-3xl bg-white p-6 text-center shadow-[0_14px_50px_rgba(20,27,44,.07)] ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(20,27,44,.12)] motion-reduce:transform-none motion-reduce:transition-none">
                    <div className="relative mx-auto h-24 w-24 rounded-full p-[3px] transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none" style={{ background: `conic-gradient(${f.color}, #d9a441, ${f.color})` }}>
                      <div className="absolute inset-[3px] grid place-items-center overflow-hidden rounded-full bg-white">
                        {f.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={f.photoUrl} alt="" loading="lazy" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          <span className="grid h-full w-full place-items-center rounded-full font-display text-3xl font-bold text-white" style={{ background: f.color }}>{initials(f.name)}</span>
                        )}
                      </div>
                    </div>
                    <h3 id={`facilitator-${f.id}`} className="mt-4 font-display text-xl font-bold">{f.name}</h3>
                    <p className="mt-1 text-sm font-semibold" style={{ color: f.color }}>{f.title}</p>
                    <p className="text-xs text-muted">{f.country}{f.joinedYear ? ` · since ${f.joinedYear}` : ""}</p>
                    {f.bio && <p className="mt-4 text-sm leading-relaxed text-muted">{f.bio}</p>}
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      {f.specialties.split(",").filter(Boolean).map((s) => (
                        <span key={s} className="rounded-full bg-paper px-3 py-1.5 text-xs font-medium text-ink/75">{s.trim()}</span>
                      ))}
                    </div>
                </article>
            ))}
            <Link href="/contact" className="group grid h-full min-h-[260px] place-items-center rounded-3xl border border-dashed border-brand/40 bg-white/55 p-6 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand hover:bg-white hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand motion-reduce:transform-none motion-reduce:transition-none">
              <div>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand"><Icon name="people" size={24} /></span>
                <p className="mt-4 font-display text-xl font-bold">This could be you</p>
                <p className="mt-1 text-sm text-muted">Become a volunteer facilitator</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">Explore volunteering <Icon name="arrow-up-right" size={16} /></span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ================= CHAMPIONS ================= */}
      <section id="champions" className="scroll-mt-28 py-24">
        <div className="mx-auto max-w-7xl px-5">
          <Reveal>
            <p className="text-center text-sm font-semibold uppercase tracking-widest text-brand">Hall of champions</p>
            <h2 className="mt-2 text-center font-display text-4xl font-bold md:text-5xl">Winners &amp; champions</h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-muted">Debate champions, Golden Mic speakers, spelling bee legends — and this month&apos;s top XP earners.</p>
          </Reveal>

          {xpTop.length > 0 && (
            <Reveal delay={100}>
              <div className="mx-auto mt-10 max-w-4xl rounded-3xl bg-gradient-to-r from-amber-100 via-white to-rose-100 p-5 ring-1 ring-gold/30">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 font-display text-lg font-bold"><Icon name="sparkles" size={20} className="text-gold" />{xpLabel} <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 align-middle text-[10px] font-bold text-emerald-800">LIVE</span></p>
                  <Link href="/leaderboard" className="text-sm font-semibold text-brand hover:underline">Full leaderboard →</Link>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {xpTop.map((u, i) => (
                    <div key={u.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
                      <span className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 text-xs font-bold text-brand"><Icon name="award" size={16} />#{i + 1}</span>
                      <Avatar name={u.displayName} color={u.avatarColor} size={40} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{u.displayName}</p>
                        <p className="text-xs text-muted">{u.total.toLocaleString()} XP · {u.country}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          )}

          <div className="mt-12">
            <ChampionsHall
              items={champs.map((c) => ({ id: c.id, name: c.name, award: c.award, competition: c.competition, category: c.category, place: c.place, season: c.season, year: c.year, country: c.country, photoUrl: c.photoUrl, description: c.description }))}
            />
          </div>
        </div>
      </section>

      {/* ================= LIVESTREAM ================= */}
      <section id="live" className="scroll-mt-28 relative overflow-hidden bg-[#0b0f1a] py-24 text-white">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-red-600/20 blur-3xl" />
        <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-5">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-red-400">
                  <span className={`h-2 w-2 rounded-full bg-red-500 ${liveNow ? "live-glow" : ""}`} /> Gelan Live
                </p>
                <h2 className="mt-2 font-display text-4xl font-bold md:text-5xl">{liveNow ? "We're live right now!" : "Livestream"}</h2>
                <p className="mt-2 max-w-xl text-white/60">Championship finals, open mics, masterclasses and watch parties, streamed to members everywhere.</p>
              </div>
            </div>
          </Reveal>
          <div className="mt-10">
            <LiveHub streams={streamDTO} loggedIn={!!me} />
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section id="faq" className="scroll-mt-28 mx-auto max-w-3xl px-5 pt-24">
        <Reveal>
          <h2 className="text-center font-display text-4xl font-bold">Frequently asked questions</h2>
        </Reveal>
        <div className="mt-8 space-y-3">
          {FAQ.map(([q, a], i) => (
            <Reveal key={q} delay={i * 60}>
              <details className="group rounded-2xl bg-white p-5 ring-1 ring-black/5 open:shadow-md">
                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
                  {q}
                  <span className="ml-4 text-xl text-brand transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 leading-relaxed text-muted">{a}</p>
              </details>
            </Reveal>
          ))}
        </div>
        <p className="mt-8 text-center text-muted">
          Still curious? <Link href="/contact" className="font-semibold text-brand hover:underline">Send us a message</Link>.
        </p>
      </section>
    </div>
  );
}
