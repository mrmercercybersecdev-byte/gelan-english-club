import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/db";
import { meetPeers, meetRooms } from "@/db/schema";
import { desc, gt, sql, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";
import { timeAgo } from "@/lib/format";
import MeetLobbyForms from "./MeetLobbyForms";
import { Reveal } from "@/components/fx/Effects";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Live meeting rooms" };

export default async function MeetPage() {
  const user = await getCurrentUser();
  const cutoff = new Date(Date.now() - 20_000);
  const rooms = await db
    .select({
      code: meetRooms.code,
      title: meetRooms.title,
      hostName: meetRooms.hostName,
      createdAt: meetRooms.createdAt,
      live: sql<number>`count(${meetPeers.id}) filter (where ${meetPeers.lastSeen} > ${cutoff})::int`,
    })
    .from(meetRooms)
    .leftJoin(meetPeers, eq(meetPeers.roomCode, meetRooms.code))
    .where(gt(meetRooms.createdAt, new Date(Date.now() - 1000 * 60 * 60 * 48)))
    .groupBy(meetRooms.id)
    .orderBy(desc(sql`count(${meetPeers.id})`), desc(meetRooms.createdAt))
    .limit(12);

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-700 to-navy text-white">
        <div className="grid-bg absolute inset-0 opacity-40" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-2">
          <div>
            <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" /> Peer-to-peer · encrypted · no downloads
            </span>
            <h1 className="mt-5 font-display text-5xl font-bold md:text-6xl">Live Meeting Rooms</h1>
            <p className="mt-4 max-w-lg text-lg text-white/80">
              Host a video call for your study group, conversation circle or IELTS speaking partner in one click.
              Screen share, raise your hand, react, chat — and deal random conversation topics to break the ice.
            </p>
            <ul className="mt-6 grid max-w-md grid-cols-2 gap-2 text-sm text-white/85">
              {["📹 HD video & audio", "🖥️ Screen sharing", "💬 In-room chat", "✋ Raise hand", "🎉 Live reactions", "🎲 Topic dealer"].map((f) => <li key={f}>{f}</li>)}
            </ul>
          </div>
          <MeetLobbyForms defaultName={user?.displayName ?? ""} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14">
        <h2 className="font-display text-3xl font-bold">Recent rooms</h2>
        <p className="mt-1 text-muted">Jump into an active room or revisit one from the last 48 hours.</p>
        {rooms.length ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((r, i) => (
              <Reveal key={r.code} delay={i * 60}>
                <Link href={`/meet/${r.code}`} className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <span className={`grid h-12 w-12 place-items-center rounded-2xl text-xl ${r.live ? "bg-emerald-100" : "bg-paper"}`}>📹</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold group-hover:text-brand">{r.title}</p>
                    <p className="text-xs text-muted">Host {r.hostName} · {timeAgo(r.createdAt)} · <code>{r.code}</code></p>
                  </div>
                  {r.live > 0 ? (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> {r.live} live
                    </span>
                  ) : (
                    <span className="text-xs text-muted">empty</span>
                  )}
                </Link>
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-2xl bg-white p-10 text-center text-muted ring-1 ring-black/5">No rooms yet — create the first one above!</p>
        )}
      </section>
    </div>
  );
}
