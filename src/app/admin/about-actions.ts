"use server";

import { db } from "@/db";
import { champions, livestreams, milestones, teamMembers } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { isValidStreamUrl } from "@/lib/embed";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "../actions";

async function guard() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}
const s = (fd: FormData, k: string, max = 500) => String(fd.get(k) ?? "").trim().slice(0, max);
const n = (fd: FormData, k: string) => {
  const v = Number(fd.get(k));
  return Number.isFinite(v) && String(fd.get(k) ?? "").trim() !== "" ? Math.round(v) : null;
};
function photo(fd: FormData) {
  const p = String(fd.get("photoUrl") ?? "").trim();
  if (!p) return null;
  if (p.startsWith("data:image/") && p.length < 400_000) return p;
  if (/^(https?:\/\/|\/)[^\s]+$/.test(p)) return p.slice(0, 500);
  return null;
}
function refresh() {
  revalidatePath("/about");
  revalidatePath("/", "layout");
}

/* ---------------- Team ---------------- */
export async function saveTeamMemberAction(_p: FormState, fd: FormData): Promise<FormState> {
  await guard();
  const id = n(fd, "id");
  const name = s(fd, "name", 100);
  const title = s(fd, "title", 120);
  if (!name || !title) return { ok: false, message: "Name and title are required." };
  const values = {
    name,
    title,
    group: s(fd, "group", 20) === "leader" ? "leader" : "facilitator",
    bio: s(fd, "bio", 2000),
    quote: s(fd, "quote", 280) || null,
    country: s(fd, "country", 60) || null,
    photoUrl: photo(fd),
    specialties: s(fd, "specialties", 300),
    joinedYear: n(fd, "joinedYear"),
    color: /^#[0-9a-f]{6}$/i.test(s(fd, "color", 7)) ? s(fd, "color", 7) : "#b8322a",
    sortOrder: n(fd, "sortOrder") ?? 50,
    active: fd.get("active") === "on",
  };
  if (id) await db.update(teamMembers).set(values).where(eq(teamMembers.id, id));
  else await db.insert(teamMembers).values(values);
  refresh();
  redirect("/admin?tab=team");
}

export async function deleteTeamMemberAction(fd: FormData) {
  await guard();
  const id = Number(fd.get("id"));
  if (id) await db.delete(teamMembers).where(eq(teamMembers.id, id));
  refresh();
  revalidatePath("/admin");
}

export async function toggleTeamActiveAction(fd: FormData) {
  await guard();
  const id = Number(fd.get("id"));
  const [m] = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
  if (m) await db.update(teamMembers).set({ active: !m.active }).where(eq(teamMembers.id, id));
  refresh();
  revalidatePath("/admin");
}

export async function moveTeamMemberAction(fd: FormData) {
  await guard();
  const id = Number(fd.get("id"));
  const dir = Number(fd.get("dir")) || 0;
  const [m] = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
  if (!m) return;
  const peers = (await db.select().from(teamMembers).where(eq(teamMembers.group, m.group))).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  const idx = peers.findIndex((p) => p.id === id);
  const swap = peers[idx + dir];
  if (!swap) return;
  // normalise order then swap
  await Promise.all(peers.map((p, i) => db.update(teamMembers).set({ sortOrder: i * 10 }).where(eq(teamMembers.id, p.id))));
  await db.update(teamMembers).set({ sortOrder: (idx + dir) * 10 }).where(eq(teamMembers.id, m.id));
  await db.update(teamMembers).set({ sortOrder: idx * 10 }).where(eq(teamMembers.id, swap.id));
  refresh();
  revalidatePath("/admin");
}

