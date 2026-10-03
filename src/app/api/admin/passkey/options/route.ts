import { adminPassword, createAdminSession, verifyAdminPassword } from "@/lib/auth";
import { isTrustedOrigin } from "@/lib/admin-passkeys";
import { limitRequest, logError, logSecurityEvent, sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    return await handleOptions(request);
  } catch (error) {
    logError("admin-passkey.options", error);
    return jsonError("Unable to complete organiser sign-in.", 500);
  }
}

async function handleOptions(request: Request) {
  if (!sameOrigin(request) || !isTrustedOrigin(request)) return jsonError("This sign-in page origin is not allowed. Open the site on its HTTPS domain and try again.", 403);
  const limited = limitRequest(request, "admin", "passkey-options");
  if (limited) return limited;

  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }
  const password = typeof body.password === "string" ? body.password.slice(0, 512) : "";

  if (!adminPassword()) {
    return jsonError("Organiser login is not configured. Set ADMIN_PASSWORD in the hosting environment.", 503);
  }
  if (!verifyAdminPassword(password)) {
    logSecurityEvent("admin-passkey", "password", "failed");
    return jsonError("Incorrect organiser password.", 401);
  }

  try {
    await createAdminSession();
  } catch (error) {
    logError("admin-session", error);
    return jsonError("Unable to create organiser session.", 500);
  }
  logSecurityEvent("admin-passkey", "password", "success");
  return Response.json({ mode: "signed-in" });
}
