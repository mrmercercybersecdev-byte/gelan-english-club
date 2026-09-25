"use server";

import { db } from "@/db";
import { blogPosts, channels, users, chatMessages } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "../actions";

async function guard() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 150);
}

export async function saveBlogPostAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await guard();
  const id = Number(fd.get("id") || 0);
  const title = String(fd.get("title") ?? "").trim().slice(0, 200);
  const content = String(fd.get("content") ?? "").trim();
  const excerpt = String(fd.get("excerpt") ?? "").trim().slice(0, 400) || content.replace(/[#>*_`]/g, "").slice(0, 180);
  const tags = String(fd.get("tags") ?? "").trim().slice(0, 200);
  const author = String(fd.get("author") ?? "").trim().slice(0, 80) || "Gelan English Club";
  const coverImage = String(fd.get("coverImage") ?? "").trim().slice(0, 300) || null;
  const published = fd.get("published") === "on";
  if (!title || content.length < 10) return { ok: false, message: "A title and some content are required." };

  if (id) {
    await db
      .update(blogPosts)
      .set({ title, content, excerpt, tags, author, coverImage, published, updatedAt: new Date() })
      .where(eq(blogPosts.id, id));
  } else {
    let slug = slugify(title) || `post-${Date.now()}`;
    const clash = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, slug));
    if (clash.length) slug = `${slug}-${Date.now().toString(36)}`;
    await db.insert(blogPosts).values({ slug, title, content, excerpt, tags, author, coverImage, published });
  }
  revalidatePath("/blog");
  revalidatePath("/admin");
  redirect("/admin?tab=blog");
}

export async function deleteBlogPostAction(fd: FormData) {
  await guard();
  const id = Number(fd.get("id"));
  if (id) await db.delete(blogPosts).where(eq(blogPosts.id, id));
  revalidatePath("/blog");
  revalidatePath("/admin");
}

export async function toggleBlogPublishAction(fd: FormData) {
  await guard();
  const id = Number(fd.get("id"));
  if (id) await db.update(blogPosts).set({ published: sql`not ${blogPosts.published}` }).where(eq(blogPosts.id, id));
  revalidatePath("/blog");
  revalidatePath("/admin");
}

export async function userAdminAction(fd: FormData) {
  await guard();
  const id = Number(fd.get("id"));
  const op = String(fd.get("op"));
  if (!id) return;
  if (op === "ban") await db.update(users).set({ banned: true }).where(eq(users.id, id));
  if (op === "unban") await db.update(users).set({ banned: false }).where(eq(users.id, id));
  if (op === "promote") await db.update(users).set({ role: "admin" }).where(eq(users.id, id));
  if (op === "demote") await db.update(users).set({ role: "member" }).where(eq(users.id, id));
  if (op === "bonus") await db.update(users).set({ xp: sql`${users.xp} + 100` }).where(eq(users.id, id));
  if (op === "reset") await db.update(users).set({ xp: 0, streak: 0 }).where(eq(users.id, id));
  if (op === "purge") await db.delete(chatMessages).where(eq(chatMessages.userId, id));
  if (op === "delete") await db.delete(users).where(eq(users.id, id));
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
}

export async function createChannelAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await guard();
  const name = String(fd.get("name") ?? "").trim().slice(0, 60);
  const description = String(fd.get("description") ?? "").trim().slice(0, 200);
  const emoji = String(fd.get("emoji") ?? "💬").trim().slice(0, 8) || "💬";
  const slug = slugify(name).slice(0, 40);
  if (!slug) return { ok: false, message: "Channel name required." };
  const clash = await db.select({ id: channels.id }).from(channels).where(eq(channels.slug, slug));
  if (clash.length) return { ok: false, message: "A channel with that name exists." };
  await db.insert(channels).values({ slug, name, description, emoji, sortOrder: 50 });
  revalidatePath("/chat");
  revalidatePath("/admin");
  return { ok: true, message: `#${slug} created.` };
}

export async function deleteChannelAction(fd: FormData) {
  await guard();
  const id = Number(fd.get("id"));
  if (id) await db.delete(channels).where(eq(channels.id, id));
  revalidatePath("/chat");
  revalidatePath("/admin");
}

export async function clearChannelAction(fd: FormData) {
  await guard();
  const id = Number(fd.get("id"));
  if (id) await db.delete(chatMessages).where(eq(chatMessages.channelId, id));
  revalidatePath("/admin");
}
