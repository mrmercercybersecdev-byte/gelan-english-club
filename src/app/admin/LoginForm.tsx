"use client";

import { useActionState } from "react";
import { loginAction, type FormState } from "@/app/actions";
import { FormNotice, SubmitButton } from "@/components/FormBits";

export default function LoginForm({ showHint = true }: { showHint?: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(loginAction, null);
  return (
    <form action={action} className="mt-6 space-y-4">
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
          placeholder="Enter your organiser password"
        />
        {showHint && <p className="text-[11px] text-muted mt-1">Minimum 12 characters with uppercase, lowercase, number and symbol.</p>}
      </div>
      <FormNotice state={state} />
      <SubmitButton className="w-full">Log in</SubmitButton>
      {showHint && (
        <div className="space-y-2 rounded-xl bg-amber-50 p-4 text-xs text-amber-900 ring-1 ring-amber-200">
          <p className="font-semibold">🔒 Security reminder:</p>
          <ul className="list-disc space-y-1 pl-4">
            <li>Never share your admin password with others</li>
            <li>Use a unique, strong password (set via <code>ADMIN_PASSWORD</code> in Vercel)</li>
            <li>Organiser sessions expire after 8 hours</li>
            <li>Failed attempts are rate-limited to prevent brute force attacks</li>
          </ul>
        </div>
      )}
    </form>
  );
}

