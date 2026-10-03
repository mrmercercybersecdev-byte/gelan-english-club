import { NextRequest } from "next/server";
import { db } from "@/db";
import { meetPeers, meetRooms, meetSignals } from "@/db/schema";
import { and, eq, gt, lt, ne, or, sql } from "drizzle-orm";
import { createMeetPeerToken, verifyMeetPeerToken } from "@/lib/meet-auth";
import { ipFromRequest, limitRequest, sameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

const STALE_MS = 20_000;
const MAX_REQUEST_BYTES = 24 * 1024;
const ROOM_CODE = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/;
const PEER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function jsonError(error: string, status: number) {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

function bearerToken(req: Request) {
  const header = req.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

async function readBody(req: Request): Promise<PostBody | null> {
  const length = Number(req.headers.get("content-length") || 0);
  if (length > MAX_REQUEST_BYTES) return null;
  if (!req.body) return null;
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_REQUEST_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    const body = JSON.parse(new TextDecoder().decode(bytes)) as PostBody;
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

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
  if (!ROOM_CODE.test(code)) return jsonError("Room not found", 404);
  const limited = limitRequest(req, "signal", "meet-poll");
  if (limited) return limited;
  const peer = req.nextUrl.searchParams.get("peer") || "";
  const after = Number(req.nextUrl.searchParams.get("after") || 0);
  if (!Number.isSafeInteger(after) || after < 0) return jsonError("Invalid signal cursor", 400);

  if (!peer) {
    const [room] = await db.select().from(meetRooms).where(eq(meetRooms.code, code));
    if (!room) return Response.json({ error: "Room not found" }, { status: 404 });
    await cleanup(code);
    return Response.json({ room, peers: await peersOf(code) }, { headers: { "Cache-Control": "no-store" } });
  }

  if (!PEER_ID.test(peer) || !verifyMeetPeerToken(bearerToken(req), code, peer)) {
    return jsonError("Meeting peer authentication required", 401);
  }

  const [activePeer] = await db.update(meetPeers).set({ lastSeen: new Date() })
    .where(and(eq(meetPeers.id, peer), eq(meetPeers.roomCode, code)))
    .returning({ id: meetPeers.id });
  if (!activePeer) return jsonError("Meeting peer has expired", 401);
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

  return Response.json({ peers: await peersOf(code), signals }, { headers: { "Cache-Control": "no-store" } });
}

type PostBody = {
  action?: "join" | "leave" | "signal";
  peerId?: string;
  peerToken?: string;
  name?: string;
  to?: string;
  kind?: string;
  payload?: unknown;
};

export async function POST(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  if (!ROOM_CODE.test(code)) return jsonError("Room not found", 404);
  if (!sameOrigin(req)) return jsonError("Forbidden", 403);
  const limited = limitRequest(req, "meetWrite", "meet-write");
  if (limited) return limited;
  const body = await readBody(req);
  if (!body) return jsonError("Invalid or oversized request", 400);
  const peerId = String(body.peerId || "");
  if (!PEER_ID.test(peerId)) return jsonError("A valid peer ID is required", 400);

  if (body.action === "join") {
    const joinLimit = limitRequest(req, "meetJoin", "meet-join");
    if (joinLimit) return joinLimit;
    const [room] = await db.select().from(meetRooms).where(eq(meetRooms.code, code));
    if (!room) return Response.json({ error: "Room not found" }, { status: 404 });
    const name = String(body.name || "Guest").slice(0, 60);
    const [createdPeer] = await db
      .insert(meetPeers)
      .values({ id: peerId, roomCode: code, name })
      .onConflictDoNothing()
      .returning({ id: meetPeers.id });
    if (!createdPeer) return jsonError("This peer ID is already in use. Rejoin with a new ID.", 409);
    const [{ maxId }] = await db
      .select({ maxId: sql<number>`coalesce(max(${meetSignals.id}), 0)::int` })
      .from(meetSignals);
    await db.insert(meetSignals).values({ roomCode: code, fromPeer: peerId, toPeer: "*", kind: "join", payload: JSON.stringify({ name }) });
    const peers = (await peersOf(code)).filter((p) => p.id !== peerId);
    return Response.json({ room, peers, after: maxId, peerToken: createMeetPeerToken(code, peerId) }, { headers: { "Cache-Control": "no-store" } });
  }

  if (!verifyMeetPeerToken(String(body.peerToken || ""), code, peerId)) {
    return jsonError("Meeting peer authentication required", 401);
  }
  const [activePeer] = await db.select({ id: meetPeers.id }).from(meetPeers)
    .where(and(eq(meetPeers.id, peerId), eq(meetPeers.roomCode, code))).limit(1);
  if (!activePeer) return jsonError("Meeting peer has expired", 401);

  if (body.action === "leave") {
    await db.delete(meetPeers).where(and(eq(meetPeers.id, peerId), eq(meetPeers.roomCode, code)));
    await db.insert(meetSignals).values({ roomCode: code, fromPeer: peerId, toPeer: "*", kind: "leave", payload: "{}" });
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  }

  if (body.action === "signal") {
    const kind = String(body.kind || "").slice(0, 20);
    const allowed = ["offer", "answer", "ice", "chat", "state", "reaction"];
    if (!allowed.includes(kind)) return Response.json({ error: "bad kind" }, { status: 400 });
    const to = String(body.to || "*").slice(0, 40);
    if (to !== "*" && !PEER_ID.test(to)) return jsonError("Invalid signal recipient", 400);
    if (to !== "*") {
      const [recipient] = await db.select({ id: meetPeers.id }).from(meetPeers)
        .where(and(eq(meetPeers.id, to), eq(meetPeers.roomCode, code))).limit(1);
      if (!recipient) return jsonError("Signal recipient is not in this room", 404);
    }
    const payload = JSON.stringify(body.payload ?? {});
    if (new TextEncoder().encode(payload).byteLength > 20 * 1024) {
      return jsonError("Signal payload is too large", 413);
    }
    await db.insert(meetSignals).values({
      roomCode: code,
      fromPeer: peerId,
      toPeer: to,
      kind,
      payload,
    });
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  }

  return jsonError("Unknown action", 400);
}
