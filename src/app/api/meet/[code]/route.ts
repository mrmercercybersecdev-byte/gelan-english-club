import { NextRequest } from "next/server";
import { db } from "@/db";
import { meetPeers, meetRooms, meetSignals } from "@/db/schema";
import { and, eq, gt, lt, ne, or, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
import { rateLimit, ipFromRequest } from "@/lib/security";

const STALE_MS = 20_000;

async function cleanup(code: string) {
  const cutoff = new Date(Date.now() - STALE_MS);
  const stale = await db
    .delete(meetPeers)
    .where(and(eq(meetPeers.roomCode, code), lt(meetPeers.lastSeen, cutoff)))
    .returning({ id: meetPeers.id });
  if (stale.length) {
    await db.insert(meetSignals).values(
      stale.map((s) => ({ roomCode: code, fromPeer: s.id, toPeer: "*", kind: "leave", payload: "{}" })),
    );
  }
  await db.delete(meetSignals).where(lt(meetSignals.createdAt, new Date(Date.now() - 5 * 60_000)));
}

async function peersOf(code: string) {
  return db
    .select({ id: meetPeers.id, name: meetPeers.name, joinedAt: meetPeers.joinedAt })
    .from(meetPeers)
    .where(eq(meetPeers.roomCode, code))
    .orderBy(meetPeers.joinedAt);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const peer = req.nextUrl.searchParams.get("peer") || "";
  const after = Number(req.nextUrl.searchParams.get("after") || 0);

  if (!peer) {
    const [room] = await db.select().from(meetRooms).where(eq(meetRooms.code, code));
    if (!room) return Response.json({ error: "Room not found" }, { status: 404 });
    await cleanup(code);
    return Response.json({ room, peers: await peersOf(code) });
  }

  await db.update(meetPeers).set({ lastSeen: new Date() }).where(eq(meetPeers.id, peer));
  await cleanup(code);

  const signals = await db
    .select()
    .from(meetSignals)
    .where(
      and(
        eq(meetSignals.roomCode, code),
        gt(meetSignals.id, after),
        ne(meetSignals.fromPeer, peer),
        or(eq(meetSignals.toPeer, peer), eq(meetSignals.toPeer, "*")),
      ),
    )
    .orderBy(meetSignals.id)
    .limit(200);

  return Response.json({ peers: await peersOf(code), signals });
}

type PostBody = {
  action?: "join" | "leave" | "signal";
  peerId?: string;
  name?: string;
  to?: string;
  kind?: string;
  payload?: unknown;
};

export async function POST(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  if (rateLimit("signal", ipFromRequest(req))) {
    return Response.json({ error: "Slow down" }, { status: 429 });
  }
  const body = (await req.json().catch(() => ({}))) as PostBody;
  const peerId = String(body.peerId || "").slice(0, 40);
  if (!peerId) return Response.json({ error: "peerId required" }, { status: 400 });

  if (body.action === "join") {
    const [room] = await db.select().from(meetRooms).where(eq(meetRooms.code, code));
    if (!room) return Response.json({ error: "Room not found" }, { status: 404 });
    const name = String(body.name || "Guest").slice(0, 60);
    await db
      .insert(meetPeers)
      .values({ id: peerId, roomCode: code, name })
      .onConflictDoUpdate({ target: meetPeers.id, set: { lastSeen: new Date(), name } });
    const [{ maxId }] = await db
      .select({ maxId: sql<number>`coalesce(max(${meetSignals.id}), 0)::int` })
      .from(meetSignals);
    await db.insert(meetSignals).values({ roomCode: code, fromPeer: peerId, toPeer: "*", kind: "join", payload: JSON.stringify({ name }) });
    const peers = (await peersOf(code)).filter((p) => p.id !== peerId);
    return Response.json({ room, peers, after: maxId });
  }

  if (body.action === "leave") {
    await db.delete(meetPeers).where(eq(meetPeers.id, peerId));
    await db.insert(meetSignals).values({ roomCode: code, fromPeer: peerId, toPeer: "*", kind: "leave", payload: "{}" });
    return Response.json({ ok: true });
  }

  if (body.action === "signal") {
    const kind = String(body.kind || "").slice(0, 20);
    const allowed = ["offer", "answer", "ice", "chat", "state", "reaction"];
    if (!allowed.includes(kind)) return Response.json({ error: "bad kind" }, { status: 400 });
    const payload = JSON.stringify(body.payload ?? {}).slice(0, 60_000);
    await db.insert(meetSignals).values({
      roomCode: code,
      fromPeer: peerId,
      toPeer: String(body.to || "*").slice(0, 40),
      kind,
      payload,
    });
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
