"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveBlogPostAction } from "./admin-actions";
import type { FormState } from "../actions";
import { FormNotice, SubmitButton } from "@/components/FormBits";
import Markdown from "@/components/Markdown";

type Post = { id: number; title: string; excerpt: string; content: string; tags: string; author: string; coverImage: string | null; published: boolean };

const COVERS = ["/images/hero.jpg", "/images/bookclub.jpg", "/images/debate.jpg"];

export default function BlogEditor({ post }: { post?: Post }) {
  const [state, action] = useActionState<FormState, FormData>(saveBlogPostAction, null);
  const [content, setContent] = useState(post?.content ?? "## Heading\n\nWrite your article in **markdown**.\n\n- Bullet one\n- Bullet two\n\n> A lovely quote");
  const [cover, setCover] = useState(post?.coverImage ?? COVERS[0]);
  const [preview, setPreview] = useState(false);

  return (
    <form action={action} className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">{post ? "Edit post" : "New post"}</h2>
        {post && <Link href="/admin?tab=blog" className="text-sm text-muted hover:text-ink">+ New post instead</Link>}
      </div>
      {post && <input type="hidden" name="id" value={post.id} />}
      <input name="title" defaultValue={post?.title} required maxLength={200} placeholder="Post title" className="input font-display !text-xl font-bold" />
      <input name="excerpt" defaultValue={post?.excerpt} maxLength={400} placeholder="Short excerpt (optional — auto-generated if empty)" className="input" />
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="tags" defaultValue={post?.tags} placeholder="tags, comma, separated" className="input" />
        <input name="author" defaultValue={post?.author ?? "Gelan English Club"} placeholder="Author" className="input" />
      </div>
      <div>
        <p className="label">Cover image</p>
        <input type="hidden" name="coverImage" value={cover} />
        <div className="flex flex-wrap items-center gap-2">
          {COVERS.map((c) => (
            // eslint-disable-next-line @next/next/no-img-element
            <button type="button" key={c} onClick={() => setCover(c)} className={`overflow-hidden rounded-xl ring-2 ${cover === c ? "ring-brand" : "ring-transparent"}`}><img src={c} alt="" className="h-14 w-20 object-cover" /></button>
          ))}
          <input value={COVERS.includes(cover) ? "" : cover} onChange={(e) => setCover(e.target.value)} maxLength={500} placeholder="…or secure HTTPS URL / /images/ path" className="input !w-56 !py-2 text-sm" />
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="label !mb-0">Content (markdown)</p>
          <div className="flex rounded-full bg-paper p-0.5 text-xs font-semibold">
            <button type="button" onClick={() => setPreview(false)} className={`rounded-full px-3 py-1 ${!preview ? "bg-white shadow" : ""}`}>Write</button>
            <button type="button" onClick={() => setPreview(true)} className={`rounded-full px-3 py-1 ${preview ? "bg-white shadow" : ""}`}>Preview</button>
          </div>
        </div>
        <textarea name="content" value={content} onChange={(e) => setContent(e.target.value)} rows={16} className={`input font-mono text-sm ${preview ? "hidden" : ""}`} />
        {preview && <div className="min-h-[300px] rounded-xl border border-black/10 p-5"><Markdown text={content} /></div>}
        <p className="mt-1 text-xs text-muted">Supports ## headings, **bold**, *italic*, `code`, [links](/url), lists and &gt; quotes.</p>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="published" defaultChecked={post?.published ?? true} className="h-4 w-4 accent-brand" /> Published
      </label>
      <FormNotice state={state} />
      <SubmitButton>{post ? "Save changes" : "Publish post"}</SubmitButton>
    </form>
  );
}
