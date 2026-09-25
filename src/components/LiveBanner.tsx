import Link from "next/link";
import { db } from "@/db";
import { livestreams } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function LiveBanner() {
  let live: { title: string; host: string } | undefined;
  try {
    [live] = await db.select({ title: livestreams.title, host: livestreams.host }).from(livestreams).where(eq(livestreams.status, "live")).limit(1);
  } catch {
    return null;
  }
  if (!live) return null;
  return (
    <Link
      href="/about#live"
      className="animate-gradient-x relative z-[51] flex items-center justify-center gap-3 bg-gradient-to-r from-red-700 via-red-500 to-rose-600 px-4 py-2 text-sm font-semibold text-white"
    >
      <span className="flex items-center gap-1.5 rounded bg-white/20 px-2 py-0.5 text-[11px] font-bold">
        <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> LIVE
      </span>
      <span className="truncate">{live.title} — with {live.host}</span>
      <span className="hidden shrink-0 underline underline-offset-2 sm:inline">Watch now →</span>
    </Link>
  );
}
