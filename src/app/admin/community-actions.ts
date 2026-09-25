"use server";

import { randomBytes } from "crypto";
import { db } from "@/db";
import { announcements, groupMembers, notifications, studyGroups, submissions, users } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import { awardXp } from "@/lib/award";
import { notify } from "@/lib/notify";
import { logInfo } from "@/lib/security";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "../actions";

async function guard() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const u = await getCurrentUser();
  return u?.displayName ?? "Organiser";
}
const s = (fd: FormData, k: string, max = 500) => String(fd.get(k) ?? "").trim().slice(0, max);
const slugify = (x: string) => x.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60);

/* ---------------- Submissions review ---------------- */
function verificationCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = () => Array.from(randomBytes(4), (b) => alphabet[b % alphabet.length]).join("");
  return `WEC-${part()}-${part()}`;
}

export async function reviewSubmissionAction(_p: FormState, fd: FormData): Promise<FormState> {
  const reviewer = await guard();
  const id = Number(fd.get("id"));
  const decision = s(fd, "decision", 10);
  const feedback = s(fd, "feedback", 4000);
  const scoreRaw = s(fd, "score", 4);
  const score = scoreRaw ? Math.max(0, Math.min(100, Number(scoreRaw) || 0)) : null;
  if (!id || !["approved", "declined"].includes(decision)) return { ok: false, message: "Invalid decision." };
  if (decision === "declined" && feedback.length < 5) return { ok: false, message: "Please tell the student why it was declined." };

  const [sub] = await db.select().from(submissions).where(eq(submissions.id, id));
  if (!sub) return { ok: false, message: "Submission not found." };
  if (sub.status !== "pending") return { ok: false, message: `Already ${sub.status}.` };

  const code = decision === "approved" ? verificationCode() : null;
  const updated = await db
    .update(submissions)
    .set({ status: decision, feedback: feedback || null, score, reviewedBy: reviewer, reviewedAt: new Date(), verificationCode: code })
    .where(and(eq(submissions.id, id), eq(submissions.status, "pending")))
    .returning({ id: submissions.id });
  if (!updated.length) return { ok: false, message: "Someone else just reviewed this." };

  if (decision === "approved") {
    await awardXp(sub.userId, "submission_approved", `#${sub.id}`);
    await notify(sub.userId, { kind: "submission_approved", title: `✅ "${sub.title}" was approved`, body: feedback ? feedback.slice(0, 200) : `Verification code ${code} · +50 XP`, href: `/verify/${code}` });
  } else {
    await notify(sub.userId, { kind: "submission_declined", title: `"${sub.title}" needs changes`, body: feedback.slice(0, 200), href: "/submit" });
  }
  logInfo("review", "submission reviewed", { id, decision, reviewer });
  revalidatePath("/admin");
  revalidatePath("/submit");
  return { ok: true, message: decision === "approved" ? `Approved · code ${code}` : "Declined with feedback." };
}

export async function revokeSubmissionAction(fd: FormData) {
  await guard();
  const id = Number(fd.get("id"));
  const [sub] = await db.select().from(submissions).where(eq(submissions.id, id));
  if (!sub) return;
  await db.update(submissions).set({ status: "pending", verificationCode: null, reviewedAt: null, reviewedBy: null }).where(eq(submissions.id, id));
  await notify(sub.userId, { kind: "submission_reopened", title: `"${sub.title}" is being re-reviewed`, href: "/submit" });
  revalidatePath("/admin");
}

/* ---------------- Announcements ---------------- */
export async function saveAnnouncementAction(_p: FormState, fd: FormData): Promise<FormState> {
  await guard();
  const id = Number(fd.get("id") || 0);
  const title = s(fd, "title", 160);
  const body = s(fd, "body", 8000);
  if (!title || body.length < 3) return { ok: false, message: "Title and body are required." };
  const linkUrl = s(fd, "linkUrl", 300);
  if (linkUrl && !/^(\/|https?:\/\/)/.test(linkUrl)) return { ok: false, message: "Link must start with / or https://" };
  const exp = s(fd, "expiresAt", 40);
  const expiresAt = exp ? new Date(exp) : null;
  const values = {
    title,
    body,
    category: ["news", "event", "urgent", "update", "celebration"].includes(s(fd, "category", 20)) ? s(fd, "category", 20) : "news",
    pinned: fd.get("pinned") === "on",
    showBanner: fd.get("showBanner") === "on",
    published: fd.get("published") === "on",
    linkUrl: linkUrl || null,
    linkLabel: s(fd, "linkLabel", 60) || null,
    author: s(fd, "author", 80) || "Gelan English Club",
    expiresAt: expiresAt && !isNaN(expiresAt.getTime()) ? expiresAt : null,
  };
  if (id) await db.update(announcements).set(values).where(eq(announcements.id, id));
  else await db.insert(announcements).values(values);
  revalidatePath("/", "layout");
  redirect("/admin?tab=announcements");
}

