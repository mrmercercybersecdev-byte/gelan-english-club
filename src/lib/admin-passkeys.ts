import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db";
import { adminPasskeyChallenges } from "@/db/schema";

export const ADMIN_CHALLENGE_COOKIE = "wec_admin_challenge";

export function webAuthnConfig(request: Request) {
  const configuredUrl = process.env.SITE_URL;
  if (process.env.NODE_ENV === "production" && !configuredUrl) {
    throw new Error("SITE_URL must be configured to enable organiser passkeys.");
  }
  const origin = process.env.NODE_ENV === "production"
    ? new URL(configuredUrl!).origin
    : new URL(request.url).origin;
  const url = new URL(origin);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("Organiser passkeys require an HTTPS SITE_URL in production.");
  }
  return { origin, rpID: url.hostname, rpName: "Gelan English Club" };
}

export function isTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === webAuthnConfig(request).origin;
  } catch {
    return false;
  }
}

export async function saveAdminChallenge(challenge: string, purpose: "login" | "bootstrap" | "enroll") {
  const id = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await db.insert(adminPasskeyChallenges).values({ id, challenge, purpose, expiresAt });
  await db.delete(adminPasskeyChallenges).where(lt(adminPasskeyChallenges.expiresAt, new Date()));
  const store = await cookies();
  store.set(ADMIN_CHALLENGE_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/admin/passkey",
    expires: expiresAt,
  });
}

export async function consumeAdminChallenge() {
  const store = await cookies();
  const id = store.get(ADMIN_CHALLENGE_COOKIE)?.value;
  store.set(ADMIN_CHALLENGE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/admin/passkey",
    maxAge: 0,
  });
  if (!id || !/^[a-f0-9]{64}$/.test(id)) return null;
  const [challenge] = await db
    .delete(adminPasskeyChallenges)
    .where(and(
      eq(adminPasskeyChallenges.id, id),
      gt(adminPasskeyChallenges.expiresAt, new Date()),
    ))
    .returning({
      challenge: adminPasskeyChallenges.challenge,
      purpose: adminPasskeyChallenges.purpose,
    });
  return challenge ?? null;
}
