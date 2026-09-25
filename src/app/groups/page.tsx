import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/db";
import { groupMembers, studyGroups } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import { ensureSeed } from "@/lib/seed";
import { GROUP_CATEGORIES } from "@/lib/group-categories";
import { getCurrentUser } from "@/lib/session";
import { Reveal, TiltCard } from "@/components/fx/Effects";
import { joinGroupAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Study groups", description: "Join Gelan English Club study groups: tongue twisters, vocabulary, debate, grammar, pronunciation, exam prep and more." };

export default async function GroupsPage({ searchParams }: { searchParams: Promise<{ cat?: string; mine?: string; q?: string }> }) {
  await ensureSeed();
  const { cat, mine, q } = await searchParams;
  const user = await getCurrentUser();
  const activeCat = cat && GROUP_CATEGORIES[cat] ? cat : undefined;
  const query = (q ?? "").trim().toLowerCase().slice(0, 60);

  const rows = await db
    .select({
      g: studyGroups,
      members: sql<number>`count(${groupMembers.id}) filter (where ${groupMembers.status} = 'active')::int`,
      myStatus: user ? sql<string | null>`max(case when ${groupMembers.userId} = ${user.id} then ${groupMembers.status} end)` : sql<string | null>`null`,
    })
    .from(studyGroups)
    .leftJoin(groupMembers, eq(groupMembers.groupId, studyGroups.id))
    .groupBy(studyGroups.id)
    .orderBy(asc(studyGroups.id));

  let list = rows;
  if (activeCat) list = list.filter((r) => r.g.category === activeCat);
  if (mine) list = list.filter((r) => r.myStatus);
  if (query) list = list.filter((r) => `${r.g.name} ${r.g.description} ${r.g.category}`.toLowerCase().includes(query));
  const myCount = rows.filter((r) => r.myStatus === "active").length;

  return (
    <div>
      <section className="aurora-bg relative overflow-hidden text-white">
        <div className="grid-bg absolute inset-0 opacity-50" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Object.values(GROUP_CATEGORIES).map((c, i) => (
            <span key={c.label} className="animate-floaty absolute text-4xl opacity-20" style={{ left: `${(i * 97) % 95}%`, top: `${(i * 53) % 80 + 5}%`, animationDelay: `${-i * 0.7}s` }}>{c.icon}</span>
          ))}
        </div>
        <div className="relative mx-auto max-w-7xl px-5 py-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">👥 Find your people</p>
          <h1 className="mt-2 font-display text-5xl font-bold md:text-6xl">Study <span className="text-gradient">groups</span></h1>
          <p className="mt-3 max-w-xl text-lg text-white/75">Small communities with weekly challenges, discussion boards and friendly moderators. Join as many as you like.</p>
          <form className="mt-6 flex max-w-md gap-2">
            {activeCat && <input type="hidden" name="cat" value={activeCat} />}
            <input name="q" defaultValue={q} placeholder="Search groups…" className="w-full rounded-full bg-white/10 px-5 py-3 text-white outline-none ring-1 ring-white/20 placeholder:text-white/50 focus:bg-white/15" />
            <button className="rounded-full bg-white px-5 font-semibold text-ink">Search</button>
          </form>
          {user && <p className="mt-4 text-sm text-white/70">You&apos;re in <strong className="text-gold">{myCount}</strong> group{myCount === 1 ? "" : "s"}.</p>}
        </div>
      </section>

      <div className="sticky top-16 z-30 border-b border-black/5 bg-cream/85 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl gap-1.5 overflow-x-auto px-5 py-2.5 [scrollbar-width:none]">
          <Link href="/groups" className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold ${!activeCat && !mine ? "bg-ink text-white" : "bg-white ring-1 ring-black/10"}`}>All</Link>
          {user && <Link href="/groups?mine=1" className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold ${mine ? "bg-ink text-white" : "bg-white ring-1 ring-black/10"}`}>⭐ My groups</Link>}
          {Object.entries(GROUP_CATEGORIES).map(([k, v]) => (
            <Link key={k} href={`/groups?cat=${k}`} className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold ${activeCat === k ? "bg-ink text-white" : "bg-white ring-1 ring-black/10 hover:bg-paper"}`}>{v.icon} {v.label}</Link>
          ))}
        </nav>
      </div>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map(({ g, members, myStatus }, i) => {
            const cat = GROUP_CATEGORIES[g.category];
            const full = members >= g.maxMembers;
            return (
              <Reveal key={g.id} delay={(i % 6) * 60}>
                <TiltCard className="h-full rounded-3xl">
                  <div className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-xl">
                    <Link href={`/groups/${g.slug}`} className="relative block h-32 overflow-hidden" style={{ background: `linear-gradient(135deg, ${g.color}, #0f1424)` }}>
                      <div className="grid-bg absolute inset-0 opacity-40" />
                      <span className="absolute bottom-3 left-5 text-6xl transition duration-500 group-hover:-rotate-12 group-hover:scale-125">{g.emoji}</span>
                      <span className="glass absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white">{cat?.icon} {cat?.label ?? g.category}</span>
                      {g.joinPolicy === "approval" && <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-bold text-white">🔒 Approval</span>}
                    </Link>
                    <div className="flex flex-1 flex-col p-5">
                      <Link href={`/groups/${g.slug}`} className="font-display text-2xl font-bold hover:text-brand">{g.name}</Link>
                      <p className="mt-1 line-clamp-2 text-sm text-muted">{g.description}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                        <span className="rounded-full bg-paper px-2 py-0.5">🎓 {g.level}</span>
                        {g.schedule && <span className="rounded-full bg-paper px-2 py-0.5">🗓 {g.schedule}</span>}
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-5">
                        <span className="text-sm text-muted"><strong className="text-ink">{members}</strong> member{members === 1 ? "" : "s"}</span>
                        {myStatus === "active" ? (
                          <Link href={`/groups/${g.slug}`} className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-800">✓ Joined</Link>
                        ) : myStatus === "pending" ? (
                          <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-800">⏳ Requested</span>
                        ) : full ? (
                          <span className="rounded-full bg-paper px-4 py-2 text-sm font-bold text-muted">Full</span>
                        ) : (
                          <form action={joinGroupAction}>
                            <input type="hidden" name="slug" value={g.slug} />
                            <button className="btn-primary !px-4 !py-2 text-sm">{g.joinPolicy === "approval" ? "Request to join" : "Join"}</button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
        {!list.length && <p className="rounded-3xl bg-white p-10 text-center text-muted ring-1 ring-black/5">No groups match. <Link href="/groups" className="text-brand underline">See all groups</Link>.</p>}
        {!user && (
          <div className="mt-10 rounded-3xl bg-ink p-8 text-center text-white">
            <p className="font-display text-2xl font-bold">New here?</p>
            <p className="mt-1 text-white/70">Create a free account and pick your groups during sign-up.</p>
            <Link href="/login?next=/groups" className="btn-primary mt-5">Sign up & choose groups</Link>
          </div>
        )}
      </section>
    </div>
  );
}
