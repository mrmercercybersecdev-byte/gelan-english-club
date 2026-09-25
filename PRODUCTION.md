# Gelan English Club — Production checklist

## 1. Environment
Copy `.env.example` and set at minimum:

| Variable | Why |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string. Required for build, runtime and Drizzle schema updates. |
| `DATABASE_URL_UNPOOLED` *(optional)* | Direct PostgreSQL URL for Drizzle schema updates when `DATABASE_URL` is pooled. |
| `ADMIN_PASSWORD` | Required organiser dashboard password. Use a unique, long random value; password login is disabled when unset. |
| `SITE_URL` | Canonical URL for sitemap, robots.txt and social cards |
| `SEED_DEMO_DATA=false` | Skip demo accounts, chat messages, submissions, events, posts, groups, profiles and livestreams on first boot. Empty starter chat channels are still created. |
| `FRAME_ANCESTORS` *(optional)* | Who may embed the site in an iframe. Defaults to `'self'`; only add trusted origins if embedding is required. |
| `OPENAI_API_KEY` *(optional)* | Upgrades the AI tutors from the built-in engine to an LLM |

## 2. Database
```bash
npx drizzle-kit push      # apply schema
```
Back up any existing database before applying schema changes. Disabling seed data does not remove sample content already stored in a database.
Uploaded submission files are stored in Postgres (`submission_files.bytea`, 5 MB max each), so they survive container restarts and are covered by your normal DB backups. Schedule daily `pg_dump` backups.

## 3. Build & run
```bash
npm ci
npm run build
npm run start             # local/container hosting; Vercel manages the runtime
```
Health check: `GET /api/health` → `200 {"ok":true,...}` or `503` when the DB is unreachable.

## 4. Vercel deployment
1. Push the project to GitHub, import the repository in Vercel, and keep the detected Next.js framework settings. Vercel runs `npm ci` and `npm run build`; it manages the production runtime, so do not set `npm run start` as a deployment command.
2. Connect a managed PostgreSQL provider such as Neon. Set `DATABASE_URL` to its pooled URL and, if provided, `DATABASE_URL_UNPOOLED` to its direct URL.
3. Add `ADMIN_PASSWORD`, `SITE_URL`, `SEED_DEMO_DATA=false`, `FRAME_ANCESTORS='self'` and `DB_POOL_MAX=1` in Vercel Project Settings → Environment Variables. Add `OPENAI_API_KEY` only if you want the external AI service. Set database variables for every environment you build (Production and Preview); use a separate database for Preview.
4. Apply the schema once before the first production deployment, and again when the schema changes. Link the project with the Vercel CLI, pull Production variables into the ignored local `.env`, then run `npx drizzle-kit push`. The Drizzle config prefers `DATABASE_URL_UNPOOLED` for this step. Never commit `.env`.
5. Deploy. Set `SITE_URL` to the final HTTPS domain assigned by Vercel (or your custom domain), then redeploy so sitemap and social metadata use the canonical URL.

Vercel functions are serverless and may run in separate instances. This app currently keeps rate-limit counters, chat presence and live-room presence in process memory; these features are not shared reliably between instances. Move them to shared storage such as Redis before relying on global rate limits or consistent presence/live-room state.

## 5. What's hardened
- **Security headers**: CSP, HSTS (prod), nosniff, Referrer-Policy, Permissions-Policy (camera/mic limited to self), no `X-Powered-By`.
- **Auth**: scrypt password hashing, 30-day httpOnly session cookies (HTTPS: `Secure; SameSite=None; Partitioned` so sessions also work when embedded; HTTP: `SameSite=Lax`), expired sessions cleaned up automatically, 8-char minimum passwords.
- **Rate limiting**: login, sign-up, AI tutor, chat, uploads, forms, games and meeting signalling are all rate-limited per IP/user.
- **CSRF**: SameSite cookies + Origin checks on JSON APIs; Server Actions have built-in origin protection.
- **Uploads**: file type detected from magic bytes (not the client's claim), size capped, filenames sanitised, served only to the owner/admins with `Content-Security-Policy: sandbox` and `nosniff`.
- **Abuse caps**: max 5 pending submissions per user, 20/day; plausibility checks on game scores.
- **Resilience**: DB pool limits + statement timeout, pool error handler, error boundaries (`error.tsx`, `global-error.tsx`), structured JSON error logs.
- **SEO/PWA**: `robots.txt`, dynamic `sitemap.xml`, web manifest, app icon, Open Graph metadata.

## 6. Scaling notes
- Rate-limit counters, chat presence and live-room presence are held in memory. On serverless hosting, move these to shared storage such as Redis.
- Live video rooms are peer-to-peer WebRTC using public STUN servers. Add a TURN server (e.g. coturn) for users behind strict corporate/mobile NATs, and consider an SFU (LiveKit, mediasoup) for rooms larger than ~6 people.
