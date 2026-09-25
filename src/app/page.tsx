import Image from "next/image";
import Link from "next/link";
import EventCard from "@/components/EventCard";
import { getUpcomingEvents } from "@/lib/queries";
import { wordOfTheDay } from "@/lib/words";
import { db } from "@/db";
import { announcements, blogPosts, chatMessages, members, rsvps, users } from "@/db/schema";
import { ANNOUNCE_STYLES } from "@/lib/announce";
import { and, desc, eq, gt, isNull, or, sql } from "drizzle-orm";
import DnaHelix from "@/components/fx/DnaHelix";
import WordGlobe from "@/components/fx/WordGlobe";
import { Counter, Marquee, Reveal, TiltCard, Typewriter } from "@/components/fx/Effects";
import { Avatar } from "@/components/SiteHeader";
import { levelFromXp, rankTitle } from "@/lib/xp";

export const dynamic = "force-dynamic";

const FEATURES = [
  { href: "/meet", icon: "📹", title: "Live Video Rooms", text: "Spin up a peer-to-peer video meeting in one click. Screen share, reactions, in-room chat.", color: "from-emerald-400 to-teal-600" },
  { href: "/learn", icon: "🧠", title: "AI Learning Lab", text: "IELTS, SAT & TOEFL tutors, instant essay band scores and timed quizzes.", color: "from-rose-400 to-red-600" },
  { href: "/speak", icon: "🎙️", title: "Speaking Studio", text: "Talk out loud with an AI partner and get your pronunciation scored in real time.", color: "from-violet-400 to-purple-700" },
  { href: "/chat", icon: "💬", title: "Chat Channels", text: "Grammar help, IELTS prep, book club and more — live community chat rooms.", color: "from-sky-400 to-blue-700" },
  { href: "/leaderboard", icon: "🏆", title: "XP & Rankings", text: "Earn XP for everything you do. Level up, unlock badges, keep your streak.", color: "from-amber-300 to-orange-600" },
  { href: "/events", icon: "☕", title: "Real-World Meetups", text: "Conversation circles, debates, book club and movie nights near you.", color: "from-pink-400 to-rose-600" },
  { href: "/groups", icon: "👥", title: "Study Groups", text: "Tongue twisters, vocabulary, debate, grammar and more — each with a weekly challenge.", color: "from-fuchsia-400 to-violet-700" },
  { href: "/games", icon: "🧩", title: "Word Games", text: "Crosswords, scrambles, hangman and tongue-twister races with leaderboards.", color: "from-indigo-400 to-violet-600" },
  { href: "/submit", icon: "✅", title: "Verified Work", text: "Send essays, recordings or certificates for review and get a shareable verification code.", color: "from-teal-400 to-emerald-700" },
];

const DNA_STEPS = [
  { k: "01", title: "Listen", text: "Shadow native audio, join book club readings and let the rhythm of English sink in.", icon: "🎧" },
  { k: "02", title: "Speak", text: "Voice-chat with Wordy, our AI partner, then test yourself in a live video room with real members.", icon: "🗣️" },
  { k: "03", title: "Read", text: "Blog articles, SAT passages and monthly novels build vocabulary in context.", icon: "📖" },
  { k: "04", title: "Write", text: "Get IELTS-style band scores on your essays in seconds, with line-by-line fixes.", icon: "✍️" },
];

const PHRASES = ["Break the ice", "Piece of cake", "Hit the books", "Speak your mind", "On cloud nine", "Once in a blue moon", "The ball is in your court", "Spill the beans", "Under the weather", "Bite the bullet", "Cost an arm and a leg", "Every cloud has a silver lining"];

const TESTIMONIALS = [
  { quote: "The AI essay grader took me from IELTS 6.0 to 7.5 in two months. The live rooms gave me the confidence for the speaking test.", name: "Kenji T.", from: "Japan" },
  { quote: "It's not a class, it's a community. I've made real friends from twelve different countries — and I'm #1 on the leaderboard 😎", name: "Lucía R.", from: "Argentina" },
  { quote: "The pronunciation drills are addictive. I practise 'th' sounds on the bus every morning.", name: "Amira K.", from: "Egypt" },
];

