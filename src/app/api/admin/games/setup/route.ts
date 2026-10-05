import { sql } from "drizzle-orm";
import { db } from "@/db";
import { gameSettings, profileAvatars } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { GAMES } from "@/lib/games";
import { limitRequest, sameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Forbidden." }, { status: 403 });
  if (!(await isAdmin())) return Response.json({ error: "Administrator access required." }, { status: 403 });
  const limited = limitRequest(request, "write", "game-settings-setup");
  if (limited) return limited;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS game_settings (
      game_id varchar(40) PRIMARY KEY, published boolean NOT NULL DEFAULT false,
      min_level integer NOT NULL DEFAULT 1 CHECK (min_level BETWEEN 1 AND 30),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS profile_avatars (
      user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      mime varchar(30) NOT NULL DEFAULT 'image/jpeg', data bytea NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
    )`);
    for (const game of GAMES) {
      await db.insert(gameSettings).values({ gameId: game.id, published: game.defaultPublished, minLevel: game.id === "emoji-decoder" || game.id === "verb-vortex" ? 2 : game.id === "plural-panic" || game.id === "polite-or-chaos" ? 3 : 1 })
        .onConflictDoNothing({ target: gameSettings.gameId });
    }
    await recordAudit("games.settings.initialize", "game_settings", GAMES.length);
    const rows = await db.select().from(gameSettings);
    return Response.json({ ok: true, games: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error(JSON.stringify({ scope: "games.settings.initialize", message: error instanceof Error ? error.message : String(error) }));
    return Response.json({ error: "Could not initialize game settings and avatar storage. Check database permissions." }, { status: 503 });
  }
}
