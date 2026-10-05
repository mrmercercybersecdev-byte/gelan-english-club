import sharp from "sharp";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profileAvatars } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { limitRequest, sameOrigin } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Forbidden." }, { status: 403 });
  const limited = limitRequest(request, "upload", "profile-avatar");
  if (limited) return limited;
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in to upload a profile photo." }, { status: 401 });
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 2_000_000) return Response.json({ error: "Choose a photo smaller than 1.5 MB." }, { status: 413 });
  try {
    const form = await request.formData();
    const photo = form.get("photo");
    if (!(photo instanceof File) || photo.size < 1 || photo.size > 1_500_000) return Response.json({ error: "Choose a photo smaller than 1.5 MB." }, { status: 400 });
    if (!["image/jpeg", "image/png", "image/webp"].includes(photo.type)) return Response.json({ error: "Use a JPG, PNG, or WebP photo." }, { status: 415 });
    const source = Buffer.from(await photo.arrayBuffer());
    const metadata = await sharp(source, { limitInputPixels: 12_000_000 }).metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format ?? "") || !metadata.width || !metadata.height) return Response.json({ error: "That image format is not supported." }, { status: 415 });
    const data = await sharp(source, { limitInputPixels: 12_000_000 }).rotate().resize(512, 512, { fit: "cover", withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
    if (data.length > 300_000) return Response.json({ error: "That image could not be compressed enough. Try a smaller photo." }, { status: 413 });
    await db.insert(profileAvatars).values({ userId: user.id, mime: "image/jpeg", data, updatedAt: new Date() })
      .onConflictDoUpdate({ target: profileAvatars.userId, set: { mime: "image/jpeg", data, updatedAt: new Date() } });
    const avatarUrl = `/api/profile-avatar/${user.id}?v=${Date.now()}`;
    return Response.json({ ok: true, avatarUrl }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error(JSON.stringify({ scope: "profile.avatar.upload", message: error instanceof Error ? error.message : String(error) }));
    return Response.json({ error: "Photo storage is not ready. Ask an organiser to initialize game settings, then try again." }, { status: 503 });
  }
}
