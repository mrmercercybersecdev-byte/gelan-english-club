import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db";
import { adminPasskeyChallenges } from "@/db/schema";
import { cookieSecure } from "@/lib/security";

export const ADMIN_CHALLENGE_COOKIE = "wec_admin_challenge";
export const ORGANISER_WEBAUTHN_USER_ID = new TextEncoder().encode("gelan-english-club-organiser");

function requestOrigin(request: Request) {
  const originHeader = request.headers.get("origin");
  if (originHeader) return new URL(originHeader).origin;
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").split(",")[0].trim();
  const proto = (request.headers.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http"))
    .split(",")[0]
    .trim();
  if (host) return `${proto}://${host}`;
  if (process.env.SITE_URL) return new URL(process.env.SITE_URL).origin;
  return new URL(request.url).origin;
}

export function webAuthnConfig(request: Request) {
  const origin = requestOrigin(request);
  const url = new URL(origin);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:" && process.env.COOKIE_INSECURE !== "1") {
    throw new Error("Organiser passkeys require HTTPS.");
  }
  return { origin, rpID: url.hostname, rpName: "Gelan English Club" };
}

export function isTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const originUrl = new URL(origin);
    const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").split(",")[0].trim();
    if (host && originUrl.host === host) return true;
    const configured = process.env.SITE_URL;
    if (configured) return originUrl.origin === new URL(configured).origin;
    return false;
  } catch {
    return false;
  }
}

export function parseTransports(raw: string): AuthenticatorTransport[] {
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is AuthenticatorTransport => typeof item === "string");
  } catch {
    return [];
  }
}

function challengeCookieOptions(extra: { expires?: Date; maxAge?: number; path?: string } = {}) {
  return {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax" as const,
    path: extra.path ?? "/",
    expires: extra.expires,
    maxAge: extra.maxAge,
  };
}

export async function saveAdminChallenge(challenge: string, purpose: "login" | "bootstrap" | "enroll") {
  const id = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await db.insert(adminPasskeyChallenges).values({ id, challenge, purpose, expiresAt });
  await db.delete(adminPasskeyChallenges).where(lt(adminPasskeyChallenges.expiresAt, new Date()));
  const store = await cookies();
  store.set(ADMIN_CHALLENGE_COOKIE, id, challengeCookieOptions({ expires: expiresAt }));
}

export async function consumeAdminChallenge() {
  const store = await cookies();
  const id = store.get(ADMIN_CHALLENGE_COOKIE)?.value;
  store.set(ADMIN_CHALLENGE_COOKIE, "", challengeCookieOptions({ maxAge: 0 }));
  store.set(ADMIN_CHALLENGE_COOKIE, "", challengeCookieOptions({ maxAge: 0, path: "/api/admin/passkey" }));
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
