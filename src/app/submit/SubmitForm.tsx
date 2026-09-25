"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ACCEPT_ATTR, MAX_FILE_BYTES, SUBMISSION_KINDS, humanSize } from "@/lib/files";

type G = { slug: string; name: string; emoji: string };

export default function SubmitForm({ groups, defaultGroup, defaultKind }: { groups: G[]; defaultGroup: string; defaultKind: string }) {
  const router = useRouter();
  const [kind, setKind] = useState(defaultKind);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [group, setGroup] = useState(defaultGroup);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  // recorder
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setRecSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  useEffect(() => {
    if (!file) return setPreviewUrl(null);
    if (file.type.startsWith("audio/") || file.type.startsWith("image/")) {
      const u = URL.createObjectURL(file);
      setPreviewUrl(u);
      return () => URL.revokeObjectURL(u);
    }
    setPreviewUrl(null);
  }, [file]);

  function pick(f: File | undefined | null) {
    if (!f) return;
    if (f.size > MAX_FILE_BYTES) return setMsg({ ok: false, text: `That file is ${humanSize(f.size)} — the limit is 5 MB.` });
    setMsg(null);
    setFile(f);
  }

  async function startRec() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
        const ext = (rec.mimeType || "audio/webm").includes("mp4") ? "m4a" : "webm";
        pick(new File([blob], `recording-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.${ext}`, { type: blob.type }));
      };
      rec.start();
      recRef.current = rec;
      setRecSecs(0);
      setRecording(true);
      if (kind !== "recording") setKind("recording");
    } catch {
      setMsg({ ok: false, text: "Microphone permission denied or unavailable." });
    }
  }
  function stopRec() {
    recRef.current?.stop();
    setRecording(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData();
    fd.set("kind", kind);
    fd.set("title", title);
    fd.set("text", text);
    fd.set("group", group);
    if (file) fd.set("file", file);
    // XHR for upload progress
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/submissions");
    xhr.upload.onprogress = (ev) => ev.lengthComputable && setProgress(Math.round((ev.loaded / ev.total) * 100));
    xhr.onload = () => {
      setProgress(null);
      let data: { ok?: boolean; error?: string } = {};
      try { data = JSON.parse(xhr.responseText); } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && data.ok) {
        setMsg({ ok: true, text: "Submitted! An organiser will review it soon — you'll get a notification 🔔" });
        setTitle(""); setText(""); setFile(null);
        router.refresh();
      } else setMsg({ ok: false, text: data.error || `Upload failed (${xhr.status}).` });
    };
    xhr.onerror = () => { setProgress(null); setMsg({ ok: false, text: "Network error — please try again." }); };
    setProgress(0);
    xhr.send(fd);
  }

  const busy = progress !== null;

  return (
    <form onSubmit={submit} className="h-fit space-y-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 md:p-8 lg:sticky lg:top-24">
      <h2 className="font-display text-2xl font-bold">New submission</h2>

      <div>
        <p className="label">Type</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Object.entries(SUBMISSION_KINDS).map(([k, v]) => (
            <button type="button" key={k} onClick={() => setKind(k)} title={v.hint} className={`rounded-2xl p-3 text-left text-xs font-semibold transition ${kind === k ? "bg-ink text-white shadow-lg" : "bg-paper hover:bg-gold/20"}`}>
              <span className="block text-xl">{v.icon}</span>{v.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-muted">{SUBMISSION_KINDS[kind]?.hint}</p>
      </div>

      <div>
        <label className="label" htmlFor="sb-title">Title</label>
        <input id="sb-title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} maxLength={160} className="input" placeholder="e.g. Tongue twister challenge — week 12" />
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
        className={`rounded-2xl border-2 border-dashed p-5 text-center transition ${drag ? "border-brand bg-brand/5" : "border-black/15"}`}
      >
        {file ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold">📎 {file.name} <span className="font-normal text-muted">· {humanSize(file.size)}</span></p>
            {previewUrl && file.type.startsWith("audio/") && <audio controls src={previewUrl} className="mx-auto w-full" />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {previewUrl && file.type.startsWith("image/") && <img src={previewUrl} alt="" className="mx-auto max-h-40 rounded-xl" />}
            <button type="button" onClick={() => setFile(null)} className="text-xs font-semibold text-rose-700">Remove</button>
          </div>
        ) : recording ? (
          <div>
            <div className="mx-auto flex h-10 items-center justify-center gap-1">
              {Array.from({ length: 18 }).map((_, i) => <span key={i} className="wave-bar w-1.5 rounded-full bg-brand" style={{ height: `${30 + ((i * 41) % 70)}%`, animationDelay: `${i * 0.06}s` }} />)}
            </div>
            <p className="mt-2 font-mono text-lg font-bold text-brand">● {String(Math.floor(recSecs / 60)).padStart(2, "0")}:{String(recSecs % 60).padStart(2, "0")}</p>
            <button type="button" onClick={stopRec} className="btn-primary mt-3 !py-2 text-sm">■ Stop recording</button>
          </div>
        ) : (
          <div>
            <p className="text-3xl">⬆️</p>
            <p className="mt-1 text-sm font-semibold">Drag & drop a file, or</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <label className="btn-ghost cursor-pointer !py-2 text-sm">
                Browse files
                <input type="file" accept={ACCEPT_ATTR} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
              </label>
              <button type="button" onClick={startRec} className="btn-ghost !py-2 text-sm">🎙️ Record voice</button>
            </div>
            <p className="mt-3 text-[11px] text-muted">PDF, images, audio, MP4, DOCX, PPTX or TXT · max 5 MB</p>
          </div>
        )}
      </div>

      <div>
        <label className="label" htmlFor="sb-text">Text / notes {file ? <span className="font-normal text-muted">(optional)</span> : null}</label>
        <textarea id="sb-text" value={text} onChange={(e) => setText(e.target.value)} rows={6} maxLength={20000} className="input" placeholder={file ? "Anything the reviewer should know?" : "Paste or write your work here…"} />
        <p className="mt-1 text-right text-[11px] text-muted">{text.length.toLocaleString()} / 20,000</p>
      </div>

      {groups.length > 0 && (
        <div>
          <label className="label" htmlFor="sb-group">Share with a group <span className="font-normal text-muted">(optional)</span></label>
          <select id="sb-group" value={group} onChange={(e) => setGroup(e.target.value)} className="input">
            <option value="">— None —</option>
            {groups.map((g) => <option key={g.slug} value={g.slug}>{g.emoji} {g.name}</option>)}
          </select>
        </div>
      )}

      {busy && (
        <div className="h-2 overflow-hidden rounded-full bg-paper">
          <div className="h-full rounded-full bg-gradient-to-r from-brand to-gold transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {msg && <p role="status" className={`rounded-xl px-4 py-3 text-sm font-medium ${msg.ok ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200" : "bg-rose-50 text-rose-900 ring-1 ring-rose-200"}`}>{msg.ok ? "✓ " : "⚠ "}{msg.text}</p>}
      <button disabled={busy || recording} className="btn-primary w-full">{busy ? `Uploading… ${progress}%` : "Send for review"}</button>
    </form>
  );
}
