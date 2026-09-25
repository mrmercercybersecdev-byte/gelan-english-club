import { NextRequest } from "next/server";
import { db } from "@/db";
import { gameScores } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { awardXp } from "@/lib/award";
import { limitRequest, sameOrigin } from "@/lib/security";
import { GAMES } from "@/lib/games";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return Response.json({ error: "Forbidden" }, { status: 403 });
  const limited = limitRequest(req, "game");
  if (limited) return limited;
  const user = await getCurrentUser();
  if (!user) return Response.json({ saved: false, loggedIn: false });

  const body = (await req.json().catch(() => ({}))) as { game?: string; score?: number; timeMs?: number; won?: boolean; meta?: string };
  const game = GAMES.find((g) => g.id === body.game);
  if (!game) return Response.json({ error: "Unknown game" }, { status: 400 });
  const score = Math.max(0, Math.min(game.maxScore, Math.round(Number(body.score) || 0)));
  const timeMs = Math.max(0, Math.min(3_600_000, Math.round(Number(body.timeMs) || 0)));
  // plausibility: reject impossibly fast wins
  if (body.won && timeMs > 0 && timeMs < game.minWinMs) return Response.json({ error: "Implausible result" }, { status: 400 });

  await db.insert(gameScores).values({ userId: user.id, game: game.id, score, timeMs, meta: String(body.meta ?? "").slice(0, 120) || null });
  const xp = body.won ? await awardXp(user.id, "game_win", game.id) : null;
  return Response.json({ saved: true, loggedIn: true, xp });
}
