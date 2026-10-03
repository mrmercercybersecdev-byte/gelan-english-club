import { db } from "@/db";
import { users, xpLog } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { ACTIVITIES } from "./xp";

function today() {
  return new Date().toISOString().slice(0, 10);
}
function yesterday() {
  return new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
}

export async function awardXp(userId: number, activity: string, meta?: string, multiplier = 1) {
  const def = ACTIVITIES[activity];
  if (!def) return { awarded: 0 };
  return db.transaction(async (tx) => {
    // Serialize awards for this account so simultaneous requests cannot bypass cooldowns.
    const [u] = await tx.select().from(users).where(eq(users.id, userId)).for("update");
    if (!u) return { awarded: 0 };
    const [last] = await tx
      .select({ createdAt: xpLog.createdAt })
      .from(xpLog)
      .where(and(eq(xpLog.userId, userId), eq(xpLog.activity, activity)))
      .orderBy(desc(xpLog.createdAt))
      .limit(1);
    if (last && Date.now() - last.createdAt.getTime() < def.cooldownSec * 1000) {
      return { awarded: 0 };
    }

    const amount = Math.round(def.xp * Math.max(0.5, Math.min(3, multiplier)));
    const t = today();
    const streak = u.lastActiveDate === t ? u.streak : u.lastActiveDate === yesterday() ? u.streak + 1 : 1;
    await tx.insert(xpLog).values({ userId, activity, amount, meta: meta?.slice(0, 200) });
    const [updated] = await tx
      .update(users)
      .set({ xp: sql`${users.xp} + ${amount}`, streak, lastActiveDate: t })
      .where(eq(users.id, userId))
      .returning({ xp: users.xp, streak: users.streak });
    return { awarded: amount, xp: updated.xp, streak: updated.streak };
  });
}
