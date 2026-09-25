"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { FormState } from "../actions";
import { FormNotice, SubmitButton } from "@/components/FormBits";
import Markdown from "@/components/Markdown";
import { broadcastNotificationAction, reviewSubmissionAction, saveAnnouncementAction, saveGroupAction } from "./community-actions";
import type { Announcement, StudyGroup } from "@/db/schema";
import { ANNOUNCE_STYLES } from "@/lib/announce";
import { GROUP_CATEGORIES } from "@/lib/group-categories";

const QUICK = [
  "Excellent work — clear, accurate and well structured. 🌟",
  "Great effort! Pronunciation was clear; watch the 'th' sounds.",
  "Good content, but please check verb tenses and resubmit.",
  "The file is unclear or incomplete — please upload a better version.",
];

export function ReviewForm({ id }: { id: number }) {
  const [state, action] = useActionState<FormState, FormData>(reviewSubmissionAction, null);
  const [feedback, setFeedback] = useState("");
  if (state?.ok) return <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">✓ {state.message}</p>;
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap gap-1.5">
        {QUICK.map((q) => <button type="button" key={q} onClick={() => setFeedback(q)} className="rounded-full bg-paper px-2.5 py-1 text-[11px] hover:bg-gold/20">{q.slice(0, 34)}…</button>)}
      </div>
      <textarea name="feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} maxLength={4000} placeholder="Feedback for the student (required when declining)" className="input text-sm" />
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs font-semibold">Score <input name="score" type="number" min={0} max={100} placeholder="—" className="input !w-20 !py-1.5" /> /100</label>
        <div className="ml-auto flex gap-2">
          <button name="decision" value="declined" className="rounded-full bg-rose-100 px-4 py-2 text-sm font-bold text-rose-800 hover:bg-rose-200">✋ Decline</button>
          <button name="decision" value="approved" className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">✅ Approve & verify</button>
        </div>
      </div>
      <FormNotice state={state} />
    </form>
  );
}

