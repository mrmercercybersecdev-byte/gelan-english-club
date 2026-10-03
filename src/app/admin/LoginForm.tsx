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

export default function LoginForm({ showHint = true }: { showHint?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    try {
      const optionsResponse = await fetch("/api/admin/passkey/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const optionsData = await optionsResponse.json() as OptionsResponse & { error?: string };
      if (!optionsResponse.ok) throw new Error(optionsData.error || "Could not start organiser sign-in.");

      let response: unknown;
      let mode: "register" | "authenticate";
      if (optionsData.mode === "register") {
        mode = "register";
        response = await startRegistration({ optionsJSON: optionsData.options });
      } else {
        mode = "authenticate";
        response = await startAuthentication({ optionsJSON: optionsData.options });
      }

      const verifyResponse = await fetch("/api/admin/passkey/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, password, response }),
      });
      const verifyData = await verifyResponse.json() as { error?: string };
      if (!verifyResponse.ok) throw new Error(verifyData.error || "Passkey verification failed.");
      window.location.assign("/admin");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Organiser sign-in failed.");
      setBusy(false);
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
      <p className="text-sm text-muted">
        {showHint
          ? "The first sign-in will register this device as your passkey. Later sign-ins require both your password and passkey."
          : "Sign in with your organiser password and registered passkey."}
      </p>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <button className="btn-primary w-full" type="submit" disabled={busy}>
        {busy ? "Verifying…" : "Continue with password and passkey"}
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
