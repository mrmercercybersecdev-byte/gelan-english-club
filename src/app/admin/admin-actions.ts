"use server";

import { db } from "@/db";
import { blogPosts, channels, users, chatMessages, aiSettings, siteContent } from "@/db/schema";
import { isAdmin, isContentManager } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { isSafeCoverImage } from "@/lib/image-url";
import { AI_PROVIDERS, encryptAiKey, type AiProvider } from "@/lib/ai-settings";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "../actions";

async function guard() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

async function contentGuard() {
  if (!(await isContentManager())) throw new Error("Unauthorized");
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
  await contentGuard();
  const id = Number(fd.get("id") || 0);
  const title = String(fd.get("title") ?? "").trim().slice(0, 200);
  const content = String(fd.get("content") ?? "").trim();
  const excerpt = String(fd.get("excerpt") ?? "").trim().slice(0, 400) || content.replace(/[#>*_`]/g, "").slice(0, 180);
  const tags = String(fd.get("tags") ?? "").trim().slice(0, 200);
  const author = String(fd.get("author") ?? "").trim().slice(0, 80) || "Gelan English Club";
  const coverImageInput = String(fd.get("coverImage") ?? "").trim();
  if (coverImageInput && !isSafeCoverImage(coverImageInput)) {
    return { ok: false, message: "Cover images must use an /images/ path or a secure HTTPS URL." };
  }
  const coverImage = coverImageInput || null;
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
  await recordAudit(id ? "blog.update" : "blog.create", "blog_post", id || undefined, { title, published });
  revalidatePath("/blog");
  revalidatePath("/admin");
  redirect("/admin?tab=blog");
}

export async function deleteBlogPostAction(fd: FormData) {
  await contentGuard();
  const id = Number(fd.get("id"));
  if (id) await db.delete(blogPosts).where(eq(blogPosts.id, id));
  if (id) await recordAudit("blog.delete", "blog_post", id);
  revalidatePath("/blog");
  revalidatePath("/admin");
}

export async function toggleBlogPublishAction(fd: FormData) {
  await contentGuard();
  const id = Number(fd.get("id"));
  if (id) await db.update(blogPosts).set({ published: sql`not ${blogPosts.published}` }).where(eq(blogPosts.id, id));
  if (id) await recordAudit("blog.toggle_publish", "blog_post", id);
  revalidatePath("/blog");
  revalidatePath("/admin");
}

export async function saveAiSettingsAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await guard();
  const scope = String(fd.get("scope") || "learning");
  const provider = String(fd.get("provider") ?? "");
  const model = String(fd.get("model") ?? "").trim();
  const apiKey = String(fd.get("apiKey") ?? "").trim();
  if (!["learning", "chat"].includes(scope)) {
    return { ok: false, message: "Choose a valid AI scope." };
  }
  if (!AI_PROVIDERS.includes(provider as AiProvider)) {
    return { ok: false, message: "Choose Gemini or Groq." };
  }
  if (!model || model.length > 100) return { ok: false, message: "Enter a model name up to 100 characters." };
  if (apiKey.length > 500 || (apiKey && apiKey.length < 12)) {
    return { ok: false, message: "Enter a valid provider API key." };
  }

  const existing = await db
    .select({ provider: aiSettings.provider, encryptedApiKey: aiSettings.encryptedApiKey })
    .from(aiSettings)
    .where(eq(aiSettings.scope, scope))
    .limit(1);
  if (existing[0] && existing[0].provider !== provider && !apiKey) {
    return { ok: false, message: "Enter an API key when changing providers." };
  }
  let encryptedApiKey = existing[0]?.encryptedApiKey;
  if (apiKey) {
    try {
      encryptedApiKey = encryptAiKey(apiKey);
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : "Could not securely save the API key." };
    }
  }
  if (!encryptedApiKey) return { ok: false, message: "Enter an API key to enable the selected AI provider." };

  await db
    .insert(aiSettings)
    .values({ scope, provider, model, encryptedApiKey, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: aiSettings.scope,
      set: { provider, model, encryptedApiKey, updatedAt: new Date() },
    });
  await recordAudit("ai.settings.update", "ai_settings", 1, { scope, provider, model });
  revalidatePath("/admin");
  revalidatePath("/learn");
  return { ok: true, message: `${provider === "gemini" ? "Gemini" : "Groq"} settings saved for ${scope}. The API key is encrypted and never displayed again.` };
}

export async function clearAiSettingsAction(fd: FormData) {
  await guard();
  const scope = String(fd.get("scope") || "learning");
  if (["learning", "chat"].includes(scope)) {
    await db.delete(aiSettings).where(eq(aiSettings.scope, scope));
    await recordAudit("ai.settings.clear", "ai_settings", 1, { scope });
  }
  revalidatePath("/admin");
  revalidatePath("/learn");
}

export async function saveSiteContentAction(fd: FormData) {
  await contentGuard();
  const id = Number(fd.get("id") || 0);
  const pagePath = String(fd.get("pagePath") ?? "").trim().slice(0, 300);
  const placement = String(fd.get("placement") ?? "bottom");
  const title = String(fd.get("title") ?? "").trim().slice(0, 200);
  const body = String(fd.get("body") ?? "").trim().slice(0, 10000);
  const linkLabel = String(fd.get("linkLabel") ?? "").trim().slice(0, 80);
  const linkUrl = String(fd.get("linkUrl") ?? "").trim().slice(0, 500);
  const published = fd.get("published") === "on";
  if (!/^\/(?!\/)[a-zA-Z0-9_/?=&%.-]*$/.test(pagePath) || pagePath.includes("..")) throw new Error("Choose a valid site path, such as /about.");
  if (! ["top", "bottom"].includes(placement)) throw new Error("Choose a valid placement.");
  if (!body) throw new Error("Content is required.");
  if (linkUrl && !linkUrl.startsWith("/") && !/^https:\/\//i.test(linkUrl)) throw new Error("Links must be a site path or secure HTTPS URL.");
  const values = { pagePath, placement, title, body, linkLabel: linkLabel || null, linkUrl: linkUrl || null, published, updatedAt: new Date() };
  let savedId = id;
  if (id) await db.update(siteContent).set(values).where(eq(siteContent.id, id));
  else savedId = (await db.insert(siteContent).values(values).returning({ id: siteContent.id }))[0].id;
  await recordAudit(id ? "page_content.update" : "page_content.create", "site_content", savedId, { pagePath, placement, published });
  revalidatePath(pagePath);
  revalidatePath("/admin");
  redirect("/admin?tab=pages");
}

export async function deleteSiteContentAction(fd: FormData) {
  await contentGuard();
  const id = Number(fd.get("id"));
  if (!Number.isSafeInteger(id) || id < 1) return;
  const [row] = await db.select({ pagePath: siteContent.pagePath }).from(siteContent).where(eq(siteContent.id, id));
  if (row) {
    await db.delete(siteContent).where(eq(siteContent.id, id));
    await recordAudit("page_content.delete", "site_content", id, { pagePath: row.pagePath });
    revalidatePath(row.pagePath);
  }
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
