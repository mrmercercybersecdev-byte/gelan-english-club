"use client";

import { useState, type FormEvent } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/browser";

type AdminCredential = {
  credentialId: string;
  createdAt: string;
  deviceType: string;
  backedUp: boolean;
};

export default function PasskeyManager({ initialCredentials }: { initialCredentials: AdminCredential[] }) {
  const [credentials, setCredentials] = useState(initialCredentials);
  const [password, setPassword] = useState("");
  const [removePassword, setRemovePassword] = useState("");
  const [removeId, setRemoveId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadCredentials() {
    const response = await fetch("/api/admin/passkey/credentials", { credentials: "same-origin" });
    const data = await response.json() as { credentials?: AdminCredential[]; error?: string };
    if (!response.ok) throw new Error(data.error || "Unable to load passkeys.");
    setCredentials(data.credentials ?? []);
  }

  async function addPasskey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const optionsResponse = await fetch("/api/admin/passkey/options", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const optionsData = await optionsResponse.json() as {
        mode?: string;
        options?: PublicKeyCredentialCreationOptionsJSON;
        error?: string;
      };
      if (!optionsResponse.ok || optionsData.mode !== "register" || !optionsData.options) {
        throw new Error(optionsData.error || "Could not start passkey registration.");
      }
      const response = await startRegistration({ optionsJSON: optionsData.options });
      const verifyResponse = await fetch("/api/admin/passkey/verify", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "register", response }),
      });
      const verifyData = await verifyResponse.json() as { error?: string };
      if (!verifyResponse.ok) throw new Error(verifyData.error || "Passkey registration failed.");
      setPassword("");
      setMessage("Passkey registered. Keep another trusted device available if you can.");
      await loadCredentials();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Passkey registration failed.");
    } finally {
      setBusy(false);
    }
  }

  async function removePasskey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !removeId) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/passkey/credentials", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId: removeId, password: removePassword }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not remove passkey.");
      setCredentials((current) => current.filter((credential) => credential.credentialId !== removeId));
      setRemoveId("");
      setRemovePassword("");
      setMessage("Passkey removed.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove passkey.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-black/5 sm:p-6" aria-labelledby="passkey-heading">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">Account security</p>
        <h2 id="passkey-heading" className="mt-1 font-display text-2xl font-bold">Organiser passkeys</h2>
        <p className="mt-2 text-sm text-muted">
          A passkey adds device verification after your password. Your device can use a fingerprint, Face ID, Windows Hello, or its screen-lock PIN. The site never receives biometric data.
        </p>
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {message && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}

      <ul className="mt-5 space-y-2">
        {credentials.map((credential) => (
          <li key={credential.credentialId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-paper p-3 text-sm">
            <span>
              Passkey · added {new Date(credential.createdAt).toLocaleDateString()}
              {credential.backedUp ? " · synced" : ""}
            </span>
            <button
              type="button"
              className="btn-ghost text-xs text-rose-700"
              onClick={() => { setRemoveId(credential.credentialId); setError(""); }}
              disabled={credentials.length < 2 || busy}
              title={credentials.length < 2 ? "Register another passkey before removing this one." : "Remove this passkey"}
            >
              Remove
            </button>
          </li>
        ))}
        {!credentials.length && <li className="text-sm text-muted">No passkeys are registered.</li>}
      </ul>

      {removeId && (
        <form onSubmit={removePasskey} className="mt-4 flex flex-col gap-3 rounded-xl border border-rose-200 p-4 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label className="label" htmlFor="remove-passkey-password">Confirm organiser password to remove this passkey</label>
            <input
              id="remove-passkey-password"
              className="input"
              type="password"
              autoComplete="current-password"
              required
              value={removePassword}
              onChange={(event) => setRemovePassword(event.target.value)}
            />
          </div>
          <button className="btn-ghost text-rose-700" type="submit" disabled={busy}>
            {busy ? "Removing…" : "Confirm removal"}
          </button>
          <button className="btn-ghost" type="button" onClick={() => setRemoveId("")} disabled={busy}>Cancel</button>
        </form>
      )}

      <form onSubmit={addPasskey} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label className="label" htmlFor="add-passkey-password">Confirm organiser password to add a passkey</label>
          <input
            id="add-passkey-password"
            className="input"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? "Waiting for device…" : "Add this device"}
        </button>
      </form>
    </section>
  );
}
