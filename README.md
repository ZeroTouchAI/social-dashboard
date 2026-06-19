# Social Intelligence Dashboard

A premium, per-client social media intelligence platform for Instagram & X.
Built with Next.js 14, Supabase, Apify, and Claude (Anthropic).

---

## Phase 1 Setup — Complete These Steps In Order

### Step 1 — Create Your Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for it to provision (about 2 minutes)
3. Go to **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### Step 2 — Enable pgvector Extension

In your Supabase project:
1. Go to **Database → Extensions**
2. Search for `vector`
3. Enable it

OR run in **SQL Editor**:
```sql
create extension if not exists vector;
```

### Step 3 — Run the Database Migration

1. Go to **SQL Editor → New Query**
2. Open the file `supabase/migrations/001_initial_schema.sql`
3. Paste the entire contents and click **Run**
4. Verify: go to **Table Editor** — you should see 9 tables

### Step 4 — Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-...
APIFY_API_KEY=apify_api_...
CLIENT_INSTAGRAM_HANDLE=your_handle_here
CLIENT_X_HANDLE=your_x_handle
CLIENT_NICHE_KEYWORDS=short term rental,airbnb,vacation rental
COMPETITOR_HANDLES=handle1,handle2,handle3
CRON_SECRET=run-this-to-generate: openssl rand -hex 32
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 5 — Install Dependencies

```bash
npm install
```

### Step 6 — Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

The dashboard will show empty states — that's correct. Run your first sync next.

### Step 7 — Trigger Your First Sync (Manual)

With the dev server running, call the sync cron manually:

```bash
curl "http://localhost:3000/api/cron/daily-sync?secret=YOUR_CRON_SECRET"
```

This triggers Apify runs. They take 2–5 minutes to complete and POST back to your webhook.

**For local development**, Apify can't reach localhost. Use one of:
- [ngrok](https://ngrok.com): `ngrok http 3000` → use the HTTPS URL as `NEXT_PUBLIC_APP_URL`
- Deploy to Vercel first, then trigger sync from there

---

## Architecture

```
Instagram / X
  ↓ (Apify scrapes)
/api/sync/instagram   ← Apify webhook on completion
/api/sync/x
  ↓ (upsert into Supabase)
posts / analytics / follower_snapshots / news_feed
  ↓ (triggers automatically)
/api/ai/score-hooks   ← Claude scores every new post's hook
  ↓
hooks table populated
  ↓
Dashboard reads from views:
  - posts_with_analytics
  - best_time_to_post
  - client_kpis
```

---

## Cron Schedule

| Job | Schedule | What it does |
|-----|----------|--------------|
| `/api/cron/daily-sync` | Daily at 6am UTC | Triggers all Apify scrapes |
| `/api/cron/weekly-report` | Mondays at 8am UTC | Competitor AI report + hook batch scoring |

Both are configured in `vercel.json` and run automatically on Vercel.

---

## Deploying a New Client

1. Fork this repo to a new Vercel project
2. Create a new Supabase project for the client
3. Run the migration SQL in their Supabase project
4. Set all env vars in Vercel dashboard with client-specific values:
   - `CLIENT_INSTAGRAM_HANDLE`
   - `CLIENT_X_HANDLE`
   - `COMPETITOR_HANDLES`
   - `CLIENT_NICHE_KEYWORDS`
   - New Supabase URL + keys
5. Deploy — Vercel crons activate automatically
6. Trigger first sync: `curl https://your-vercel-url.vercel.app/api/cron/daily-sync?secret=CRON_SECRET`

---

## Phase Build Order

| Phase | What's built | Status |
|-------|-------------|--------|
| 1 | Database, scaffold, sync pipeline, analytics overview | ✅ This phase |
| 2 | Post Library (full grid, search, detail drawer) | Next |
| 3 | Apify integration + first real data sync | Next |
| 4 | Hook Intelligence module | After sync is live |
| 5 | Hook scoring AI job (batch all existing posts) | After sync is live |
| 6 | Competitor Intelligence module | After sync is live |
| 7 | Niche News Feed module | After sync is live |
| 8 | AI Studio (chat UI + streaming) | After data is populated |
| 9 | Polish: loading states, mobile, error handling | Final |

---

## Key Files

| File | Purpose |
|------|---------|
| `supabase/migrations/001_initial_schema.sql` | **Run this first** — full DB setup |
| `.env.local.example` | Copy to `.env.local` and fill in |
| `lib/supabase/queries.ts` | All database query functions |
| `lib/ai/claude.ts` | Anthropic client + helpers |
| `lib/ai/prompts.ts` | All AI prompt templates |
| `lib/ai/rag.ts` | RAG context assembly for AI chat |
| `lib/apify/client.ts` | Apify client + dataset helpers |
| `lib/apify/actors.ts` | Actor configs + data transformers |
| `app/api/cron/daily-sync/route.ts` | Triggers all Apify scrapes |
| `app/api/sync/instagram/route.ts` | Apify webhook → Supabase |
| `app/api/ai/score-hooks/route.ts` | Batch hook scoring with Claude |
| `app/api/ai/chat/route.ts` | Streaming RAG chat |
| `vercel.json` | Cron schedule |

---

## Design System

| Token | Value | Used for |
|-------|-------|----------|
| `--bg-base` | `#0E0E10` | Page background |
| `--bg-surface` | `#1A1A1E` | Cards |
| `--bg-elevated` | `#222226` | Inputs, hover states |
| `--teal` | `#00D9B8` | Primary accent, metrics |
| `--amber` | `#F5A623` | Hooks, warnings, engagement |
| `--success` | `#22C55E` | Positive trends |
| `--danger` | `#EF4444` | Negative trends |
| Font display | Space Grotesk | All text |
| Font mono | JetBrains Mono | Numbers, metrics |
