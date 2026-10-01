"use client";

import { useActionState, useState } from "react";
import type { FormState } from "../actions";
import { FormNotice, SubmitButton } from "@/components/FormBits";
import { clearAiSettingsAction, saveAiSettingsAction } from "./admin-actions";

type Settings = { provider: string; model: string; configured: boolean; savedKey: boolean };

const MODELS: Record<string, string> = {
  gemini: "gemini-2.5-flash",
  groq: "llama-3.3-70b-versatile",
};

export default function AISettingsForm({ settings }: { settings: Settings }) {
  const [state, action] = useActionState<FormState, FormData>(saveAiSettingsAction, null);
  const [provider, setProvider] = useState(settings.provider === "groq" ? "groq" : "gemini");
  const [model, setModel] = useState(settings.model);
  const configured = settings.configured || Boolean(state?.ok);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
      <form action={action} className="space-y-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">AI provider</p>
          <h2 className="mt-1 font-display text-3xl font-bold">Learning lab settings</h2>
          <p className="mt-2 text-sm text-muted">One server-side key powers the tutors, essay feedback, and blog-writing assistant.</p>
        </div>
        <div>
          <label className="label" htmlFor="ai-provider">Provider</label>
          <select id="ai-provider" name="provider" value={provider} onChange={(event) => {
            const next = event.target.value === "groq" ? "groq" : "gemini";
            if (model === MODELS[provider]) setModel(MODELS[next]);
            setProvider(next);
          }} className="input">
            <option value="gemini">Google Gemini</option>
            <option value="groq">Groq</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="ai-model">Model</label>
          <input id="ai-model" name="model" value={model} onChange={(event) => setModel(event.target.value)} required maxLength={100} placeholder={MODELS[provider]} className="input" />
          <p className="mt-1 text-xs text-muted">Use a model available to your account, such as {MODELS.gemini} or {MODELS.groq}.</p>
        </div>
        <div>
          <label className="label" htmlFor="ai-api-key">API key</label>
          <input id="ai-api-key" name="apiKey" type="password" autoComplete="new-password" maxLength={500} placeholder={settings.configured ? "Saved securely — leave blank to keep it" : "Paste your provider API key"} className="input" />
          <p className="mt-1 text-xs text-muted">The key is encrypted before it is stored and is never sent to visitors or shown again.</p>
        </div>
        <FormNotice state={state} />
        <SubmitButton>Save AI settings</SubmitButton>
      </form>
      <aside className="rounded-3xl bg-ink p-6 text-white sm:p-8">
        <span className="text-4xl">🔐</span>
        <h3 className="mt-4 font-display text-2xl font-bold">Your key stays on the server</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          Keys are encrypted in the database using the configured organiser password and are only decrypted by server-side AI requests.
          Changing <code className="text-white">ADMIN_PASSWORD</code> means you will need to save your provider key again.
        </p>
        <p className="mt-5 rounded-2xl bg-white/10 p-4 text-sm">
          Status: <strong>{configured ? (settings.savedKey || state?.ok ? "A dashboard provider key is saved" : "A server environment key is active") : "No provider key configured"}</strong>
        </p>
        {settings.savedKey && (
          <form action={clearAiSettingsAction} className="mt-4">
            <button className="btn-ghost border-white/30 text-white hover:bg-white/10">Remove saved key</button>
          </form>
        )}
      </aside>
    </div>
  );
}
