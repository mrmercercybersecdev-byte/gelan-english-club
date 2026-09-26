import { randomBytes } from "crypto";
import { db } from "@/db";
import { users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { createSession, hashPassword } from "./session";
import { AVATAR_COLORS } from "./xp";

export const GOOGLE_STATE_COOKIE = "wec_google_state";
export const GOOGLE_NEXT_COOKIE = "wec_google_next";

export type GoogleProfile = { sub: string; email: string; name?: string; picture?: string };

function configuredEmails(name: "GOOGLE_LEADER_EMAILS" | "GOOGLE_TEACHER_EMAILS") {
  return new Set(
    (process.env[name] || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function roleForEmail(email: string) {
  const normalized = email.toLowerCase();
  if (configuredEmails("GOOGLE_LEADER_EMAILS").has(normalized)) return "leader";
  if (configuredEmails("GOOGLE_TEACHER_EMAILS").has(normalized)) return "teacher";
  return "member";
}

function usernameBase(email: string) {
  return email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/^_+|_+$/g, "").slice(0, 20) || "member";
}

async function availableUsername(email: string) {
  const base = usernameBase(email);
  for (let i = 0; i < 100; i += 1) {
    const suffix = i ? `_${i}` : "";
    const candidate = `${base.slice(0, 24 - suffix.length)}${suffix}`;
    const exists = await db.select({ id: users.id }).from(users).where(eq(users.username, candidate));
    if (!exists.length) return candidate;
  }
  return `${base.slice(0, 15)}_${randomBytes(4).toString("hex")}`.slice(0, 32);
}

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.SITE_URL);
}

export function googleRedirectUri() {
  return `${(process.env.SITE_URL || "").replace(/\/$/, "")}/api/auth/google/callback`;
}

export function googleAuthorizationUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeGoogleCode(code: string): Promise<GoogleProfile> {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: googleRedirectUri(),
      grant_type: "authorization_code",
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!tokenResponse.ok) throw new Error("Google token exchange failed");
  const token = (await tokenResponse.json()) as { access_token?: string };
  if (!token.access_token) throw new Error("Google did not return an access token");

  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (!profileResponse.ok) throw new Error("Google profile request failed");
  const profile = (await profileResponse.json()) as GoogleProfile;
  if (!profile.sub || !profile.email) throw new Error("Google profile is missing required fields");
  return profile;
}

export async function signInWithGoogle(profile: GoogleProfile) {
  const email = profile.email.trim().toLowerCase();
  const role = roleForEmail(email);
  const existing = await db
    .select()
    .from(users)
    .where(and(eq(users.googleId, profile.sub), eq(users.email, email)));
  const byEmail = existing[0] ?? (await db.select().from(users).where(eq(users.email, email)))[0];
  if (byEmail) {
    const nextRole = byEmail.role === "admin" || byEmail.role === "leader" || byEmail.role === "teacher" ? byEmail.role : role;
    const [updated] = await db.update(users).set({ googleId: profile.sub, email, role: nextRole }).where(eq(users.id, byEmail.id)).returning();
    await createSession(updated.id);
    return updated;
  }

  const username = await availableUsername(email);
  const [created] = await db.insert(users).values({
    username,
    email,
    googleId: profile.sub,
    displayName: profile.name?.trim().slice(0, 60) || username,
    passwordHash: hashPassword(randomBytes(32).toString("hex")),
    role,
    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
  }).returning();
  await createSession(created.id);
  return created;
}