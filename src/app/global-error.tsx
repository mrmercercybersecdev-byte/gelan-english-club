"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#fbf7f0", color: "#1d1b18", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <p style={{ fontSize: 56, margin: 0 }}>🛠️</p>
          <h1 style={{ fontSize: 32 }}>We&apos;ll be right back</h1>
          <p style={{ color: "#6b645a" }}>The club hit an unexpected problem. Please refresh the page.</p>
          {error.digest && <p style={{ fontFamily: "monospace", fontSize: 12, color: "#6b645a" }}>Reference: {error.digest}</p>}
          <button onClick={reset} style={{ marginTop: 16, background: "#b8322a", color: "white", border: 0, borderRadius: 999, padding: "12px 24px", fontWeight: 600, cursor: "pointer" }}>
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
