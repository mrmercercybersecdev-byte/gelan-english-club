import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/db";
import { channels } from "@/db/schema";
import { asc } from "drizzle-orm";
import { ensureSeed } from "@/lib/seed";
import { getCurrentUser, toPublic } from "@/lib/session";
import ChatClient from "./ChatClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `#${slug} · Chat` };
}

export default async function ChannelPage({ params }: { params: Promise<{ slug: string }> }) {
  await ensureSeed();
  const { slug } = await params;
  const list = await db.select().from(channels).orderBy(asc(channels.sortOrder), asc(channels.id));
  const channel = list.find((c) => c.slug === slug);
  if (!channel) notFound();
  const u = await getCurrentUser();
  return <ChatClient channels={list} channel={channel} me={u ? toPublic(u) : null} />;
}
