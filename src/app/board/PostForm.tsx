"use client";

import { useActionState, useEffect, useRef } from "react";
import { createPostAction, type FormState } from "@/app/actions";
import { FormNotice, SubmitButton } from "@/components/FormBits";

export default function PostForm() {
  const [state, action] = useActionState<FormState, FormData>(createPostAction, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      const author = (ref.current?.elements.namedItem("author") as HTMLInputElement | null)?.value;
      ref.current?.reset();
      const input = ref.current?.elements.namedItem("author") as HTMLInputElement | null;
      if (input && author) input.value = author;
    }
  }, [state]);

  return (
    <form ref={ref} action={action} className="mt-4 space-y-4">
      <div>
        <label className="label" htmlFor="author">Your first name</label>
        <input className="input" id="author" name="author" required maxLength={80} />
      </div>
      <div>
        <label className="label" htmlFor="kind">Type</label>
        <select className="input" id="kind" name="kind" defaultValue="idiom">
          <option value="idiom">💡 Idiom or phrase</option>
          <option value="question">❓ Question</option>
          <option value="tip">✨ Learning tip</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="content">Your post</label>
        <textarea className="input" id="content" name="content" rows={3} required maxLength={280} placeholder="e.g. Once in a blue moon" />
      </div>
      <div>
        <label className="label" htmlFor="meaning">
          Meaning / answer / details <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea className="input" id="meaning" name="meaning" rows={2} maxLength={400} placeholder="e.g. Very rarely" />
      </div>
      <FormNotice state={state} />
      <SubmitButton className="w-full">Post to the wall</SubmitButton>
    </form>
  );
}
