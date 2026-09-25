import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { ensureSeed } from "@/lib/seed";
import { timeAgo } from "@/lib/format";
import { wordOfTheDay } from "@/lib/words";
import PostForm from "./PostForm";
import LikeButton from "./LikeButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Phrase Wall" };

const KINDS: Record<string, { label: string; icon: string; style: string }> = {
  idiom: { label: "Idiom", icon: "💡", style: "bg-amber-100 text-amber-900" },
  question: { label: "Question", icon: "❓", style: "bg-sky-100 text-sky-900" },
  tip: { label: "Learning tip", icon: "✨", style: "bg-emerald-100 text-emerald-900" },
};

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; sort?: string }>;
}) {
  await ensureSeed();
  const { kind, sort } = await searchParams;
  const activeKind = kind && KINDS[kind] ? kind : undefined;
  const top = sort === "top";

  const list = await db
    .select()
    .from(posts)
    .where(activeKind ? eq(posts.kind, activeKind) : undefined)
    .orderBy(top ? desc(posts.likes) : desc(posts.createdAt), desc(posts.id))
    .limit(100);

  const word = wordOfTheDay();

  const href = (k?: string, s?: string) => {
    const p = new URLSearchParams();
    if (k) p.set("kind", k);
    if (s) p.set("sort", s);
    const q = p.toString();
    return q ? `/board?${q}` : "/board";
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand">Community</p>
      <h1 className="mt-2 font-display text-5xl font-bold">The Phrase Wall</h1>
      <p className="mt-4 max-w-2xl text-muted">
        Share an idiom you love, ask a grammar question, or pass on a learning tip. Give a ♥ to the posts that
        help you most.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Link
                href={href(undefined, sort)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ring-1 ring-black/10 ${!activeKind ? "bg-ink text-white" : "bg-white"}`}
              >
                All
              </Link>
              {Object.entries(KINDS).map(([k, v]) => (
                <Link
                  key={k}
                  href={href(k, sort)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium ring-1 ring-black/10 ${activeKind === k ? "bg-ink text-white" : "bg-white"}`}
                >
                  {v.icon} {v.label}
                </Link>
              ))}
            </div>
            <div className="flex rounded-full bg-white p-1 text-sm ring-1 ring-black/10">
              <Link href={href(activeKind)} className={`rounded-full px-3 py-1 ${!top ? "bg-paper font-semibold" : ""}`}>
                Newest
              </Link>
              <Link href={href(activeKind, "top")} className={`rounded-full px-3 py-1 ${top ? "bg-paper font-semibold" : ""}`}>
                Most loved
              </Link>
            </div>
          </div>

          <div className="mt-6 columns-1 gap-4 sm:columns-2">
            {list.map((p) => {
              const k = KINDS[p.kind] ?? KINDS.tip;
              return (
                <article key={p.id} className="mb-4 break-inside-avoid rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${k.style}`}>
                      {k.icon} {k.label}
                    </span>
                    <span className="text-xs text-muted">{timeAgo(p.createdAt)}</span>
                  </div>
                  <p className={`mt-3 ${p.kind === "idiom" ? "font-display text-2xl font-bold" : "text-[15px] font-medium leading-relaxed"}`}>
                    {p.kind === "idiom" ? `“${p.content}”` : p.content}
                  </p>
                  {p.meaning && (
                    <p className="mt-2 border-l-2 border-gold pl-3 text-sm leading-relaxed text-muted">{p.meaning}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-navy text-xs font-bold text-white">
                        {p.author.charAt(0).toUpperCase()}
                      </span>
                      {p.author}
                    </span>
                    <LikeButton id={p.id} likes={p.likes} />
                  </div>
                </article>
              );
            })}
          </div>
          {!list.length && (
            <p className="mt-6 rounded-2xl bg-white p-10 text-center text-muted ring-1 ring-black/5">
              Nothing here yet — be the first to post!
            </p>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="font-display text-xl font-bold">Share something</h2>
            <PostForm />
          </div>
          <div className="rounded-3xl bg-navy p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">Word of the day</p>
            <p className="mt-2 font-display text-3xl font-bold">{word.word}</p>
            <p className="text-sm text-white/60">
              {word.phonetic} · <em>{word.partOfSpeech}</em>
            </p>
            <p className="mt-3 text-sm leading-relaxed">{word.definition}</p>
            <p className="mt-3 text-sm italic text-white/70">&ldquo;{word.example}&rdquo;</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
