"use client";

export type LocalOllamaSettings = { baseUrl: string; model: string };
const STORAGE_KEY = "gelan-admin-ollama-local-v1";
export const DEFAULT_LOCAL_OLLAMA: LocalOllamaSettings = { baseUrl: "http://localhost:11434", model: "gemma4:31b-cloud" };

export function readLocalOllamaSettings(): LocalOllamaSettings {
  if (typeof window === "undefined") return DEFAULT_LOCAL_OLLAMA;
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as Partial<LocalOllamaSettings> | null;
    return {
      baseUrl: typeof value?.baseUrl === "string" ? value.baseUrl.replace(/\/$/, "") : DEFAULT_LOCAL_OLLAMA.baseUrl,
      model: typeof value?.model === "string" && value.model.trim() ? value.model.trim() : DEFAULT_LOCAL_OLLAMA.model,
    };
  } catch { return DEFAULT_LOCAL_OLLAMA; }
}

export function saveLocalOllamaSettings(settings: LocalOllamaSettings) {
  const baseUrl = settings.baseUrl.trim().replace(/\/$/, "");
  if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(baseUrl)) throw new Error("For safety, local Ollama must use localhost or 127.0.0.1.");
  const model = settings.model.trim();
  if (!model || model.length > 100) throw new Error("Enter a valid Ollama model name.");
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ baseUrl, model }));
  return { baseUrl, model };
}

function explainConnectionError(error: unknown) {
  const message = error instanceof Error ? error.message : "Connection failed.";
  if (error instanceof TypeError || /failed to fetch|networkerror/i.test(message)) {
    return "The browser could not reach Ollama on this PC. Start Ollama and allow this admin site's origin with OLLAMA_ORIGINS, then restart Ollama.";
  }
  return message;
}

export async function testLocalOllama(settings = readLocalOllamaSettings()) {
  let response: Response;
  try { response = await fetch(`${settings.baseUrl}/api/tags`, { cache: "no-store" }); }
  catch (error) { throw new Error(explainConnectionError(error)); }
  if (!response.ok) throw new Error(`Ollama responded with HTTP ${response.status}.`);
  const data = await response.json() as { models?: Array<{ name?: string }> };
  const models = (data.models ?? []).map((item) => item.name ?? "");
  return { models, modelAvailable: models.some((name) => name === settings.model || name.startsWith(`${settings.model}:`)) };
}

export async function writeWithLocalOllama(topic: string, systemPrompt: string, settings = readLocalOllamaSettings()) {
  let response: Response;
  try {
    response = await fetch(`${settings.baseUrl}/api/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
      body: JSON.stringify({ model: settings.model, stream: false, messages: [
        { role: "system", content: systemPrompt }, { role: "user", content: topic },
      ], options: { temperature: 0.5 } }),
    });
  } catch (error) { throw new Error(explainConnectionError(error)); }
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Ollama returned HTTP ${response.status}${detail ? `: ${detail.slice(0, 240)}` : ". Check that the model is available after running ollama signin."}`);
  }
  const result = await response.json() as { message?: { content?: string } };
  const draft = result.message?.content?.trim();
  if (!draft) throw new Error("Ollama connected but returned an empty draft.");
  return draft;
}