function toLocal(d?: Date | null) {
  if (!d) return "";
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export function AnnouncementForm({ a }: { a?: Announcement }) {
  const [state, action] = useActionState<FormState, FormData>(async (p: FormState, fd: FormData) => {
    const local = String(fd.get("expiresLocal") ?? "");
    fd.set("expiresAt", local ? new Date(local).toISOString() : "");
    return saveAnnouncementAction(p, fd);
  }, null);
  const [body, setBody] = useState(a?.body ?? "");
  const [preview, setPreview] = useState(false);
  return (
    <form action={action} className="space-y-3 rounded-3xl bg-white p-6 ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">{a ? "Edit announcement" : "New announcement"}</h2>
        {a && <Link href="/admin?tab=announcements" className="text-xs text-muted hover:text-ink">+ New instead</Link>}
      </div>
      {a && <input type="hidden" name="id" value={a.id} />}
      <input name="title" defaultValue={a?.title} required maxLength={160} placeholder="Headline" className="input font-semibold" />
      <div className="grid grid-cols-2 gap-3">
        <select name="category" defaultValue={a?.category ?? "news"} className="input">
          {Object.entries(ANNOUNCE_STYLES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        <input name="author" defaultValue={a?.author ?? "Gelan English Club"} placeholder="Author" className="input" />
      </div>
      <div>
        <div className="mb-1 flex justify-end gap-1 text-xs font-semibold">
          <button type="button" onClick={() => setPreview(false)} className={`rounded-full px-3 py-1 ${!preview ? "bg-ink text-white" : "bg-paper"}`}>Write</button>
          <button type="button" onClick={() => setPreview(true)} className={`rounded-full px-3 py-1 ${preview ? "bg-ink text-white" : "bg-paper"}`}>Preview</button>
        </div>
        <textarea name="body" value={body} onChange={(e) => setBody(e.target.value)} rows={6} required className={`input text-sm ${preview ? "hidden" : ""}`} placeholder="Markdown supported: **bold**, lists, [links](/events)" />
        {preview && <div className="min-h-[150px] rounded-xl border border-black/10 p-4 text-sm"><Markdown text={body || "_Nothing yet_"} /></div>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input name="linkUrl" defaultValue={a?.linkUrl ?? ""} placeholder="Button link (/events or https://…)" className="input text-sm" />
        <input name="linkLabel" defaultValue={a?.linkLabel ?? ""} placeholder="Button label" className="input text-sm" />
      </div>
      <label className="block text-xs font-semibold">Expires (optional)
        <input name="expiresLocal" type="datetime-local" defaultValue={toLocal(a?.expiresAt)} className="input mt-1" />
      </label>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="published" defaultChecked={a?.published ?? true} className="h-4 w-4 accent-brand" /> Published</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="pinned" defaultChecked={a?.pinned ?? false} className="h-4 w-4 accent-brand" /> 📌 Pinned</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="showBanner" defaultChecked={a?.showBanner ?? false} className="h-4 w-4 accent-brand" /> 📣 Site-wide banner</label>
      </div>
      <FormNotice state={state} />
      <SubmitButton className="w-full">{a ? "Save changes" : "Publish announcement"}</SubmitButton>
    </form>
  );
}

export function BroadcastForm() {
  const [state, action] = useActionState<FormState, FormData>(broadcastNotificationAction, null);
  return (
    <form action={action} className="space-y-3 rounded-3xl bg-ink p-6 text-white">
      <h3 className="font-display text-lg font-bold">🔔 Push notification to all members</h3>
      <input name="title" required maxLength={160} placeholder="Notification title" className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm outline-none placeholder:text-white/40" />
      <input name="body" maxLength={500} placeholder="Short message (optional)" className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm outline-none placeholder:text-white/40" />
      <input name="href" maxLength={300} placeholder="Link (optional, e.g. /announcements)" className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm outline-none placeholder:text-white/40" />
      {state && <p className={`text-sm ${state.ok ? "text-emerald-300" : "text-rose-300"}`}>{state.message}</p>}
      <SubmitButton className="w-full">Send to everyone</SubmitButton>
    </form>
  );
}

export function GroupForm({ g }: { g?: StudyGroup }) {
  const [state, action] = useActionState<FormState, FormData>(saveGroupAction, null);
  return (
    <form action={action} className="space-y-3 rounded-3xl bg-white p-6 ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">{g ? "Edit group" : "New group"}</h2>
        {g && <Link href="/admin?tab=groups" className="text-xs text-muted hover:text-ink">+ New instead</Link>}
      </div>
      {g && <input type="hidden" name="id" value={g.id} />}
      <div className="grid grid-cols-[70px_1fr] gap-3">
        <input name="emoji" defaultValue={g?.emoji ?? "👥"} maxLength={8} className="input text-center text-xl" />
        <input name="name" defaultValue={g?.name} required maxLength={80} placeholder="Group name" className="input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <select name="category" defaultValue={g?.category ?? "vocabulary"} className="input">
          {Object.entries(GROUP_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        <input name="level" defaultValue={g?.level ?? "All levels"} placeholder="Level" className="input" />
      </div>
      <input name="schedule" defaultValue={g?.schedule ?? ""} placeholder="Schedule (e.g. Wed 19:00)" className="input" />
      <textarea name="description" defaultValue={g?.description} rows={3} placeholder="What is this group about?" className="input text-sm" />
      <textarea name="challenge" defaultValue={g?.challenge ?? ""} rows={2} placeholder="🎯 Weekly challenge (optional)" className="input text-sm" />
      <div className="grid grid-cols-3 gap-3">
        <select name="joinPolicy" defaultValue={g?.joinPolicy ?? "open"} className="input">
          <option value="open">🔓 Open</option>
          <option value="approval">🔒 Approval</option>
        </select>
        <input name="maxMembers" type="number" min={2} max={5000} defaultValue={g?.maxMembers ?? 200} className="input" title="Max members" />
        <input name="color" type="color" defaultValue={g?.color ?? "#b8322a"} className="input !h-[46px] !p-1" />
      </div>
      <FormNotice state={state} />
      <SubmitButton className="w-full">{g ? "Save changes" : "Create group"}</SubmitButton>
    </form>
  );
}
