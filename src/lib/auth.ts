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
  if (store.get(ADMIN_COOKIE)?.value === adminToken()) return true;
  const u = await getCurrentUser();
  return u?.role === "admin";
}
