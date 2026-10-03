import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteAnalyticsEvents, visitorConsents } from "@/db/schema";
import { limitRequest, sameOrigin } from "@/lib/security";
import { cleanupAnalytics } from "@/lib/analytics-retention";

export const dynamic = "force-dynamic";
const VITALS = new Set(["CLS", "FCP", "FID", "INP", "LCP", "TTFB"]);
const VISITOR_COOKIE = "wec_privacy";

function safePath(value: unknown) {
  if (typeof value !== "string" || value.length > 300 || !value.startsWith("/") || value.startsWith("//") || value.includes("?") || value.includes("#")) return null;
  const parts = value.split("/").filter(Boolean);
  if (!parts.length) return "/";
  const root = parts[0].toLowerCase();
  const staticRoutes = new Set(["about", "announcements", "blog", "board", "chat", "contact", "contact-developer", "events", "games", "groups", "help", "join", "leaderboard", "learn", "login", "meet", "profile", "speak", "submit", "verify"]);
  if (!staticRoutes.has(root)) return "/other";
  if (parts.length === 1) return `/${root}`;
  if (root === "events" && /^\d+$/.test(parts[1])) return "/events/:id";
  if (["blog", "chat", "games", "groups", "learn", "meet", "profile", "verify"].includes(root)) return `/${root}/:item`;
  return `/${root}/:section`;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 4_096) return Response.json({ error: "Event too large." }, { status: 413 });
  const limited = limitRequest(request, "write", "site-analytics");
  if (limited) return limited;
  await cleanupAnalytics();
  const jar = await cookies();
  const token = jar.get(VISITOR_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return Response.json({ error: "Consent required." }, { status: 403 });
  const visitorHash = createHash("sha256").update(token).digest("hex");
  const [consent] = await db.select().from(visitorConsents).where(eq(visitorConsents.visitorHash, visitorHash)).limit(1);
  if (!consent || consent.expiresAt <= new Date() || (!consent.analytics && !consent.marketing)) return Response.json({ error: "Consent required." }, { status: 403 });

  let body: { kind?: unknown; pagePath?: unknown; device?: unknown; metric?: unknown; value?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid event." }, { status: 400 }); }
  const pagePath = safePath(body.pagePath);
  const kind = body.kind === "page_view" ? "page_view" : body.kind === "web_vital" ? "web_vital" : null;
  const device = ["mobile", "tablet", "desktop", "unknown"].includes(String(body.device)) ? String(body.device) : "unknown";
  const marketingOnly = !consent.analytics && consent.marketing;
  if (!pagePath || !kind || (kind === "web_vital" && (!consent.analytics || typeof body.metric !== "string" || !VITALS.has(body.metric) || typeof body.value !== "number" || !Number.isFinite(body.value) || body.value < 0 || body.value > 3_600_000))) {
    return Response.json({ error: "Invalid event." }, { status: 400 });
  }
  const rawCountry = request.headers.get("x-app-country") ?? "";
  const countryCode = /^[A-Z]{2}$/.test(rawCountry) && rawCountry !== "XX" ? rawCountry : null;
  const purpose = marketingOnly ? "marketing" : "analytics";
  await db.insert(siteAnalyticsEvents).values({
    visitorHash, purpose, kind, pagePath, deviceClass: device, countryCode,
    metricName: kind === "web_vital" ? String(body.metric) : null,
    metricValueMilli: kind === "web_vital" ? Math.round(Number(body.value) * 1000) : null,
  });

  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
