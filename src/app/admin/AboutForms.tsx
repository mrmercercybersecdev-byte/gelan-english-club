"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { FormState } from "../actions";
import { FormNotice, SubmitButton } from "@/components/FormBits";
import { saveChampionAction, saveMilestoneAction, saveStreamAction, saveTeamMemberAction } from "./about-actions";
import { CHAMPION_ICONS } from "@/lib/embed";
import type { Champion, Livestream, Milestone, TeamMember } from "@/db/schema";

const PRESETS = ["/images/team/emma.jpg", "/images/team/daniel.jpg", "/images/team/sofia.jpg", "/images/team/priya.jpg", "/images/history.jpg", "/images/debate.jpg", "/images/bookclub.jpg", "/images/hero.jpg", "/images/trophy.jpg"];

/** Photo picker: preset, URL, or upload (resized in-browser to a small JPEG data URL). */
function PhotoField({ initial, label = "Photo" }: { initial?: string | null; label?: string }) {
  const [val, setVal] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFile(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) {
      setError("Choose a JPEG, PNG or WebP image smaller than 8 MB.");
      return;
    }

    setBusy(true);
    setError("");
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = objectUrl;
      await img.decode();
      const max = 480;
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      const context = c.getContext("2d");
      if (!context) throw new Error("Your browser could not prepare this image.");
      context.drawImage(img, 0, 0, c.width, c.height);
      setVal(c.toDataURL("image/jpeg", 0.82));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not process this image.");
    } finally {
      URL.revokeObjectURL(objectUrl);
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="label">{label}</p>
      <input type="hidden" name="photoUrl" value={val} />
      <div className="flex items-start gap-3">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-paper text-2xl ring-1 ring-black/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {val ? <img src={val} alt="" className="h-full w-full object-cover" /> : "🖼️"}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <button type="button" key={p} onClick={() => setVal(p)} className={`overflow-hidden rounded-lg ring-2 ${val === p ? "ring-brand" : "ring-transparent"}`}><img src={p} alt="" className="h-9 w-9 object-cover" /></button>
            ))}
          </div>
          <div className="flex gap-2">
            <label className="cursor-pointer rounded-full bg-paper px-3 py-1.5 text-xs font-semibold hover:bg-gold/20">
              {busy ? "Processing…" : "⬆ Upload"}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            </label>
            <input value={val.startsWith("data:") ? "(uploaded image)" : val} onChange={(e) => setVal(e.target.value)} placeholder="or secure HTTPS URL / /images/ path" className="input !py-1.5 text-xs" />
            {val && <button type="button" onClick={() => setVal("")} className="text-xs text-muted hover:text-rose-700">✕</button>}
          </div>
          {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function Header({ title, editing, tab }: { title: string; editing: boolean; tab: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-display text-xl font-bold">{editing ? `Edit ${title}` : `Add ${title}`}</h2>
      {editing && <Link href={`/admin?tab=${tab}`} className="text-xs text-muted hover:text-ink">+ Add new instead</Link>}
    </div>
  );
}

export function TeamForm({ m }: { m?: TeamMember }) {
  const [state, action] = useActionState<FormState, FormData>(saveTeamMemberAction, null);
  return (
    <form action={action} className="space-y-3 rounded-3xl bg-white p-6 ring-1 ring-black/5">
      <Header title="team member" editing={!!m} tab="team" />
      {m && <input type="hidden" name="id" value={m.id} />}
      <div className="grid grid-cols-2 gap-3">
        <input name="name" defaultValue={m?.name} required placeholder="Full name" className="input" />
        <select name="group" defaultValue={m?.group ?? "facilitator"} className="input">
          <option value="leader">👑 Leader</option>
          <option value="facilitator">🧑‍🏫 Facilitator</option>
        </select>
      </div>
      <input name="title" defaultValue={m?.title} required placeholder="Role / title (e.g. Head of Debate)" className="input" />
      <div className="grid grid-cols-3 gap-3">
        <input name="country" defaultValue={m?.country ?? ""} placeholder="Country" className="input" />
        <input name="joinedYear" type="number" defaultValue={m?.joinedYear ?? ""} placeholder="Since (year)" className="input" />
        <input name="color" type="color" defaultValue={m?.color ?? "#b8322a"} className="input !h-[46px] !p-1" title="Accent colour" />
      </div>
      <input name="specialties" defaultValue={m?.specialties} placeholder="Specialties, comma separated" className="input" />
      <input name="quote" defaultValue={m?.quote ?? ""} placeholder="Signature quote (shown on leader cards)" className="input" maxLength={280} />
      <textarea name="bio" defaultValue={m?.bio} rows={3} placeholder="Short bio" className="input" />
      <PhotoField initial={m?.photoUrl} />
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={m?.active ?? true} className="h-4 w-4 accent-brand" /> Visible on site</label>
        <label className="flex items-center gap-2 text-sm">Order <input name="sortOrder" type="number" defaultValue={m?.sortOrder ?? 50} className="input !w-20 !py-1.5" /></label>
      </div>
      <FormNotice state={state} />
      <SubmitButton className="w-full">{m ? "Save changes" : "Add member"}</SubmitButton>
    </form>
  );
}

export function ChampionForm({ c }: { c?: Champion }) {
  const [state, action] = useActionState<FormState, FormData>(saveChampionAction, null);
  return (
    <form action={action} className="space-y-3 rounded-3xl bg-white p-6 ring-1 ring-black/5">
      <Header title="champion" editing={!!c} tab="champions" />
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="grid grid-cols-2 gap-3">
        <input name="name" defaultValue={c?.name} required placeholder="Winner's name" className="input" />
        <input name="country" defaultValue={c?.country ?? ""} placeholder="Country" className="input" />
      </div>
      <input name="award" defaultValue={c?.award} required placeholder="Award (e.g. Debate Champion, The Golden Mic)" className="input" />
      <input name="competition" defaultValue={c?.competition} required placeholder="Competition name" className="input" />
      <div className="grid grid-cols-4 gap-3">
        <select name="category" defaultValue={c?.category ?? "debate"} className="input col-span-2">
          {Object.entries(CHAMPION_ICONS).map(([k, v]) => <option key={k} value={k}>{v} {k}</option>)}
        </select>
        <select name="place" defaultValue={c?.place ?? 1} className="input">
          <option value={1}>🥇 1st</option>
          <option value={2}>🥈 2nd</option>
          <option value={3}>🥉 3rd</option>
          <option value={4}>🎖️ Finalist</option>
        </select>
        <input name="year" type="number" defaultValue={c?.year ?? new Date().getFullYear()} required className="input" />
      </div>
      <select name="season" defaultValue={c?.season ?? "Spring"} className="input">
        {["Spring", "Summer", "Autumn", "Winter", "Annual"].map((s) => <option key={s}>{s}</option>)}
      </select>
      <textarea name="description" defaultValue={c?.description} rows={3} placeholder="What made this win special?" className="input" />
      <PhotoField initial={c?.photoUrl} />
      <FormNotice state={state} />
      <SubmitButton className="w-full">{c ? "Save changes" : "Add to Hall of Champions"}</SubmitButton>
    </form>
  );
}

export function MilestoneForm({ m }: { m?: Milestone }) {
  const [state, action] = useActionState<FormState, FormData>(saveMilestoneAction, null);
  return (
    <form action={action} className="space-y-3 rounded-3xl bg-white p-6 ring-1 ring-black/5">
      <Header title="milestone" editing={!!m} tab="history" />
      {m && <input type="hidden" name="id" value={m.id} />}
      <div className="grid grid-cols-[70px_1fr_1fr] gap-3">
        <input name="icon" defaultValue={m?.icon ?? "⭐"} className="input text-center text-xl" maxLength={8} />
        <input name="year" type="number" defaultValue={m?.year ?? new Date().getFullYear()} required className="input" />
        <input name="month" defaultValue={m?.month ?? ""} placeholder="Month (optional)" className="input" />
      </div>
      <input name="title" defaultValue={m?.title} required placeholder="Milestone title" className="input" />
      <textarea name="description" defaultValue={m?.description} rows={3} placeholder="What happened?" className="input" />
      <PhotoField initial={m?.imageUrl} label="Image (optional)" />
      <label className="flex items-center gap-2 text-sm">Order within year <input name="sortOrder" type="number" defaultValue={m?.sortOrder ?? 0} className="input !w-20 !py-1.5" /></label>
      <FormNotice state={state} />
      <SubmitButton className="w-full">{m ? "Save changes" : "Add milestone"}</SubmitButton>
    </form>
  );
}

function toLocalInput(d?: Date) {
  const x = d ?? new Date(Date.now() + 86_400_000);
  const off = x.getTimezoneOffset() * 60_000;
  return new Date(x.getTime() - off).toISOString().slice(0, 16);
}

export function StreamForm({ s }: { s?: Livestream }) {
  const [state, action] = useActionState<FormState, FormData>(async (prev: FormState, fd: FormData) => {
    const local = String(fd.get("scheduledAtLocal") ?? "");
    if (local) fd.set("scheduledAt", new Date(local).toISOString());
    return saveStreamAction(prev, fd);
  }, null);
  return (
    <form action={action} className="space-y-3 rounded-3xl bg-white p-6 ring-1 ring-black/5">
      <Header title="livestream" editing={!!s} tab="streams" />
      {s && <input type="hidden" name="id" value={s.id} />}
      <input name="title" defaultValue={s?.title} required placeholder="Broadcast title" className="input" />
      <input name="streamUrl" defaultValue={s?.streamUrl ?? "/meet/gelan-live"} placeholder="YouTube / Twitch / Vimeo / .mp4 URL, or /meet/room-code" className="input font-mono text-sm" />
      <p className="-mt-1 text-xs text-muted">Tip: use <code>/meet/gelan-live</code> to broadcast from the club&apos;s own live room.</p>
      <div className="grid grid-cols-2 gap-3">
        <input name="host" defaultValue={s?.host ?? "Gelan English Club"} placeholder="Host" className="input" />
        <select name="status" defaultValue={s?.status ?? "scheduled"} className="input">
          <option value="scheduled">📅 Scheduled</option>
          <option value="live">🔴 Live now</option>
          <option value="ended">🎬 Ended (replay)</option>
        </select>
      </div>
      <input name="scheduledAtLocal" type="datetime-local" defaultValue={toLocalInput(s?.scheduledAt)} required className="input" />
      <textarea name="description" defaultValue={s?.description} rows={3} placeholder="Description" className="input" />
      <FormNotice state={state} />
      <SubmitButton className="w-full">{s ? "Save changes" : "Create broadcast"}</SubmitButton>
    </form>
  );
}
