import { cookies } from "next/headers";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { getCurrentUser } from "./session";
import { cookieSecure } from "./security";

export const ADMIN_COOKIE = "wec_admin";

export function adminPassword() {
  return process.env.ADMIN_PASSWORD || "";
}

export function verifyAdminPassword(candidate: string) {
  const expected = adminPassword();
  if (!expected) return false;
  const actualHash = createHash("sha256").update(candidate).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax" as const,
    path: "/",
  };
}

export async function createAdminSession() {
  const password = adminPassword();
  if (!password) throw new Error("Organiser password is not configured.");
  const expiresAtSeconds = Math.floor(Date.now() / 1000) + 8 * 60 * 60;
  const payload = `${expiresAtSeconds}.${randomBytes(16).toString("base64url")}`;
  const key = createHash("sha256").update("gelan-organiser-cookie-v1:").update(password).digest();
  const signature = createHmac("sha256", key).update(payload).digest("base64url");
  const store = await cookies();
  store.set(ADMIN_COOKIE, `${payload}.${signature}`, {
    ...adminCookieOptions(),
    expires: new Date(expiresAtSeconds * 1000),
  });
}

export async function destroyAdminSession() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, "", { ...adminCookieOptions(), maxAge: 0 });
}

export async function isAdmin() {
  const password = adminPassword();
  if (!password) return false;
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  const match = token?.match(/^(\d{10})\.([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]{43})$/);
  if (!match || Number(match[1]) <= Math.floor(Date.now() / 1000)) return false;
  const payload = `${match[1]}.${match[2]}`;
  const key = createHash("sha256").update("gelan-organiser-cookie-v1:").update(password).digest();
  const expected = createHmac("sha256", key).update(payload).digest();
  const actual = Buffer.from(match[3], "base64url");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function isContentManager() {
  if (await isAdmin()) return true;
  const u = await getCurrentUser();
  return u?.role === "leader" || u?.role === "teacher";
}
