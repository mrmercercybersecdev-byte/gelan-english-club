import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const startedAt = Date.now();

export async function GET() {
  const t0 = performance.now();
  try {
    await db.execute(sql`select 1`);
    return Response.json(
      {
        ok: true,
        status: "healthy",
        db: { ok: true, latencyMs: Math.round((performance.now() - t0) * 10) / 10 },
        uptimeSec: Math.round((Date.now() - startedAt) / 1000),
        ai: Boolean(process.env.OPENAI_API_KEY),
        time: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ ok: false, status: "degraded", db: { ok: false } }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
