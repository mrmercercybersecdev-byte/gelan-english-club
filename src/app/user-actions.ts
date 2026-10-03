"use server";

import { db } from "@/db";
import { emailVerificationTokens, meetRooms, users } from "@/db/schema";
import { createSession, destroySession, getCurrentUser, hashPassword, verifyPassword } from "@/lib/session";
import { awardXp } from "@/lib/award";
import { AVATAR_COLORS } from "@/lib/xp";
import { and, eq, gt, ilike, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "crypto";
import type { FormState } from "./actions";
import { limitAction, logError } from "@/lib/security";
import { groupMembers, studyGroups } from "@/db/schema";
import { sendVerificationEmail } from "@/lib/email";

function safeNext(v: FormDataEntryValue | null) {
  const s = String(v ?? "/profile");
  return s.startsWith("/") && !s.startsWith("//") ? s : "/profile";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function issueVerificationEmail(user: { id: number; email: string; displayName: string }) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db
    .insert(emailVerificationTokens)
    .values({ userId: user.id, tokenHash, expiresAt })
    .onConflictDoUpdate({
      target: emailVerificationTokens.userId,
      set: { tokenHash, expiresAt },
    });
  await sendVerificationEmail(user.email, user.displayName, token);
}

export async function signupAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const limited = await limitAction("signup");
  if (limited) return { ok: false, message: limited };
  const username = String(fd.get("username") ?? "").trim().toLowerCase();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const displayName = String(fd.get("displayName") ?? "").trim().slice(0, 60) || username;
  const password = String(fd.get("password") ?? "");
  const country = String(fd.get("country") ?? "").trim().slice(0, 60);
  const level = String(fd.get("level") ?? "").slice(0, 50);

  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    return { ok: false, message: "Username must be 3–24 characters: letters, numbers or underscores." };
  }
  if (email.length > 320 || !EMAIL_RE.test(email)) {
    return { ok: false, message: "Please enter a valid email address." };
  }
  if (password.length < 8) return { ok: false, message: "Password must be at least 8 characters." };
  if (password.length > 200) return { ok: false, message: "Password is too long." };

  const exists = await db.select({ id: users.id }).from(users).where(eq(users.username, username));
  if (exists.length) return { ok: false, message: "That username is taken — try another." };
  const emailExists = await db.select({ id: users.id }).from(users).where(ilike(users.email, email));
  if (emailExists.length) return { ok: false, message: "That email is already registered. Log in or request a new confirmation email." };

  const [u] = await db
    .insert(users)
    .values({
      username,
      email,
      emailVerified: false,
      displayName,
      passwordHash: hashPassword(password),
      country: country || null,
      level: level || null,
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    })
    .onConflictDoNothing()
    .returning();
  if (!u) {
    return { ok: false, message: "That username or email is already registered. Log in or request a new confirmation email." };
  }

  await awardXp(u.id, "daily_bonus", "welcome");
  // Join any groups picked during sign-up (open groups only; approval groups create a pending request)
  const picked = fd.getAll("groups").map((v) => Number(v)).filter((n) => Number.isInteger(n) && n > 0).slice(0, 10);
  if (picked.length) {
    const gs = await db.select().from(studyGroups).where(inArray(studyGroups.id, picked));
    if (gs.length) {
      await db
        .insert(groupMembers)
        .values(gs.map((g) => ({ groupId: g.id, userId: u.id, status: g.joinPolicy === "approval" ? "pending" : "active" })))
        .onConflictDoNothing();
      await awardXp(u.id, "group_join", "signup");
    }
  }
  try {
    await issueVerificationEmail({ id: u.id, email, displayName });
  } catch (error) {
    logError("auth.email-verification.send", error, { userId: u.id });
    return {
      ok: false,
      message: "Your account was created, but we couldn't send the confirmation email. Ask an organiser to check email settings, then request a new link below.",
    };
  }
  return { ok: true, message: "Account created. Check your inbox for a confirmation link before logging in." };
}

