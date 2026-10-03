"use client";

import { useActionState, useState } from "react";
import type { FormState } from "../actions";
import { FormNotice, SubmitButton } from "@/components/FormBits";
import { clearAiSettingsAction, saveAiSettingsAction } from "./admin-actions";

type Settings = { provider: string; model: string; configured: boolean; savedKey: boolean };

const MODELS: Record<string, string> = {
  gemini: "gemini-2.5-flash",
  groq: "llama-3.3-70b-versatile",
  ollama: "gemma4:31b-cloud",
};

const asProvider = (value: string) => value === "groq" || value === "ollama" ? value : "gemini";

export default function AISettingsForm({ settings }: { settings: { learning?: Settings; chat?: Settings } }) {
  const [state, action] = useActionState<FormState, FormData>(saveAiSettingsAction, null);
  const [scope, setScope] = useState<"learning" | "chat">("learning");
  const active = settings[scope] ?? { provider: "gemini", model: MODELS.gemini, configured: false, savedKey: false };
  const [provider, setProvider] = useState(asProvider(active.provider));
  const [model, setModel] = useState(active.model || MODELS.gemini);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState("");
  const configured = active.configured || Boolean(state?.ok);

  async function testConnection() {
    setTesting(true); setTestResult("");
    try {
      const response = await fetch("/api/admin/ai-test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scope }) });
      const result = await response.json() as { ok?: boolean; message?: string };
      setTestResult(result.message || (result.ok ? "Connection works." : "Test failed."));
    } catch { setTestResult("Could not reach the AI test endpoint."); }
    finally { setTesting(false); }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
      <form action={action} className="space-y-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">AI provider</p>
          <h2 className="mt-1 font-display text-3xl font-bold">AI settings</h2>
          <p className="mt-2 text-sm text-muted">Use separate keys for learning/tutors and chat grammar support.</p>
        </div>
        <div>
          <label className="label" htmlFor="ai-scope">Scope</label>
          <select id="ai-scope" name="scope" value={scope} onChange={(event) => {
            const next = event.target.value === "chat" ? "chat" : "learning";
            const nextSettings = settings[next] ?? { provider: "gemini", model: MODELS.gemini, configured: false, savedKey: false };
            setScope(next);
            const nextProvider = asProvider(nextSettings.provider);
            setProvider(nextProvider);
            setModel(nextSettings.model || MODELS[nextProvider]);
            setTestResult("");
          }} className="input">
            <option value="learning">Learning / tutor</option>
            <option value="chat">Chat grammar & correction</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="ai-provider">Provider</label>
          <select id="ai-provider" name="provider" value={provider} onChange={(event) => {
            const next = asProvider(event.target.value);
            if (model === MODELS[provider]) setModel(MODELS[next]);
            setProvider(next);
            setTestResult("");
          }} className="input">
            <option value="gemini">Google Gemini</option>
            <option value="groq">Groq</option>
            <option value="ollama">Ollama Cloud</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="ai-model">Model</label>
          <input id="ai-model" name="model" value={model} onChange={(event) => setModel(event.target.value)} required maxLength={100} placeholder={MODELS[provider]} className="input" />
          <p className="mt-1 text-xs text-muted">Examples: {MODELS.gemini}, {MODELS.groq}, or {MODELS.ollama}.</p>
        </div>
        <div>
          <label className="label" htmlFor="ai-api-key">API key</label>
          <input id="ai-api-key" name="apiKey" type="password" autoComplete="new-password" maxLength={500} placeholder={active.configured ? "Saved securely — leave blank to keep it" : "Paste your provider API key"} className="input" />
          <p className="mt-1 text-xs text-muted">The key is encrypted before it is stored and is never sent to visitors or shown again. {provider === "ollama" && <>Create an Ollama cloud API key at <a href="https://ollama.com/settings/keys" target="_blank" rel="noreferrer" className="underline">ollama.com</a>.</>}</p>
        </div>
        <FormNotice state={state} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <SubmitButton>Save AI settings</SubmitButton>
          <button type="button" onClick={testConnection} disabled={!configured || testing} className="min-h-11 rounded-full px-5 text-sm font-semibold ring-1 ring-black/15 disabled:opacity-50">{testing ? "Testing…" : "Test saved connection"}</button>
        </div>
        {testResult && <p role="status" className="text-sm text-muted">{testResult}</p>}
      </form>
      <aside className="rounded-3xl bg-ink p-6 text-white sm:p-8">
        <span className="text-4xl">🔐</span>
        <h3 className="mt-4 font-display text-2xl font-bold">Two AI lanes</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          You can keep one key for the learning lab and another for grammar-aware chat. Each key is encrypted and used only by the relevant server-side flow.
        </p>
        <p className="mt-5 rounded-2xl bg-white/10 p-4 text-sm">
          Status: <strong>{configured ? (active.savedKey || state?.ok ? "A dashboard provider key is saved" : "A server environment key is active") : "No provider key configured"}</strong>
        </p>
        {active.savedKey && (
          <form action={clearAiSettingsAction} className="mt-4">
            <input type="hidden" name="scope" value={scope} />
            <button className="btn-ghost border-white/30 text-white hover:bg-white/10">Remove saved key</button>
          </form>
        )}
      </aside>
    </div>
  );
}
