"use client";

import { useState, type FormEvent } from "react";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";

type OptionsResponse =
  | { mode: "register"; options: PublicKeyCredentialCreationOptionsJSON }
  | { mode: "authenticate"; options: PublicKeyCredentialRequestOptionsJSON };

async function readApiResponse<T extends { error?: string }>(response: Response, action: string): Promise<T> {
  let payload: unknown;
  try {
    payload = JSON.parse(await response.text());
  } catch {
    throw new Error(`${action} failed because the server returned an invalid response (HTTP ${response.status}). The passkey database schema may need to be applied.`);
  }
  if (!payload || typeof payload !== "object") {
    throw new Error(`${action} failed because the server returned an invalid response (HTTP ${response.status}).`);
  }
  const data = payload as T;
  if (!response.ok) throw new Error(data.error || `${action} failed (HTTP ${response.status}).`);
  return data;
}

export default function LoginForm({ showHint = true }: { showHint?: boolean }) {
  const [phase, setPhase] = useState<"idle" | "checking" | "device" | "verifying">("idle");
  const [error, setError] = useState("");
  const busy = phase !== "idle";

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setPhase("checking");
    setError("");
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    try {
      const optionsResponse = await fetch("/api/admin/passkey/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const optionsData = await readApiResponse<OptionsResponse & { error?: string }>(optionsResponse, "Could not start organiser sign-in");

      let response: unknown;
      let mode: "register" | "authenticate";
      if (optionsData.mode === "register") {
        mode = "register";
        setPhase("device");
        response = await startRegistration({ optionsJSON: optionsData.options });
      } else {
        mode = "authenticate";
        setPhase("device");
        response = await startAuthentication({ optionsJSON: optionsData.options });
      }

      setPhase("verifying");
      const verifyResponse = await fetch("/api/admin/passkey/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, password, response }),
      });
      await readApiResponse<{ error?: string }>(verifyResponse, "Passkey verification failed");
      window.location.assign("/admin");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Organiser sign-in failed.");
      setPhase("idle");
    }
  }

  return (
    <form onSubmit={signIn} className="mt-6 space-y-4">
      <div>
        <label className="label" htmlFor="password">Admin Password</label>
        <input
          className="input"
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          minLength={12}
          maxLength={512}
          autoComplete="current-password"
          placeholder="Enter your organiser password"
        />
        {showHint && <p className="mt-1 text-[11px] text-muted">Use your unique, strong organiser password.</p>}
      </div>
      <div className="rounded-xl bg-brand/5 p-4 text-sm text-ink ring-1 ring-brand/15">
        <p className="font-semibold">Password + device verification</p>
        <p className="mt-1 text-muted">
          {showHint
            ? "On your first sign-in, after checking your password, your browser will ask you to create a passkey for this device. On later sign-ins, it will ask you to verify with that passkey."
            : "After checking your password, your browser will ask you to register a passkey if this is the first setup, or verify with your passkey if one is already registered."}
        </p>
        <p className="mt-2 text-xs text-muted">Your device may use Face ID, Windows Hello, fingerprint, or its screen-lock PIN. The website never receives biometric data.</p>
      </div>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <button className="btn-primary w-full" type="submit" disabled={busy}>
        {phase === "checking" ? "Checking password…" :
          phase === "device" ? "Waiting for device verification…" :
            phase === "verifying" ? "Verifying passkey…" : "Continue"}
      </button>
      {showHint && (
        <div className="space-y-2 rounded-xl bg-amber-50 p-4 text-xs text-amber-900 ring-1 ring-amber-200">
          <p className="font-semibold">🔒 Security reminder:</p>
          <ul className="list-disc space-y-1 pl-4">
            <li>Never share your admin password with others</li>
            <li>Use a unique, strong password stored in Vercel as <code>ADMIN_PASSWORD</code></li>
            <li>Organiser sessions expire after 8 hours</li>
            <li>Passkeys use your device’s screen lock, Face ID, or fingerprint; biometric data stays on your device</li>
          </ul>
        </div>
      )}
    </form>
  );
}
