"use client";

import { useActionState, useState } from "react";
import { loginUserAction, signupAction } from "@/app/user-actions";
import type { FormState } from "@/app/actions";
import { FormNotice, SubmitButton } from "@/components/FormBits";
import { LEVELS } from "@/lib/format";

type G = { id: number; name: string; emoji: string; joinPolicy: string };

export default function AuthForms({ next, groups = [], error }: { next: string; groups?: G[]; error?: string }) {
  const [tab, setTab] = useState<"login" | "signup">("signup");
  const [loginState, loginAction] = useActionState<FormState, FormData>(loginUserAction, null);
  const [signupState, signup] = useActionState<FormState, FormData>(signupAction, null);

  return (
    <div className="rounded-3xl bg-white p-7 shadow-xl ring-1 ring-black/5 md:p-9">
      {error && <p className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <a href={`/api/auth/google/start?next=${encodeURIComponent(next)}`} className="flex w-full items-center justify-center gap-3 rounded-full border border-black/10 bg-white px-4 py-3 font-semibold shadow-sm transition hover:bg-paper">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-sm font-bold text-blue-600 ring-1 ring-black/10">G</span>
        Continue with Google
      </a>
      <div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-black/10" />or use a username<span className="h-px flex-1 bg-black/10" /></div>
      <div className="mb-6 grid grid-cols-2 rounded-full bg-paper p-1 text-sm font-semibold">
        {(["signup", "login"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full py-2 transition ${tab === t ? "bg-white shadow" : "text-muted"}`}>
            {t === "signup" ? "Create account" : "Log in"}
          </button>
        ))}
      </div>

      {tab === "signup" ? (
        <form action={signup} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <h1 className="font-display text-3xl font-bold">Join the club ✨</h1>
          <p className="text-sm text-muted">Free forever. Get +15 XP just for signing up.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="su-username">Username</label>
              <input className="input" id="su-username" name="username" required pattern="[A-Za-z0-9_]{3,24}" placeholder="alex_22" />
            </div>
            <div>
              <label className="label" htmlFor="su-display">Display name</label>
              <input className="input" id="su-display" name="displayName" maxLength={60} placeholder="Alex" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="su-password">Password</label>
            <input className="input" id="su-password" name="password" type="password" required minLength={8} maxLength={200} autoComplete="new-password" />
            <p className="mt-1 text-[11px] text-muted">At least 8 characters.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="su-country">Country</label>
              <input className="input" id="su-country" name="country" maxLength={60} placeholder="e.g. Spain" />
            </div>
            <div>
              <label className="label" htmlFor="su-level">Level</label>
              <select className="input" id="su-level" name="level" defaultValue="">
                <option value="">—</option>
                {LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
          {groups.length > 0 && (
            <fieldset>
              <legend className="label">Join study groups <span className="font-normal text-muted">(optional)</span></legend>
              <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto">
                {groups.map((g) => (
                  <label key={g.id} className="cursor-pointer">
                    <input type="checkbox" name="groups" value={g.id} className="peer sr-only" />
                    <span className="inline-block rounded-full border border-black/10 bg-cream px-3 py-1.5 text-xs font-semibold transition peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white">
                      {g.emoji} {g.name}{g.joinPolicy === "approval" ? " 🔒" : ""}
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-1 text-[11px] text-muted">🔒 groups send a join request to the organisers.</p>
            </fieldset>
          )}
          <FormNotice state={signupState} />
          <SubmitButton className="w-full">Create my account</SubmitButton>
        </form>
      ) : (
        <form action={loginAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <h1 className="font-display text-3xl font-bold">Welcome back 👋</h1>
          <div>
            <label className="label" htmlFor="li-username">Username</label>
            <input className="input" id="li-username" name="username" required />
          </div>
          <div>
            <label className="label" htmlFor="li-password">Password</label>
            <input className="input" id="li-password" name="password" type="password" required autoComplete="current-password" />
          </div>
          <FormNotice state={loginState} />
          <SubmitButton className="w-full">Log in</SubmitButton>
          <p className="rounded-xl bg-paper p-3 text-center text-xs text-muted">
            Just exploring? Use the demo account <code className="font-semibold text-ink">demo</code> / <code className="font-semibold text-ink">demo1234</code>
          </p>
        </form>
      )}
    </div>
  );
}
