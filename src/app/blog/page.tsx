import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { and, desc, eq, ilike } from "drizzle-orm";
import { ensureSeed } from "@/lib/seed";
import { formatLongDate } from "@/lib/format";
import { Reveal, TiltCard } from "@/components/fx/Effects";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Blog" };

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  await ensureSeed();
  const { tag } = await searchParams;
  const cleanTag = tag?.replace(/[^a-z0-9-]/gi, "").slice(0, 40);
  const posts = await db
    .select()
    .from(blogPosts)
    .where(cleanTag ? and(eq(blogPosts.published, true), ilike(blogPosts.tags, `%${cleanTag}%`)) : eq(blogPosts.published, true))
    .orderBy(desc(blogPosts.createdAt));
  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags.split(",").map((t) => t.trim()).filter(Boolean))));
  const [hero, ...rest] = posts;

  return (
    <div className="mx-auto max-w-7xl px-5 py-14">
      <Reveal>
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">The Gelan Journal</p>
        <h1 className="mt-2 font-display text-5xl font-bold md:text-6xl">Blog</h1>
        <p className="mt-3 max-w-2xl text-muted">Study strategies, exam tips, culture notes and club news from our organisers.</p>
      </Reveal>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/blog" className={`rounded-full px-4 py-1.5 text-sm font-medium ring-1 ring-black/10 ${!cleanTag ? "bg-ink text-white" : "bg-white"}`}>All</Link>
        {allTags.map((t) => (
          <Link key={t} href={`/blog?tag=${t}`} className={`rounded-full px-4 py-1.5 text-sm font-medium ring-1 ring-black/10 ${cleanTag === t ? "bg-ink text-white" : "bg-white"}`}>#{t}</Link>
        ))}
      </div>

      {hero && (
        <Reveal delay={100}>
          <Link href={`/blog/${hero.slug}`} className="group mt-10 grid overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-xl md:grid-cols-2">
            <div className="relative min-h-[280px] overflow-hidden bg-paper">
              {hero.coverImage && <Image src={hero.coverImage} alt="" fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />}
            </div>
            <div className="flex flex-col justify-center p-8 md:p-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand">Featured · {formatLongDate(hero.createdAt)}</p>
              <h2 className="mt-3 font-display text-4xl font-bold leading-tight group-hover:text-brand">{hero.title}</h2>
              <p className="mt-3 text-muted">{hero.excerpt}</p>
              <p className="mt-6 text-sm font-semibold">By {hero.author} · {hero.views} reads</p>
            </div>
          </Link>
        </Reveal>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((p, i) => (
          <Reveal key={p.id} delay={i * 80}>
            <TiltCard className="h-full rounded-3xl">
              <Link href={`/blog/${p.slug}`} className="group block h-full overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
                <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-brand/20 to-gold/30">
                  {p.coverImage ? <Image src={p.coverImage} alt="" fill sizes="(min-width:1024px) 33vw, 50vw" className="object-cover transition duration-700 group-hover:scale-110" /> : <span className="absolute inset-0 grid place-items-center text-5xl">📰</span>}
                </div>
                <div className="p-6">
                  <p className="text-xs text-muted">{formatLongDate(p.createdAt)}</p>
                  <h3 className="mt-1 font-display text-xl font-bold leading-snug group-hover:text-brand">{p.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-muted">{p.excerpt}</p>
                </div>
              </Link>
            </TiltCard>
          </Reveal>
        ))}
      </div>
      {!posts.length && <p className="mt-10 rounded-2xl bg-white p-10 text-center text-muted">No posts yet.</p>}
    </div>
  );
}
