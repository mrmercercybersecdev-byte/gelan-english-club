import { db } from "@/db";
import { notifications } from "@/db/schema";
import { logError } from "./security";

export async function notify(userId: number, n: { kind: string; title: string; body?: string; href?: string }) {
  try {
    await db.insert(notifications).values({
      userId,
      kind: n.kind.slice(0, 30),
      title: n.title.slice(0, 160),
      body: (n.body ?? "").slice(0, 500),
      href: n.href?.slice(0, 300) ?? null,
    });
  } catch (err) {
    logError("notify", err, { userId });
  }
}
