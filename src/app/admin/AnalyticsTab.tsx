import { and, desc, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { siteAnalyticsEvents, visitorConsents } from "@/db/schema";

type Distribution = { label: string; count: number };

function DistributionList({ title, rows }: { title: string; rows: Distribution[] }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return <section className="rounded-2xl bg-white p-5 ring-1 ring-black/5 sm:p-6">
    <h3 className="font-display text-xl font-bold">{title}</h3>
    {rows.length ? <ul className="mt-4 space-y-4">{rows.map((row) => <li key={row.label}>
      <div className="flex justify-between gap-3 text-sm"><span className="truncate">{row.label}</span><span className="font-semibold tabular-nums">{row.count.toLocaleString()}</span></div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper"><div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(3, row.count / max * 100)}%` }} /></div>
    </li>)}</ul> : <p className="mt-4 text-sm text-muted">No consented data in the last 30 days.</p>}
  </section>;
}

export default async function AnalyticsTab() {
  const since = new Date(Date.now() - 30 * 86_400_000);
  const now = new Date();
  try {
    const [totals, countries, devices, pages, vitals, daily, consentCounts] = await Promise.all([
      db.select({ purpose: siteAnalyticsEvents.purpose, kind: siteAnalyticsEvents.kind, count: sql<number>`count(*)::int` }).from(siteAnalyticsEvents).where(gte(siteAnalyticsEvents.createdAt, since)).groupBy(siteAnalyticsEvents.purpose, siteAnalyticsEvents.kind),
      db.select({ label: siteAnalyticsEvents.countryCode, count: sql<number>`count(*)::int` }).from(siteAnalyticsEvents).where(and(gte(siteAnalyticsEvents.createdAt, since), sql`${siteAnalyticsEvents.countryCode} is not null`)).groupBy(siteAnalyticsEvents.countryCode).orderBy(desc(sql`count(*)`)).limit(10),
      db.select({ label: siteAnalyticsEvents.deviceClass, count: sql<number>`count(*)::int` }).from(siteAnalyticsEvents).where(gte(siteAnalyticsEvents.createdAt, since)).groupBy(siteAnalyticsEvents.deviceClass).orderBy(desc(sql`count(*)`)),
      db.select({ label: siteAnalyticsEvents.pagePath, count: sql<number>`count(*)::int` }).from(siteAnalyticsEvents).where(and(gte(siteAnalyticsEvents.createdAt, since), sql`${siteAnalyticsEvents.kind} = 'page_view'`)).groupBy(siteAnalyticsEvents.pagePath).orderBy(desc(sql`count(*)`)).limit(10),
      db.select({ label: siteAnalyticsEvents.metricName, average: sql<number>`round(avg(${siteAnalyticsEvents.metricValueMilli})::numeric / 1000, 1)`, count: sql<number>`count(*)::int` }).from(siteAnalyticsEvents).where(and(gte(siteAnalyticsEvents.createdAt, since), sql`${siteAnalyticsEvents.kind} = 'web_vital'`)).groupBy(siteAnalyticsEvents.metricName),
      db.select({ label: sql<string>`to_char(date_trunc('day', ${siteAnalyticsEvents.createdAt}), 'YYYY-MM-DD')`, count: sql<number>`count(*)::int` }).from(siteAnalyticsEvents).where(and(gte(siteAnalyticsEvents.createdAt, since), sql`${siteAnalyticsEvents.kind} = 'page_view'`)).groupBy(sql`date_trunc('day', ${siteAnalyticsEvents.createdAt})`).orderBy(sql`date_trunc('day', ${siteAnalyticsEvents.createdAt})`),
      db.select({ analytics: sql<number>`count(*) filter (where ${visitorConsents.analytics})::int`, marketing: sql<number>`count(*) filter (where ${visitorConsents.marketing})::int` }).from(visitorConsents).where(gte(visitorConsents.expiresAt, now)),
    ]);
    const count = (purpose: string, kind: string) => totals.find((r) => r.purpose === purpose && r.kind === kind)?.count ?? 0;
    const pageViews = count("analytics", "page_view") + count("marketing", "page_view");
    const maxDaily = Math.max(1, ...daily.map((d) => d.count));
    return <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-2xl font-bold">Performance & audience</h2><p className="mt-1 text-sm text-muted">Aggregated, consented activity from the last 30 days. This view never exposes browser-level records.</p></div><span className="rounded-full bg-paper px-3 py-1 text-xs font-semibold">Last 30 days</span></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Page views", pageViews], ["Consent for analytics", consentCounts[0]?.analytics ?? 0], ["Product-planning opt-ins", consentCounts[0]?.marketing ?? 0], ["Web vital samples", vitals.reduce((sum, row) => sum + row.count, 0)]].map(([label, value]) => <article key={label} className="rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5"><p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p><p className="mt-2 font-display text-3xl font-bold">{Number(value).toLocaleString()}</p></article>)}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl bg-white p-5 ring-1 ring-black/5 sm:p-6"><h3 className="font-display text-xl font-bold">Daily page views</h3>{daily.length ? <div className="mt-5 flex h-36 items-end gap-1.5">{daily.map((day) => <div key={day.label} className="group relative flex h-full min-w-1 flex-1 items-end" title={`${day.label}: ${day.count}`}><div className="w-full rounded-t bg-brand/80" style={{ height: `${Math.max(3, day.count / maxDaily * 100)}%` }} /></div>)}</div> : <p className="mt-4 text-sm text-muted">No page views recorded yet.</p>}<div className="mt-2 flex justify-between text-[11px] text-muted"><span>{daily[0]?.label ?? ""}</span><span>{daily.at(-1)?.label ?? ""}</span></div></section>
        <section className="rounded-2xl bg-white p-5 ring-1 ring-black/5 sm:p-6"><h3 className="font-display text-xl font-bold">Core Web Vitals</h3><p className="mt-1 text-xs text-muted">Average measured value: milliseconds except CLS (unitless × 1000).</p>{vitals.length ? <div className="mt-4 divide-y divide-black/5">{vitals.map((v) => <div key={v.label} className="flex items-center justify-between py-3"><span className="font-semibold">{v.label}</span><span className="text-sm tabular-nums">{v.average}{v.label === "CLS" ? " × 0.001" : " ms"} <span className="text-muted">({v.count})</span></span></div>)}</div> : <p className="mt-4 text-sm text-muted">No performance samples yet.</p>}</section>
      </div>
      <div className="grid gap-5 xl:grid-cols-3"><DistributionList title="Country" rows={countries.map((row) => ({ label: row.label ?? "Unknown", count: row.count }))} /><DistributionList title="Device type" rows={devices.map((row) => ({ label: row.label, count: row.count }))} /><DistributionList title="Popular pages" rows={pages.map((row) => ({ label: row.label, count: row.count }))} /></div>
      <p className="rounded-2xl bg-paper p-4 text-xs leading-relaxed text-muted">Product-planning totals include only visitors who opted in. The site stores coarse country and device categories, never raw IP addresses, full user-agent strings, names, email addresses, or account IDs in this analytics system. Visitors can revoke consent from “Privacy choices”; their pseudonymous analytics rows are deleted when they withdraw.</p>
    </div>;
  } catch {
    return <div className="rounded-2xl bg-amber-50 p-5 text-sm text-amber-950 ring-1 ring-amber-200">Analytics needs its database tables. Run <code>drizzle/0002_consent_analytics.sql</code> in Neon, then reload the dashboard.</div>;
  }
}
