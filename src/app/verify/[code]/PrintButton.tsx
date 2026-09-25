"use client";

import { useState } from "react";

export default function PrintButton() {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex gap-2">
      <button
        onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        className="btn-ghost !py-2 text-sm"
      >
        {copied ? "✓ Link copied" : "🔗 Copy link"}
      </button>
      <button onClick={() => window.print()} className="btn-primary !py-2 text-sm">🖨️ Print / PDF</button>
    </div>
  );
}
