import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { siteContent } from "@/db/schema";
import { deleteSiteContentAction } from "./admin-actions";
import PageContentForm from "./PageContentForm";

export default async function PageContentTab({ editId = 0 }: { editId?: number }) {
  let rows: (typeof siteContent.$inferSelect)[] = [];
  let migrationNeeded = false;
  try {
    rows = await db.select().from(siteContent).orderBy(asc(siteContent.pagePath), asc(siteContent.id));
  } catch {
    migrationNeeded = true;
  }
  const editing = rows.find((r) => r.id === editId);
  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)]">
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Page content</h2>
          <p className="mt-1 text-sm text-muted">Add a content block to any public page. Choose where it appears and publish it when ready.</p>
        </div>
        {migrationNeeded && <div role="status" className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-950 ring-1 ring-amber-200">The page editor needs its database table. In the Neon SQL Editor for this project, run the additive SQL in <code>drizzle/0001_site_content.sql</code>, then reload this page.</div>}
        {rows.map((row) => (
          <article key={row.id} className="rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{row.title || "Untitled content"}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${row.published ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>{row.published ? "Published" : "Draft"}</span>
                </div>
                <p className="mt-1 text-xs text-muted"><Link href={row.pagePath} className="underline">{row.pagePath}</Link> · {row.placement}</p>
                <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm text-muted">{row.body}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link href={`/admin?tab=pages&edit=${row.id}`} className="rounded-full bg-paper px-3 py-1.5 text-sm font-semibold">Edit</Link>
                <form action={deleteSiteContentAction}><input type="hidden" name="id" value={row.id} /><button className="rounded-full bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-800">Delete</button></form>
              </div>
            </div>
          </article>
        ))}
        {!rows.length && <div className="rounded-2xl bg-white p-6 text-sm text-muted ring-1 ring-black/5">No extra page content yet. Use the form to add your first block.</div>}
      </section>

      <section className="h-fit rounded-2xl bg-white p-5 ring-1 ring-black/5 sm:p-6">
        <h2 className="font-display text-xl font-bold">{editing ? "Edit content" : "Add content"}</h2>
        <PageContentForm editing={editing} />
        {editing && <Link href="/admin?tab=pages" className="mt-3 block text-center text-sm font-semibold text-muted">Cancel editing</Link>}
      </section>
    </div>
  );
}
