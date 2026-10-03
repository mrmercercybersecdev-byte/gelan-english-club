import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ensureSeed } from "@/lib/seed";
import AuthForms from "./AuthForms";
import DnaHelix from "@/components/fx/DnaHelix";
import { db } from "@/db";
import { studyGroups } from "@/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; missing?: string }> }) {
  await ensureSeed();
  const { next, error, missing } = await searchParams;
  const safe = next && next.startsWith("/") && !next.startsWith("//") && next !== "/login" ? next : "/profile";
  if (await getCurrentUser()) redirect(safe);
  const groups = await db
    .select({ id: studyGroups.id, name: studyGroups.name, emoji: studyGroups.emoji, joinPolicy: studyGroups.joinPolicy })
    .from(studyGroups)
    .orderBy(asc(studyGroups.id));

  return (
    <div className="mx-auto grid min-h-[80vh] max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-2">
      <div className="aurora-bg relative hidden h-[560px] overflow-hidden rounded-[2rem] lg:block">
        <div className="grid-bg absolute inset-0" />
        <DnaHelix className="absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <p className="font-display text-4xl font-bold leading-tight">
            Your English journey is <span className="text-gradient">written in your DNA</span>.
          </p>
          <p className="mt-3 text-white/70">Earn XP, climb the leaderboard, unlock badges and keep your streak alive.</p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-md">
        <AuthForms next={safe} groups={groups} error={error === "google_unconfigured" ? `Google sign-in is not configured in Vercel. Add: ${missing || "GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SITE_URL"}.` : error ? "Google sign-in could not be completed. Please try again or use your username and password." : undefined} />
      </div>
    </div>
  );
}
