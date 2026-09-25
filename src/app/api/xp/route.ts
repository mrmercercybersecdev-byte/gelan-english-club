import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { awardXp } from "@/lib/award";
import { ACTIVITIES } from "@/lib/xp";
import { limitRequest, sameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

const CLIENT_ALLOWED = new Set(["quiz_correct", "quiz_complete", "pronunciation", "daily_bonus", "flashcard", "meeting_join"]);

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return Response.json({ error: "Forbidden" }, { status: 403 });
  const limited = limitRequest(req, "write", "xp");
  if (limited) return limited;
  const user = await getCurrentUser();
  if (!user) return Response.json({ awarded: 0, loggedIn: false });
  const body = (await req.json().catch(() => ({}))) as { activity?: string; meta?: string; score?: number };
  const activity = String(body.activity || "");
  if (!CLIENT_ALLOWED.has(activity) || !ACTIVITIES[activity]) {
    return Response.json({ error: "Unknown activity" }, { status: 400 });
  }
  let multiplier = 1;
  if (activity === "pronunciation" && typeof body.score === "number") {
    multiplier = body.score >= 90 ? 1.5 : body.score >= 60 ? 1 : 0.5;
  }
  const result = await awardXp(user.id, activity, body.meta, multiplier);
  return Response.json({ ...result, loggedIn: true });
}
