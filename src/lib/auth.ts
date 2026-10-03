import { cookies } from "next/headers";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db";
import { adminSessions } from "@/db/schema";
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
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await db.insert(adminSessions).values({ tokenHash, expiresAt });
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()));
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, { ...adminCookieOptions(), expires: expiresAt });
}

export async function destroyAdminSession() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (token) {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await db.delete(adminSessions).where(eq(adminSessions.tokenHash, tokenHash));
  }
  store.set(ADMIN_COOKIE, "", { ...adminCookieOptions(), maxAge: 0 });
}

export async function isAdmin() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return false;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const [session] = await db
    .select({ tokenHash: adminSessions.tokenHash })
    .from(adminSessions)
    .where(and(eq(adminSessions.tokenHash, tokenHash), gt(adminSessions.expiresAt, new Date())))
    .limit(1);
  return Boolean(session);
}

export async function isContentManager() {
  if (await isAdmin()) return true;
  const u = await getCurrentUser();
  return u?.role === "leader" || u?.role === "teacher";
}
