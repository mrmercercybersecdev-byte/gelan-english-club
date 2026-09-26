import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import Markdown from "@/components/Markdown";
import { formatLongDate } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { awardXp } from "@/lib/award";
import BlogCover from "@/components/BlogCover";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [p] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
  return { title: p?.title ?? "Blog", description: p?.excerpt };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post] = await db.select().from(blogPosts).where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)));
  if (!post) notFound();
  await db.update(blogPosts).set({ views: sql`${blogPosts.views} + 1` }).where(eq(blogPosts.id, post.id));
  const user = await getCurrentUser();
  if (user) await awardXp(user.id, "blog_read", post.slug);
  const more = await db.select().from(blogPosts).where(and(eq(blogPosts.published, true), ne(blogPosts.id, post.id))).orderBy(desc(blogPosts.createdAt)).limit(2);
  const minutes = Math.max(1, Math.round(post.content.split(/\s+/).length / 200));

  return (
    <article>
      <header className="relative overflow-hidden bg-ink text-white">
        {post.coverImage && <BlogCover src={post.coverImage} alt="" priority sizes="100vw" className="object-cover opacity-30" />}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
        <div className="relative mx-auto max-w-3xl px-5 pb-14 pt-20">
          <Link href="/blog" className="text-sm text-white/70 hover:text-white">← All articles</Link>
          <div className="mt-6 flex flex-wrap gap-2">
            {post.tags.split(",").filter(Boolean).map((t) => <Link key={t} href={`/blog?tag=${t.trim()}`} className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">#{t.trim()}</Link>)}
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight md:text-6xl">{post.title}</h1>
          <p className="mt-4 text-lg text-white/75">{post.excerpt}</p>
          <p className="mt-6 text-sm text-white/60">By <strong className="text-white">{post.author}</strong> · {formatLongDate(post.createdAt)} · {minutes} min read · {post.views + 1} reads</p>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-5 py-12">
        <Markdown text={post.content} className="text-lg leading-relaxed text-ink/90" />
        {!user && (
          <p className="mt-10 rounded-2xl bg-gold/15 p-4 text-sm ring-1 ring-gold/30">📚 <Link href={`/login?next=/blog/${post.slug}`} className="font-semibold underline">Sign in</Link> to earn XP for reading articles.</p>
        )}
        {more.length > 0 && (
          <div className="mt-16 border-t border-black/10 pt-10">
            <h2 className="font-display text-2xl font-bold">Keep reading</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {more.map((m) => (
                <Link key={m.id} href={`/blog/${m.slug}`} className="rounded-2xl bg-white p-5 ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md">
                  <p className="font-display text-lg font-bold">{m.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{m.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
