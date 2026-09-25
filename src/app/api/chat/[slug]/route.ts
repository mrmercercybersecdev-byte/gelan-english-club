import { NextRequest } from "next/server";
import { db } from "@/db";
import { channels, chatMessages, users } from "@/db/schema";
import { and, desc, eq, gt } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";
import { awardXp } from "@/lib/award";
import { limitRequest, sameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

// Lightweight in-memory presence: channelId -> (userId -> {name,color,ts})
const g = globalThis as typeof globalThis & {
  __wecPresence?: Map<number, Map<number, { name: string; color: string; ts: number }>>;
};
const presence = (g.__wecPresence ??= new Map());

function touch(channelId: number, u: { id: number; displayName: string; avatarColor: string }) {
  let m = presence.get(channelId);
  if (!m) presence.set(channelId, (m = new Map()));
  m.set(u.id, { name: u.displayName, color: u.avatarColor, ts: Date.now() });
}
function online(channelId: number) {
  const m = presence.get(channelId);
  if (!m) return [];
  const cutoff = Date.now() - 15_000;
  const out: { id: number; name: string; color: string }[] = [];
  for (const [id, v] of m) {
    if (v.ts < cutoff) m.delete(id);
    else out.push({ id, name: v.name, color: v.color });
  }
  return out;
}

async function getChannel(slug: string) {
  const [c] = await db.select().from(channels).where(eq(channels.slug, slug));
  return c;
}

const selectMsg = {
  id: chatMessages.id,
  body: chatMessages.body,
  createdAt: chatMessages.createdAt,
  userId: users.id,
  username: users.username,
  displayName: users.displayName,
  avatarColor: users.avatarColor,
  role: users.role,
  xp: users.xp,
};

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const channel = await getChannel(slug);
  if (!channel) return Response.json({ error: "Not found" }, { status: 404 });
  const after = Number(req.nextUrl.searchParams.get("after") || 0);
  const user = await getCurrentUser();
  if (user) touch(channel.id, user);

  const rows = after
    ? await db
        .select(selectMsg)
        .from(chatMessages)
        .innerJoin(users, eq(users.id, chatMessages.userId))
        .where(and(eq(chatMessages.channelId, channel.id), gt(chatMessages.id, after)))
        .orderBy(chatMessages.id)
        .limit(100)
    : (
        await db
          .select(selectMsg)
          .from(chatMessages)
          .innerJoin(users, eq(users.id, chatMessages.userId))
          .where(eq(chatMessages.channelId, channel.id))
          .orderBy(desc(chatMessages.id))
          .limit(60)
      ).reverse();

  return Response.json({ messages: rows, online: online(channel.id) });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  if (!sameOrigin(req)) return Response.json({ error: "Forbidden" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Please log in to chat." }, { status: 401 });
  const limited = limitRequest(req, "chat", String(user.id));
  if (limited) return limited;
  const channel = await getChannel(slug);
  if (!channel) return Response.json({ error: "Not found" }, { status: 404 });

  const { body } = (await req.json().catch(() => ({}))) as { body?: string };
  const text = String(body ?? "").trim().slice(0, 1000);
  if (!text) return Response.json({ error: "Empty message" }, { status: 400 });

  const [msg] = await db.insert(chatMessages).values({ channelId: channel.id, userId: user.id, body: text }).returning();
  touch(channel.id, user);
  const xp = await awardXp(user.id, "chat_message", channel.slug);
  return Response.json({ id: msg.id, xp });
}
