import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { adminPasskeys, adminSessions } from "@/db/schema";
import { createAdminSession, isAdmin, verifyAdminPassword } from "@/lib/auth";
import { isTrustedOrigin } from "@/lib/admin-passkeys";
import { limitRequest, sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function GET(request: Request) {
  if (!sameOrigin(request) || !isTrustedOrigin(request)) return jsonError("Request origin is not allowed.", 403);
  if (!(await isAdmin())) return jsonError("Organiser authentication is required.", 401);
  const credentials = await db.select({
    credentialId: adminPasskeys.credentialId,
    createdAt: adminPasskeys.createdAt,
    deviceType: adminPasskeys.deviceType,
    backedUp: adminPasskeys.backedUp,
  }).from(adminPasskeys);
  return Response.json({ credentials });
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request) || !isTrustedOrigin(request)) return jsonError("Request origin is not allowed.", 403);
  if (!(await isAdmin())) return jsonError("Organiser authentication is required.", 401);
  const limited = limitRequest(request, "admin", "passkey-delete");
  if (limited) return limited;

  let body: { credentialId?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }
  const credentialId = typeof body.credentialId === "string" ? body.credentialId.slice(0, 1024) : "";
  const password = typeof body.password === "string" ? body.password.slice(0, 512) : "";
  if (!credentialId || !verifyAdminPassword(password)) return jsonError("Incorrect organiser password.", 401);

  const removed = await db.transaction(async (tx) => {
    const allCredentials = await tx.select({ credentialId: adminPasskeys.credentialId })
      .from(adminPasskeys)
      .orderBy(asc(adminPasskeys.credentialId))
      .for("update");
    if (allCredentials.length < 2 || !allCredentials.some((credential) => credential.credentialId === credentialId)) {
      return false;
    }
    await tx.delete(adminPasskeys).where(eq(adminPasskeys.credentialId, credentialId));
    return true;
  });
  if (!removed) return jsonError("Keep at least one passkey registered.", 409);

  await db.delete(adminSessions);
  await createAdminSession();
  return Response.json({ ok: true });
}
