"use client";

import { useActionState } from "react";
import { createChannelAction } from "./admin-actions";
import type { FormState } from "../actions";
import { FormNotice, SubmitButton } from "@/components/FormBits";

export default function ChannelForm() {
  const [state, action] = useActionState<FormState, FormData>(createChannelAction, null);
  return (
    <form action={action} className="space-y-3 rounded-2xl bg-white p-5 ring-1 ring-black/5">
      <h3 className="font-display text-lg font-bold">New channel</h3>
      <div className="grid grid-cols-[70px_1fr] gap-2">
        <input name="emoji" defaultValue="💬" className="input text-center" maxLength={8} />
        <input name="name" required placeholder="e.g. Pronunciation" className="input" maxLength={60} />
      </div>
      <input name="description" placeholder="What is this channel for?" className="input" maxLength={200} />
      <FormNotice state={state} />
      <SubmitButton className="w-full">Create channel</SubmitButton>
    </form>
  );
}
