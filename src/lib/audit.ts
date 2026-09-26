import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function recordAudit(action: string, targetType?: string, targetId?: string | number, metadata?: Record<string, unknown>) {
  try {
    const actor = await getCurrentUser();
    await db.insert(auditLogs).values({
      actorId: actor?.id ?? null,
      actorRole: actor?.role ?? "admin_password",
      action: action.slice(0, 80),
      targetType: targetType?.slice(0, 40) ?? null,
      targetId: targetId == null ? null : String(targetId).slice(0, 80),
      metadata: metadata ? JSON.stringify(metadata).slice(0, 2000) : null,
    });
  } catch (error) {
    console.error(JSON.stringify({ level: "error", scope: "audit", message: error instanceof Error ? error.message : String(error) }));
  }
}