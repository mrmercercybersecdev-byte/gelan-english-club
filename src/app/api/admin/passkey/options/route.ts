import { generateAuthenticationOptions, generateRegistrationOptions } from "@simplewebauthn/server";
import { db } from "@/db";
import { adminPasskeys } from "@/db/schema";
import { adminPassword, isAdmin, verifyAdminPassword } from "@/lib/auth";
import { saveAdminChallenge, webAuthnConfig, isTrustedOrigin } from "@/lib/admin-passkeys";
import { limitRequest, logSecurityEvent } from "@/lib/security";
import { sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (!sameOrigin(request) || !isTrustedOrigin(request)) return jsonError("Request origin is not allowed.", 403);
  const limited = limitRequest(request, "admin", "passkey-options");
  if (limited) return limited;

  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }
  const password = typeof body.password === "string" ? body.password.slice(0, 512) : "";
  const config = webAuthnConfig(request);

  if (await isAdmin()) {
    if (!verifyAdminPassword(password)) {
      logSecurityEvent("admin-passkey", "enrollment_password", "failed");
      return jsonError("Incorrect organiser password.", 401);
    }
    const currentPasskeys = await db.select().from(adminPasskeys);
    const options = await generateRegistrationOptions({
      ...config,
      userName: "club-organiser",
      userDisplayName: "Gelan English Club organiser",
      userID: Buffer.from("gelan-english-club-organiser"),
      attestationType: "none",
      authenticatorSelection: { residentKey: "preferred", userVerification: "required" },
      excludeCredentials: currentPasskeys.map((passkey) => ({
        id: passkey.credentialId,
        transports: JSON.parse(passkey.transports) as string[],
      })),
    });
    await saveAdminChallenge(options.challenge, "enroll");
    return Response.json({ mode: "register", options });
  }

  if (!adminPassword() || !verifyAdminPassword(password)) {
    logSecurityEvent("admin-passkey", "password", "failed");
    return jsonError("Incorrect organiser password.", 401);
  }

  const currentPasskeys = await db.select().from(adminPasskeys);
  if (currentPasskeys.length === 0) {
    const options = await generateRegistrationOptions({
      ...config,
      userName: "club-organiser",
      userDisplayName: "Gelan English Club organiser",
      userID: Buffer.from("gelan-english-club-organiser"),
      attestationType: "none",
      authenticatorSelection: { residentKey: "preferred", userVerification: "required" },
    });
    await saveAdminChallenge(options.challenge, "bootstrap");
    return Response.json({ mode: "register", options });
  }

  const options = await generateAuthenticationOptions({
    rpID: config.rpID,
    allowCredentials: currentPasskeys.map((passkey) => ({
      id: passkey.credentialId,
      transports: JSON.parse(passkey.transports) as string[],
    })),
    userVerification: "required",
  });
  await saveAdminChallenge(options.challenge, "login");
  return Response.json({ mode: "authenticate", options });
}

