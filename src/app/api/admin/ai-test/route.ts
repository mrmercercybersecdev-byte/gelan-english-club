import { isAdmin } from "@/lib/auth";
import { llm } from "@/lib/ai";
import { logError, limitRequest, sameOrigin } from "@/lib/security";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ message: "Forbidden." }, { status: 403 });
  if (!(await isAdmin())) return Response.json({ message: "Administrator access required." }, { status: 403 });
  const limited = limitRequest(request, "ai", "admin-ai-test");
  if (limited) return limited;
  try {
    const body = await request.json() as { scope?: unknown };
    const scope = body.scope === "chat" ? "chat" : body.scope === "learning" ? "learning" : null;
    if (!scope) return Response.json({ message: "Choose an AI scope." }, { status: 400 });
    const response = await llm("Reply with the single word OK.", [{ role: "user", content: "Connection test" }], 12, scope);
    if (!response) {
      await recordAudit("ai.provider.test", "ai_settings", scope, { success: false });
      return Response.json({ message: "The model did not respond. Check the saved API key, model ID, and provider quota." }, { status: 502 });
    }
    await recordAudit("ai.provider.test", "ai_settings", scope, { success: true });
    return Response.json({ ok: true, message: "Connected. The selected model returned a response." }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logError("admin.ai-test", error);
    return Response.json({ message: "The AI connection test failed. Check the server logs for details." }, { status: 500 });
  }
}
