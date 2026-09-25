"use client";

import { useActionState, useState } from "react";
import { updateProfileAction } from "@/app/user-actions";
import type { FormState } from "@/app/actions";
import { FormNotice, SubmitButton } from "@/components/FormBits";
import { AVATAR_COLORS } from "@/lib/xp";

export default function ProfileForm(props: { displayName: string; bio: string; country: string; avatarColor: string }) {
  const [state, action] = useActionState<FormState, FormData>(updateProfileAction, null);
  const [color, setColor] = useState(props.avatarColor);
  return (
    <form action={action} className="mt-4 space-y-3">
      <div>
        <label className="label" htmlFor="pf-name">Display name</label>
        <input id="pf-name" name="displayName" defaultValue={props.displayName} className="input" maxLength={60} />
      </div>
      <div>
        <label className="label" htmlFor="pf-country">Country</label>
        <input id="pf-country" name="country" defaultValue={props.country} className="input" maxLength={60} />
      </div>
      <div>
        <label className="label" htmlFor="pf-bio">Bio</label>
        <textarea id="pf-bio" name="bio" defaultValue={props.bio} className="input" rows={3} maxLength={280} placeholder="What are you working on?" />
      </div>
      <div>
        <p className="label">Avatar colour</p>
        <input type="hidden" name="avatarColor" value={color} />
        <div className="flex flex-wrap gap-2">
          {AVATAR_COLORS.map((c) => (
            <button type="button" key={c} onClick={() => setColor(c)} className={`h-8 w-8 rounded-full transition ${color === c ? "scale-110 ring-2 ring-ink ring-offset-2" : ""}`} style={{ background: c }} aria-label={c} />
          ))}
        </div>
      </div>
      <FormNotice state={state} />
      <SubmitButton className="w-full">Save profile</SubmitButton>
    </form>
  );
}
