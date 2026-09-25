import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/db";
import { groupMembers, studyGroups, submissionFiles, submissions } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";
import { SUBMISSION_KINDS, humanSize } from "@/lib/files";
import { formatLongDate, timeAgo } from "@/lib/format";
import SubmitForm from "./SubmitForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Submit work", description: "Send essays, recordings, homework or certificates to the organisers for review and verification." };

const STATUS: Record<string, { label: string; cls: string; icon: string }> = {
  pending: { label: "Awaiting review", cls: "bg-amber-100 text-amber-900", icon: "⏳" },
  approved: { label: "Approved & verified", cls: "bg-emerald-100 text-emerald-900", icon: "✅" },
  declined: { label: "Declined", cls: "bg-rose-100 text-rose-900", icon: "✋" },
};

export default async function SubmitPage({ searchParams }: { searchParams: Promise<{ group?: string; kind?: string }> }) {
  const { group, kind } = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <p className="text-6xl">📤</p>
        <h1 className="mt-4 font-display text-4xl font-bold">Submit your work</h1>
        <p className="mt-3 text-muted">Sign in to send essays, voice recordings, homework or certificates to the organisers. Approved work gets a public verification code and +50 XP.</p>
        <Link href="/login?next=/submit" className="btn-primary mt-8">Sign in to continue</Link>
        <p className="mt-6 text-sm text-muted">Have a verification code? <Link href="/verify" className="font-semibold text-brand underline">Verify it here</Link>.</p>
      </div>
    );
  }

  const [mine, myGroups] = await Promise.all([
    db
      .select({
        s: submissions,
        fileName: submissionFiles.filename,
        fileMime: submissionFiles.mime,
        fileSize: submissionFiles.size,
        groupName: studyGroups.name,
      })
      .from(submissions)
      .leftJoin(submissionFiles, eq(submissionFiles.id, submissions.fileId))
      .leftJoin(studyGroups, eq(studyGroups.id, submissions.groupId))
      .where(eq(submissions.userId, user.id))
      .orderBy(desc(submissions.createdAt))
      .limit(50),
    db
      .select({ slug: studyGroups.slug, name: studyGroups.name, emoji: studyGroups.emoji })
      .from(groupMembers)
      .innerJoin(studyGroups, eq(studyGroups.id, groupMembers.groupId))
      .where(and(eq(groupMembers.userId, user.id), eq(groupMembers.status, "active"))),
  ]);

  const counts = { pending: 0, approved: 0, declined: 0 } as Record<string, number>;
  mine.forEach((m) => (counts[m.s.status] = (counts[m.s.status] ?? 0) + 1));

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-indigo-900 to-violet-900 text-white">
        <div className="grid-bg absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-7xl px-5 py-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">📤 Review & verification</p>
          <h1 className="mt-2 font-display text-5xl font-bold">Submit your work</h1>
          <p className="mt-3 max-w-2xl text-white/75">Send a file, a voice recording or text to the organisers. They&apos;ll approve or decline it with feedback. Approved work gets a <strong>verification code</strong> anyone can check — and you earn <strong>+50 XP</strong>.</p>
          <ol className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
            {[["1", "Submit", "Upload, record or type your work"], ["2", "Review", "An organiser checks it and gives feedback"], ["3", "Verified", "Get a shareable verification certificate"]].map(([n, t, d]) => (
              <li key={n} className="glass flex items-start gap-3 rounded-2xl p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold font-bold text-ink">{n}</span>
                <span><span className="block font-semibold">{t}</span><span className="text-xs text-white/60">{d}</span></span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1fr_1.1fr]">
        <SubmitForm groups={myGroups} defaultGroup={group ?? ""} defaultKind={kind && SUBMISSION_KINDS[kind] ? kind : "essay"} />

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold">My submissions</h2>
            <div className="flex gap-2 text-xs font-semibold">
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-900">⏳ {counts.pending}</span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-900">✅ {counts.approved}</span>
              <span className="rounded-full bg-rose-100 px-2.5 py-1 text-rose-900">✋ {counts.declined}</span>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {mine.map(({ s, fileName, fileMime, fileSize, groupName }) => {
              const st = STATUS[s.status] ?? STATUS.pending;
              const k = SUBMISSION_KINDS[s.kind] ?? SUBMISSION_KINDS.other;
              return (
                <article key={s.id} className="animate-toast overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
                  <div className={`h-1 ${s.status === "approved" ? "bg-emerald-500" : s.status === "declined" ? "bg-rose-500" : "shimmer bg-amber-400"}`} />
                  <div className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-muted">{k.icon} {k.label}{groupName ? ` · ${groupName}` : ""} · {timeAgo(s.createdAt)}</p>
                        <h3 className="mt-0.5 font-display text-xl font-bold">{s.title}</h3>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${st.cls}`}>{st.icon} {st.label}</span>
                    </div>
                    {s.textContent && <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm text-ink/75">{s.textContent}</p>}
                    {s.fileId && fileName && (
                      <div className="mt-3">
                        {fileMime?.startsWith("audio/") ? (
                          <audio controls preload="none" src={`/api/files/${s.fileId}`} className="w-full" />
                        ) : fileMime?.startsWith("image/") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`/api/files/${s.fileId}`} alt="" className="max-h-48 rounded-xl ring-1 ring-black/5" />
                        ) : (
                          <a href={`/api/files/${s.fileId}?download=1`} className="inline-flex items-center gap-2 rounded-xl bg-paper px-3 py-2 text-sm font-medium hover:bg-gold/20">📎 {fileName} <span className="text-xs text-muted">{humanSize(fileSize ?? 0)}</span></a>
                        )}
                      </div>
                    )}
                    {s.status !== "pending" && (
                      <div className={`mt-4 rounded-2xl p-4 text-sm ${s.status === "approved" ? "bg-emerald-50" : "bg-rose-50"}`}>
                        <p className="font-semibold">{s.status === "approved" ? "Reviewer feedback" : "Why it was declined"}{s.score != null ? ` · Score ${s.score}/100` : ""}</p>
                        <p className="mt-1 whitespace-pre-line text-ink/80">{s.feedback || "No comments."}</p>
                        <p className="mt-2 text-xs text-muted">— {s.reviewedBy}{s.reviewedAt ? `, ${formatLongDate(s.reviewedAt)}` : ""}</p>
                        {s.verificationCode && (
                          <Link href={`/verify/${s.verificationCode}`} className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700">
                            🔏 Certificate · {s.verificationCode}
                          </Link>
                        )}
                        {s.status === "declined" && <p className="mt-2 text-xs font-semibold text-rose-800">You can improve it and submit a new version.</p>}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
            {!mine.length && <p className="rounded-3xl bg-white p-10 text-center text-muted ring-1 ring-black/5">Nothing submitted yet. Your first submission will appear here.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
