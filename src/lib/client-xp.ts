"use client";

export type XpResult = { awarded?: number; xp?: number; streak?: number } | null | undefined;

export function notifyXp(result: XpResult, label?: string) {
  if (!result || !result.awarded) return;
  window.dispatchEvent(new CustomEvent("wec:xp", { detail: { amount: result.awarded, label, xp: result.xp, streak: result.streak } }));
}

export async function earnXp(activity: string, extra: Record<string, unknown> = {}, label?: string) {
  try {
    const res = await fetch("/api/xp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activity, ...extra }),
    });
    const data = (await res.json()) as XpResult;
    notifyXp(data, label);
    return data;
  } catch {
    return null;
  }
}
