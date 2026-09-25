"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createRoomAction } from "@/app/user-actions";
import type { FormState } from "@/app/actions";
import { FormNotice, SubmitButton } from "@/components/FormBits";

export default function MeetLobbyForms({ defaultName }: { defaultName: string }) {
  const [state, action] = useActionState<FormState, FormData>(createRoomAction, null);
  const [code, setCode] = useState("");
  const router = useRouter();

  return (
    <div className="rounded-3xl bg-white p-7 text-ink shadow-2xl">
      <form action={action} className="space-y-3">
        <h2 className="font-display text-2xl font-bold">Start a new room</h2>
        <input name="title" className="input" placeholder="Room title (e.g. IELTS Speaking Practice)" maxLength={120} />
        <input name="hostName" className="input" placeholder="Your name" defaultValue={defaultName} maxLength={60} />
        <FormNotice state={state} />
        <SubmitButton className="w-full">📹 Create room & join</SubmitButton>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-black/10" />or join with a code<span className="h-px flex-1 bg-black/10" /></div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const c = code.trim().toLowerCase().replace(/.*\/meet\//, "");
          if (c) router.push(`/meet/${encodeURIComponent(c)}`);
        }}
        className="flex gap-2"
      >
        <input value={code} onChange={(e) => setCode(e.target.value)} className="input font-mono" placeholder="abc-defg-hij" />
        <button className="btn-ghost shrink-0">Join</button>
      </form>
    </div>
  );
}
