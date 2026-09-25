const TZ = process.env.CLUB_TIMEZONE || "UTC";

export function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: TZ,
  }).format(d);
}

export function formatLongDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(d);
}

export function formatTime(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(d);
}

export function dayNumber(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", timeZone: TZ }).format(d);
}

export function monthShort(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: TZ }).format(d);
}

export function timeAgo(d: Date) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

export const CATEGORY_STYLES: Record<string, string> = {
  Conversation: "bg-amber-100 text-amber-900",
  "Book Club": "bg-emerald-100 text-emerald-900",
  Debate: "bg-rose-100 text-rose-900",
  Workshop: "bg-sky-100 text-sky-900",
  Social: "bg-violet-100 text-violet-900",
};

export const CATEGORIES = ["Conversation", "Book Club", "Debate", "Workshop", "Social"];
export const LEVELS = [
  "Beginner (A1–A2)",
  "Intermediate (B1)",
  "Upper-intermediate (B2)",
  "Advanced (C1–C2)",
  "Native / fluent speaker",
];
