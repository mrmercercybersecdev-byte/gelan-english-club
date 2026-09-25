export type Embed =
  | { kind: "iframe"; src: string; provider: "youtube" | "twitch" | "vimeo" }
  | { kind: "video"; src: string }
  | { kind: "room"; href: string }
  | { kind: "link"; href: string }
  | { kind: "none" };

export function youtubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|live\/|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m?.[1] ?? null;
}

export function thumbnailFor(url: string) {
  const id = youtubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

export function toEmbed(url: string, hostname = "localhost", autoplay = false): Embed {
  const u = (url || "").trim();
  if (!u) return { kind: "none" };
  if (u.startsWith("/meet/")) return { kind: "room", href: u };
  const yt = youtubeId(u);
  if (yt) return { kind: "iframe", provider: "youtube", src: `https://www.youtube-nocookie.com/embed/${yt}?rel=0&modestbranding=1${autoplay ? "&autoplay=1" : ""}` };
  const tw = u.match(/twitch\.tv\/(?:videos\/(\d+)|([\w]+))/);
  if (tw) {
    const q = tw[1] ? `video=${tw[1]}` : `channel=${tw[2]}`;
    return { kind: "iframe", provider: "twitch", src: `https://player.twitch.tv/?${q}&parent=${hostname}&autoplay=${autoplay}` };
  }
  const vm = u.match(/vimeo\.com\/(?:event\/)?(\d+)/);
  if (vm) return { kind: "iframe", provider: "vimeo", src: `https://player.vimeo.com/video/${vm[1]}${autoplay ? "?autoplay=1" : ""}` };
  if (/\.(mp4|webm|ogg|m3u8)(\?|$)/i.test(u)) return { kind: "video", src: u };
  if (/^https?:\/\//.test(u)) return { kind: "link", href: u };
  return { kind: "none" };
}

export function isValidStreamUrl(u: string) {
  return !u || u.startsWith("/meet/") || /^https?:\/\/[^\s]+$/.test(u);
}

export const CHAMPION_ICONS: Record<string, string> = {
  debate: "🎤",
  speech: "🏅",
  spelling: "🐝",
  essay: "✍️",
  quiz: "🧠",
  storytelling: "📖",
  xp: "⚡",
  other: "🏆",
};
