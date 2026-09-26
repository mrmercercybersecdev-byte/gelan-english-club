import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/db";
import { auditLogs, events, members, messages, posts, rsvps, users, chatMessages, blogPosts, channels, meetRooms, meetPeers, submissions, groupMembers } from "@/db/schema";
import { levelFromXp } from "@/lib/xp";
import { Avatar } from "@/components/SiteHeader";
import BlogEditor from "./BlogEditor";
import { ChampionsTab, HistoryTab, StreamsTab, TeamTab } from "./AboutTabs";
import { AnnouncementsTab, GroupsTab, SubmissionsTab } from "./CommunityTabs";
import { isDefaultAdminPassword } from "@/lib/security";
import ChannelForm from "./ChannelForm";
import {
  clearChannelAction,
  deleteBlogPostAction,
  deleteChannelAction,
  toggleBlogPublishAction,
  userAdminAction,
} from "./admin-actions";
import { desc, asc, eq, gt, sql } from "drizzle-orm";
import { isAdmin, isContentManager } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";
import { formatDate, formatTime, timeAgo } from "@/lib/format";
import {
  deleteEventAction,
  deleteMessageAction,
  deletePostAction,
  logoutAction,
  setMemberStatusAction,
} from "@/app/actions";
import LoginForm from "./LoginForm";
import EventForm from "./EventForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Organiser dashboard", robots: { index: false } };

