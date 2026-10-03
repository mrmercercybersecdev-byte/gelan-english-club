import "server-only";

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { aiSettings } from "@/db/schema";
import { logError } from "@/lib/security";

export const AI_PROVIDERS = ["gemini", "groq", "ollama"] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];
export type AiScope = "learning" | "chat";

export type AiConfig = {
  key: string;
  model: string;
  baseUrl: string;
  provider: "openai" | AiProvider;
};

const PROVIDERS: Record<AiProvider, { baseUrl: string; model: string }> = {
  gemini: { baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-2.5-flash" },
  groq: { baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" },
  ollama: { baseUrl: "https://ollama.com/v1", model: "gemma4:31b-cloud" },
};

function encryptionKey() {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("Set ADMIN_PASSWORD before saving an AI provider key.");
  return scryptSync(secret, "gelan-ai-settings:v1", 32);
}

export function encryptAiKey(key: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(key, "utf8"), cipher.final()]);
  return `v1:${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${encrypted.toString("hex")}`;
}

function decryptAiKey(payload: string) {
  const [version, ivHex, tagHex, encryptedHex] = payload.split(":");
  if (version !== "v1" || !ivHex || !tagHex || !encryptedHex) {
    throw new Error("Stored AI provider key has an unsupported format.");
  }
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedHex, "hex")), decipher.final()]).toString("utf8");
}

export async function getAiConfig(scope: "learning" | "chat" | "admin" = "learning"): Promise<AiConfig | null> {
  const [saved] = await db.select().from(aiSettings).where(eq(aiSettings.scope, scope)).limit(1);
  if (saved) {
    if (!AI_PROVIDERS.includes(saved.provider as AiProvider)) {
      throw new Error("Stored AI provider is not supported.");
    }
    const provider = saved.provider as AiProvider;
    return {
      provider,
      key: decryptAiKey(saved.encryptedApiKey),
      model: saved.model,
      baseUrl: PROVIDERS[provider].baseUrl,
    };
  }

  const fallbackKey = scope === "chat" ? process.env.OPENAI_API_KEY_CHAT || process.env.OPENAI_API_KEY : process.env.OPENAI_API_KEY;
  if (!fallbackKey) return null;
  return {
    provider: "openai",
    key: fallbackKey,
    model: scope === "chat" ? (process.env.OPENAI_MODEL_CHAT || process.env.OPENAI_MODEL || "gpt-4o-mini") : (process.env.OPENAI_MODEL || "gpt-4o-mini"),
    baseUrl: (scope === "chat" ? (process.env.OPENAI_BASE_URL_CHAT || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1") : (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1")).replace(/\/$/, ""),
  };
}

export async function getPublicAiSettings() {
  try {
    const rows = await db.select().from(aiSettings).orderBy(aiSettings.scope);
    if (rows.length) {
      return rows.reduce((acc, saved) => {
        acc[saved.scope as "learning" | "chat"] = { provider: saved.provider as AiProvider, model: saved.model, configured: true, savedKey: true };
        return acc;
      }, {} as Record<string, { provider: AiProvider; model: string; configured: boolean; savedKey: boolean }>);
    }
    return {
      learning: { provider: "gemini" as const, model: PROVIDERS.gemini.model, configured: Boolean(process.env.OPENAI_API_KEY), savedKey: false },
      chat: { provider: "gemini" as const, model: PROVIDERS.gemini.model, configured: Boolean(process.env.OPENAI_API_KEY_CHAT || process.env.OPENAI_API_KEY), savedKey: false },
    };
  } catch (error) {
    logError("ai-settings.read", error);
    throw error;
  }
}
