"use client";

import { useState } from "react";

export default function AnalyticsSetupButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function initialize() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/analytics/setup", { method: "POST" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not initialize analytics.");
      window.location.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not initialize analytics."); }
    finally { setBusy(false); }
  }
  return <div className="mt-4"><button type="button" onClick={initialize} disabled={busy} className="btn-primary disabled:opacity-50">{busy ? "Connecting database…" : "Set up analytics tables"}</button>{message && <p role="alert" className="mt-2">{message}</p>}</div>;
}
