import { eq } from "drizzle-orm";
import { db } from "@/db";
import { gameSettings } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { GAMES } from "@/lib/games";
import { limitRequest, sameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Forbidden." }, { status: 403 });
  if (!(await isAdmin())) return Response.json({ error: "Administrator access required." }, { status: 403 });
  const limited = limitRequest(request, "write", "game-settings-update");
  if (limited) return limited;
  const body = await request.json().catch(() => null) as { gameId?: unknown; published?: unknown; minLevel?: unknown } | null;
  const game = GAMES.find((item) => item.id === body?.gameId);
  if (!game || typeof body?.published !== "boolean" || !Number.isSafeInteger(body.minLevel) || Number(body.minLevel) < 1 || Number(body.minLevel) > 30) {
    return Response.json({ error: "Choose a valid game, release setting, and level from 1 to 30." }, { status: 400 });
  }
  try {
    await db.insert(gameSettings).values({ gameId: game.id, published: body.published, minLevel: Number(body.minLevel), updatedAt: new Date() })
      .onConflictDoUpdate({ target: gameSettings.gameId, set: { published: body.published, minLevel: Number(body.minLevel), updatedAt: new Date() } });
    await recordAudit(body.published ? "games.publish" : "games.unpublish", "game", game.id, { minLevel: Number(body.minLevel) });
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Game settings are not initialized yet. Initialize them from the Games tab first." }, { status: 503 });
  }
}