/* ---------------- Champions ---------------- */
export async function saveChampionAction(_p: FormState, fd: FormData): Promise<FormState> {
  await guard();
  const id = n(fd, "id");
  const name = s(fd, "name", 100);
  const award = s(fd, "award", 140);
  const competition = s(fd, "competition", 160);
  const year = n(fd, "year");
  if (!name || !award || !competition || !year) return { ok: false, message: "Name, award, competition and year are required." };
  const values = {
    name,
    award,
    competition,
    category: s(fd, "category", 30) || "other",
    place: Math.max(1, Math.min(10, n(fd, "place") ?? 1)),
    season: s(fd, "season", 40),
    year,
    country: s(fd, "country", 60) || null,
    photoUrl: photo(fd),
    description: s(fd, "description", 1000),
  };
  if (id) await db.update(champions).set(values).where(eq(champions.id, id));
  else await db.insert(champions).values(values);
  refresh();
  redirect("/admin?tab=champions");
}

export async function deleteChampionAction(fd: FormData) {
  await guard();
  const id = Number(fd.get("id"));
  if (id) await db.delete(champions).where(eq(champions.id, id));
  refresh();
  revalidatePath("/admin");
}

/* ---------------- History ---------------- */
export async function saveMilestoneAction(_p: FormState, fd: FormData): Promise<FormState> {
  await guard();
  const id = n(fd, "id");
  const title = s(fd, "title", 160);
  const year = n(fd, "year");
  if (!title || !year) return { ok: false, message: "Title and year are required." };
  const values = {
    title,
    year,
    month: s(fd, "month", 12) || null,
    description: s(fd, "description", 2000),
    icon: s(fd, "icon", 8) || "⭐",
    imageUrl: photo(fd),
    sortOrder: n(fd, "sortOrder") ?? 0,
  };
  if (id) await db.update(milestones).set(values).where(eq(milestones.id, id));
  else await db.insert(milestones).values(values);
  refresh();
  redirect("/admin?tab=history");
}

export async function deleteMilestoneAction(fd: FormData) {
  await guard();
  const id = Number(fd.get("id"));
  if (id) await db.delete(milestones).where(eq(milestones.id, id));
  refresh();
  revalidatePath("/admin");
}

/* ---------------- Livestreams ---------------- */
export async function saveStreamAction(_p: FormState, fd: FormData): Promise<FormState> {
  await guard();
  const id = n(fd, "id");
  const title = s(fd, "title", 160);
  const streamUrl = s(fd, "streamUrl", 500);
  const at = new Date(s(fd, "scheduledAt", 40));
  if (!title) return { ok: false, message: "A title is required." };
  if (!isValidStreamUrl(streamUrl)) return { ok: false, message: "Stream URL must start with https:// or /meet/." };
  if (isNaN(at.getTime())) return { ok: false, message: "Please pick a valid date and time." };
  const status = ["scheduled", "live", "ended"].includes(s(fd, "status", 12)) ? s(fd, "status", 12) : "scheduled";
  const values = { title, streamUrl, status, scheduledAt: at, description: s(fd, "description", 2000), host: s(fd, "host", 100) || "Gelan English Club" };
  let savedId = id;
  if (id) await db.update(livestreams).set(values).where(eq(livestreams.id, id));
  else savedId = (await db.insert(livestreams).values(values).returning({ id: livestreams.id }))[0].id;
  if (status === "live" && savedId) {
    await db.update(livestreams).set({ status: "ended" }).where(and(eq(livestreams.status, "live"), ne(livestreams.id, savedId)));
  }
  refresh();
  redirect("/admin?tab=streams");
}

export async function setStreamStatusAction(fd: FormData) {
  await guard();
  const id = Number(fd.get("id"));
  const status = String(fd.get("status"));
  if (!id || !["scheduled", "live", "ended"].includes(status)) return;
  if (status === "live") {
    await db.update(livestreams).set({ status: "ended" }).where(and(eq(livestreams.status, "live"), ne(livestreams.id, id)));
    await db.update(livestreams).set({ status, scheduledAt: new Date() }).where(eq(livestreams.id, id));
  } else {
    await db.update(livestreams).set({ status }).where(eq(livestreams.id, id));
  }
  refresh();
  revalidatePath("/admin");
}

export async function deleteStreamAction(fd: FormData) {
  await guard();
  const id = Number(fd.get("id"));
  if (id) await db.delete(livestreams).where(eq(livestreams.id, id));
  refresh();
  revalidatePath("/admin");
}
