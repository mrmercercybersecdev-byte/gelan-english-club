import Link from "next/link";
import { db } from "@/db";
import { announcements, groupMembers, studyGroups, submissionFiles, submissions, users } from "@/db/schema";
import { asc, desc, eq, sql } from "drizzle-orm";
import { SUBMISSION_KINDS, humanSize } from "@/lib/files";
import { ANNOUNCE_STYLES } from "@/lib/announce";
import { GROUP_CATEGORIES } from "@/lib/group-categories";
import { timeAgo } from "@/lib/format";
import { Avatar } from "@/components/SiteHeader";
import { AnnouncementForm, BroadcastForm, GroupForm, ReviewForm } from "./CommunityForms";
import { announcementOpAction, deleteGroupAction, memberOpAction, revokeSubmissionAction } from "./community-actions";

function Op({ action, fields, children, danger }: { action: (fd: FormData) => Promise<void>; fields: Record<string, string | number>; children: React.ReactNode; danger?: boolean }) {
  return (
    <form action={action}>
      {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <button className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${danger ? "bg-rose-100 text-rose-800 hover:bg-rose-200" : "bg-paper hover:bg-black/10"}`}>{children}</button>
    </form>
  );
}

/* ---------------- Submissions ---------------- */
export async function SubmissionsTab({ status }: { status: string }) {
  const st = ["pending", "approved", "declined"].includes(status) ? status : "pending";
  const counts = await db.select({ status: submissions.status, n: sql<number>`count(*)::int` }).from(submissions).groupBy(submissions.status);
  const c = Object.fromEntries(counts.map((r) => [r.status, r.n])) as Record<string, number>;
  const list = await db
    .select({
      s: submissions,
      name: users.displayName,
      username: users.username,
      color: users.avatarColor,
      fileName: submissionFiles.filename,
      fileMime: submissionFiles.mime,
      fileSize: submissionFiles.size,
      group: studyGroups.name,
    })
    .from(submissions)
    .innerJoin(users, eq(users.id, submissions.userId))
    .leftJoin(submissionFiles, eq(submissionFiles.id, submissions.fileId))
    .leftJoin(studyGroups, eq(studyGroups.id, submissions.groupId))
    .where(eq(submissions.status, st))
    .orderBy(st === "pending" ? asc(submissions.createdAt) : desc(submissions.reviewedAt))
    .limit(50);

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {([["pending", "⏳ Pending"], ["approved", "✅ Approved"], ["declined", "✋ Declined"]] as const).map(([k, l]) => (
          <Link key={k} href={`/admin?tab=submissions&status=${k}`} className={`rounded-full px-4 py-2 text-sm font-semibold ${st === k ? "bg-ink text-white" : "bg-white ring-1 ring-black/10"}`}>
            {l} <span className="ml-1 rounded-full bg-black/10 px-1.5 text-xs">{c[k] ?? 0}</span>
          </Link>
        ))}
      </div>
      <div className="space-y-5">
        {list.map(({ s, name, username, color, fileName, fileMime, fileSize, group }) => {
          const k = SUBMISSION_KINDS[s.kind] ?? SUBMISSION_KINDS.other;
          return (
            <article key={s.id} className="grid gap-5 rounded-3xl bg-white p-5 ring-1 ring-black/5 lg:grid-cols-[1.3fr_1fr]">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <Avatar name={name} color={color} size={36} />
                  <div className="min-w-0">
                    <p className="font-semibold">{name} <span className="text-xs font-normal text-muted">@{username}</span></p>
                    <p className="text-xs text-muted">{k.icon} {k.label}{group ? ` · ${group}` : ""} · #{s.id} · {timeAgo(s.createdAt)}</p>
                  </div>
                </div>
                <h3 className="mt-3 font-display text-xl font-bold">{s.title}</h3>
                {s.textContent && <div className="mt-2 max-h-64 overflow-y-auto whitespace-pre-line rounded-2xl bg-paper/70 p-4 text-sm leading-relaxed">{s.textContent}</div>}
                {s.fileId && (
                  <div className="mt-3 space-y-2">
                    {fileMime?.startsWith("audio/") && <audio controls preload="none" src={`/api/files/${s.fileId}`} className="w-full" />}
                    {fileMime?.startsWith("video/") && <video controls preload="none" src={`/api/files/${s.fileId}`} className="max-h-72 w-full rounded-xl" />}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {fileMime?.startsWith("image/") && <img src={`/api/files/${s.fileId}`} alt="" className="max-h-72 rounded-xl ring-1 ring-black/5" />}
                    <div className="flex flex-wrap gap-2 text-sm">
                      <a href={`/api/files/${s.fileId}`} target="_blank" rel="noreferrer" className="rounded-xl bg-paper px-3 py-1.5 font-medium hover:bg-gold/20">👁 Open {fileName}</a>
                      <a href={`/api/files/${s.fileId}?download=1`} className="rounded-xl bg-paper px-3 py-1.5 font-medium hover:bg-gold/20">⬇ Download · {humanSize(fileSize ?? 0)}</a>
                    </div>
                  </div>
                )}
              </div>
              <div className="rounded-2xl bg-cream p-4">
                {s.status === "pending" ? (
                  <ReviewForm id={s.id} />
                ) : (
                  <div className="text-sm">
                    <p className="font-semibold">{s.status === "approved" ? "✅ Approved" : "✋ Declined"} by {s.reviewedBy} · {s.reviewedAt ? timeAgo(s.reviewedAt) : ""}</p>
                    {s.score != null && <p className="mt-1">Score: <strong>{s.score}/100</strong></p>}
                    <p className="mt-2 whitespace-pre-line text-muted">{s.feedback || "No feedback."}</p>
                    {s.verificationCode && <Link href={`/verify/${s.verificationCode}`} className="mt-3 inline-block rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">🔏 {s.verificationCode}</Link>}
                    <div className="mt-3"><Op action={revokeSubmissionAction} fields={{ id: s.id }} danger>↺ Revoke & re-review</Op></div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
        {!list.length && <p className="rounded-3xl bg-white p-10 text-center text-muted ring-1 ring-black/5">{st === "pending" ? "🎉 Inbox zero — nothing waiting for review." : "Nothing here yet."}</p>}
      </div>
    </div>
  );
}

/* ---------------- Announcements ---------------- */
export async function AnnouncementsTab({ editId }: { editId: number }) {
  const list = await db.select().from(announcements).orderBy(desc(announcements.pinned), desc(announcements.createdAt));
  const editing = list.find((a) => a.id === editId);
  const now = Date.now();
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_440px]">
      <div className="space-y-2">
        {list.map((a) => {
          const st = ANNOUNCE_STYLES[a.category] ?? ANNOUNCE_STYLES.news;
          const expired = a.expiresAt && a.expiresAt.getTime() < now;
          return (
            <div key={a.id} className={`rounded-2xl bg-white p-4 ring-1 ${editing?.id === a.id ? "ring-brand" : "ring-black/5"} ${!a.published || expired ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                <span className={`rounded-full px-2 py-0.5 ${st.chip}`}>{st.icon} {st.label}</span>
                {a.pinned && <span className="rounded-full bg-gold/20 px-2 py-0.5">📌 Pinned</span>}
                {a.showBanner && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-900">📣 Banner</span>}
                {!a.published && <span className="rounded-full bg-gray-200 px-2 py-0.5">Draft</span>}
                {expired && <span className="rounded-full bg-gray-200 px-2 py-0.5">Expired</span>}
                <span className="font-normal text-muted">{timeAgo(a.createdAt)} · {a.author}</span>
              </div>
              <p className="mt-2 font-semibold">{a.title}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                <Link href={`/admin?tab=announcements&edit=${a.id}`} className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-semibold hover:bg-black/10">Edit</Link>
                <Op action={announcementOpAction} fields={{ id: a.id, op: "pin" }}>{a.pinned ? "Unpin" : "Pin"}</Op>
                <Op action={announcementOpAction} fields={{ id: a.id, op: "banner" }}>{a.showBanner ? "Hide banner" : "Show banner"}</Op>
                <Op action={announcementOpAction} fields={{ id: a.id, op: "publish" }}>{a.published ? "Unpublish" : "Publish"}</Op>
                <Op action={announcementOpAction} fields={{ id: a.id, op: "delete" }} danger>Delete</Op>
              </div>
            </div>
          );
        })}
      </div>
      <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <AnnouncementForm key={editing?.id ?? "new"} a={editing} />
        <BroadcastForm />
      </div>
    </div>
  );
}

