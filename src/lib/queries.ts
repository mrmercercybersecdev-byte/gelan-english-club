import { db } from "@/db";
import { events, rsvps } from "@/db/schema";
import { asc, eq, gte, sql, and } from "drizzle-orm";
import { ensureSeed } from "./seed";

export type EventWithCount = typeof events.$inferSelect & { attending: number };

export async function getUpcomingEvents(opts: { limit?: number; category?: string } = {}) {
  await ensureSeed();
  const conditions = [gte(events.startsAt, sql`now() - interval '3 hours'`)];
  if (opts.category) conditions.push(eq(events.category, opts.category));

  const q = db
    .select({
      event: events,
      attending: sql<number>`count(${rsvps.id})::int`,
    })
    .from(events)
    .leftJoin(rsvps, eq(rsvps.eventId, events.id))
    .where(and(...conditions))
    .groupBy(events.id)
    .orderBy(asc(events.startsAt));

  const rows = opts.limit ? await q.limit(opts.limit) : await q;
  return rows.map((r) => ({ ...r.event, attending: r.attending })) as EventWithCount[];
}

export async function getEvent(id: number) {
  await ensureSeed();
  const rows = await db
    .select({ event: events, attending: sql<number>`count(${rsvps.id})::int` })
    .from(events)
    .leftJoin(rsvps, eq(rsvps.eventId, events.id))
    .where(eq(events.id, id))
    .groupBy(events.id);
  if (!rows.length) return null;
  return { ...rows[0].event, attending: rows[0].attending } as EventWithCount;
}
