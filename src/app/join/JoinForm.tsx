"use client";

import Link from "next/link";
import { useActionState } from "react";
import { joinAction, type FormState } from "@/app/actions";
import { FormNotice, SubmitButton } from "@/components/FormBits";
import { CATEGORIES, LEVELS } from "@/lib/format";

export default function JoinForm() {
  const [state, action] = useActionState<FormState, FormData>(joinAction, null);

  if (state?.ok) {
    return (
      <div className="py-10 text-center">
        <p className="text-5xl">🎉</p>
        <h2 className="mt-4 font-display text-3xl font-bold">You&apos;re in!</h2>
        <p className="mx-auto mt-3 max-w-sm text-muted">{state.message}</p>
        <Link href="/events" className="btn-primary mt-8">
          Pick your first event →
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <h2 className="font-display text-2xl font-bold">Membership application</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="fullName">Full name *</label>
          <input className="input" id="fullName" name="fullName" required maxLength={120} />
        </div>
        <div>
          <label className="label" htmlFor="email">Email *</label>
          <input className="input" id="email" name="email" type="email" required />
        </div>
        <div>
          <label className="label" htmlFor="level">English level *</label>
          <select className="input" id="level" name="level" required defaultValue="">
            <option value="" disabled>Choose your level</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="nativeLanguage">Native language</label>
          <input className="input" id="nativeLanguage" name="nativeLanguage" placeholder="e.g. Spanish" maxLength={80} />
        </div>
      </div>

      <fieldset>
        <legend className="label">I&apos;m interested in…</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <label key={c} className="cursor-pointer">
              <input type="checkbox" name="interests" value={c} className="peer sr-only" />
              <span className="inline-block rounded-full border border-black/10 bg-cream px-4 py-2 text-sm font-medium transition peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white">
                {c}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="label" htmlFor="goals">What would you like to achieve?</label>
        <textarea
          className="input"
          id="goals"
          name="goals"
          rows={4}
          maxLength={1000}
          placeholder="e.g. Feel more confident speaking in meetings, prepare for IELTS, make new friends…"
        />
      </div>

      <FormNotice state={state} />
      <SubmitButton className="w-full">Submit application</SubmitButton>
      <p className="text-center text-xs text-muted">We&apos;ll only use your email to send club updates. No spam, ever.</p>
    </form>
  );
}
