import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profileAvatars } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const id = Number(userId);
  if (!Number.isSafeInteger(id) || id < 1) return new Response(null, { status: 404 });
  try {
    const [avatar] = await db.select({ mime: profileAvatars.mime, data: profileAvatars.data, updatedAt: profileAvatars.updatedAt }).from(profileAvatars).where(eq(profileAvatars.userId, id)).limit(1);
    if (!avatar) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(avatar.data), { headers: { "Content-Type": avatar.mime, "Cache-Control": "public, max-age=300, stale-while-revalidate=3600", "Last-Modified": avatar.updatedAt.toUTCString(), "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response(null, { status: 404 }); }
}