export async function announcementOpAction(fd: FormData) {
  await guard();
  const id = Number(fd.get("id"));
  const op = String(fd.get("op"));
  const [a] = await db.select().from(announcements).where(eq(announcements.id, id));
  if (!a) return;
  if (op === "delete") await db.delete(announcements).where(eq(announcements.id, id));
  if (op === "pin") await db.update(announcements).set({ pinned: !a.pinned }).where(eq(announcements.id, id));
  if (op === "banner") await db.update(announcements).set({ showBanner: !a.showBanner }).where(eq(announcements.id, id));
  if (op === "publish") await db.update(announcements).set({ published: !a.published }).where(eq(announcements.id, id));
  revalidatePath("/", "layout");
}

/* ---------------- Groups ---------------- */
export async function saveGroupAction(_p: FormState, fd: FormData): Promise<FormState> {
  await guard();
  const id = Number(fd.get("id") || 0);
  const name = s(fd, "name", 80);
  if (!name) return { ok: false, message: "Group name is required." };
  const values = {
    name,
    category: s(fd, "category", 30) || "vocabulary",
    description: s(fd, "description", 2000),
    challenge: s(fd, "challenge", 1000) || null,
    emoji: s(fd, "emoji", 8) || "👥",
    color: /^#[0-9a-f]{6}$/i.test(s(fd, "color", 7)) ? s(fd, "color", 7) : "#b8322a",
    level: s(fd, "level", 40) || "All levels",
    schedule: s(fd, "schedule", 120) || null,
    joinPolicy: s(fd, "joinPolicy", 12) === "approval" ? "approval" : "open",
    maxMembers: Math.max(2, Math.min(5000, Number(fd.get("maxMembers")) || 200)),
  };
  if (id) {
    await db.update(studyGroups).set(values).where(eq(studyGroups.id, id));
  } else {
    let slug = slugify(name) || `group-${Date.now()}`;
    const clash = await db.select({ id: studyGroups.id }).from(studyGroups).where(eq(studyGroups.slug, slug));
    if (clash.length) slug = `${slug}-${Date.now().toString(36)}`;
    await db.insert(studyGroups).values({ ...values, slug });
  }
  revalidatePath("/groups");
  redirect("/admin?tab=groups");
}

export async function deleteGroupAction(fd: FormData) {
  await guard();
  const id = Number(fd.get("id"));
  if (id) await db.delete(studyGroups).where(eq(studyGroups.id, id));
  revalidatePath("/groups");
  revalidatePath("/admin");
}

export async function memberOpAction(fd: FormData) {
  await guard();
  const id = Number(fd.get("id"));
  const op = String(fd.get("op"));
  const [m] = await db
    .select({ id: groupMembers.id, userId: groupMembers.userId, role: groupMembers.role, slug: studyGroups.slug, name: studyGroups.name })
    .from(groupMembers)
    .innerJoin(studyGroups, eq(studyGroups.id, groupMembers.groupId))
    .where(eq(groupMembers.id, id));
  if (!m) return;
  if (op === "approve") {
    await db.update(groupMembers).set({ status: "active" }).where(eq(groupMembers.id, id));
    await awardXp(m.userId, "group_join", m.slug);
    await notify(m.userId, { kind: "group_approved", title: `🎉 Welcome to ${m.name}!`, body: "Your request to join was approved.", href: `/groups/${m.slug}` });
  }
  if (op === "reject" || op === "remove") {
    await db.delete(groupMembers).where(eq(groupMembers.id, id));
    if (op === "reject") await notify(m.userId, { kind: "group_rejected", title: `Your request to join ${m.name} wasn't approved`, href: "/groups" });
  }
  if (op === "mod") await db.update(groupMembers).set({ role: m.role === "moderator" ? "member" : "moderator" }).where(eq(groupMembers.id, id));
  revalidatePath("/admin");
  revalidatePath(`/groups/${m.slug}`);
}

export async function broadcastNotificationAction(_p: FormState, fd: FormData): Promise<FormState> {
  await guard();
  const title = s(fd, "title", 160);
  const body = s(fd, "body", 500);
  const href = s(fd, "href", 300);
  if (!title) return { ok: false, message: "Title required." };
  const all = await db.select({ id: users.id }).from(users).where(eq(users.banned, false));
  for (let i = 0; i < all.length; i += 500) {
    await db.insert(notifications).values(all.slice(i, i + 500).map((u) => ({ userId: u.id, kind: "broadcast", title, body, href: href || null })));
  }
  return { ok: true, message: `Sent to ${all.length} members.` };
}