export async function resendVerificationEmailAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const limited = await limitAction("signup", `resend:${email}`);
  if (limited) return { ok: false, message: limited };
  if (email.length > 320 || !EMAIL_RE.test(email)) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  const [user] = await db
    .select({ id: users.id, email: users.email, emailVerified: users.emailVerified, displayName: users.displayName })
    .from(users)
    .where(ilike(users.email, email));
  if (!user || user.emailVerified || !user.email) {
    return { ok: true, message: "If that address has an unverified account, a new confirmation link will be sent." };
  }

  try {
    await issueVerificationEmail({ id: user.id, email: user.email, displayName: user.displayName });
  } catch (error) {
    logError("auth.email-verification.resend", error, { userId: user.id });
    return { ok: false, message: "We couldn't send the confirmation email right now. Please try again later." };
  }

  return { ok: true, message: "If that address has an unverified account, a new confirmation link will be sent." };
}

export async function confirmEmailAction(fd: FormData) {
  const token = String(fd.get("token") ?? "");
  if (!/^[a-f0-9]{64}$/.test(token)) redirect("/login?error=verification");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const confirmed = await db.transaction(async (tx) => {
    const [verification] = await tx
      .delete(emailVerificationTokens)
      .where(and(eq(emailVerificationTokens.tokenHash, tokenHash), gt(emailVerificationTokens.expiresAt, new Date())))
      .returning({ userId: emailVerificationTokens.userId });
    if (!verification) return false;
    await tx.update(users).set({ emailVerified: true }).where(eq(users.id, verification.userId));
    return true;
  });

  redirect(confirmed ? "/login?verified=1" : "/login?error=verification");
}

export async function loginUserAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const username = String(fd.get("username") ?? "").trim().toLowerCase();
  const limited = await limitAction("login", username);
  if (limited) return { ok: false, message: limited };
  const password = String(fd.get("password") ?? "");
  const [u] = await db.select().from(users).where(eq(users.username, username));
  if (!u || !verifyPassword(password, u.passwordHash)) {
    return { ok: false, message: "Wrong username or password." };
  }
  if (!u.emailVerified) {
    return { ok: false, message: "Please confirm your email before logging in. You can request a new link below." };
  }
  if (u.banned) return { ok: false, message: "This account has been suspended." };
  await createSession(u.id);
  await awardXp(u.id, "daily_bonus", "login");
  redirect(safeNext(fd.get("next")));
}

export async function logoutUserAction() {
  await destroySession();
  redirect("/");
}

export async function updateProfileAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please log in." };
  const displayName = String(fd.get("displayName") ?? "").trim().slice(0, 60);
  const bio = String(fd.get("bio") ?? "").trim().slice(0, 280);
  const country = String(fd.get("country") ?? "").trim().slice(0, 60);
  const avatarColor = String(fd.get("avatarColor") ?? "");
  await db
    .update(users)
    .set({
      displayName: displayName || user.displayName,
      bio: bio || null,
      country: country || null,
      avatarColor: AVATAR_COLORS.includes(avatarColor) ? avatarColor : user.avatarColor,
    })
    .where(eq(users.id, user.id));
  revalidatePath("/profile");
  return { ok: true, message: "Profile saved." };
}

export async function createRoomAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  const title = String(fd.get("title") ?? "").trim().slice(0, 120) || "English practice room";
  const hostName = String(fd.get("hostName") ?? user?.displayName ?? "Host").trim().slice(0, 60) || "Host";
  const alphabet = "abcdefghjkmnpqrstuvwxyz";
  const part = (n: number) => Array.from(randomBytes(n), (b) => alphabet[b % alphabet.length]).join("");
  const code = `${part(3)}-${part(4)}-${part(3)}`;
  await db.insert(meetRooms).values({ code, title, hostName });
  redirect(`/meet/${code}`);
}
