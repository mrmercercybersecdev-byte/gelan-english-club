import type { MetadataRoute } from "next";
import { db } from "@/db";
import { blogPosts, events, studyGroups } from "@/db/schema";
import { eq } from "drizzle-orm";
import { siteUrl } from "@/lib/site";
import { TRACKS } from "@/lib/quizzes";
import { GAMES } from "@/lib/games";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const staticPaths = ["", "/events", "/learn", "/speak", "/meet", "/chat", "/leaderboard", "/blog", "/about", "/announcements", "/groups", "/games", "/board", "/join", "/contact", "/verify"];
  const entries: MetadataRoute.Sitemap = staticPaths.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly", priority: p === "" ? 1 : 0.7 }));
  TRACKS.forEach((t) => entries.push({ url: `${base}/learn/${t.id}`, changeFrequency: "monthly", priority: 0.6 }));
  GAMES.forEach((g) => entries.push({ url: `${base}/games/${g.id}`, changeFrequency: "monthly", priority: 0.5 }));
  try {
    const [posts, evs, groups] = await Promise.all([
      db.select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt }).from(blogPosts).where(eq(blogPosts.published, true)),
      db.select({ id: events.id }).from(events),
      db.select({ slug: studyGroups.slug }).from(studyGroups),
    ]);
    posts.forEach((p) => entries.push({ url: `${base}/blog/${p.slug}`, lastModified: p.updatedAt, priority: 0.6 }));
    evs.forEach((e) => entries.push({ url: `${base}/events/${e.id}`, priority: 0.5 }));
    groups.forEach((g) => entries.push({ url: `${base}/groups/${g.slug}`, priority: 0.5 }));
  } catch {
    /* DB unavailable — return static entries only */
  }
  return entries;
}
