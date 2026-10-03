"use client";

import { useEffect, useState } from "react";

type Consent = { decided: boolean; analytics: boolean; marketing: boolean };

export default function PrivacyControls() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/privacy/consent", { cache: "no-store" }).then((res) => res.json()).then((value: Consent) => {
      if (!active) return;
      setConsent(value);
      setAnalytics(value.analytics);
      setMarketing(value.marketing);
      if (!value.decided) setOpen(true);
    }).catch(() => { if (active) setOpen(true); });
    return () => { active = false; };
  }, []);

  async function save(analyticsChoice = analytics, marketingChoice = marketing) {
    if (saving) return;
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/privacy/consent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ analytics: analyticsChoice, marketing: marketingChoice }) });
      if (!response.ok) throw new Error("Could not save privacy choices. Please try again.");
      const result = await response.json() as Consent;
      setConsent(result); setOpen(false);
      window.dispatchEvent(new CustomEvent("wec-privacy-updated", { detail: result }));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save privacy choices."); }
    finally { setSaving(false); }
  }

  return <>
    <button type="button" onClick={() => setOpen(true)} className="fixed bottom-3 left-3 z-[70] rounded-full bg-ink px-3 py-2 text-xs font-semibold text-white shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">Privacy choices</button>
    {open && <div className="fixed inset-x-3 bottom-14 z-[80] mx-auto max-h-[75vh] max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl ring-1 ring-black/10 sm:inset-x-auto sm:bottom-5 sm:left-5 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="privacy-title">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-widest text-brand">Your privacy</p><h2 id="privacy-title" className="mt-1 font-display text-xl font-bold">Choose optional data use</h2></div>
        {consent?.decided && <button type="button" onClick={() => setOpen(false)} aria-label="Close privacy choices" className="rounded-full px-3 py-2 text-muted hover:bg-paper">✕</button>}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">The club uses essential storage for sign-in. Optional choices are separate and can be changed here at any time.</p>
      <label className="mt-4 flex cursor-pointer gap-3 rounded-2xl bg-paper p-4">
        <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="mt-1 size-4 accent-brand" />
        <span><span className="block text-sm font-semibold">Performance & usage analytics</span><span className="mt-1 block text-xs leading-relaxed text-muted">Allow page counts, coarse device type, country, and Core Web Vitals. We do not store your IP, full browser signature, account ID, or page query strings. Data is removed after 90 days.</span></span>
      </label>
      <label className="mt-3 flex cursor-pointer gap-3 rounded-2xl bg-paper p-4">
        <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-1 size-4 accent-brand" />
        <span><span className="block text-sm font-semibold">Aggregate product planning</span><span className="mt-1 block text-xs leading-relaxed text-muted">Allow coarse page and country totals to help decide where to offer club products. This does not sign you up for advertising messages. Contact details require a separate opt-in.</span></span>
      </label>
      {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={() => { setAnalytics(false); setMarketing(false); void save(false, false); }} disabled={saving} className="min-h-11 rounded-full px-4 text-sm font-semibold ring-1 ring-black/15">Reject optional</button>
        <button type="button" onClick={() => void save()} disabled={saving} className="btn-primary min-h-11 justify-center">{saving ? "Saving…" : "Save my choices"}</button>
      </div>
    </div>}
  </>;
}
