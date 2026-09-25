import { headers } from "next/headers";

/** Cookie `secure` flag: on in production unless explicitly disabled (e.g. plain-HTTP intranet deployments). */
export function cookieSecure() {
  return process.env.NODE_ENV === "production" && process.env.COOKIE_INSECURE !== "1";
}

/**
 * Options for auth cookies. When served over HTTPS we use SameSite=None + Secure + Partitioned (CHIPS)
 * so sessions keep working when the site is embedded in an iframe (previews, portals, site builders).
 * Cross-site request forgery is still blocked by Origin checks on APIs and Next.js Server Action origin checks.
 */
export function authCookieOptions() {
  const secure = cookieSecure();
  return secure
    ? ({ httpOnly: true, secure: true, sameSite: "none", partitioned: true, path: "/" } as const)
    : ({ httpOnly: true, secure: false, sameSite: "lax", path: "/" } as const);
}

export async function clientIp(): Promise<string> {
  try {
    const h = await headers();
    return (
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      h.get("cf-connecting-ip") ||
      "unknown"
    );
  } catch {
    return "unknown";
  }
}

export function ipFromRequest(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

/* ---------------- Rate limiting (sliding window, in-memory) ---------------- */
type Bucket = number[];
const g = globalThis as typeof globalThis & { __wecRate?: Map<string, Bucket>; __wecRateSweep?: number };
const store = (g.__wecRate ??= new Map());

export const LIMITS = {
  login: { max: 10, windowSec: 300 },
  signup: { max: 5, windowSec: 3600 },
  ai: { max: 30, windowSec: 60 },
  chat: { max: 20, windowSec: 30 },
  upload: { max: 10, windowSec: 600 },
  form: { max: 8, windowSec: 300 },
  game: { max: 30, windowSec: 60 },
  write: { max: 30, windowSec: 60 },
  signal: { max: 900, windowSec: 60 },
} as const;

export type LimitName = keyof typeof LIMITS;

/** Returns `null` if allowed, otherwise the number of seconds until retry. */
export function rateLimit(name: LimitName, key: string): number | null {
  const { max, windowSec } = LIMITS[name];
  const now = Date.now();
  const k = `${name}:${key}`;
  const cutoff = now - windowSec * 1000;
  const bucket = (store.get(k) ?? []).filter((t: number) => t > cutoff);
  if (bucket.length >= max) {
    store.set(k, bucket);
    return Math.max(1, Math.ceil((bucket[0] + windowSec * 1000 - now) / 1000));
  }
  bucket.push(now);
  store.set(k, bucket);

  // periodic sweep to bound memory
  if (!g.__wecRateSweep || now - g.__wecRateSweep > 60_000) {
    g.__wecRateSweep = now;
    for (const [key2, b] of store) if (!b.length || b[b.length - 1] < now - 3600_000) store.delete(key2);
  }
  return null;
}

export async function limitAction(name: LimitName, extraKey = ""): Promise<string | null> {
  const ip = await clientIp();
  const wait = rateLimit(name, `${ip}:${extraKey}`);
  return wait ? `Too many attempts — please try again in ${wait}s.` : null;
}

export function limitRequest(req: Request, name: LimitName, extraKey = ""): Response | null {
  const wait = rateLimit(name, `${ipFromRequest(req)}:${extraKey}`);
  if (!wait) return null;
  return Response.json({ error: `Too many requests — try again in ${wait}s.` }, { status: 429, headers: { "Retry-After": String(wait) } });
}

/** Basic same-origin check for state-changing JSON endpoints (defence in depth on top of SameSite cookies). */
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients / same-origin navigations
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/* ---------------- Logging ---------------- */
export function logError(scope: string, err: unknown, extra?: Record<string, unknown>) {
  const e = err instanceof Error ? { message: err.message, stack: err.stack?.split("\n").slice(0, 4).join(" | ") } : { message: String(err) };
  console.error(JSON.stringify({ level: "error", scope, time: new Date().toISOString(), ...e, ...extra }));
}

export function logInfo(scope: string, msg: string, extra?: Record<string, unknown>) {
  console.log(JSON.stringify({ level: "info", scope, time: new Date().toISOString(), msg, ...extra }));
}

export function isDefaultAdminPassword() {
  return !process.env.ADMIN_PASSWORD;
}
