import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { gameSettings } from "@/db/schema";
import { GAMES } from "@/lib/games";

export type GameAvailability = { id: string; published: boolean; minLevel: number };

export async function getGameAvailability(): Promise<GameAvailability[]> {
  try {
    const rows = await db.select().from(gameSettings);
    const byId = new Map(rows.map((row) => [row.gameId, row]));
    return GAMES.map((game) => {
      const row = byId.get(game.id);
      return { id: game.id, published: row?.published ?? game.defaultPublished, minLevel: row?.minLevel ?? 1 };
    });
  } catch {
    return GAMES.map((game) => ({ id: game.id, published: game.defaultPublished, minLevel: 1 }));
  }
}

export async function getGameAvailabilityById(id: string) {
  const game = GAMES.find((item) => item.id === id);
  if (!game) return null;
  try {
    const [row] = await db.select().from(gameSettings).where(eq(gameSettings.gameId, id)).limit(1);
    return { id, published: row?.published ?? game.defaultPublished, minLevel: row?.minLevel ?? 1 };
  } catch {
    return { id, published: game.defaultPublished, minLevel: 1 };
  }
}
