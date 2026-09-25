"use client";

import { useActionState, useEffect, useRef } from "react";
import { createEventAction, type FormState } from "@/app/actions";
import { FormNotice, SubmitButton } from "@/components/FormBits";
import { CATEGORIES } from "@/lib/format";

export default function EventForm() {
  const [state, action] = useActionState<FormState, FormData>(async (prev: FormState, fd: FormData) => {
    // Convert the local datetime to an ISO string so the server stores the right instant.
    const local = String(fd.get("startsAtLocal") ?? "");
    if (local) fd.set("startsAt", new Date(local).toISOString());
    return createEventAction(prev, fd);
  }, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="mt-4 space-y-3">
      <div>
        <label className="label" htmlFor="title">Title</label>
        <input className="input" id="title" name="title" required maxLength={200} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="category">Category</label>
          <select className="input" id="category" name="category" required>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="level">Level</label>
          <input className="input" id="level" name="level" defaultValue="All levels" maxLength={50} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="startsAtLocal">Date & time</label>
        <input className="input" id="startsAtLocal" name="startsAtLocal" type="datetime-local" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="durationMinutes">Duration (min)</label>
          <input className="input" id="durationMinutes" name="durationMinutes" type="number" min={15} max={600} defaultValue={90} />
        </div>
        <div>
          <label className="label" htmlFor="capacity">Capacity</label>
          <input className="input" id="capacity" name="capacity" type="number" min={1} max={1000} defaultValue={20} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="location">Location</label>
        <input className="input" id="location" name="location" required maxLength={200} />
      </div>
      <div>
        <label className="label" htmlFor="host">Host</label>
        <input className="input" id="host" name="host" required maxLength={120} />
      </div>
      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea className="input" id="description" name="description" rows={4} required />
      </div>
      <FormNotice state={state} />
      <SubmitButton className="w-full">Create event</SubmitButton>
    </form>
  );
}
