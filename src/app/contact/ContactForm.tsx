"use client";

import { useActionState } from "react";
import { contactAction, type FormState } from "@/app/actions";
import { FormNotice, SubmitButton } from "@/components/FormBits";

export default function ContactForm() {
  const [state, action] = useActionState<FormState, FormData>(contactAction, null);

  if (state?.ok) {
    return (
      <div className="py-12 text-center">
        <p className="text-5xl">📬</p>
        <h2 className="mt-4 font-display text-3xl font-bold">Message sent</h2>
        <p className="mt-2 text-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <h2 className="font-display text-2xl font-bold">Send a message</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">Name *</label>
          <input className="input" id="name" name="name" required maxLength={120} />
        </div>
        <div>
          <label className="label" htmlFor="email">Email *</label>
          <input className="input" id="email" name="email" type="email" required />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="subject">Subject</label>
        <select className="input" id="subject" name="subject" defaultValue="General enquiry">
          <option>General enquiry</option>
          <option>Events</option>
          <option>Volunteering</option>
          <option>Partnership / venue</option>
          <option>Feedback</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="body">Message *</label>
        <textarea className="input" id="body" name="body" rows={6} required minLength={5} maxLength={4000} />
      </div>
      <FormNotice state={state} />
      <SubmitButton className="w-full">Send message</SubmitButton>
    </form>
  );
}
