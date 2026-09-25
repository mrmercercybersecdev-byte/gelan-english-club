"use client";

import { useActionState } from "react";
import { rsvpAction, type FormState } from "@/app/actions";
import { FormNotice, SubmitButton } from "@/components/FormBits";

export default function RsvpForm({ eventId }: { eventId: number }) {
  const [state, action] = useActionState<FormState, FormData>(rsvpAction, null);

  if (state?.ok) {
    return (
      <div className="rounded-2xl bg-emerald-50 p-5 text-center ring-1 ring-emerald-200">
        <p className="text-3xl">🎉</p>
        <p className="mt-2 font-semibold text-emerald-900">{state.message}</p>
        <p className="mt-1 text-sm text-emerald-800">Add it to your calendar — we can&apos;t wait to meet you.</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="eventId" value={eventId} />
      <div>
        <label className="label" htmlFor="name">Your name</label>
        <input className="input" id="name" name="name" required maxLength={120} placeholder="Alex Smith" />
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" required placeholder="alex@example.com" />
      </div>
      <div>
        <label className="label" htmlFor="note">Anything we should know? <span className="font-normal text-muted">(optional)</span></label>
        <textarea className="input" id="note" name="note" rows={2} maxLength={500} placeholder="e.g. It's my first time!" />
      </div>
      <FormNotice state={state} />
      <SubmitButton className="w-full">Count me in</SubmitButton>
    </form>
  );
}
