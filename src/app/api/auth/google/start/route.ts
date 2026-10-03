import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { googleAuthorizationUrl, googleConfigurationIssues, googleConfigured, GOOGLE_NEXT_COOKIE, GOOGLE_STATE_COOKIE } from "@/lib/google-auth";
import { cookieSecure } from "@/lib/security";

export async function GET(request: Request) {
  if (!googleConfigured()) {
    const missing = googleConfigurationIssues().join(", ");
    return Response.redirect(new URL(`/login?error=google_unconfigured&missing=${encodeURIComponent(missing)}`, request.url));
  }
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/profile";
  const safeNext = next.startsWith("/") && !next.startsWith("//") && next !== "/login" ? next : "/profile";
  const state = randomBytes(32).toString("hex");
  const store = await cookies();
  const oauthCookie = { httpOnly: true, secure: cookieSecure(), sameSite: "lax" as const, maxAge: 600, path: "/" };
  store.set(GOOGLE_STATE_COOKIE, state, oauthCookie);
  store.set(GOOGLE_NEXT_COOKIE, safeNext, oauthCookie);
  return Response.redirect(googleAuthorizationUrl(state));
}