import { NextRequest } from "next/server";
import { isContentManager } from "@/lib/auth";
import { aiEnabled, llm } from "@/lib/ai";
import { limitRequest, logError, sameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return Response.json({ error: "Forbidden" }, { status: 403 });
  const limited = limitRequest(req, "ai", "admin-blog");
  if (limited) return limited;
  if (!(await isContentManager())) return Response.json({ error: "Content manager access required." }, { status: 403 });

  try {
    const body = (await req.json()) as { topic?: unknown; audience?: unknown; format?: unknown };
    const topic = typeof body.topic === "string" ? body.topic.trim().slice(0, 1000) : "";
    const audience = typeof body.audience === "string" ? body.audience.trim().slice(0, 120) : "English learners";
    const format = body.format === "page" ? "page" : "blog";
    if (topic.length < 8) return Response.json({ error: "Add a topic or a few notes (at least 8 characters)." }, { status: 400 });
    if (!(await aiEnabled())) return Response.json({ error: "Configure a server AI provider in Admin → AI settings, or use Draft with this PC's Ollama from the editor." }, { status: 503 });

    const systemPrompt = format === "page"
      ? "You are the Gelan English Club's careful website copy helper. Draft concise, welcoming website copy based only on the supplied notes. Return a short heading followed by 1–3 short paragraphs. Do not invent dates, prices, staff, outcomes, statistics, or policies. If a fact is missing, use a clear [organiser: add detail] placeholder. Return only the draft."
      : "You are the Gelan English Club's careful educational blog-writing assistant. Write an original, practical and friendly 500–700 word Markdown draft for English learners. Use a clear title as an H1, useful H2 sections, examples where they help, and a short encouraging conclusion. Keep claims factual, avoid fabricating sources or statistics, and do not claim to be a human. Return only the draft.";
    const draft = await llm(
      systemPrompt,
      [{ role: "user", content: `Audience: ${audience}\nTopic and notes:\n${topic}` }],
      format === "page" ? 600 : 1400,
    );
    if (!draft) return Response.json({ error: "The AI provider could not create a draft. Check the provider key, model, and quota." }, { status: 502 });
    return Response.json({ draft });
  } catch (error) {
    logError("api/admin/blog-assistant", error);
    return Response.json({ error: "Could not generate the draft. Please try again." }, { status: 500 });
  }
}
