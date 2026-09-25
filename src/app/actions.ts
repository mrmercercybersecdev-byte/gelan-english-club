"use server";

import { db } from "@/db";
import { events, members, messages, posts, rsvps } from "@/db/schema";
import { ADMIN_COOKIE, adminPassword, adminToken, isAdmin } from "@/lib/auth";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authCookieOptions, limitAction } from "@/lib/security";

export type FormState = { ok: boolean; message: string } | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function str(fd: FormData, key: string, max = 1000) {
  return String(fd.get(key) ?? "").trim().slice(0, max);
}

/* ---------- RSVP ---------- */
export async function rsvpAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const limited = await limitAction("form", "rsvp");
  if (limited) return { ok: false, message: limited };
  const eventId = Number(fd.get("eventId"));
  const name = str(fd, "name", 120);
  const email = str(fd, "email", 200).toLowerCase();
  const note = str(fd, "note", 500);

  if (!eventId || !name || !EMAIL_RE.test(email)) {
    return { ok: false, message: "Please enter your name and a valid email address." };
  }

  const [event] = await db.select().from(events).where(eq(events.id, eventId));
  if (!event) return { ok: false, message: "This event no longer exists." };
  if (event.startsAt.getTime() < Date.now()) {
    return { ok: false, message: "This event has already taken place." };
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(rsvps)
    .where(eq(rsvps.eventId, eventId));
  if (count >= event.capacity) {
    return { ok: false, message: "Sorry — this event is fully booked." };
  }

  const existing = await db
    .select({ id: rsvps.id })
    .from(rsvps)
    .where(and(eq(rsvps.eventId, eventId), eq(rsvps.email, email)));
  if (existing.length) {
    return { ok: false, message: "You're already on the list for this event. See you there!" };
  }

  await db.insert(rsvps).values({ eventId, name, email, note: note || null });
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  return { ok: true, message: `You're in, ${name.split(" ")[0]}! We've saved your spot.` };
}

/* ---------- Membership ---------- */
export async function joinAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const limited = await limitAction("form", "join");
  if (limited) return { ok: false, message: limited };
  const fullName = str(fd, "fullName", 120);
  const email = str(fd, "email", 200).toLowerCase();
  const level = str(fd, "level", 50);
  const nativeLanguage = str(fd, "nativeLanguage", 80);
  const goals = str(fd, "goals", 1000);
  const interests = fd
    .getAll("interests")
    .map((v) => String(v))
    .join(", ")
    .slice(0, 500);

  if (!fullName || !EMAIL_RE.test(email) || !level) {
    return { ok: false, message: "Please fill in your name, a valid email and your English level." };
  }

  const existing = await db.select({ id: members.id }).from(members).where(eq(members.email, email));
  if (existing.length) {
    return { ok: false, message: "That email is already registered. Welcome back!" };
  }

  await db.insert(members).values({
    fullName,
    email,
    level,
    nativeLanguage: nativeLanguage || null,
    goals: goals || null,
    interests: interests || null,
  });
  return {
    ok: true,
    message: `Welcome aboard, ${fullName.split(" ")[0]}! We'll email you a welcome pack within 48 hours.`,
  };
}

/* ---------- Contact ---------- */
export async function contactAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const limited = await limitAction("form", "contact");
  if (limited) return { ok: false, message: limited };
  const name = str(fd, "name", 120);
  const email = str(fd, "email", 200);
  const subject = str(fd, "subject", 200) || "General enquiry";
  const body = str(fd, "body", 4000);

  if (!name || !EMAIL_RE.test(email) || body.length < 5) {
    return { ok: false, message: "Please include your name, a valid email, and a message." };
  }

  await db.insert(messages).values({ name, email, subject, body });
  return { ok: true, message: "Thanks for reaching out! We usually reply within a day." };
}

/* ---------- Phrase wall ---------- */
export async function createPostAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const limited = await limitAction("form", "post");
  if (limited) return { ok: false, message: limited };
  const author = str(fd, "author", 80);
  const kind = str(fd, "kind", 20);
  const content = str(fd, "content", 280);
  const meaning = str(fd, "meaning", 400);

  if (!author || !content || !["idiom", "question", "tip"].includes(kind)) {
    return { ok: false, message: "Please add your name, choose a type and write something." };
  }

  await db.insert(posts).values({ author, kind, content, meaning: meaning || null });
  revalidatePath("/board");
  return { ok: true, message: "Posted! Thanks for sharing with the club." };
}

export async function likePostAction(id: number) {
  await db
    .update(posts)
    .set({ likes: sql`${posts.likes} + 1` })
    .where(eq(posts.id, id));
  revalidatePath("/board");
}

/* ---------- Admin ---------- */
export async function loginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const limited = await limitAction("login", "admin");
  if (limited) return { ok: false, message: limited };
  const password = String(fd.get("password") ?? "");
  if (!adminPassword()) {
    return { ok: false, message: "Organiser password login is not configured." };
  }
  if (password !== adminPassword()) {
    return { ok: false, message: "Incorrect password." };
  }
  const store = await cookies();
  store.set(ADMIN_COOKIE, adminToken(), { ...authCookieOptions(), maxAge: 60 * 60 * 8 });
  redirect("/admin");
}

export async function logoutAction() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, "", { ...authCookieOptions(), maxAge: 0 });
  redirect("/admin");
}

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

export async function createEventAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const title = str(fd, "title", 200);
  const description = str(fd, "description", 4000);
  const category = str(fd, "category", 50);
  const level = str(fd, "level", 50) || "All levels";
  const location = str(fd, "location", 200);
  const host = str(fd, "host", 120);
  const startsAtRaw = str(fd, "startsAt", 40);
  const durationMinutes = Number(fd.get("durationMinutes")) || 90;
  const capacity = Number(fd.get("capacity")) || 20;
  const startsAt = new Date(startsAtRaw);

  if (!title || !description || !category || !location || !host || isNaN(startsAt.getTime())) {
    return { ok: false, message: "Please complete every field with valid values." };
  }

  await db.insert(events).values({
    title,
    description,
    category,
    level,
    location,
    host,
    startsAt,
    durationMinutes: Math.max(15, Math.min(600, durationMinutes)),
    capacity: Math.max(1, Math.min(1000, capacity)),
  });
  revalidatePath("/events");
  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true, message: `Event "${title}" created.` };
}

export async function deleteEventAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  if (id) await db.delete(events).where(eq(events.id, id));
  revalidatePath("/admin");
  revalidatePath("/events");
  revalidatePath("/");
}

export async function setMemberStatusAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const status = String(fd.get("status"));
  if (id && ["pending", "approved", "declined"].includes(status)) {
    await db.update(members).set({ status }).where(eq(members.id, id));
  }
  revalidatePath("/admin");
}

export async function deletePostAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  if (id) await db.delete(posts).where(eq(posts.id, id));
  revalidatePath("/admin");
  revalidatePath("/board");
}

export async function deleteMessageAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  if (id) await db.delete(messages).where(eq(messages.id, id));
  revalidatePath("/admin");
}
