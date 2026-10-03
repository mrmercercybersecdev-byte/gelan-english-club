"use client";

import { useState, type FormEvent } from "react";

async function readApiResponse<T extends { error?: string }>(response: Response): Promise<T> {
  let payload: unknown;
  try {
    payload = JSON.parse(await response.text());
  } catch {
    throw new Error("Organiser sign-in is temporarily unavailable. Refresh and try again.");
  }
  if (!payload || typeof payload !== "object") {
    throw new Error("Organiser sign-in is temporarily unavailable. Refresh and try again.");
  }
  const data = payload as T;
  if (!response.ok) throw new Error(data.error || "Organiser sign-in could not be completed.");
  return data;
}

export default function LoginForm({ configured = true }: { configured?: boolean }) {
  const [phase, setPhase] = useState<"idle" | "checking">("idle");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const busy = phase !== "idle";

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !configured) return;
    setPhase("checking");
    setError("");
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    try {
      const response = await fetch("/api/admin/passkey/options", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      await readApiResponse<{ error?: string }>(response);
      window.location.assign("/admin");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in. Check your password and try again.");
      setPhase("idle");
    }
  }

  return (
    <form onSubmit={signIn} className="mt-6 space-y-4">
      {!configured && (
        <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
          Organiser login is not configured yet. Set the <code>ADMIN_PASSWORD</code> environment variable, then reload this page.
        </p>
      )}
      <div>
        <label className="label" htmlFor="password">Admin Password</label>
        <div className="relative">
          <input
            className="input min-h-12 pr-16"
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            maxLength={512}
            autoComplete="current-password"
            placeholder="Enter your organiser password"
            disabled={!configured}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-1 min-w-12 rounded-lg px-3 text-sm font-semibold text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((shown) => !shown)}
            disabled={!configured}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <p className="mt-1 text-[11px] text-muted">Use the unique organiser password stored as <code>ADMIN_PASSWORD</code>.</p>
      </div>
      <div className="rounded-xl bg-brand/5 p-4 text-sm text-ink ring-1 ring-brand/15">
        <p className="font-semibold">Password protection</p>
        <p className="mt-1 text-muted">
          Enter the organiser password to sign in. Use the unique organiser password stored as <code className="font-mono text-xs">ADMIN_PASSWORD</code> in the hosting environment.
        </p>
      </div>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <button className="btn-primary min-h-12 w-full" type="submit" disabled={busy || !configured}>
        {phase === "checking" ? "Checking password…" : "Continue"}
      </button>
      <div className="space-y-2 rounded-xl bg-amber-50 p-4 text-xs text-amber-900 ring-1 ring-amber-200">
        <p className="font-semibold">Security reminder</p>
        <ul className="list-disc space-y-1 pl-4">
          <li>Never share the organiser password</li>
          <li>Organiser sessions expire after 8 hours</li>
        </ul>
      </div>
    </form>
  );
}