/* ---------------- Groups ---------------- */
export async function GroupsTab({ editId }: { editId: number }) {
  const groups = await db
    .select({ g: studyGroups, active: sql<number>`count(${groupMembers.id}) filter (where ${groupMembers.status}='active')::int`, pending: sql<number>`count(${groupMembers.id}) filter (where ${groupMembers.status}='pending')::int` })
    .from(studyGroups)
    .leftJoin(groupMembers, eq(groupMembers.groupId, studyGroups.id))
    .groupBy(studyGroups.id)
    .orderBy(asc(studyGroups.id));
  const requests = await db
    .select({ id: groupMembers.id, name: users.displayName, color: users.avatarColor, username: users.username, group: studyGroups.name, emoji: studyGroups.emoji, at: groupMembers.joinedAt })
    .from(groupMembers)
    .innerJoin(users, eq(users.id, groupMembers.userId))
    .innerJoin(studyGroups, eq(studyGroups.id, groupMembers.groupId))
    .where(eq(groupMembers.status, "pending"))
    .orderBy(asc(groupMembers.joinedAt));
  const editing = groups.find((r) => r.g.id === editId)?.g;
  const editMembers = editing
    ? await db
        .select({ id: groupMembers.id, name: users.displayName, color: users.avatarColor, role: groupMembers.role, status: groupMembers.status })
        .from(groupMembers)
        .innerJoin(users, eq(users.id, groupMembers.userId))
        .where(eq(groupMembers.groupId, editing.id))
    : [];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
      <div className="space-y-6">
        {requests.length > 0 && (
          <div className="rounded-3xl bg-amber-50 p-5 ring-1 ring-amber-200">
            <h3 className="font-display text-lg font-bold">⏳ Join requests ({requests.length})</h3>
            <ul className="mt-3 space-y-2">
              {requests.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3">
                  <Avatar name={r.name} color={r.color} size={32} />
                  <span className="min-w-0 flex-1 text-sm"><strong>{r.name}</strong> wants to join {r.emoji} {r.group} <span className="text-xs text-muted">· {timeAgo(r.at)}</span></span>
                  <Op action={memberOpAction} fields={{ id: r.id, op: "approve" }}>✅ Approve</Op>
                  <Op action={memberOpAction} fields={{ id: r.id, op: "reject" }} danger>Decline</Op>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="space-y-2">
          {groups.map(({ g, active, pending }) => (
            <div key={g.id} className={`flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 ring-1 ${editing?.id === g.id ? "ring-brand" : "ring-black/5"}`}>
              <span className="grid h-11 w-11 place-items-center rounded-xl text-2xl" style={{ background: `${g.color}22` }}>{g.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{g.name} {g.joinPolicy === "approval" && <span className="text-xs">🔒</span>}</p>
                <p className="text-xs text-muted">{GROUP_CATEGORIES[g.category]?.label ?? g.category} · {active}/{g.maxMembers} members{pending ? ` · ${pending} pending` : ""}</p>
              </div>
              <Link href={`/groups/${g.slug}`} className="text-xs font-semibold text-brand">View</Link>
              <Link href={`/admin?tab=groups&edit=${g.id}`} className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-semibold hover:bg-black/10">Edit & members</Link>
              <Op action={deleteGroupAction} fields={{ id: g.id }} danger>Delete</Op>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <GroupForm key={editing?.id ?? "new"} g={editing} />
        {editing && (
          <div className="rounded-3xl bg-white p-5 ring-1 ring-black/5">
            <h3 className="font-display text-lg font-bold">Members of {editing.name}</h3>
            <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto">
              {editMembers.map((m) => (
                <li key={m.id} className="flex items-center gap-2 text-sm">
                  <Avatar name={m.name} color={m.color} size={28} />
                  <span className="flex-1 truncate">{m.name} {m.status === "pending" && <span className="text-xs text-amber-700">(pending)</span>}</span>
                  {m.role === "moderator" && <span className="rounded bg-brand px-1.5 text-[10px] font-bold text-white">MOD</span>}
                  <Op action={memberOpAction} fields={{ id: m.id, op: "mod" }}>{m.role === "moderator" ? "Unmod" : "Make mod"}</Op>
                  <Op action={memberOpAction} fields={{ id: m.id, op: "remove" }} danger>Remove</Op>
                </li>
              ))}
              {!editMembers.length && <li className="text-sm text-muted">No members yet.</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
