import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { db } from "@/db";
import { groupMembers, studyGroups, submissionFiles, submissions } from "@/db/schema";
import { and, eq, gt, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";
import { MAX_FILE_BYTES, SUBMISSION_KINDS, safeFilename, sniff } from "@/lib/files";
import { limitRequest, logError, sameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return Response.json({ error: "Forbidden" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Please sign in to submit work." }, { status: 401 });
  const limited = limitRequest(req, "upload", String(user.id));
  if (limited) return limited;

  const len = Number(req.headers.get("content-length") || 0);
  if (len > MAX_FILE_BYTES + 200_000) return Response.json({ error: "File too large (max 5 MB)." }, { status: 413 });

  try {
    const fd = await req.formData();
    const kind = String(fd.get("kind") ?? "");
    const title = String(fd.get("title") ?? "").trim().slice(0, 160);
    const text = String(fd.get("text") ?? "").trim().slice(0, 20_000);
    const groupSlug = String(fd.get("group") ?? "").trim();
    const file = fd.get("file");

    if (!SUBMISSION_KINDS[kind]) return Response.json({ error: "Choose a submission type." }, { status: 400 });
    if (title.length < 3) return Response.json({ error: "Please add a title (at least 3 characters)." }, { status: 400 });
    const hasFile = file instanceof File && file.size > 0;
    if (!hasFile && text.length < 10) return Response.json({ error: "Attach a file or write at least 10 characters." }, { status: 400 });

    // at most 5 pending submissions per user, 20 per day
    const [{ pending }] = await db
      .select({ pending: sql<number>`count(*)::int` })
      .from(submissions)
      .where(and(eq(submissions.userId, user.id), eq(submissions.status, "pending")));
    if (pending >= 5) return Response.json({ error: "You already have 5 submissions waiting for review. Please wait for feedback first." }, { status: 429 });
    const [{ today }] = await db
      .select({ today: sql<number>`count(*)::int` })
      .from(submissions)
      .where(and(eq(submissions.userId, user.id), gt(submissions.createdAt, new Date(Date.now() - 86_400_000))));
    if (today >= 20) return Response.json({ error: "Daily submission limit reached." }, { status: 429 });

    let groupId: number | null = null;
    if (groupSlug) {
      const [g] = await db
        .select({ id: studyGroups.id })
        .from(studyGroups)
        .innerJoin(groupMembers, and(eq(groupMembers.groupId, studyGroups.id), eq(groupMembers.userId, user.id), eq(groupMembers.status, "active")))
        .where(eq(studyGroups.slug, groupSlug));
      groupId = g?.id ?? null;
    }

    let fileId: number | null = null;
    if (hasFile) {
      if (file.size > MAX_FILE_BYTES) return Response.json({ error: "File too large (max 5 MB)." }, { status: 413 });
      const buf = Buffer.from(await file.arrayBuffer());
      const type = sniff(buf, file.name);
      if (!type) {
        return Response.json({ error: "Unsupported file type. Allowed: PDF, images, audio (mp3/m4a/wav/ogg/webm), mp4, DOCX, PPTX, TXT." }, { status: 415 });
      }
      const [f] = await db
        .insert(submissionFiles)
        .values({
          ownerId: user.id,
          filename: safeFilename(file.name || `recording.${type.ext}`),
          mime: type.mime,
          size: buf.length,
          sha256: createHash("sha256").update(buf).digest("hex"),
          data: buf,
        })
        .returning({ id: submissionFiles.id });
      fileId = f.id;
    }

    const [s] = await db
      .insert(submissions)
      .values({ userId: user.id, kind, title, textContent: text || null, fileId, groupId })
      .returning({ id: submissions.id });

    return Response.json({ ok: true, id: s.id });
  } catch (err) {
    logError("api/submissions", err, { userId: user.id });
    return Response.json({ error: "Upload failed — please try again." }, { status: 500 });
  }
}
