import "server-only";

import { lt } from "drizzle-orm";
import { db } from "@/db";
import { siteAnalyticsEvents, visitorConsents } from "@/db/schema";

let lastCleanup = 0;

export async function cleanupAnalytics() {
  const now = Date.now();
  if (now - lastCleanup < 86_400_000) return;
  const cutoff = new Date(now - 90 * 86_400_000);
  await db.delete(siteAnalyticsEvents).where(lt(siteAnalyticsEvents.createdAt, cutoff));
  await db.delete(visitorConsents).where(lt(visitorConsents.expiresAt, new Date(now)));
  lastCleanup = now;
}
