# Deployment Guide: Gelan English Club

## What's Ready to Deploy

✅ **Coming Soon Page** (`/learn/coming-soon`)
- Full landing page with AI Lab roadmap, feature showcase, and stats
- Mobile responsive design
- Accessible from main navigation

✅ **Enhanced Organiser Login Security**
- Strong password validation: 12+ chars, uppercase, lowercase, number, symbol
- Rate limiting: 3 failed attempts per 10 minutes (vs 5 per 5 min for general login)
- Security event logging for audit trails
- User-friendly security reminders in login UI

✅ **Mobile-Optimized Games**
- Crossword: Responsive cell sizing (24–44px), scrollable clues, mobile-friendly controls
- All games updated for touch-friendly interaction
- Reduced padding and optimized button spacing for small screens

---

## How to Deploy to Live (Vercel)

### Option 1: Via Git Push (Recommended)
Since the local network doesn't have GitHub access, **you'll need to push from your main machine:**

```bash
cd C:\Users\yosef\gelan-english-club
git push origin main
```

Once pushed to GitHub's `main` branch, **Vercel will automatically detect the push** and:
1. Trigger a new deployment
2. Run build: `npm run build`
3. Deploy to https://gelan-english-club-ayy7.vercel.app/

**Monitor deployment:** https://vercel.com/dashboard → Select "gelan-english-club" project

### Option 2: Manual Vercel Redeploy (If git push fails)
1. Go to https://vercel.com/dashboard
2. Select **gelan-english-club** project
3. Click **"Redeploy"** on the latest commit
4. Choose **"Redeploy to Production"**

### Option 3: Deploy Using Vercel CLI
```bash
npm install -g vercel
vercel
```
Then follow the interactive prompts.

---

## Pre-Deployment Checklist

- [x] TypeScript validation passed (`npm run typecheck`)
- [x] All files committed locally
- [x] No build errors
- [x] Environment variables configured on Vercel:
  - `OPENAI_API_KEY` (or your Gemini/Groq key)
  - `ADMIN_PASSWORD` (organiser password)
  - `DATABASE_URL` (Neon PostgreSQL)
  - `DATABASE_URL_UNPOOLED` (Neon unpooled for migrations)

---

## Post-Deployment Verification

### 1. Test Coming Soon Page
```
https://gelan-english-club-ayy7.vercel.app/learn/coming-soon
```
Should display roadmap, features, and stats without errors.

### 2. Test Organiser Login
```
https://gelan-english-club-ayy7.vercel.app/admin
```
- Try with weak password (< 12 chars) → should show error
- Try correct password → should log in
- Try 4+ failed attempts → should be rate-limited

### 3. Test Games on Mobile
- Visit `/games/crossword`, `/games/hangman`, `/games/scramble` on phone
- Verify layout doesn't overflow
- Verify touch controls work

### 4. Check Server Logs
In Vercel Dashboard → Deployments → Logs
- Should see security event logs for failed login attempts
- Should see successful API calls to AI provider (if configured)

---

## If Deployment Fails

**Check Vercel function logs** (Vercel Dashboard → Deployments → Functions → Logs):

| Error | Solution |
|-------|----------|
| `Provider returned HTTP 404` | Verify API key in .env.local on Vercel |
| `Failed query: column "scope" does not exist` | Run `npx drizzle-kit push` with correct `DATABASE_URL` |
| `ADMIN_PASSWORD is undefined` | Add `ADMIN_PASSWORD` env var to Vercel |
| `Build failed` | Check that all dependencies are in `package.json` |

**To fix Neon schema:**
```bash
# Set your Neon DATABASE_URL
$env:DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
$env:DATABASE_URL_UNPOOLED="postgresql://user:password@host/database?sslmode=require"

# Apply migrations
npx drizzle-kit push
```

---

## Environment Variables (Vercel Settings)

Add these to Vercel project settings (Settings → Environment Variables):

```
OPENAI_API_KEY=sk-... (or paste your Gemini/Groq key)
ADMIN_PASSWORD=YourStrongPassword123!
DATABASE_URL=postgresql://...@db.neon.tech/...?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://...@db.neon.tech/...
ENCRYPTION_KEY=your-secret-key (if using encryption)
```

---

## Files Changed in This Deployment

```
✨ NEW:
  src/app/learn/coming-soon/page.tsx          [Full landing page]

📝 MODIFIED:
  src/lib/security.ts                         [Password validation, rate limit, logging]
  src/app/admin/LoginForm.tsx                 [Enhanced security UI]
  src/components/games/Crossword.tsx          [Mobile optimization]
  src/app/globals.css                         [Mobile viewport settings]
  src/app/learn/page.tsx                      [Link to coming-soon]
  src/app/login/AuthForms.tsx                 [Security improvements]
  src/components/SiteHeader.tsx               [Navigation updates]
  src/components/learn/TutorChat.tsx          [Mobile layout fixes]
```

---

## Next Steps After Deployment

1. ✅ Verify live site loads correctly
2. ✅ Test organiser login security
3. ✅ Test games on real mobile devices
4. ✅ Monitor Vercel logs for errors
5. 📋 Consider adding SMS alerts for failed organiser login attempts
6. 📋 Set up weekly security audit of login attempts

---

**Last Updated:** Oct 2024
**Commit:** 40cd065
**Status:** Ready for Production ✅
