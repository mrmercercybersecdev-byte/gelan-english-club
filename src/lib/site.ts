export function siteUrl() {
  const fallback = "http://localhost:3000";
  const raw = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || fallback).trim();
  if (!raw) return fallback;

  try {
    const url = new URL(raw);
    if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) {
      return fallback;
    }
    return raw.replace(/\/$/, "");
  } catch {
    return fallback;
  }
}
