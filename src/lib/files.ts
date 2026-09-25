export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export const SUBMISSION_KINDS: Record<string, { label: string; icon: string; hint: string }> = {
  essay: { label: "Essay / writing", icon: "✍️", hint: "IELTS/TOEFL essays, stories, reports" },
  recording: { label: "Voice recording", icon: "🎙️", hint: "Tongue twisters, speeches, pronunciation" },
  homework: { label: "Homework", icon: "📘", hint: "Worksheets and assignments from workshops" },
  vocabulary: { label: "Vocabulary list", icon: "📚", hint: "Word lists, flashcards, definitions" },
  certificate: { label: "Certificate to verify", icon: "🏅", hint: "IELTS/TOEFL/SAT results, course certificates" },
  project: { label: "Project", icon: "🧪", hint: "Presentations, videos, group projects" },
  other: { label: "Other", icon: "📎", hint: "Anything else for the organisers" },
};

type Sniffed = { mime: string; ext: string; inline: boolean };

function startsWith(buf: Uint8Array, sig: number[], offset = 0) {
  return sig.every((b, i) => buf[offset + i] === b);
}

/** Detect the real file type from magic bytes. Returns null for disallowed types. */
export function sniff(buf: Uint8Array, name: string): Sniffed | null {
  const ext = (name.split(".").pop() || "").toLowerCase();
  if (startsWith(buf, [0x25, 0x50, 0x44, 0x46])) return { mime: "application/pdf", ext: "pdf", inline: true };
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47])) return { mime: "image/png", ext: "png", inline: true };
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return { mime: "image/jpeg", ext: "jpg", inline: true };
  if (startsWith(buf, [0x47, 0x49, 0x46, 0x38])) return { mime: "image/gif", ext: "gif", inline: true };
  if (startsWith(buf, [0x52, 0x49, 0x46, 0x46]) && startsWith(buf, [0x57, 0x45, 0x42, 0x50], 8)) return { mime: "image/webp", ext: "webp", inline: true };
  if (startsWith(buf, [0x52, 0x49, 0x46, 0x46]) && startsWith(buf, [0x57, 0x41, 0x56, 0x45], 8)) return { mime: "audio/wav", ext: "wav", inline: true };
  if (startsWith(buf, [0x1a, 0x45, 0xdf, 0xa3])) return { mime: ext === "webm" || ext === "weba" || !ext ? "audio/webm" : "video/webm", ext: "webm", inline: true };
  if (startsWith(buf, [0x4f, 0x67, 0x67, 0x53])) return { mime: "audio/ogg", ext: "ogg", inline: true };
  if (startsWith(buf, [0x49, 0x44, 0x33]) || startsWith(buf, [0xff, 0xfb]) || startsWith(buf, [0xff, 0xf3])) return { mime: "audio/mpeg", ext: "mp3", inline: true };
  if (startsWith(buf, [0x66, 0x74, 0x79, 0x70], 4)) {
    const brand = String.fromCharCode(...buf.slice(8, 12));
    if (/M4A|M4B/.test(brand)) return { mime: "audio/mp4", ext: "m4a", inline: true };
    return { mime: "video/mp4", ext: "mp4", inline: true };
  }
  if (startsWith(buf, [0x50, 0x4b, 0x03, 0x04])) {
    if (ext === "docx") return { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ext: "docx", inline: false };
    if (ext === "pptx") return { mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", ext: "pptx", inline: false };
    return null; // arbitrary zips not allowed
  }
  if (ext === "txt" || ext === "md") {
    // accept only if it decodes as text without NUL bytes
    const sample = buf.slice(0, 4096);
    if (sample.includes(0)) return null;
    return { mime: "text/plain; charset=utf-8", ext, inline: true };
  }
  return null;
}

export function safeFilename(name: string) {
  const base = name.replace(/[/\\?%*:|"<>\x00-\x1f]/g, "_").replace(/\s+/g, " ").trim();
  return (base || "file").slice(-120);
}

export function humanSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export const ACCEPT_ATTR = ".pdf,.png,.jpg,.jpeg,.gif,.webp,.mp3,.m4a,.wav,.ogg,.webm,.mp4,.docx,.pptx,.txt,.md";
