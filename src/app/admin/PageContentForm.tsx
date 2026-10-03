"use client";

import { useState } from "react";
import { saveSiteContentAction } from "./admin-actions";

const ROUTES = ["/", "/about", "/help", "/events", "/announcements", "/blog", "/learn", "/speak", "/meet", "/chat", "/groups", "/games", "/leaderboard", "/join", "/contact", "/submit", "/board"];

type Content = { id: number; pagePath: string; placement: string; title: string; body: string; linkLabel: string | null; linkUrl: string | null; published: boolean };

export default function PageContentForm({ editing }: { editing?: Content }) {
  const [title, setTitle] = useState(editing?.title ?? "");
  const [body, setBody] = useState(editing?.body ?? "");
  const [topic, setTopic] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState("");

  async function writeWithAi() {
    if (topic.trim().length < 8 || drafting) return;
    setDrafting(true);
    setError("");
    try {
      const response = await fetch("/api/admin/blog-assistant", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, format: "page", audience: "Gelan English Club website visitors" }),
      });
      const result = await response.json() as { draft?: string; error?: string };
      if (!response.ok || !result.draft) throw new Error(result.error || "Could not create a draft.");
      const lines = result.draft.split("\n");
      const heading = lines.findIndex((line) => line.trim());
      const draftTitle = heading >= 0 ? lines[heading].replace(/^#+\s*/, "").trim() : "";
      setTitle(draftTitle);
      setBody(lines.filter((_, i) => i !== heading).join("\n").trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create a draft.");
    } finally {
      setDrafting(false);
    }
  }

  return <form action={saveSiteContentAction} className="mt-5 space-y-4">
    {editing && <input type="hidden" name="id" value={editing.id} />}
    <label className="block text-sm font-semibold">Page path
      <input list="site-page-routes" name="pagePath" required maxLength={300} defaultValue={editing?.pagePath ?? "/"} placeholder="/ or /groups/my-group" className="mt-1.5 w-full rounded-xl border border-black/15 px-3 py-3 font-normal" />
      <datalist id="site-page-routes">{ROUTES.map((route) => <option key={route} value={route} />)}</datalist>
    </label>
    <label className="block text-sm font-semibold">Placement
      <select name="placement" defaultValue={editing?.placement ?? "bottom"} className="mt-1.5 w-full rounded-xl border border-black/15 bg-white px-3 py-3 font-normal"><option value="top">Before page content</option><option value="bottom">After page content</option></select>
    </label>
    <section className="rounded-2xl bg-gradient-to-br from-brand/10 to-gold/15 p-4 ring-1 ring-brand/15">
      <p className="font-semibold">✨ AI writing helper</p>
      <p className="mt-1 text-xs text-muted">Describe the message and audience. Review the draft before saving or publishing.</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={1000} placeholder="Notes about this page content…" className="input" />
        <button type="button" onClick={writeWithAi} disabled={drafting || topic.trim().length < 8} className="btn-primary shrink-0 disabled:opacity-50">{drafting ? "Writing…" : "Draft with AI"}</button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-rose-700">{error}</p>}
    </section>
    <label className="block text-sm font-semibold">Heading <span className="font-normal text-muted">(optional)</span><input name="title" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5 w-full rounded-xl border border-black/15 px-3 py-3 font-normal" /></label>
    <label className="block text-sm font-semibold">Text<textarea name="body" required maxLength={10000} rows={6} value={body} onChange={(e) => setBody(e.target.value)} className="mt-1.5 w-full rounded-xl border border-black/15 px-3 py-3 font-normal" /></label>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block text-sm font-semibold">Button label<input name="linkLabel" maxLength={80} defaultValue={editing?.linkLabel ?? ""} className="mt-1.5 w-full rounded-xl border border-black/15 px-3 py-3 font-normal" /></label>
      <label className="block text-sm font-semibold">Button URL<input name="linkUrl" maxLength={500} placeholder="/events" defaultValue={editing?.linkUrl ?? ""} className="mt-1.5 w-full rounded-xl border border-black/15 px-3 py-3 font-normal" /></label>
    </div>
    <label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" name="published" defaultChecked={editing?.published ?? false} className="size-4 accent-emerald-700" /> Publish now</label>
    <button className="btn-primary w-full justify-center">{editing ? "Save changes" : "Add content"}</button>
  </form>;
}
