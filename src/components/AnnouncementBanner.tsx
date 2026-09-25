import { db } from "@/db";
import { announcements } from "@/db/schema";
import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import AnnouncementBannerClient from "./AnnouncementBannerClient";
import { ANNOUNCE_STYLES } from "@/lib/announce";

export default async function AnnouncementBanner() {
  try {
    const [a] = await db
      .select({ id: announcements.id, title: announcements.title, category: announcements.category, linkUrl: announcements.linkUrl, linkLabel: announcements.linkLabel })
      .from(announcements)
      .where(and(eq(announcements.published, true), eq(announcements.showBanner, true), or(isNull(announcements.expiresAt), gt(announcements.expiresAt, new Date()))))
      .orderBy(desc(announcements.createdAt))
      .limit(1);
    if (!a) return null;
    const st = ANNOUNCE_STYLES[a.category] ?? ANNOUNCE_STYLES.news;
    return <AnnouncementBannerClient id={a.id} title={a.title} icon={st.icon} gradient={st.banner} href={a.linkUrl || `/announcements#a-${a.id}`} label={a.linkLabel || "Read more"} />;
  } catch {
    return null;
  }
}
