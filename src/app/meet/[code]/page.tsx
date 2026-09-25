import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/db";
import { meetRooms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";
import MeetRoom from "./MeetRoom";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const [room] = await db.select().from(meetRooms).where(eq(meetRooms.code, code));
  return { title: room ? `${room.title} · Live` : "Room" };
}

export default async function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const [room] = await db.select().from(meetRooms).where(eq(meetRooms.code, code));
  if (!room) notFound();
  const user = await getCurrentUser();
  return <MeetRoom code={room.code} title={room.title} host={room.hostName} defaultName={user?.displayName ?? ""} loggedIn={!!user} />;
}
