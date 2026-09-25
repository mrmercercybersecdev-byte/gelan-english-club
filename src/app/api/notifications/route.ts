import { NextRequest } from "next/server";
import { db } from "@/db";
import { announcements, notifications } from "@/db/schema";
import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";
import { sameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  const now = new Date();
  const ann = await db
    .select({ id: announcements.id, title: announcements.title, category: announcements.category, createdAt: announcements.createdAt, pinned: announcements.pinned })
    .from(announcements)
    .where(and(eq(announcements.published, true), or(isNull(announcements.expiresAt), gt(announcements.expiresAt, now))))
    .orderBy(desc(announcements.createdAt))
    .limit(6);
  const mine = user
    ? await db.select().from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt)).limit(15)
    : [];
  return Response.json(
    { announcements: ann, notifications: mine, unread: mine.filter((n) => !n.read).length },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return Response.json({ error: "Forbidden" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await db.update(notifications).set({ read: true }).where(and(eq(notifications.userId, user.id), eq(notifications.read, false)));
  return Response.json({ ok: true });
}
