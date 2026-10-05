"use client";

import { useState } from "react";
import { GAMES } from "@/lib/games";

type Setting = { gameId: string; published: boolean; minLevel: number };
const defaults = GAMES.map((game) => ({ gameId: game.id, published: game.defaultPublished, minLevel: game.id === "emoji-decoder" || game.id === "verb-vortex" ? 2 : game.id === "plural-panic" || game.id === "polite-or-chaos" ? 3 : 1 }));

export default function GameReleasePanel({ initialized, settings }: { initialized: boolean; settings: Setting[] }) {
  const [ready, setReady] = useState(initialized);
  const [rows, setRows] = useState<Setting[]>(settings.length ? settings : defaults);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");

  async function initialize() {
    setBusy("setup"); setNotice("");
    try {
      const response = await fetch("/api/admin/games/setup", { method: "POST" });
      const result = await response.json() as { games?: Setting[]; error?: string };
      if (!response.ok || !result.games) throw new Error(result.error || "Could not initialize game settings.");
      setRows(result.games); setReady(true); setNotice("Game releases and profile-photo storage are ready.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not initialize settings."); }
    finally { setBusy(""); }
  }

  async function save(row: Setting) {
    setBusy(row.gameId); setNotice("");
    try {
      const response = await fetch("/api/admin/games", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(row) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not save this game.");
      setNotice(`${GAMES.find((game) => game.id === row.gameId)?.name} settings saved.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save this game."); }
    finally { setBusy(""); }
  }

  function update(gameId: string, patch: Partial<Setting>) {
    setRows((current) => current.map((row) => row.gameId === gameId ? { ...row, ...patch } : row));
  }

  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-2xl font-bold">Game releases & unlocks</h2><p className="mt-1 max-w-2xl text-sm text-muted">Publish a game when you are ready and choose its minimum player level. Level gates are enforced by the game page and score API.</p></div>{!ready && <button type="button" onClick={initialize} disabled={!!busy} className="btn-primary disabled:opacity-50">{busy === "setup" ? "Setting up…" : "Initialize game controls"}</button>}</div>
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{GAMES.map((game) => {
      const row = rows.find((item) => item.gameId === game.id) ?? { gameId: game.id, published: game.defaultPublished, minLevel: 1 };
      return <section key={game.id} className="rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
        <div className="flex items-start gap-3"><span className="text-3xl" aria-hidden="true">{game.icon}</span><div className="min-w-0 flex-1"><h3 className="font-display text-lg font-bold">{game.name}</h3><p className="text-xs text-muted">{game.tagline}</p></div></div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={row.published} onChange={(event) => update(game.id, { published: event.target.checked })} className="size-4 accent-emerald-700" />Published</label>
          <label className="flex items-center gap-2 text-sm">Unlock at level <select value={row.minLevel} onChange={(event) => update(game.id, { minLevel: Number(event.target.value) })} className="min-h-10 rounded-lg border border-black/15 bg-white px-2">{Array.from({ length: 30 }, (_, index) => index + 1).map((level) => <option key={level} value={level}>{level}</option>)}</select></label>
        </div>
        <button type="button" onClick={() => save(row)} disabled={!ready || !!busy} className="mt-3 min-h-10 w-full rounded-full px-4 text-sm font-semibold ring-1 ring-black/15 disabled:opacity-50">{busy === game.id ? "Saving…" : "Save release settings"}</button>
      </section>;
    })}</div>
  </div>;
}
