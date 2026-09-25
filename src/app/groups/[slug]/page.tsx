import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/db";
import { groupMembers, groupPosts, studyGroups, submissions, users } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { ensureSeed } from "@/lib/seed";
import { GROUP_CATEGORIES } from "@/lib/group-categories";
import { getCurrentUser } from "@/lib/session";
import { levelFromXp } from "@/lib/xp";
import { timeAgo } from "@/lib/format";
import { Avatar } from "@/components/SiteHeader";
import { deleteGroupPostAction, joinGroupAction, leaveGroupAction } from "../actions";
import GroupPostForm from "./GroupPostForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [g] = await db.select().from(studyGroups).where(eq(studyGroups.slug, slug));
  return { title: g ? `${g.name} · Groups` : "Group", description: g?.description };
}

export default async function GroupPage({ params }: { params: Promise<{ slug: string }> }) {
  await ensureSeed();
  const { slug } = await params;
  const [g] = await db.select().from(studyGroups).where(eq(studyGroups.slug, slug));
  if (!g) notFound();
  const user = await getCurrentUser();

  const [members, posts, verified] = await Promise.all([
    db
      .select({ id: users.id, displayName: users.displayName, avatarColor: users.avatarColor, xp: users.xp, country: users.country, role: groupMembers.role, status: groupMembers.status })
      .from(groupMembers)
      .innerJoin(users, eq(users.id, groupMembers.userId))
      .where(eq(groupMembers.groupId, g.id))
      .orderBy(desc(users.xp)),
    db
      .select({ id: groupPosts.id, body: groupPosts.body, createdAt: groupPosts.createdAt, userId: users.id, displayName: users.displayName, avatarColor: users.avatarColor, xp: users.xp })
      .from(groupPosts)
      .innerJoin(users, eq(users.id, groupPosts.userId))
      .where(eq(groupPosts.groupId, g.id))
      .orderBy(desc(groupPosts.createdAt))
      .limit(50),
    db
      .select({ title: submissions.title, code: submissions.verificationCode, name: users.displayName, at: submissions.reviewedAt })
      .from(submissions)
      .innerJoin(users, eq(users.id, submissions.userId))
      .where(and(eq(submissions.groupId, g.id), eq(submissions.status, "approved")))
      .orderBy(desc(submissions.reviewedAt))
      .limit(5),
  ]);

  const active = members.filter((m) => m.status === "active");
  const me = user ? members.find((m) => m.id === user.id) : undefined;
  const isMember = me?.status === "active";
  const isMod = me?.role === "moderator" || user?.role === "admin";
  const cat = GROUP_CATEGORIES[g.category];

  return (
    <div>
      <section className="relative overflow-hidden text-white" style={{ background: `linear-gradient(135deg, ${g.color} 0%, #0f1424 75%)` }}>
        <div className="grid-bg absolute inset-0 opacity-40" />
        <span className="animate-floaty pointer-events-none absolute -right-6 top-6 text-[180px] opacity-20">{g.emoji}</span>
        <div className="relative mx-auto max-w-7xl px-5 py-14">
          <Link href="/groups" className="text-sm text-white/70 hover:text-white">← All groups</Link>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
            <div className="flex items-center gap-5">
              <span className="grid h-24 w-24 place-items-center rounded-3xl bg-white/15 text-6xl shadow-2xl backdrop-blur">{g.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-white/70">{cat?.icon} {cat?.label} · {g.level}{g.joinPolicy === "approval" ? " · 🔒 Approval required" : ""}</p>
                <h1 className="font-display text-5xl font-bold">{g.name}</h1>
                {g.schedule && <p className="mt-1 text-sm text-white/70">🗓 {g.schedule}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {active.slice(0, 5).map((m) => <span key={m.id} className="rounded-full ring-2 ring-white/40"><Avatar name={m.displayName} color={m.avatarColor} size={36} /></span>)}
              </div>
              <span className="text-sm text-white/80">{active.length} / {g.maxMembers}</span>
              {!user ? (
                <Link href={`/login?next=/groups/${g.slug}`} className="rounded-full bg-white px-5 py-2.5 font-bold text-ink">Sign in to join</Link>
              ) : isMember ? (
                <form action={leaveGroupAction}><input type="hidden" name="slug" value={g.slug} /><button className="glass rounded-full px-5 py-2.5 text-sm font-bold hover:bg-white/15">Leave group</button></form>
              ) : me?.status === "pending" ? (
                <span className="rounded-full bg-amber-200 px-5 py-2.5 text-sm font-bold text-amber-900">⏳ Request pending</span>
              ) : active.length >= g.maxMembers ? (
                <span className="glass rounded-full px-5 py-2.5 text-sm font-bold">Group full</span>
              ) : (
                <form action={joinGroupAction}><input type="hidden" name="slug" value={g.slug} /><button className="rounded-full bg-white px-6 py-2.5 font-bold text-ink shadow-xl transition hover:scale-105">{g.joinPolicy === "approval" ? "Request to join" : "Join group +10 XP"}</button></form>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5">
            <h2 className="font-display text-xl font-bold">About this group</h2>
            <p className="mt-2 whitespace-pre-line text-ink/80">{g.description}</p>
          </div>

          {g.challenge && (
            <div className="relative overflow-hidden rounded-3xl p-6 text-white" style={{ background: `linear-gradient(120deg, ${g.color}, #7c3aed)` }}>
              <div className="shimmer absolute inset-0 opacity-30" />
              <p className="relative text-xs font-bold uppercase tracking-widest text-white/80">🎯 Weekly challenge</p>
              <p className="relative mt-2 font-display text-2xl font-bold leading-snug">{g.challenge}</p>
              {isMember && (
                <Link href={`/submit?group=${g.slug}&kind=${g.category === "tongue-twister" || g.category === "pronunciation" ? "recording" : "essay"}`} className="relative mt-4 inline-flex rounded-full bg-white px-5 py-2 text-sm font-bold text-ink">📤 Submit your attempt for verification</Link>
              )}
            </div>
          )}

          <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5">
            <h2 className="font-display text-xl font-bold">Discussion</h2>
            {isMember ? (
              <GroupPostForm slug={g.slug} />
            ) : (
              <p className="mt-3 rounded-2xl bg-paper p-4 text-sm text-muted">{user ? "Join the group to take part in the discussion." : "Sign in and join to post."}</p>
            )}
            <ul className="mt-6 space-y-4">
              {posts.map((p) => (
                <li key={p.id} className="flex gap-3">
                  <Avatar name={p.displayName} color={p.avatarColor} size={38} />
                  <div className="min-w-0 flex-1 rounded-2xl bg-paper/70 px-4 py-3">
                    <p className="text-sm">
                      <span className="font-semibold">{p.displayName}</span>
                      <span className="ml-1.5 rounded bg-white px-1.5 text-[10px] font-semibold text-muted">Lv {levelFromXp(p.xp)}</span>
                      <span className="ml-2 text-xs text-muted">{timeAgo(p.createdAt)}</span>
                    </p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-[15px]">{p.body}</p>
                    {(isMod || p.userId === user?.id) && (
                      <form action={deleteGroupPostAction} className="mt-1 text-right">
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="slug" value={g.slug} />
                        <button className="text-[11px] font-semibold text-muted hover:text-rose-700">Delete</button>
                      </form>
                    )}
                  </div>
                </li>
              ))}
              {!posts.length && <li className="py-6 text-center text-sm text-muted">No posts yet — start the conversation!</li>}
            </ul>
          </div>
        </div>

        <aside className="space-y-6">
          {verified.length > 0 && (
            <div className="rounded-3xl bg-emerald-50 p-5 ring-1 ring-emerald-200">
              <p className="font-display text-lg font-bold">✅ Recently verified</p>
              <ul className="mt-3 space-y-2 text-sm">
                {verified.map((v) => (
                  <li key={v.code}><Link href={`/verify/${v.code}`} className="block rounded-xl bg-white p-2.5 hover:shadow"><span className="font-semibold">{v.name}</span><span className="block truncate text-xs text-muted">{v.title}</span></Link></li>
                ))}
              </ul>
            </div>
          )}
          <div className="rounded-3xl bg-white p-5 ring-1 ring-black/5">
            <p className="font-display text-lg font-bold">Members · {active.length}</p>
            <ul className="mt-3 max-h-[420px] space-y-2 overflow-y-auto">
              {active.map((m, i) => (
                <li key={m.id} className="flex items-center gap-3 text-sm">
                  <span className="w-5 text-xs text-muted">{i + 1}</span>
                  <Avatar name={m.displayName} color={m.avatarColor} size={30} />
                  <span className="min-w-0 flex-1 truncate font-medium">{m.displayName}</span>
                  {m.role === "moderator" && <span className="rounded bg-brand px-1.5 text-[10px] font-bold text-white">MOD</span>}
                  <span className="text-xs text-muted">Lv {levelFromXp(m.xp)}</span>
                </li>
              ))}
              {!active.length && <li className="text-sm text-muted">Be the first member!</li>}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
