"use server";

import { db } from "@/db";
import { groupMembers, groupPosts, studyGroups } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { awardXp } from "@/lib/award";
import { limitAction } from "@/lib/security";
import type { FormState } from "../actions";

export async function joinGroupAction(fd: FormData) {
  const slug = String(fd.get("slug") ?? "");
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/groups/${encodeURIComponent(slug)}`);
  const [g] = await db.select().from(studyGroups).where(eq(studyGroups.slug, slug));
  if (!g) return;
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, g.id), eq(groupMembers.status, "active")));
  if (n >= g.maxMembers) return;
  const status = g.joinPolicy === "approval" ? "pending" : "active";
  const inserted = await db.insert(groupMembers).values({ groupId: g.id, userId: user.id, status }).onConflictDoNothing().returning({ id: groupMembers.id });
  if (inserted.length && status === "active") await awardXp(user.id, "group_join", g.slug);
  revalidatePath(`/groups/${slug}`);
  revalidatePath("/groups");
}

export async function leaveGroupAction(fd: FormData) {
  const slug = String(fd.get("slug") ?? "");
  const user = await getCurrentUser();
  if (!user) return;
  const [g] = await db.select({ id: studyGroups.id }).from(studyGroups).where(eq(studyGroups.slug, slug));
  if (g) await db.delete(groupMembers).where(and(eq(groupMembers.groupId, g.id), eq(groupMembers.userId, user.id)));
  revalidatePath(`/groups/${slug}`);
  revalidatePath("/groups");
}

export async function postToGroupAction(_p: FormState, fd: FormData): Promise<FormState> {
  const slug = String(fd.get("slug") ?? "");
  const body = String(fd.get("body") ?? "").trim().slice(0, 1500);
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in." };
  const limited = await limitAction("write", `gpost:${user.id}`);
  if (limited) return { ok: false, message: limited };
  if (body.length < 2) return { ok: false, message: "Write something first." };
  const [m] = await db
    .select({ groupId: studyGroups.id })
    .from(studyGroups)
    .innerJoin(groupMembers, and(eq(groupMembers.groupId, studyGroups.id), eq(groupMembers.userId, user.id), eq(groupMembers.status, "active")))
    .where(eq(studyGroups.slug, slug));
  if (!m) return { ok: false, message: "Join the group to post." };
  await db.insert(groupPosts).values({ groupId: m.groupId, userId: user.id, body });
  await awardXp(user.id, "group_post", slug);
  revalidatePath(`/groups/${slug}`);
  return { ok: true, message: "Posted!" };
}

export async function deleteGroupPostAction(fd: FormData) {
  const id = Number(fd.get("id"));
  const slug = String(fd.get("slug") ?? "");
  const user = await getCurrentUser();
  if (!user || !id) return;
  const [p] = await db.select().from(groupPosts).where(eq(groupPosts.id, id));
  if (!p) return;
  const [mod] = await db
    .select({ role: groupMembers.role })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, p.groupId), eq(groupMembers.userId, user.id)));
  if (p.userId === user.id || mod?.role === "moderator" || user.role === "admin") {
    await db.delete(groupPosts).where(eq(groupPosts.id, id));
  }
  revalidatePath(`/groups/${slug}`);
}
