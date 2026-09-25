import { redirect } from "next/navigation";
import { db } from "@/db";
import { channels } from "@/db/schema";
import { asc } from "drizzle-orm";
import { ensureSeed } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function ChatIndex() {
  await ensureSeed();
  const [first] = await db.select().from(channels).orderBy(asc(channels.sortOrder)).limit(1);
  redirect(`/chat/${first?.slug ?? "general"}`);
}
