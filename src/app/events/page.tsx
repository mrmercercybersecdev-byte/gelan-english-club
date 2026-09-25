import Link from "next/link";
import type { Metadata } from "next";
import EventCard from "@/components/EventCard";
import { getUpcomingEvents } from "@/lib/queries";
import { CATEGORIES } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Events" };

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const active = category && CATEGORIES.includes(category) ? category : undefined;
  const list = await getUpcomingEvents({ category: active });

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand">Calendar</p>
      <h1 className="mt-2 font-display text-5xl font-bold">Upcoming events</h1>
      <p className="mt-4 max-w-2xl text-muted">
        All events are free for members. Reserve your spot so we can plan tables and materials — and
        please cancel by email if you can&apos;t make it.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href="/events"
          className={`rounded-full px-4 py-2 text-sm font-medium ring-1 ring-black/10 ${
            !active ? "bg-ink text-white ring-ink" : "bg-white hover:bg-paper"
          }`}
        >
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/events?category=${encodeURIComponent(c)}`}
            className={`rounded-full px-4 py-2 text-sm font-medium ring-1 ring-black/10 ${
              active === c ? "bg-ink text-white ring-ink" : "bg-white hover:bg-paper"
            }`}
          >
            {c}
          </Link>
        ))}
      </div>

      {list.length ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl bg-white p-12 text-center ring-1 ring-black/5">
          <p className="text-4xl">🗓️</p>
          <p className="mt-3 font-display text-xl font-bold">No events in this category yet</p>
          <p className="mt-1 text-sm text-muted">Try another category or check back soon.</p>
        </div>
      )}
    </div>
  );
}
