import { createHmac } from "crypto";
import { and, asc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { ipFromRequest } from "@/lib/security";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 3;

/** Persistent, per-IP organiser login throttle; uses the existing audit table. */
export async function limitAdminLogin(request: Request) {
  const key = process.env.ADMIN_PASSWORD || process.env.DATABASE_URL;
  if (!key) throw new Error("Admin login throttle key is not configured.");
  const ipHash = createHmac("sha256", key)
    .update("gelan-english-club:admin-login-ip:v1:")
    .update(ipFromRequest(request))
    .digest("hex");
  const cutoff = new Date(Date.now() - WINDOW_MS);

  return db.transaction(async (tx) => {
    // Serialize checks for this IP across serverless instances.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${ipHash}))`);
    const [{ count }] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(and(
        eq(auditLogs.action, "admin.login.attempt"),
        eq(auditLogs.targetId, ipHash),
        gt(auditLogs.createdAt, cutoff),
      ));

    if (count >= MAX_ATTEMPTS) {
      const [oldest] = await tx
        .select({ createdAt: auditLogs.createdAt })
        .from(auditLogs)
        .where(and(
          eq(auditLogs.action, "admin.login.attempt"),
          eq(auditLogs.targetId, ipHash),
          gt(auditLogs.createdAt, cutoff),
        ))
        .orderBy(asc(auditLogs.createdAt))
        .limit(1);
      const retryAfter = Math.max(1, Math.ceil((oldest.createdAt.getTime() + WINDOW_MS - Date.now()) / 1000));
      return Response.json({ error: `Too many attempts — try again in ${retryAfter}s.` }, {
        status: 429,
        headers: { "Retry-After": String(retryAfter), "Cache-Control": "no-store" },
      });
    }

    await tx.insert(auditLogs).values({
      actorRole: "anonymous",
      action: "admin.login.attempt",
      targetType: "ip_hash",
      targetId: ipHash,
    });
    return null;
  });
}
