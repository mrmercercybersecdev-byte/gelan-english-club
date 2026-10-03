import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { siteContent } from "@/db/schema";

export default async function SiteContentBlocks({ pagePath, placement }: { pagePath: string; placement: "top" | "bottom" }) {
  let items: (typeof siteContent.$inferSelect)[] = [];
  try {
    items = await db.select().from(siteContent)
      .where(and(eq(siteContent.pagePath, pagePath), eq(siteContent.placement, placement), eq(siteContent.published, true)))
      .orderBy(asc(siteContent.id));
  } catch (error) {
    // Keep the public site usable while an operator applies the additive site_content migration.
    if (process.env.NODE_ENV !== "production") console.error("Could not load editable page content", error);
  }
  if (!items.length) return null;
  return <section aria-label="Page updates" className="mx-auto w-full max-w-7xl space-y-4 px-5 py-8">
    {items.map((item) => <article key={item.id} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
      {item.title && <h2 className="font-display text-2xl font-bold">{item.title}</h2>}
      <p className="mt-2 whitespace-pre-wrap leading-relaxed text-muted">{item.body}</p>
      {item.linkUrl && item.linkLabel && <Link href={item.linkUrl} className="btn-primary mt-5">{item.linkLabel}</Link>}
    </article>)}
  </section>;
}
