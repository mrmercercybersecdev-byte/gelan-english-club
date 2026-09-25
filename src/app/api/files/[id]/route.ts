import { NextRequest } from "next/server";
import { db } from "@/db";
import { submissionFiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const INLINE = /^(image\/(png|jpeg|gif|webp)|audio\/|video\/(mp4|webm)|application\/pdf|text\/plain)/;

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const fileId = Number(id);
  if (!Number.isInteger(fileId) || fileId <= 0) return new Response("Not found", { status: 404 });

  const [meta] = await db
    .select({ id: submissionFiles.id, ownerId: submissionFiles.ownerId, filename: submissionFiles.filename, mime: submissionFiles.mime, size: submissionFiles.size, sha256: submissionFiles.sha256 })
    .from(submissionFiles)
    .where(eq(submissionFiles.id, fileId));
  if (!meta) return new Response("Not found", { status: 404 });

  const user = await getCurrentUser();
  const allowed = (user && user.id === meta.ownerId) || (await isAdmin());
  if (!allowed) return new Response("Forbidden", { status: 403 });

  if (req.headers.get("if-none-match") === `"${meta.sha256}"`) return new Response(null, { status: 304 });

  const [row] = await db.select({ data: submissionFiles.data }).from(submissionFiles).where(eq(submissionFiles.id, fileId));
  const download = req.nextUrl.searchParams.get("download") === "1" || !INLINE.test(meta.mime);
  const encoded = encodeURIComponent(meta.filename);

  return new Response(new Uint8Array(row.data), {
    headers: {
      "Content-Type": meta.mime,
      "Content-Length": String(meta.size),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encoded}`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'; sandbox",
      "Cache-Control": "private, max-age=3600",
      ETag: `"${meta.sha256}"`,
    },
  });
}
