import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cache } from "react";
import { db } from "@/db";
import { sessions, users, type User } from "@/db/schema";
import { and, eq, gt, lt } from "drizzle-orm";
import { authCookieOptions } from "./security";

export const SESSION_COOKIE = "wec_session";

export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(pw: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, "hex");
  const b = scryptSync(pw, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await db.insert(sessions).values({ token, userId, expiresAt });
  // opportunistic cleanup of expired sessions
  if (Math.random() < 0.1) await db.delete(sessions).where(lt(sessions.expiresAt, new Date())).catch(() => {});
  const store = await cookies();
  store.set(SESSION_COOKIE, token, { ...authCookieOptions(), expires: expiresAt });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.token, token));
  store.set(SESSION_COOKIE, "", { ...authCookieOptions(), maxAge: 0 });
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())));
  const u = rows[0]?.user ?? null;
  if (!u || u.banned) return null;
  return u;
});

export type PublicUser = Pick<
  User,
  "id" | "username" | "displayName" | "avatarColor" | "xp" | "streak" | "role" | "country" | "level"
>;

export function toPublic(u: User): PublicUser {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarColor: u.avatarColor,
    xp: u.xp,
    streak: u.streak,
    role: u.role,
    country: u.country,
    level: u.level,
  };
}
