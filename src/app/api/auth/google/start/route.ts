import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { googleAuthorizationUrl, googleConfigured, GOOGLE_NEXT_COOKIE, GOOGLE_STATE_COOKIE } from "@/lib/google-auth";

export async function GET(request: Request) {
  if (!googleConfigured()) return Response.json({ error: "Google sign-in is not configured." }, { status: 503 });
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/profile";
  const safeNext = next.startsWith("/") && !next.startsWith("//") && next !== "/login" ? next : "/profile";
  const state = randomBytes(32).toString("hex");
  const store = await cookies();
  store.set(GOOGLE_STATE_COOKIE, state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 600, path: "/" });
  store.set(GOOGLE_NEXT_COOKIE, safeNext, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 600, path: "/" });
  return Response.redirect(googleAuthorizationUrl(state));
}