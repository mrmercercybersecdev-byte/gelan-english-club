import {
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { adminPasskeys } from "@/db/schema";
import { createAdminSession, isAdmin, verifyAdminPassword } from "@/lib/auth";
import { consumeAdminChallenge, isTrustedOrigin, parseTransports, webAuthnConfig } from "@/lib/admin-passkeys";
import { limitRequest, logError, logSecurityEvent, sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    return await handleVerification(request);
  } catch (error) {
    logError("admin-passkey.verify", error);
    return jsonError("Unable to complete organiser sign-in.", 500);
  }
}

async function handleVerification(request: Request) {
  if (!sameOrigin(request) || !isTrustedOrigin(request)) {
    return jsonError("This sign-in page origin is not allowed. Open the site on its HTTPS domain and try again.", 403);
  }
  const limited = limitRequest(request, "admin", "passkey-verify");
  if (limited) return limited;

  let body: {
    mode?: unknown;
    password?: unknown;
    response?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }
  if ((body.mode !== "register" && body.mode !== "authenticate") || !body.response || typeof body.response !== "object") {
    return jsonError("Invalid passkey response.", 400);
  }

  const challenge = await consumeAdminChallenge();
  if (!challenge) return jsonError("Passkey request expired. Start again.", 400);
  const config = webAuthnConfig(request);

  if (body.mode === "register") {
    const isBootstrap = challenge.purpose === "bootstrap";
    if ((!isBootstrap && challenge.purpose !== "enroll") ||
      (isBootstrap && (await isAdmin() || !verifyAdminPassword(typeof body.password === "string" ? body.password : ""))) ||
      (!isBootstrap && !(await isAdmin()))) {
      logSecurityEvent("admin-passkey", "registration", "failed");
      return jsonError("Organiser authentication is required.", 401);
    }

    if (isBootstrap) {
      const existing = await db.select({ id: adminPasskeys.credentialId }).from(adminPasskeys).limit(1);
      if (existing.length) return jsonError("A passkey is already set up. Sign in with it first.", 409);
    }

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: body.response as RegistrationResponseJSON,
        expectedChallenge: challenge.challenge,
        expectedOrigin: config.origin,
        expectedRPID: config.rpID,
        requireUserVerification: true,
      });
    } catch {
      logSecurityEvent("admin-passkey", "registration", "failed");
      return jsonError("Passkey registration could not be verified.", 400);
    }
    if (!verification.verified) {
      logSecurityEvent("admin-passkey", "registration", "failed");
      return jsonError("Passkey registration could not be verified.", 400);
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
    const transports = Array.isArray((body.response as RegistrationResponseJSON).response.transports)
      ? (body.response as RegistrationResponseJSON).response.transports!
      : [];
    const inserted = await db
      .insert(adminPasskeys)
      .values({
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey).toString("base64url"),
        counter: credential.counter,
        transports: JSON.stringify(transports),
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
      })
      .onConflictDoNothing()
      .returning({ credentialId: adminPasskeys.credentialId });
    if (!inserted.length) return jsonError("That passkey is already registered.", 409);

    await createAdminSession();
    logSecurityEvent("admin-passkey", isBootstrap ? "bootstrap" : "enrollment", "success");
    return Response.json({ ok: true });
  }

  if (challenge.purpose !== "login") return jsonError("Passkey request expired. Start again.", 400);
  const assertion = body.response as AuthenticationResponseJSON;
  if (typeof assertion.id !== "string" || assertion.id.length > 1024) {
    return jsonError("Passkey sign-in failed. Try again, or use a device that already has a passkey.", 401);
  }
  const [stored] = await db
    .select()
    .from(adminPasskeys)
    .where(eq(adminPasskeys.credentialId, assertion.id))
    .limit(1);
  if (!stored) {
    logSecurityEvent("admin-passkey", "authentication", "failed");
    return jsonError("Passkey sign-in failed. Try again, or use a device that already has a passkey.", 401);
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: assertion,
      expectedChallenge: challenge.challenge,
      expectedOrigin: config.origin,
      expectedRPID: config.rpID,
      requireUserVerification: true,
      credential: {
        id: stored.credentialId,
        publicKey: new Uint8Array(Buffer.from(stored.publicKey, "base64url")),
        counter: stored.counter,
        transports: parseTransports(stored.transports),
      },
    });
  } catch {
    logSecurityEvent("admin-passkey", "authentication", "failed");
    return jsonError("Passkey sign-in failed. Try again, or use a device that already has a passkey.", 401);
  }
  if (!verification.verified) {
    logSecurityEvent("admin-passkey", "authentication", "failed");
    return jsonError("Passkey sign-in failed. Try again, or use a device that already has a passkey.", 401);
  }

  await db
    .update(adminPasskeys)
    .set({
      counter: verification.authenticationInfo.newCounter,
      deviceType: verification.authenticationInfo.credentialDeviceType,
      backedUp: verification.authenticationInfo.credentialBackedUp,
    })
    .where(and(eq(adminPasskeys.credentialId, stored.credentialId), eq(adminPasskeys.counter, stored.counter)));
  await createAdminSession();
  logSecurityEvent("admin-passkey", "authentication", "success");
  return Response.json({ ok: true });
}
