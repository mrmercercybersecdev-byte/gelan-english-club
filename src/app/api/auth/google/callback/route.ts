import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { exchangeGoogleCode, GOOGLE_NEXT_COOKIE, GOOGLE_STATE_COOKIE, googleConfigured, signInWithGoogle } from "@/lib/google-auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const store = await cookies();
  const state = store.get(GOOGLE_STATE_COOKIE)?.value;
  const expected = url.searchParams.get("state");
  const next = store.get(GOOGLE_NEXT_COOKIE)?.value || "/profile";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/profile";
  store.delete(GOOGLE_STATE_COOKIE);
  store.delete(GOOGLE_NEXT_COOKIE);

  if (!googleConfigured() || !state || !expected || state !== expected) redirect(`/login?error=google_state`);
  const code = url.searchParams.get("code");
  if (!code) redirect(`/login?error=google_cancelled`);
  try {
    const profile = await exchangeGoogleCode(code);
    await signInWithGoogle(profile);
  } catch {
    redirect(`/login?error=google_failed`);
  }
  redirect(safeNext);
}