async function getData() {
  const [[m], [r], [c], top, posts, news] = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(members),
    db.select({ c: sql<number>`count(*)::int` }).from(rsvps),
    db.select({ c: sql<number>`count(*)::int` }).from(chatMessages),
    db.select().from(users).where(eq(users.banned, false)).orderBy(desc(users.xp)).limit(5),
    db.select().from(blogPosts).where(eq(blogPosts.published, true)).orderBy(desc(blogPosts.createdAt)).limit(3),
    db
      .select()
      .from(announcements)
      .where(and(eq(announcements.published, true), or(isNull(announcements.expiresAt), gt(announcements.expiresAt, new Date()))))
      .orderBy(desc(announcements.pinned), desc(announcements.createdAt))
      .limit(3),
  ]);
  return { members: m.c, rsvps: r.c, chats: c.c, top, posts, news };
}

export default async function Home() {
  const upcoming = await getUpcomingEvents({ limit: 3 });
  const data = await getData();
  const word = wordOfTheDay();

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="aurora-bg relative -mt-px overflow-hidden text-white">
        <div className="grid-bg absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-6 px-5 pb-24 pt-16 lg:grid-cols-[1.1fr_1fr] lg:pt-24">
          <div>
            <Reveal>
              <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" /></span>
                Live rooms · AI tutors · Weekly meetups
              </span>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="mt-6 font-display text-5xl font-bold leading-[1.02] md:text-7xl">
                Master English
                <br />
                with <Typewriter className="text-gradient" words={["confidence.", "real people.", "AI tutors.", "IELTS 8.0.", "your voice.", "friends."]} />
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
                Gelan English Club brings together live video rooms, community chat, an AI lab for IELTS, SAT
                &amp; TOEFL, a voice speaking studio — and cozy real-world meetups.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/login" className="btn-primary !px-6 !py-3.5 shadow-lg shadow-brand/40">Start free — earn XP ⚡</Link>
                <Link href="/meet" className="glass inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-semibold hover:bg-white/15">📹 Open a video room</Link>
              </div>
            </Reveal>
            <Reveal delay={400}>
              <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6">
                {[
                  ["Members", 320 + data.members + data.top.length, "+"],
                  ["Chat messages", 4800 + data.chats, ""],
                  ["RSVPs", 1200 + data.rsvps, ""],
                ].map(([k, v, s]) => (
                  <div key={k as string}>
                    <dt className="text-[11px] uppercase tracking-wider text-white/50">{k}</dt>
                    <dd className="font-display text-3xl font-bold"><Counter to={v as number} suffix={s as string} /></dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
          <div className="relative h-[460px] lg:h-[620px]">
            <div className="absolute inset-0 animate-spin-slow rounded-full border border-dashed border-white/10" />
            <div className="absolute inset-12 animate-spin-slow rounded-full border border-white/5 [animation-direction:reverse]" />
            <DnaHelix className="absolute inset-0" />
            <div className="glass animate-floaty absolute left-0 top-10 rounded-2xl p-4 text-sm shadow-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gold">Word of the day</p>
              <p className="font-display text-2xl font-bold">{word.word}</p>
              <p className="text-xs text-white/60">{word.phonetic}</p>
            </div>
            <div className="glass animate-floaty absolute bottom-16 right-0 rounded-2xl p-4 text-sm shadow-2xl [animation-delay:-3s]">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300">IELTS estimate</p>
              <p className="font-display text-3xl font-bold">7.5 <span className="text-sm text-white/60">band</span></p>
            </div>
          </div>
        </div>
        <div className="relative border-y border-white/10 bg-white/5 py-4">
          <Marquee items={PHRASES.map((p) => <span key={p} className="font-display text-xl italic text-white/70">✦ {p}</span>)} />
        </div>
      </section>

      {/* ============ ANNOUNCEMENTS ============ */}
      {data.news.length > 0 && (
        <section className="relative z-10 mx-auto -mt-10 max-w-7xl px-5">
          <div className="grid gap-3 md:grid-cols-3">
            {data.news.map((a, i) => {
              const st = ANNOUNCE_STYLES[a.category] ?? ANNOUNCE_STYLES.news;
              return (
                <Reveal key={a.id} delay={i * 80}>
                  <Link href={`/announcements#a-${a.id}`} className="group flex h-full items-start gap-3 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${st.bar} text-lg`}>{st.icon}</span>
                    <span className="min-w-0">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted">{a.pinned ? "📌 " : ""}{st.label}</span>
                      <span className="block font-semibold leading-snug group-hover:text-brand">{a.title}</span>
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
          <p className="mt-3 text-right text-sm"><Link href="/announcements" className="font-semibold text-brand hover:underline">All announcements →</Link></p>
        </section>
      )}

      {/* ============ FEATURES ============ */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-5">
          <Reveal>
            <p className="text-center text-sm font-semibold uppercase tracking-widest text-brand">Everything in one club</p>
            <h2 className="mx-auto mt-2 max-w-3xl text-center font-display text-4xl font-bold md:text-5xl">Nine superpowers for your English</h2>
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.href} delay={i * 80}>
                <TiltCard className="h-full rounded-3xl">
                  <Link href={f.href} className="group block h-full overflow-hidden rounded-3xl bg-white p-7 shadow-sm ring-1 ring-black/5 transition hover:shadow-xl">
                    <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${f.color} text-2xl shadow-lg transition group-hover:scale-110 group-hover:rotate-6`}>{f.icon}</div>
                    <h3 className="mt-5 font-display text-2xl font-bold">{f.title}</h3>
                    <p className="mt-2 text-muted">{f.text}</p>
                    <p className="mt-5 text-sm font-semibold text-brand">Explore <span className="inline-block transition group-hover:translate-x-1">→</span></p>
                  </Link>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ LANGUAGE DNA (sticky scroll) ============ */}
      <section className="relative bg-ink text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-2">
          <div className="lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] py-16 lg:py-0">
            <div className="relative h-[420px] lg:h-full">
              <DnaHelix className="absolute inset-0" colorA="#34d399" colorB="#a78bfa" letters="LISTENSPEAKREADWRITE" scrollFactor={0.012} speed={0.25} nodes={40} turns={3.4} />
              <div className="pointer-events-none absolute inset-x-0 top-10 text-center lg:top-24">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Scroll to spin</p>
              </div>
            </div>
          </div>
          <div className="py-10 lg:py-32">
            <p className="text-sm font-semibold uppercase tracking-widest text-gold">Your language DNA</p>
            <h2 className="mt-2 font-display text-4xl font-bold md:text-5xl">Four strands. One fluent you.</h2>
            <p className="mt-4 max-w-md text-white/60">Every skill is twisted together. We train them all — and the helix spins faster the further you scroll.</p>
            <div className="mt-16 space-y-[28vh] pb-[10vh]">
              {DNA_STEPS.map((s, i) => (
                <Reveal key={s.k} from={i % 2 ? "right" : "left"}>
                  <div className="glass rounded-3xl p-8">
                    <div className="flex items-center gap-4">
                      <span className="font-display text-6xl font-bold text-white/10">{s.k}</span>
                      <span className="text-4xl">{s.icon}</span>
                    </div>
                    <h3 className="mt-3 font-display text-3xl font-bold">{s.title}</h3>
                    <p className="mt-2 text-white/70">{s.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ WORD GLOBE + LEADERBOARD ============ */}
      <section className="py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2">
          <Reveal from="scale">
            <div className="relative aspect-square max-h-[560px] w-full">
              <div className="absolute inset-8 rounded-full bg-gradient-to-br from-gold/20 via-brand/10 to-violet-400/20 blur-2xl" />
              <WordGlobe className="relative" />
              <p className="absolute bottom-2 w-full text-center text-xs text-muted">✋ Drag to spin the word globe</p>
            </div>
          </Reveal>
          <div>
            <Reveal>
              <p className="text-sm font-semibold uppercase tracking-widest text-brand">Hall of fame</p>
              <h2 className="mt-2 font-display text-4xl font-bold md:text-5xl">This week&apos;s top wordsmiths</h2>
              <p className="mt-3 text-muted">Earn XP from quizzes, chats, speaking drills and meetings. Can you make the podium?</p>
            </Reveal>
            <ol className="mt-8 space-y-3">
              {data.top.map((u, i) => (
                <Reveal key={u.id} delay={i * 90} from="right">
                  <li className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md">
                    <span className={`grid h-9 w-9 place-items-center rounded-full font-display text-lg font-bold ${i === 0 ? "bg-gold text-white" : i === 1 ? "bg-gray-300" : i === 2 ? "bg-amber-700/70 text-white" : "bg-paper"}`}>{i + 1}</span>
                    <Avatar name={u.displayName} color={u.avatarColor} size={40} />
                    <div className="flex-1">
                      <p className="font-semibold">{u.displayName} <span className="text-xs text-muted">{u.country}</span></p>
                      <p className="text-xs text-muted">Lv {levelFromXp(u.xp)} · {rankTitle(u.xp)} {u.streak ? `· 🔥 ${u.streak}` : ""}</p>
                    </div>
                    <span className="font-display text-xl font-bold text-brand">{u.xp.toLocaleString()} <span className="text-xs text-muted">XP</span></span>
                  </li>
                </Reveal>
              ))}
            </ol>
            <Link href="/leaderboard" className="btn-ghost mt-6 text-sm">Full leaderboard →</Link>
          </div>
        </div>
      </section>

      {/* ============ EVENTS ============ */}
      <section className="bg-paper py-24">
        <div className="mx-auto max-w-7xl px-5">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-brand">In real life</p>
                <h2 className="mt-2 font-display text-4xl font-bold">Upcoming meetups</h2>
              </div>
              <Link href="/events" className="text-sm font-semibold text-brand hover:underline">View the full calendar →</Link>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {upcoming.map((e, i) => (
              <Reveal key={e.id} delay={i * 100}><EventCard event={e} /></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ BLOG ============ */}
      {data.posts.length > 0 && (
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-5">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 className="font-display text-4xl font-bold">Fresh from the blog</h2>
                <Link href="/blog" className="text-sm font-semibold text-brand hover:underline">All articles →</Link>
              </div>
            </Reveal>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {data.posts.map((p, i) => (
                <Reveal key={p.id} delay={i * 100}>
                  <Link href={`/blog/${p.slug}`} className="group block overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-xl">
                    <div className="relative aspect-[16/10] overflow-hidden bg-paper">
                      {p.coverImage && <Image src={p.coverImage} alt="" fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover transition duration-700 group-hover:scale-110" />}
                    </div>
                    <div className="p-6">
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand">{p.tags.split(",")[0]}</p>
                      <h3 className="mt-2 font-display text-xl font-bold leading-snug group-hover:text-brand">{p.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm text-muted">{p.excerpt}</p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ TESTIMONIALS ============ */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 120}>
                <TiltCard className="h-full rounded-3xl">
                  <figure className="h-full rounded-3xl bg-white p-7 shadow-sm ring-1 ring-black/5">
                    <span className="font-display text-6xl leading-none text-gold">&ldquo;</span>
                    <blockquote className="-mt-3 leading-relaxed">{t.quote}</blockquote>
                    <figcaption className="mt-5 text-sm"><span className="font-semibold">{t.name}</span> <span className="text-muted">· {t.from}</span></figcaption>
                  </figure>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="mx-auto max-w-7xl px-5">
        <Reveal from="scale">
          <div className="aurora-bg relative overflow-hidden rounded-[2.5rem] px-8 py-16 text-white md:px-16">
            <div className="grid-bg absolute inset-0 opacity-50" />
            <div className="absolute -right-10 top-0 hidden h-full w-1/2 md:block">
              <DnaHelix horizontal nodes={26} turns={2} speed={0.9} />
            </div>
            <div className="relative max-w-xl">
              <h2 className="font-display text-4xl font-bold md:text-5xl">Your first 100 XP are waiting.</h2>
              <p className="mt-4 text-white/75">Create a free account, take a quiz, say hi in #general and join your first live room today.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/login" className="inline-flex rounded-full bg-white px-6 py-3 font-semibold text-brand hover:bg-cream">Create free account</Link>
                <Link href="/speak" className="glass inline-flex rounded-full px-6 py-3 font-semibold hover:bg-white/15">🎙️ Try the Speaking Studio</Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