const TABS = [
  ["submissions", "📤 Submissions"],
  ["announcements", "📣 Announcements"],
  ["groups", "👥 Groups"],
  ["events", "📅 Events & RSVPs"],
  ["blog", "📰 Blog"],
  ["team", "👑 Leaders & facilitators"],
  ["champions", "🏆 Champions"],
  ["history", "📜 History"],
  ["streams", "🔴 Livestreams"],
  ["users", "👥 Users & XP"],
  ["channels", "💬 Chat channels"],
  ["rooms", "📹 Meet rooms"],
  ["members", "✨ Applications"],
  ["messages", "✉️ Messages"],
  ["posts", "💡 Phrase Wall"],
  ["logs", "🛡️ System logs"],
] as const;

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900",
  approved: "bg-emerald-100 text-emerald-900",
  declined: "bg-gray-200 text-gray-700",
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string; edit?: string; status?: string }> }) {
  const fullAdmin = await isAdmin();
  const contentManager = fullAdmin || await isContentManager();
  if (!contentManager) {
    return (
      <div className="mx-auto max-w-md px-5 py-20">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
          <h1 className="font-display text-3xl font-bold">Organiser login</h1>
          <p className="mt-2 text-sm text-muted">This area is for club organisers only.</p>
          <LoginForm showHint={isDefaultAdminPassword()} />
        </div>
      </div>
    );
  }

  await ensureSeed();
  const { tab: rawTab, edit, status } = await searchParams;
  const contentTabs = new Set(["announcements", "blog"]);
  const visibleTabs = fullAdmin ? TABS : TABS.filter(([key]) => contentTabs.has(key));
  const tab = visibleTabs.some(([k]) => k === rawTab) ? rawTab! : fullAdmin ? "submissions" : "blog";

  const c = sql<number>`count(*)::int`;
  const [[subPend], [grpPend]] = await Promise.all([
    db.select({ n: c }).from(submissions).where(eq(submissions.status, "pending")),
    db.select({ n: c }).from(groupMembers).where(eq(groupMembers.status, "pending")),
  ]);
  const [[ev], [mem], [pend], [rs], [msg], [us], [cm], [bp]] = await Promise.all([
    db.select({ n: c }).from(events).where(gt(events.startsAt, sql`now()`)),
    db.select({ n: c }).from(members),
    db.select({ n: c }).from(members).where(eq(members.status, "pending")),
    db.select({ n: c }).from(rsvps),
    db.select({ n: c }).from(messages),
    db.select({ n: c }).from(users),
    db.select({ n: c }).from(chatMessages),
    db.select({ n: c }).from(blogPosts),
  ]);
  const counts = { events: ev.n, members: mem.n, pending: pend.n, rsvps: rs.n, messages: msg.n, users: us.n, chats: cm.n, blog: bp.n };

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-12 sm:px-6 lg:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">Organiser</p>
          <h1 className="mt-1 font-display text-4xl font-bold">Dashboard</h1>
        </div>
        <form action={logoutAction}>
          <button className="btn-ghost text-sm">Log out</button>
        </form>
      </div>

      {isDefaultAdminPassword() && (
        <div className="mt-6 rounded-2xl bg-rose-50 p-4 text-sm text-rose-900 ring-1 ring-rose-200">
          ⚠️ <strong>Security:</strong> organiser password login is not configured. Set the <code>ADMIN_PASSWORD</code> environment variable before going live.
        </div>
      )}
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 2xl:grid-cols-5">
        {[
          ["Submissions to review", subPend.n],
          ["Group join requests", grpPend.n],
          ["Registered users", counts.users],
          ["Chat messages", counts.chats],
          ["Blog posts", counts.blog],
          ["Upcoming events", counts.events],
          ["Total RSVPs", counts.rsvps],
          ["Applications", counts.members],
          ["Pending approval", counts.pending],
          ["Contact messages", counts.messages],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{k}</p>
            <p className="mt-1 font-display text-3xl font-bold">{v}</p>
          </div>
        ))}
      </div>

      <nav aria-label="Dashboard sections" className="mt-10 flex gap-2 overflow-x-auto border-b border-black/10 pb-3">
        {visibleTabs.map(([k, label]) => (
          <Link
            key={k}
            href={`/admin?tab=${k}`}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${tab === k ? "bg-ink text-white" : "hover:bg-black/5"}`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        {tab === "submissions" && <SubmissionsTab status={status ?? "pending"} />}
        {tab === "announcements" && <AnnouncementsTab editId={Number(edit) || 0} />}
        {tab === "groups" && <GroupsTab editId={Number(edit) || 0} />}
        {tab === "events" && <EventsTab />}
        {tab === "blog" && <BlogTab editId={Number(edit) || 0} />}
        {tab === "team" && <TeamTab editId={Number(edit) || 0} />}
        {tab === "champions" && <ChampionsTab editId={Number(edit) || 0} />}
        {tab === "history" && <HistoryTab editId={Number(edit) || 0} />}
        {tab === "streams" && <StreamsTab editId={Number(edit) || 0} />}
        {tab === "users" && <UsersTab />}
        {tab === "channels" && <ChannelsTab />}
        {tab === "rooms" && <RoomsTab />}
        {tab === "members" && <MembersTab />}
        {tab === "messages" && <MessagesTab />}
        {tab === "posts" && <PostsTab />}
        {tab === "logs" && <LogsTab />}
      </div>
    </div>
  );
}

async function LogsTab() {
  const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200);
  return (
    <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-black/5">
      <table className="w-full text-left text-sm">
        <thead className="bg-paper text-xs uppercase tracking-wider text-muted"><tr><th className="p-3">Time</th><th>Actor</th><th>Action</th><th>Target</th><th>Details</th></tr></thead>
        <tbody className="divide-y divide-black/5">
          {logs.map((log) => <tr key={log.id}><td className="whitespace-nowrap p-3 text-xs text-muted">{timeAgo(log.createdAt)}</td><td>{log.actorRole}</td><td className="font-semibold">{log.action}</td><td>{log.targetType ?? "—"}{log.targetId ? ` #${log.targetId}` : ""}</td><td className="max-w-xs truncate text-xs text-muted">{log.metadata ?? "—"}</td></tr>)}
        </tbody>
      </table>
      {!logs.length && <p className="p-5 text-muted">No audit entries yet.</p>}
    </div>
  );
}

async function EventsTab() {
  const list = await db.select().from(events).orderBy(asc(events.startsAt));
  const allRsvps = await db.select().from(rsvps).orderBy(asc(rsvps.createdAt));
  const now = new Date();
  const byEvent = new Map<number, typeof allRsvps>();
  for (const r of allRsvps) {
    byEvent.set(r.eventId, [...(byEvent.get(r.eventId) ?? []), r]);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        {list.map((e) => {
          const rs = byEvent.get(e.id) ?? [];
          const past = e.startsAt < now;
          return (
            <details key={e.id} className="group rounded-2xl bg-white ring-1 ring-black/5">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <p className="font-semibold">
                    {e.title} {past && <span className="ml-1 rounded bg-gray-100 px-1.5 text-xs text-gray-600">past</span>}
                  </p>
                  <p className="text-sm text-muted">
                    {formatDate(e.startsAt)} · {formatTime(e.startsAt)} · {e.category} · {e.location}
                  </p>
                </div>
                <span className="rounded-full bg-paper px-3 py-1 text-sm font-semibold">
                  {rs.length}/{e.capacity} RSVPs
                </span>
              </summary>
              <div className="border-t border-black/5 p-5">
                {rs.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-xs uppercase tracking-wider text-muted">
                        <tr><th className="py-2">Name</th><th>Email</th><th>Note</th><th>When</th></tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {rs.map((r) => (
                          <tr key={r.id}>
                            <td className="py-2 font-medium">{r.name}</td>
                            <td>{r.email}</td>
                            <td className="text-muted">{r.note ?? "—"}</td>
                            <td className="text-muted">{timeAgo(r.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted">No RSVPs yet.</p>
                )}
                <div className="mt-4 flex gap-3">
                  <Link href={`/events/${e.id}`} className="text-sm font-semibold text-brand hover:underline">
                    View public page
                  </Link>
                  <form action={deleteEventAction}>
                    <input type="hidden" name="id" value={e.id} />
                    <button className="text-sm font-semibold text-gray-500 hover:text-rose-700">Delete event</button>
                  </form>
                </div>
              </div>
            </details>
          );
        })}
        {!list.length && <p className="text-muted">No events yet.</p>}
      </div>
      <div className="rounded-2xl bg-white p-6 ring-1 ring-black/5 lg:sticky lg:top-24 lg:self-start">
        <h2 className="font-display text-xl font-bold">Create an event</h2>
        <EventForm />
      </div>
    </div>
  );
}

async function MembersTab() {
  const list = await db.select().from(members).orderBy(desc(members.createdAt));
  if (!list.length) return <p className="text-muted">No membership applications yet.</p>;
  return (
    <div className="space-y-3">
      {list.map((m) => (
        <div key={m.id} className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">
                {m.fullName}{" "}
                <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[m.status] ?? ""}`}>
                  {m.status}
                </span>
              </p>
              <p className="text-sm text-muted">
                {m.email} · {m.level}
                {m.nativeLanguage ? ` · ${m.nativeLanguage}` : ""} · applied {timeAgo(m.createdAt)}
              </p>
              {m.interests && <p className="mt-1 text-sm">Interests: {m.interests}</p>}
              {m.goals && <p className="mt-1 text-sm italic text-muted">&ldquo;{m.goals}&rdquo;</p>}
            </div>
            <div className="flex gap-2">
              {(["approved", "declined", "pending"] as const)
                .filter((s) => s !== m.status)
                .map((s) => (
                  <form key={s} action={setMemberStatusAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="status" value={s} />
                    <button
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        s === "approved" ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-paper hover:bg-black/10"
                      }`}
                    >
                      {s === "approved" ? "Approve" : s === "declined" ? "Decline" : "Mark pending"}
                    </button>
                  </form>
                ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

async function MessagesTab() {
  const list = await db.select().from(messages).orderBy(desc(messages.createdAt));
  if (!list.length) return <p className="text-muted">No messages yet.</p>;
  return (
    <div className="space-y-3">
      {list.map((m) => (
        <div key={m.id} className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{m.subject}</p>
              <p className="text-sm text-muted">
                {m.name} · <a className="text-brand hover:underline" href={`mailto:${m.email}`}>{m.email}</a> · {timeAgo(m.createdAt)}
              </p>
            </div>
            <form action={deleteMessageAction}>
              <input type="hidden" name="id" value={m.id} />
              <button className="text-xs font-semibold text-gray-500 hover:text-rose-700">Delete</button>
            </form>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{m.body}</p>
        </div>
      ))}
    </div>
  );
}

async function PostsTab() {
  const list = await db.select().from(posts).orderBy(desc(posts.createdAt));
  if (!list.length) return <p className="text-muted">No posts yet.</p>;
  return (
    <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-black/5">
      <table className="w-full text-left text-sm">
        <thead className="bg-paper text-xs uppercase tracking-wider text-muted">
          <tr><th className="p-3">Post</th><th>Type</th><th>Author</th><th>Likes</th><th /></tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {list.map((p) => (
            <tr key={p.id}>
              <td className="max-w-md p-3">{p.content}</td>
              <td className="capitalize">{p.kind}</td>
              <td>{p.author}</td>
              <td>{p.likes}</td>
              <td className="pr-3 text-right">
                <form action={deletePostAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="text-xs font-semibold text-gray-500 hover:text-rose-700">Remove</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


async function BlogTab({ editId }: { editId: number }) {
  const list = await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  const editing = editId ? list.find((p) => p.id === editId) : undefined;
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
      <div className="space-y-3">
        {list.map((p) => (
          <div key={p.id} className={`rounded-2xl bg-white p-4 ring-1 ${editing?.id === p.id ? "ring-brand" : "ring-black/5"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{p.title}</p>
                <p className="text-xs text-muted">
                  {p.published ? <span className="text-emerald-700">● Published</span> : <span className="text-amber-700">● Draft</span>} · {p.views} views · {timeAgo(p.createdAt)}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
              <Link href={`/admin?tab=blog&edit=${p.id}`} className="text-brand hover:underline">Edit</Link>
              <Link href={`/blog/${p.slug}`} className="text-muted hover:text-ink">View</Link>
              <form action={toggleBlogPublishAction}><input type="hidden" name="id" value={p.id} /><button className="text-muted hover:text-ink">{p.published ? "Unpublish" : "Publish"}</button></form>
              <form action={deleteBlogPostAction}><input type="hidden" name="id" value={p.id} /><button className="text-gray-500 hover:text-rose-700">Delete</button></form>
            </div>
          </div>
        ))}
        {!list.length && <p className="text-muted">No posts yet.</p>}
      </div>
      <BlogEditor key={editing?.id ?? "new"} post={editing} />
    </div>
  );
}

async function UsersTab() {
  const list = await db.select().from(users).orderBy(desc(users.xp)).limit(200);
  return (
    <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-black/5">
      <table className="w-full text-left text-sm">
        <thead className="bg-paper text-xs uppercase tracking-wider text-muted">
          <tr><th className="p-3">User</th><th>Level / XP</th><th>Streak</th><th>Role</th><th>Joined</th><th className="pr-3 text-right">Actions</th></tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {list.map((u) => (
            <tr key={u.id} className={u.banned ? "bg-rose-50/60" : ""}>
              <td className="p-3">
                <span className="flex items-center gap-2">
                  <Avatar name={u.displayName} color={u.avatarColor} size={30} />
                  <span><span className="font-semibold">{u.displayName}</span><span className="block text-xs text-muted">@{u.username}{u.banned ? " · BANNED" : ""}</span></span>
                </span>
              </td>
              <td>Lv {levelFromXp(u.xp)} · {u.xp}</td>
              <td>{u.streak ? `🔥 ${u.streak}` : "—"}</td>
              <td><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.role === "admin" ? "bg-brand text-white" : "bg-paper"}`}>{u.role}</span></td>
              <td className="text-muted">{timeAgo(u.createdAt)}</td>
              <td className="pr-3">
                <div className="flex flex-wrap justify-end gap-1">
                  {([
                    ["bonus", "+100 XP"],
                    [u.role === "admin" ? "demote" : "promote", u.role === "admin" ? "Demote" : "Make admin"],
                    [u.banned ? "unban" : "ban", u.banned ? "Unban" : "Ban"],
                    ["purge", "Purge msgs"],
                    ["reset", "Reset XP"],
                    ["delete", "Delete"],
                  ] as const).map(([op, label]) => (
                    <form key={op} action={userAdminAction}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="op" value={op} />
                      <button className={`rounded-full px-2 py-1 text-[11px] font-semibold ${op === "delete" || op === "ban" ? "bg-rose-100 text-rose-800 hover:bg-rose-200" : "bg-paper hover:bg-black/10"}`}>{label}</button>
                    </form>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function ChannelsTab() {
  const list = await db
    .select({ id: channels.id, slug: channels.slug, name: channels.name, emoji: channels.emoji, description: channels.description, count: sql<number>`count(${chatMessages.id})::int` })
    .from(channels)
    .leftJoin(chatMessages, eq(chatMessages.channelId, channels.id))
    .groupBy(channels.id)
    .orderBy(asc(channels.sortOrder), asc(channels.id));
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-3">
        {list.map((ch) => (
          <div key={ch.id} className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-black/5">
            <span className="text-2xl">{ch.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">#{ch.slug}</p>
              <p className="text-xs text-muted">{ch.description} · {ch.count} messages</p>
            </div>
            <Link href={`/chat/${ch.slug}`} className="text-xs font-semibold text-brand">Open</Link>
            <form action={clearChannelAction}><input type="hidden" name="id" value={ch.id} /><button className="text-xs font-semibold text-muted hover:text-ink">Clear</button></form>
            <form action={deleteChannelAction}><input type="hidden" name="id" value={ch.id} /><button className="text-xs font-semibold text-gray-500 hover:text-rose-700">Delete</button></form>
          </div>
        ))}
      </div>
      <ChannelForm />
    </div>
  );
}

async function RoomsTab() {
  const cutoff = new Date();
  cutoff.setSeconds(cutoff.getSeconds() - 20);
  const list = await db
    .select({ code: meetRooms.code, title: meetRooms.title, hostName: meetRooms.hostName, createdAt: meetRooms.createdAt, live: sql<number>`count(${meetPeers.id}) filter (where ${meetPeers.lastSeen} > ${cutoff})::int` })
    .from(meetRooms)
    .leftJoin(meetPeers, eq(meetPeers.roomCode, meetRooms.code))
    .groupBy(meetRooms.id)
    .orderBy(desc(meetRooms.createdAt))
    .limit(50);
  if (!list.length) return <p className="text-muted">No meeting rooms have been created yet. <Link href="/meet" className="text-brand underline">Create one</Link>.</p>;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {list.map((r) => (
        <Link key={r.code} href={`/meet/${r.code}`} className="flex items-center justify-between rounded-2xl bg-white p-4 ring-1 ring-black/5 hover:shadow-md">
          <span><span className="font-semibold">{r.title}</span><span className="block text-xs text-muted">{r.hostName} · {r.code} · {timeAgo(r.createdAt)}</span></span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${r.live ? "bg-emerald-100 text-emerald-800" : "bg-paper text-muted"}`}>{r.live} live</span>
        </Link>
      ))}
    </div>
  );
}
