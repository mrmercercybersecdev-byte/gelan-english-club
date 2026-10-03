"use client";

import { useEffect, useState } from "react";
import { DEFAULT_LOCAL_OLLAMA, readLocalOllamaSettings, saveLocalOllamaSettings, testLocalOllama } from "@/lib/ollama-local";

export default function LocalOllamaSettings() {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_LOCAL_OLLAMA.baseUrl);
  const [model, setModel] = useState(DEFAULT_LOCAL_OLLAMA.model);
  const [status, setStatus] = useState("");
  const [checking, setChecking] = useState(false);
  useEffect(() => { const saved = readLocalOllamaSettings(); setBaseUrl(saved.baseUrl); setModel(saved.model); }, []);

  function save() {
    try { const saved = saveLocalOllamaSettings({ baseUrl, model }); setBaseUrl(saved.baseUrl); setModel(saved.model); setStatus("Saved in this browser only. No API key is used or sent to the website."); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Could not save local settings."); }
  }
  async function test() {
    setChecking(true); setStatus("");
    try {
      const current = saveLocalOllamaSettings({ baseUrl, model });
      const result = await testLocalOllama(current);
      setStatus(result.modelAvailable ? `Connected. ${current.model} is available through Ollama on this PC.` : `Connected to Ollama. Model “${current.model}” was not listed; sign in to Ollama and confirm that model can run.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not connect to Ollama."); }
    finally { setChecking(false); }
  }

  return <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
    <p className="text-sm font-semibold uppercase tracking-widest text-brand">Runs from this browser</p>
    <h2 className="mt-1 font-display text-2xl font-bold">Ollama on this PC</h2>
    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">Admin writing tools can call your signed-in Ollama app directly on this computer. This uses no API key and bypasses Vercel. Cloud models still send prompts to Ollama Cloud for inference.</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-semibold">Local Ollama address<input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} className="input mt-1.5" inputMode="url" /></label>
      <label className="text-sm font-semibold">Model<input value={model} onChange={(event) => setModel(event.target.value)} className="input mt-1.5" maxLength={100} /></label>
    </div>
    <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={save} className="min-h-11 rounded-full px-5 text-sm font-semibold ring-1 ring-black/15">Save on this browser</button><button type="button" onClick={test} disabled={checking} className="btn-primary disabled:opacity-50">{checking ? "Checking Ollama…" : "Test this PC's Ollama"}</button></div>
    {status && <p role="status" className="mt-3 text-sm text-muted">{status}</p>}
    <details className="mt-4 text-xs text-muted"><summary className="cursor-pointer font-semibold">One-time browser access setup</summary><p className="mt-2">Ollama allows local browser origins by default. To let this hosted admin page connect, add its exact origin to the Windows user environment variable <code>OLLAMA_ORIGINS</code>, then quit and restart Ollama. Use the origin shown in your address bar, without a page path. Sign in to Ollama on this PC with <code>ollama signin</code> before using cloud models.</p><p className="mt-2">This local connection is available only in this browser on this PC; it does not power public-site AI requests from Vercel.</p><a href="https://docs.ollama.com/faq#how-can-i-allow-additional-web-origins-to-access-ollama" target="_blank" rel="noreferrer" className="mt-2 inline-block underline">Ollama origin setup guide</a></details>
  </section>;
}
