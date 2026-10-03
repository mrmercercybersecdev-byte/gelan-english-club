import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteAnalyticsEvents, visitorConsents } from "@/db/schema";
import { limitRequest, sameOrigin, cookieSecure } from "@/lib/security";
import { cleanupAnalytics } from "@/lib/analytics-retention";

export const dynamic = "force-dynamic";
const COOKIE = "wec_privacy";
const CONSENT_DAYS = 180;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function GET() {
  await cleanupAnalytics();
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return Response.json({ decided: false, analytics: false, marketing: false }, { headers: { "Cache-Control": "no-store" } });
  const [consent] = await db.select().from(visitorConsents).where(eq(visitorConsents.visitorHash, hashToken(token))).limit(1);
  if (!consent || consent.expiresAt <= new Date()) return Response.json({ decided: false, analytics: false, marketing: false }, { headers: { "Cache-Control": "no-store" } });
  return Response.json({ decided: true, analytics: consent.analytics, marketing: consent.marketing }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Forbidden" }, { status: 403 });
  const limited = limitRequest(request, "write", "privacy-consent");
  if (limited) return limited;
  await cleanupAnalytics();
  let body: { analytics?: unknown; marketing?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
  if (typeof body.analytics !== "boolean" || typeof body.marketing !== "boolean") return Response.json({ error: "Choose valid privacy settings." }, { status: 400 });

  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  const token = existing && /^[a-f0-9]{64}$/.test(existing) ? existing : randomBytes(32).toString("hex");
  const visitorHash = hashToken(token);
  const [previous] = await db.select({ marketing: visitorConsents.marketing }).from(visitorConsents).where(eq(visitorConsents.visitorHash, visitorHash)).limit(1);
  const expiresAt = new Date(Date.now() + CONSENT_DAYS * 86_400_000);
  await db.insert(visitorConsents).values({ visitorHash, analytics: body.analytics, marketing: body.marketing, expiresAt, updatedAt: new Date() })
    .onConflictDoUpdate({ target: visitorConsents.visitorHash, set: { analytics: body.analytics, marketing: body.marketing, expiresAt, updatedAt: new Date() } });
  if (!body.analytics || (previous?.marketing && !body.marketing)) await db.delete(siteAnalyticsEvents).where(eq(siteAnalyticsEvents.visitorHash, visitorHash));

  jar.set(COOKIE, token, { httpOnly: true, secure: cookieSecure(), sameSite: "lax", path: "/", maxAge: CONSENT_DAYS * 86_400 });
  return Response.json({ ok: true, decided: true, analytics: body.analytics, marketing: body.marketing }, { headers: { "Cache-Control": "no-store" } });
}
