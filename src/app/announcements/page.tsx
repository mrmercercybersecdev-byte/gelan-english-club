import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import { ensureSeed } from "@/lib/seed";
import Markdown from "@/components/Markdown";
import { ANNOUNCE_STYLES } from "@/lib/announce";
import { formatLongDate, timeAgo } from "@/lib/format";
import { Reveal } from "@/components/fx/Effects";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Announcements", description: "Club news, events and important updates from Gelan English Club organisers." };

export default async function AnnouncementsPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  await ensureSeed();
  const { cat } = await searchParams;
  const active = cat && ANNOUNCE_STYLES[cat] ? cat : undefined;
  const now = new Date();
  const base = and(eq(announcements.published, true), or(isNull(announcements.expiresAt), gt(announcements.expiresAt, now)));
  const list = await db
    .select()
    .from(announcements)
    .where(active ? and(base, eq(announcements.category, active)) : base)
    .orderBy(desc(announcements.pinned), desc(announcements.createdAt))
    .limit(100);

  return (
    <div>
      <section className="aurora-bg relative overflow-hidden text-white">
        <div className="grid-bg absolute inset-0 opacity-50" />
        <div className="relative mx-auto max-w-5xl px-5 py-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">📣 Noticeboard</p>
          <h1 className="mt-2 font-display text-5xl font-bold md:text-6xl">Announcements</h1>
          <p className="mt-3 max-w-xl text-white/70">Club news, events, schedule changes and celebrations — straight from the organisers.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/announcements" className={`rounded-full px-4 py-1.5 text-sm font-semibold ${!active ? "bg-white text-ink" : "glass"}`}>All</Link>
            {Object.entries(ANNOUNCE_STYLES).map(([k, v]) => (
              <Link key={k} href={`/announcements?cat=${k}`} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${active === k ? "bg-white text-ink" : "glass"}`}>
                {v.icon} {v.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-12">
        <ol className="relative space-y-6 border-l-2 border-black/10 pl-8">
          {list.map((a, i) => {
            const st = ANNOUNCE_STYLES[a.category] ?? ANNOUNCE_STYLES.news;
            return (
              <Reveal key={a.id} delay={Math.min(i, 5) * 70}>
                <li id={`a-${a.id}`} className="relative scroll-mt-28">
                  <span className={`absolute -left-[49px] top-5 grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br ${st.bar} text-sm shadow ring-4 ring-cream`}>{st.icon}</span>
                  <article className={`overflow-hidden rounded-3xl bg-white shadow-sm ring-1 transition hover:shadow-lg ${a.pinned ? "ring-gold/60" : "ring-black/5"}`}>
                    <div className={`h-1.5 bg-gradient-to-r ${st.bar}`} />
                    <div className="p-6">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={`rounded-full px-2.5 py-0.5 font-bold ${st.chip}`}>{st.label}</span>
                        {a.pinned && <span className="rounded-full bg-gold/20 px-2.5 py-0.5 font-bold text-amber-900">📌 Pinned</span>}
                        <span className="text-muted" title={formatLongDate(a.createdAt)}>{timeAgo(a.createdAt)} · {a.author}</span>
                        {a.expiresAt && <span className="text-muted">· until {formatLongDate(a.expiresAt)}</span>}
                      </div>
                      <h2 className="mt-3 font-display text-2xl font-bold">{a.title}</h2>
                      <Markdown text={a.body} className="text-ink/85 [&>*:last-child]:mb-0" />
                      {a.linkUrl && (
                        <Link href={a.linkUrl} className="btn-primary mt-4 !py-2 text-sm">{a.linkLabel || "Learn more"} →</Link>
                      )}
                    </div>
                  </article>
                </li>
              </Reveal>
            );
          })}
        </ol>
        {!list.length && <p className="rounded-3xl bg-white p-10 text-center text-muted ring-1 ring-black/5">No announcements right now — check back soon!</p>}
      </section>
    </div>
  );
}
