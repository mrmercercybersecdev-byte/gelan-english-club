"use client";

import { useActionState, useRef, useState } from "react";
import { updateProfileAction } from "@/app/user-actions";
import type { FormState } from "@/app/actions";
import { FormNotice, SubmitButton } from "@/components/FormBits";
import { AVATAR_COLORS } from "@/lib/xp";

export default function ProfileForm(props: { displayName: string; bio: string; country: string; avatarColor: string; avatarUrl: string | null }) {
  const [state, action] = useActionState<FormState, FormData>(updateProfileAction, null);
  const [color, setColor] = useState(props.avatarColor);
  const [avatarUrl, setAvatarUrl] = useState(props.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  async function uploadPhoto(file?: File) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 1_500_000) { setUploadMessage("Choose a JPG, PNG, or WebP photo under 1.5 MB."); return; }
    setUploading(true); setUploadMessage("");
    try {
      const formData = new FormData(); formData.set("photo", file);
      const response = await fetch("/api/profile/avatar", { method: "POST", body: formData });
      const result = await response.json() as { avatarUrl?: string; error?: string };
      if (!response.ok || !result.avatarUrl) throw new Error(result.error || "Could not upload your photo.");
      setAvatarUrl(result.avatarUrl); setUploadMessage("Profile photo updated.");
    } catch (error) { setUploadMessage(error instanceof Error ? error.message : "Could not upload your photo."); }
    finally { setUploading(false); if (fileInput.current) fileInput.current.value = ""; }
  }
  return (
    <form action={action} className="mt-4 space-y-3">
      <div className="rounded-2xl bg-paper p-4">
        <p className="text-sm font-semibold">Profile photo</p>
        <p className="mt-1 text-xs text-muted">JPG, PNG, or WebP · up to 1.5 MB. Images are resized before saving.</p>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose profile photo" onChange={(event) => void uploadPhoto(event.target.files?.[0])} disabled={uploading} className="mt-3 block w-full text-sm file:mr-3 file:min-h-10 file:rounded-full file:border-0 file:bg-white file:px-4 file:font-semibold" />
        {avatarUrl && <p className="mt-2 text-xs text-muted">Your current photo appears in your profile and account menu.</p>}
        {uploadMessage && <p role="status" className="mt-2 text-sm text-muted">{uploadMessage}</p>}
      </div>
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
