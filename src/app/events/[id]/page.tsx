import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getEvent } from "@/lib/queries";
import { CATEGORY_STYLES, formatLongDate, formatTime } from "@/lib/format";
import RsvpForm from "./RsvpForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const event = Number(id) ? await getEvent(Number(id)) : null;
  return { title: event?.title ?? "Event" };
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const eventId = Number(id);
  if (!Number.isInteger(eventId) || eventId <= 0) notFound();
  const event = await getEvent(eventId);
  if (!event) notFound();

  const left = Math.max(0, event.capacity - event.attending);
  const past = event.startsAt.getTime() < Date.now();
  const end = new Date(event.startsAt.getTime() + event.durationMinutes * 60000);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <Link href="/events" className="text-sm font-medium text-muted hover:text-ink">
        ← All events
      </Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_380px]">
        <article>
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
              CATEGORY_STYLES[event.category] ?? "bg-gray-100"
            }`}
          >
            {event.category}
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight md:text-5xl">{event.title}</h1>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              ["When", `${formatLongDate(event.startsAt)}`, `${formatTime(event.startsAt)} – ${formatTime(end)}`],
              ["Where", event.location, ""],
              ["Level", event.level, ""],
              ["Hosted by", event.host, "Volunteer facilitator"],
            ].map(([k, v, sub]) => (
              <div key={k} className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{k}</dt>
                <dd className="mt-1 font-semibold">{v}</dd>
                {sub && <dd className="text-sm text-muted">{sub}</dd>}
              </div>
            ))}
          </dl>

          <h2 className="mt-10 font-display text-2xl font-bold">About this event</h2>
          <p className="mt-3 whitespace-pre-line text-lg leading-relaxed text-ink/85">{event.description}</p>

          <div className="mt-10 rounded-2xl bg-paper p-6">
            <h3 className="font-display text-lg font-bold">First time? Here&apos;s what to expect</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink/80">
              <li>👋 Arrive 5–10 minutes early and look for the Gelan English Club sign.</li>
              <li>🏷️ Grab a name tag — write your name and where you&apos;re from.</li>
              <li>💬 Mistakes are welcome! Everyone is here to learn.</li>
              <li>☕ Buying a drink at the café is appreciated but never required.</li>
            </ul>
          </div>
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-baseline justify-between">
              <p className="font-display text-2xl font-bold">Reserve a spot</p>
              <p className="text-sm font-semibold text-emerald-700">Free</p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-paper">
              <div
                className="h-full rounded-full bg-gold"
                style={{ width: `${Math.min(100, (event.attending / event.capacity) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-muted">
              <strong className="text-ink">{event.attending}</strong> of {event.capacity} spots taken ·{" "}
              <span className={left <= 5 ? "font-semibold text-brand" : ""}>{left} left</span>
            </p>
            <div className="mt-5">
              {past ? (
                <p className="rounded-xl bg-paper p-4 text-sm text-muted">This event has already happened.</p>
              ) : left === 0 ? (
                <p className="rounded-xl bg-paper p-4 text-sm text-muted">
                  This event is fully booked. Keep an eye on our calendar for the next one!
                </p>
              ) : (
                <RsvpForm eventId={event.id} />
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
