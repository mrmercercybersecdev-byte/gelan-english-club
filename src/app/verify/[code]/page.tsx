import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/db";
import { studyGroups, submissions, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { SUBMISSION_KINDS } from "@/lib/files";
import { formatLongDate } from "@/lib/format";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return { title: `Verification ${code}`, robots: { index: false } };
}

export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const code = decodeURIComponent(raw).toUpperCase().slice(0, 20);
  const [row] = await db
    .select({ s: submissions, name: users.displayName, username: users.username, country: users.country, group: studyGroups.name })
    .from(submissions)
    .innerJoin(users, eq(users.id, submissions.userId))
    .leftJoin(studyGroups, eq(studyGroups.id, submissions.groupId))
    .where(and(eq(submissions.verificationCode, code), eq(submissions.status, "approved")));

  if (!row) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <p className="text-6xl">❌</p>
        <h1 className="mt-4 font-display text-4xl font-bold">Not verified</h1>
        <p className="mt-3 text-muted">No approved submission matches <code className="rounded bg-paper px-1.5 font-semibold">{code}</code>. Check the code for typos, or the certificate may have been revoked.</p>
        <Link href="/verify" className="btn-primary mt-8">Try another code</Link>
      </div>
    );
  }
  const k = SUBMISSION_KINDS[row.s.kind] ?? SUBMISSION_KINDS.other;

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href="/verify" className="text-sm text-muted hover:text-ink">← Verify another</Link>
        <PrintButton />
      </div>
      <div className="relative overflow-hidden rounded-[2rem] bg-white p-3 shadow-2xl ring-1 ring-black/5">
        <div className="relative overflow-hidden rounded-[1.6rem] border-[3px] border-double border-gold/70 bg-gradient-to-br from-cream via-white to-paper px-8 py-12 text-center md:px-16">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/10" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-brand/5" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-bold text-emerald-800">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-600 text-[11px] text-white">✓</span> Verified by Gelan English Club
            </span>
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.35em] text-muted">Certificate of verification</p>
            <p className="mt-6 text-muted">This certifies that</p>
            <h1 className="mt-2 font-display text-5xl font-bold text-ink md:text-6xl">{row.name}</h1>
            <p className="mt-1 text-sm text-muted">@{row.username}{row.country ? ` · ${row.country}` : ""}</p>
            <p className="mt-6 text-muted">submitted the following work, which was reviewed and approved by our organisers:</p>
            <p className="mt-3 font-display text-2xl font-bold text-brand md:text-3xl">&ldquo;{row.s.title}&rdquo;</p>
            <p className="mt-2 text-sm">{k.icon} {k.label}{row.group ? ` · ${row.group}` : ""}{row.s.score != null ? ` · Score ${row.s.score}/100` : ""}</p>

            <div className="mx-auto mt-10 grid max-w-2xl gap-6 text-sm sm:grid-cols-3">
              <div>
                <p className="font-display text-lg italic">{row.s.reviewedBy}</p>
                <div className="mx-auto my-1 h-px w-32 bg-ink/30" />
                <p className="text-xs uppercase tracking-widest text-muted">Reviewer</p>
              </div>
              <div className="grid place-items-center">
                <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-gold to-amber-600 text-white shadow-lg ring-4 ring-gold/30">
                  <div className="text-center leading-tight"><p className="font-display text-2xl font-bold">W</p><p className="text-[8px] font-bold uppercase tracking-widest">Verified</p></div>
                </div>
              </div>
              <div>
                <p className="font-display text-lg">{row.s.reviewedAt ? formatLongDate(row.s.reviewedAt) : "—"}</p>
                <div className="mx-auto my-1 h-px w-32 bg-ink/30" />
                <p className="text-xs uppercase tracking-widest text-muted">Date approved</p>
              </div>
            </div>
            <p className="mt-10 font-mono text-sm tracking-widest text-muted">Verification code: <strong className="text-ink">{code}</strong></p>
          </div>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-muted print:hidden">Anyone can confirm this certificate at <code>/verify/{code}</code>. The submitted content itself remains private to the member and organisers.</p>
    </div>
  );
}
