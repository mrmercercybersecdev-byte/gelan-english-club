"use client";

import { useActionState } from "react";
import { loginAction, type FormState } from "@/app/actions";
import { FormNotice, SubmitButton } from "@/components/FormBits";

export default function LoginForm({ showHint = true }: { showHint?: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(loginAction, null);
  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" required autoFocus />
      </div>
      <FormNotice state={state} />
      <SubmitButton className="w-full">Log in</SubmitButton>
      {showHint && <p className="text-center text-xs text-muted">
        Set <code>ADMIN_PASSWORD</code> in your environment before enabling organiser password login.
      </p>}
    </form>
  );
}
