import Link from "next/link";
import type { EventWithCount } from "@/lib/queries";
import { CATEGORY_STYLES, dayNumber, formatDate, formatTime, monthShort } from "@/lib/format";

export default function EventCard({ event }: { event: EventWithCount }) {
  const left = Math.max(0, event.capacity - event.attending);
  const full = left === 0;
  const pct = Math.min(100, Math.round((event.attending / event.capacity) * 100));

  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex flex-col rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-paper py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand">
            {monthShort(event.startsAt)}
          </span>
          <span className="font-display text-2xl font-bold leading-none">{dayNumber(event.startsAt)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              CATEGORY_STYLES[event.category] ?? "bg-gray-100 text-gray-800"
            }`}
          >
            {event.category}
          </span>
          <h3 className="mt-1.5 font-display text-lg font-bold leading-snug group-hover:text-brand">
            {event.title}
          </h3>
        </div>
      </div>
      <div className="mt-4 space-y-1.5 text-sm text-muted">
        <p>🕒 {formatDate(event.startsAt)} · {formatTime(event.startsAt)} · {event.durationMinutes} min</p>
        <p className="truncate">📍 {event.location}</p>
        <p>🎓 {event.level}</p>
      </div>
      <div className="mt-auto pt-5">
        <div className="h-1.5 overflow-hidden rounded-full bg-paper">
          <div className={`h-full rounded-full ${full ? "bg-gray-400" : "bg-gold"}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-muted">
            {event.attending} going
          </span>
          <span className={`font-semibold ${full ? "text-gray-500" : left <= 5 ? "text-brand" : "text-emerald-700"}`}>
            {full ? "Fully booked" : `${left} spot${left === 1 ? "" : "s"} left`}
          </span>
        </div>
      </div>
    </Link>
  );
}
