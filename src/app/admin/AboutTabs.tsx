import Link from "next/link";
import { db } from "@/db";
import { champions, livestreams, milestones, teamMembers } from "@/db/schema";
import { asc, desc } from "drizzle-orm";
import { CHAMPION_ICONS } from "@/lib/embed";
import { ChampionForm, MilestoneForm, StreamForm, TeamForm } from "./AboutForms";
import {
  deleteChampionAction,
  deleteMilestoneAction,
  deleteStreamAction,
  deleteTeamMemberAction,
  moveTeamMemberAction,
  setStreamStatusAction,
  toggleTeamActiveAction,
} from "./about-actions";

function Thumb({ src, fallback, color = "#1f2d4a" }: { src: string | null; fallback: string; color?: string }) {
  return (
    <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl font-bold text-white" style={{ background: color }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : fallback}
    </span>
  );
}

function Btn({ action, fields, children, danger }: { action: (fd: FormData) => Promise<void>; fields: Record<string, string | number>; children: React.ReactNode; danger?: boolean }) {
  return (
    <form action={action}>
      {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <button className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${danger ? "bg-rose-100 text-rose-800 hover:bg-rose-200" : "bg-paper hover:bg-black/10"}`}>{children}</button>
    </form>
  );
}

export async function TeamTab({ editId }: { editId: number }) {
  const list = await db.select().from(teamMembers).orderBy(asc(teamMembers.sortOrder), asc(teamMembers.id));
  const editing = list.find((m) => m.id === editId);
  const groups = [["leader", "👑 Leaders"], ["facilitator", "🧑‍🏫 Facilitators"]] as const;
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
      <div className="space-y-8">
        {groups.map(([g, label]) => (
          <div key={g}>
            <h3 className="mb-3 font-display text-lg font-bold">{label}</h3>
            <div className="space-y-2">
              {list.filter((m) => m.group === g).map((m) => (
                <div key={m.id} className={`flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 ring-1 ${editing?.id === m.id ? "ring-brand" : "ring-black/5"} ${m.active ? "" : "opacity-50"}`}>
                  <Thumb src={m.photoUrl} fallback={m.name.charAt(0)} color={m.color} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{m.name} {!m.active && <span className="text-xs text-muted">(hidden)</span>}</p>
                    <p className="text-xs text-muted">{m.title} · {m.country}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Btn action={moveTeamMemberAction} fields={{ id: m.id, dir: -1 }}>↑</Btn>
                    <Btn action={moveTeamMemberAction} fields={{ id: m.id, dir: 1 }}>↓</Btn>
                    <Link href={`/admin?tab=team&edit=${m.id}`} className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-semibold hover:bg-black/10">Edit</Link>
                    <Btn action={toggleTeamActiveAction} fields={{ id: m.id }}>{m.active ? "Hide" : "Show"}</Btn>
                    <Btn action={deleteTeamMemberAction} fields={{ id: m.id }} danger>Delete</Btn>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="lg:sticky lg:top-24 lg:self-start"><TeamForm key={editing?.id ?? "new"} m={editing} /></div>
    </div>
  );
}

export async function ChampionsTab({ editId }: { editId: number }) {
  const list = await db.select().from(champions).orderBy(desc(champions.year), asc(champions.place));
  const editing = list.find((c) => c.id === editId);
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
      <div className="space-y-2">
        {list.map((c) => (
          <div key={c.id} className={`flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 ring-1 ${editing?.id === c.id ? "ring-brand" : "ring-black/5"}`}>
            <span className="text-2xl">{["🥇", "🥈", "🥉"][c.place - 1] ?? "🎖️"}</span>
            <Thumb src={c.photoUrl} fallback={c.name.charAt(0)} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{c.name}</p>
              <p className="text-xs text-muted">{CHAMPION_ICONS[c.category] ?? "🏆"} {c.award} · {c.competition} · {c.season} {c.year}</p>
            </div>
            <Link href={`/admin?tab=champions&edit=${c.id}`} className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-semibold hover:bg-black/10">Edit</Link>
            <Btn action={deleteChampionAction} fields={{ id: c.id }} danger>Delete</Btn>
          </div>
        ))}
        {!list.length && <p className="text-muted">No champions yet.</p>}
      </div>
      <div className="lg:sticky lg:top-24 lg:self-start"><ChampionForm key={editing?.id ?? "new"} c={editing} /></div>
    </div>
  );
}

export async function HistoryTab({ editId }: { editId: number }) {
  const list = await db.select().from(milestones).orderBy(asc(milestones.year), asc(milestones.sortOrder));
  const editing = list.find((m) => m.id === editId);
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
      <ol className="relative space-y-2 border-l-2 border-gold/40 pl-6">
        {list.map((m) => (
          <li key={m.id} className={`relative flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 ring-1 ${editing?.id === m.id ? "ring-brand" : "ring-black/5"}`}>
            <span className="absolute -left-[37px] grid h-6 w-6 place-items-center rounded-full bg-gold text-xs">{m.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-brand">{m.month} {m.year}</p>
              <p className="font-semibold">{m.title}</p>
            </div>
            <Link href={`/admin?tab=history&edit=${m.id}`} className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-semibold hover:bg-black/10">Edit</Link>
            <Btn action={deleteMilestoneAction} fields={{ id: m.id }} danger>Delete</Btn>
          </li>
        ))}
      </ol>
      <div className="lg:sticky lg:top-24 lg:self-start"><MilestoneForm key={editing?.id ?? "new"} m={editing} /></div>
    </div>
  );
}

export async function StreamsTab({ editId }: { editId: number }) {
  const list = await db.select().from(livestreams).orderBy(desc(livestreams.scheduledAt));
  const editing = list.find((s) => s.id === editId);
  const badge: Record<string, string> = { live: "bg-red-600 text-white", scheduled: "bg-sky-100 text-sky-900", ended: "bg-gray-200 text-gray-700" };
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
      <div className="space-y-2">
        <div className="mb-4 rounded-2xl bg-ink p-4 text-sm text-white/80">
          <p className="font-semibold text-white">🔴 Going live</p>
          Press <strong>Go live</strong> to put a broadcast at the top of the About page and show a site-wide LIVE banner. Only one stream can be live at a time. Press <strong>End</strong> to turn it into a replay.
        </div>
        {list.map((s) => (
          <div key={s.id} className={`flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 ring-1 ${editing?.id === s.id ? "ring-brand" : "ring-black/5"}`}>
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${badge[s.status] ?? ""}`}>{s.status}</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{s.title}</p>
              <p className="truncate text-xs text-muted">{s.scheduledAt.toLocaleString("en-GB")} · {s.host} · <code>{s.streamUrl || "no URL"}</code></p>
            </div>
            <div className="flex flex-wrap gap-1">
              {s.status !== "live" && <Btn action={setStreamStatusAction} fields={{ id: s.id, status: "live" }}>🔴 Go live</Btn>}
              {s.status === "live" && <Btn action={setStreamStatusAction} fields={{ id: s.id, status: "ended" }}>■ End</Btn>}
              {s.status === "ended" && <Btn action={setStreamStatusAction} fields={{ id: s.id, status: "scheduled" }}>Reschedule</Btn>}
              <Link href={`/admin?tab=streams&edit=${s.id}`} className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-semibold hover:bg-black/10">Edit</Link>
              <Btn action={deleteStreamAction} fields={{ id: s.id }} danger>Delete</Btn>
            </div>
          </div>
        ))}
        {!list.length && <p className="text-muted">No broadcasts yet.</p>}
      </div>
      <div className="lg:sticky lg:top-24 lg:self-start"><StreamForm key={editing?.id ?? "new"} s={editing} /></div>
    </div>
  );
}
