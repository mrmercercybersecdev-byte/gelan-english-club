import { cookies } from "next/headers";
import { createHash } from "crypto";
import { getCurrentUser } from "./session";

export const ADMIN_COOKIE = "wec_admin";

export function adminPassword() {
  return process.env.ADMIN_PASSWORD || "";
}

export function adminToken() {
  return createHash("sha256").update(`wec:${adminPassword()}`).digest("hex");
}

/** Admin if they logged in with the organiser password OR their account has the admin role. */
export async function isAdmin() {
  const store = await cookies();
  const password = adminPassword();
  if (password && store.get(ADMIN_COOKIE)?.value === adminToken()) return true;
  const u = await getCurrentUser();
  return u?.role === "admin";
}

export async function isContentManager() {
  if (await isAdmin()) return true;
  const u = await getCurrentUser();
  return u?.role === "leader" || u?.role === "teacher";
}
