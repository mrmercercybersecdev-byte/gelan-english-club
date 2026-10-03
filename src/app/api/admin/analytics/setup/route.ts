import { sql } from "drizzle-orm";
import { db } from "@/db";
import { isAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { limitRequest, sameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Forbidden." }, { status: 403 });
  if (!(await isAdmin())) return Response.json({ error: "Administrator access required." }, { status: 403 });
  const limited = limitRequest(request, "write", "analytics-schema-setup");
  if (limited) return limited;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS visitor_consents (
      visitor_hash varchar(64) PRIMARY KEY, analytics boolean NOT NULL DEFAULT false,
      marketing boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS site_analytics_events (
      id serial PRIMARY KEY, visitor_hash varchar(64) NOT NULL REFERENCES visitor_consents(visitor_hash) ON DELETE CASCADE,
      purpose varchar(12) NOT NULL, kind varchar(12) NOT NULL, page_path varchar(300) NOT NULL,
      country_code varchar(2), device_class varchar(12) NOT NULL, metric_name varchar(8),
      metric_value_milli integer, created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS site_analytics_created_idx ON site_analytics_events (created_at)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS site_analytics_country_idx ON site_analytics_events (country_code, created_at)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS site_analytics_device_idx ON site_analytics_events (device_class, created_at)`);
    await recordAudit("analytics.schema.initialize", "site_analytics_events");
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error(JSON.stringify({ scope: "analytics.schema.initialize", message: error instanceof Error ? error.message : String(error) }));
    return Response.json({ error: "Could not initialize analytics tables. Check the admin project's DATABASE_URL and database permissions." }, { status: 503 });
  }
}
