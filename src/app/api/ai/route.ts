import { NextRequest } from "next/server";
import { aiEnabled, analyzeEssay, grammarCheck, llm, offlineTutor, SYSTEM_PROMPTS, type ChatMsg } from "@/lib/ai";
import { getCurrentUser } from "@/lib/session";
import { awardXp } from "@/lib/award";
import { limitRequest, logError, sameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

type Body = {
  mode?: string;
  messages?: ChatMsg[];
  essay?: string;
  prompt?: string;
  minWords?: number;
  scenario?: string;
  source?: "tutor" | "voice";
};

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return Response.json({ error: "Forbidden" }, { status: 403 });
  const limited = limitRequest(req, "ai");
  if (limited) return limited;
  try {
    return await handle(req);
  } catch (err) {
    logError("api/ai", err);
    return Response.json({ error: "The tutor is having a moment — please try again." }, { status: 500 });
  }
}

async function handle(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const mode = String(body.mode || "conversation");
  const user = await getCurrentUser();

  /* ---------- Essay grading ---------- */
  if (mode === "essay") {
    const essay = String(body.essay || "").slice(0, 8000);
    if (essay.trim().split(/\s+/).length < 20) {
      return Response.json({ error: "Please write at least 20 words." }, { status: 400 });
    }
    const analysis = analyzeEssay(essay, Number(body.minWords) || 250);
    const feedback = await llm(
      SYSTEM_PROMPTS["ielts-writing"],
      [{ role: "user", content: `Task prompt: ${body.prompt || "(free writing)"}\n\nEssay:\n${essay}` }],
      900,
    );
    let xp = null;
    if (user) xp = await awardXp(user.id, "essay", `band ${analysis.overall}`);
    return Response.json({ analysis, feedback, source: feedback ? "ai" : "offline", xp });
  }

  /* ---------- Chat-based tutors ---------- */
  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }))
    .slice(-16);

  const last = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  let system = SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.conversation;
  if (body.scenario && body.scenario !== "free") {
    system += ` Role-play scenario: ${body.scenario}. Stay in character, but still add the brief '💡 Quick fix:' line for mistakes.`;
  }
  if (body.source === "voice") {
    system += " Your reply will be read aloud by text-to-speech, so avoid markdown symbols and emojis except the 💡 line; keep it under 60 words.";
  }

  const aiReply = await llm(system, messages);
  const reply = aiReply ?? offlineTutor(mode, messages);
  const { corrections } = grammarCheck(last);

  let xp = null;
  if (user && last) {
    xp = await awardXp(user.id, body.source === "voice" ? "speaking_turn" : "tutor_message", mode);
  }

  return Response.json({ reply, corrections, source: aiReply ? "ai" : "offline", aiEnabled: aiEnabled(), xp });
}
