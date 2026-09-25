"use client";

import { useActionState, useEffect, useRef } from "react";
import { postToGroupAction } from "../actions";
import type { FormState } from "@/app/actions";
import { FormNotice, SubmitButton } from "@/components/FormBits";

export default function GroupPostForm({ slug }: { slug: string }) {
  const [state, action] = useActionState<FormState, FormData>(postToGroupAction, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="mt-4 space-y-3">
      <input type="hidden" name="slug" value={slug} />
      <textarea name="body" required rows={3} maxLength={1500} placeholder="Share a tip, answer the challenge, ask a question…" className="input" />
      {state && !state.ok && <FormNotice state={state} />}
      <div className="flex justify-end"><SubmitButton className="!py-2 text-sm">Post +3 XP</SubmitButton></div>
    </form>
  );
}
