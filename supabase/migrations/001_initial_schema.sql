-- ═══════════════════════════════════════════════════════════════
-- SOCIAL INTELLIGENCE DASHBOARD — DATABASE MIGRATION
-- Run this entire file in: Supabase → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- STEP 1: Enable required extensions
-- ─────────────────────────────────────────────
create extension if not exists vector;
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm; -- for fast text search

-- ─────────────────────────────────────────────
-- STEP 2: PROFILES
-- Tracks both the client's own accounts and competitors
-- ─────────────────────────────────────────────
create table if not exists profiles (
  id               uuid primary key default gen_random_uuid(),
  platform         text not null check (platform in ('instagram', 'x')),
  handle           text not null,
  display_name     text,
  bio              text,
  avatar_url       text,
  follower_count   int default 0,
  following_count  int default 0,
  post_count       int default 0,
  is_client        boolean default false,
  niche            text,
  last_synced_at   timestamptz,
  created_at       timestamptz default now(),
  unique (platform, handle)
);

-- ─────────────────────────────────────────────
-- STEP 3: POSTS
-- All posts from client + competitors
-- ─────────────────────────────────────────────
create table if not exists posts (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid references profiles(id) on delete cascade,
  platform          text not null check (platform in ('instagram', 'x')),
  platform_post_id  text unique,
  content           text,          -- raw content / tweet text
  caption           text,          -- instagram caption
  media_url         text,
  thumbnail_url     text,
  post_type         text check (post_type in ('reel', 'image', 'carousel', 'tweet', 'thread', 'video')),
  posted_at         timestamptz,
  hook              text,          -- extracted first 1-2 lines
  transcript        text,          -- AI-generated for video
  hook_score        float check (hook_score >= 0 and hook_score <= 100),
  hook_type         text check (hook_type in ('question', 'stat', 'story', 'controversy', 'how-to', 'pain-point', 'unknown')),
  hook_explanation  text,
  hook_embedding    vector(1536),  -- for semantic search
  ai_processed      boolean default false,
  created_at        timestamptz default now()
);

-- ─────────────────────────────────────────────
-- STEP 4: ANALYTICS
-- Point-in-time snapshots (taken at each sync)
-- ─────────────────────────────────────────────
create table if not exists analytics (
  id                      uuid primary key default gen_random_uuid(),
  post_id                 uuid references posts(id) on delete cascade,
  profile_id              uuid references profiles(id) on delete cascade,
  snapshot_at             timestamptz default now(),
  views                   int default 0,
  likes                   int default 0,
  comments                int default 0,
  shares                  int default 0,
  saves                   int default 0,
  reach                   int default 0,
  impressions             int default 0,
  engagement_rate         float default 0,
  follower_count_at_time  int default 0
);

-- ─────────────────────────────────────────────
-- STEP 5: FOLLOWER SNAPSHOTS
-- Daily follower count for growth charts
-- ─────────────────────────────────────────────
create table if not exists follower_snapshots (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid references profiles(id) on delete cascade,
  count        int not null,
  snapshot_at  timestamptz default now()
);

-- ─────────────────────────────────────────────
-- STEP 6: HOOKS
-- Extracted and scored hooks (separate from posts for fast querying)
-- ─────────────────────────────────────────────
create table if not exists hooks (
  id               uuid primary key default gen_random_uuid(),
  post_id          uuid references posts(id) on delete cascade,
  profile_id       uuid references profiles(id) on delete cascade,
  hook_text        text not null,
  hook_score       float check (hook_score >= 0 and hook_score <= 100),
  hook_type        text check (hook_type in ('question', 'stat', 'story', 'controversy', 'how-to', 'pain-point', 'unknown')),
  hook_explanation text,
  engagement_rate  float default 0,
  views            int default 0,
  likes            int default 0,
  platform         text,
  posted_at        timestamptz,
  created_at       timestamptz default now()
);

-- ─────────────────────────────────────────────
-- STEP 7: NEWS FEED
-- Niche-relevant tweets scraped from X
-- ─────────────────────────────────────────────
create table if not exists news_feed (
  id               uuid primary key default gen_random_uuid(),
  platform         text default 'x',
  tweet_id         text unique,
  content          text,
  author_handle    text,
  author_name      text,
  author_avatar    text,
  topic            text,
  keywords_matched text[],        -- which client keywords triggered this
  engagement_score int default 0,
  likes            int default 0,
  retweets         int default 0,
  replies          int default 0,
  published_at     timestamptz,
  embedding        vector(1536),  -- for semantic search
  fetched_at       timestamptz default now()
);

-- ─────────────────────────────────────────────
-- STEP 8: COMPETITOR INTELLIGENCE REPORTS
-- Weekly AI-generated summaries
-- ─────────────────────────────────────────────
create table if not exists competitor_reports (
  id                        uuid primary key default gen_random_uuid(),
  report_date               date default current_date,
  niche                     text,
  top_hooks                 jsonb default '[]',
  tools_mentioned           jsonb default '[]',
  trending_topics           jsonb default '[]',
  pattern_summary           text,
  recommended_angles        jsonb default '[]',
  raw_response              text,
  created_at                timestamptz default now()
);

-- ─────────────────────────────────────────────
-- STEP 9: AI CONVERSATIONS
-- Persists chat history for AI Studio
-- ─────────────────────────────────────────────
create table if not exists ai_conversations (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null default gen_random_uuid(),
  role        text not null check (role in ('user', 'assistant', 'system')),
  content     text not null,
  metadata    jsonb default '{}',  -- store context sources used
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────────
-- STEP 10: SYNC LOGS
-- Track every Apify sync job for debugging
-- ─────────────────────────────────────────────
create table if not exists sync_logs (
  id            uuid primary key default gen_random_uuid(),
  sync_type     text not null,   -- 'instagram_client' | 'instagram_competitor' | 'x_news'
  profile_id    uuid references profiles(id),
  status        text check (status in ('started', 'completed', 'failed')),
  posts_synced  int default 0,
  error_message text,
  apify_run_id  text,
  started_at    timestamptz default now(),
  completed_at  timestamptz
);

-- ─────────────────────────────────────────────
-- STEP 11: INDEXES
-- ─────────────────────────────────────────────

-- Posts
create index if not exists idx_posts_profile_posted
  on posts(profile_id, posted_at desc);
create index if not exists idx_posts_platform
  on posts(platform);
create index if not exists idx_posts_hook_score
  on posts(hook_score desc nulls last);
create index if not exists idx_posts_ai_processed
  on posts(ai_processed) where ai_processed = false;
create index if not exists idx_posts_content_search
  on posts using gin(to_tsvector('english', coalesce(caption, '') || ' ' || coalesce(content, '') || ' ' || coalesce(transcript, '')));

-- Analytics
create index if not exists idx_analytics_post
  on analytics(post_id, snapshot_at desc);
create index if not exists idx_analytics_profile
  on analytics(profile_id, snapshot_at desc);

-- Follower snapshots
create index if not exists idx_follower_snapshots_profile
  on follower_snapshots(profile_id, snapshot_at desc);

-- Hooks
create index if not exists idx_hooks_score
  on hooks(hook_score desc nulls last);
create index if not exists idx_hooks_profile
  on hooks(profile_id, hook_score desc);
create index if not exists idx_hooks_type
  on hooks(hook_type);

-- News feed
create index if not exists idx_news_published
  on news_feed(published_at desc);
create index if not exists idx_news_topic
  on news_feed(topic);
create index if not exists idx_news_engagement
  on news_feed(engagement_score desc);
create index if not exists idx_news_content_search
  on news_feed using gin(to_tsvector('english', coalesce(content, '')));

-- AI conversations
create index if not exists idx_conversations_session
  on ai_conversations(session_id, created_at asc);

-- pgvector indexes (IVFFlat for approximate nearest neighbor)
-- NOTE: requires at least a few rows of data before building these
-- Uncomment and run AFTER you have data:
-- create index if not exists idx_posts_embedding
--   on posts using ivfflat (hook_embedding vector_cosine_ops) with (lists = 100);
-- create index if not exists idx_news_embedding
--   on news_feed using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ─────────────────────────────────────────────
-- STEP 12: HELPER VIEWS
-- ─────────────────────────────────────────────

-- Latest analytics per post (most recent snapshot)
create or replace view post_latest_analytics as
select distinct on (post_id)
  post_id,
  views,
  likes,
  comments,
  shares,
  saves,
  reach,
  engagement_rate,
  snapshot_at
from analytics
order by post_id, snapshot_at desc;

-- Posts with their latest analytics (for the Post Library)
create or replace view posts_with_analytics as
select
  p.*,
  pr.handle,
  pr.display_name,
  pr.is_client,
  pr.avatar_url,
  coalesce(a.views, 0)           as views,
  coalesce(a.likes, 0)           as likes,
  coalesce(a.comments, 0)        as comments,
  coalesce(a.shares, 0)          as shares,
  coalesce(a.saves, 0)           as saves,
  coalesce(a.engagement_rate, 0) as engagement_rate
from posts p
join profiles pr on pr.id = p.profile_id
left join post_latest_analytics a on a.post_id = p.id;

-- Best time to post (for the heatmap)
create or replace view best_time_to_post as
select
  pr.id as profile_id,
  extract(dow  from p.posted_at) as day_of_week,
  extract(hour from p.posted_at) as hour_of_day,
  round(avg(a.engagement_rate)::numeric, 4)         as avg_engagement_rate,
  round(avg(a.views)::numeric, 0)                   as avg_views,
  count(*)                                          as post_count
from posts p
join profiles pr on pr.id = p.profile_id
join post_latest_analytics a on a.post_id = p.id
where pr.is_client = true
  and p.posted_at is not null
group by pr.id,
  extract(dow  from p.posted_at),
  extract(hour from p.posted_at);

-- Client KPI summary
create or replace view client_kpis as
select
  pr.id         as profile_id,
  pr.platform,
  pr.handle,
  pr.follower_count,
  sum(a.views)                                as total_views,
  sum(a.likes)                                as total_likes,
  sum(a.comments)                             as total_comments,
  count(distinct p.id)                        as total_posts,
  round(avg(a.engagement_rate)::numeric, 4)   as avg_engagement_rate
from profiles pr
join posts p on p.profile_id = pr.id
join post_latest_analytics a on a.post_id = p.id
where pr.is_client = true
group by pr.id, pr.platform, pr.handle, pr.follower_count;

-- ─────────────────────────────────────────────
-- STEP 13: HELPER FUNCTIONS
-- ─────────────────────────────────────────────

-- Full-text search across posts
create or replace function search_posts(
  search_query text,
  profile_id_filter uuid default null,
  limit_count int default 50
)
returns table (
  id uuid, caption text, hook text, hook_score float,
  platform text, post_type text, posted_at timestamptz,
  views int, likes int, engagement_rate float, thumbnail_url text,
  handle text, is_client boolean, rank real
)
language sql stable as $$
  select
    p.id, p.caption, p.hook, p.hook_score,
    p.platform, p.post_type, p.posted_at,
    coalesce(a.views, 0), coalesce(a.likes, 0),
    coalesce(a.engagement_rate, 0), p.thumbnail_url,
    pr.handle, pr.is_client,
    ts_rank(
      to_tsvector('english', coalesce(p.caption,'') || ' ' || coalesce(p.content,'') || ' ' || coalesce(p.transcript,'')),
      plainto_tsquery('english', search_query)
    ) as rank
  from posts p
  join profiles pr on pr.id = p.profile_id
  left join post_latest_analytics a on a.post_id = p.id
  where
    (profile_id_filter is null or p.profile_id = profile_id_filter)
    and to_tsvector('english', coalesce(p.caption,'') || ' ' || coalesce(p.content,'') || ' ' || coalesce(p.transcript,''))
        @@ plainto_tsquery('english', search_query)
  order by rank desc, a.views desc
  limit limit_count;
$$;

-- Semantic search using pgvector (use after embeddings are populated)
create or replace function search_posts_semantic(
  query_embedding vector(1536),
  profile_id_filter uuid default null,
  match_count int default 10
)
returns table (
  id uuid, caption text, hook text, hook_score float,
  platform text, posted_at timestamptz,
  views int, engagement_rate float,
  similarity float
)
language sql stable as $$
  select
    p.id, p.caption, p.hook, p.hook_score,
    p.platform, p.posted_at,
    coalesce(a.views, 0),
    coalesce(a.engagement_rate, 0),
    1 - (p.hook_embedding <=> query_embedding) as similarity
  from posts p
  left join post_latest_analytics a on a.post_id = p.id
  where
    p.hook_embedding is not null
    and (profile_id_filter is null or p.profile_id = profile_id_filter)
  order by p.hook_embedding <=> query_embedding
  limit match_count;
$$;

-- Semantic search for news
create or replace function search_news_semantic(
  query_embedding vector(1536),
  match_count int default 10
)
returns table (
  id uuid, content text, author_handle text,
  topic text, engagement_score int, published_at timestamptz,
  similarity float
)
language sql stable as $$
  select
    n.id, n.content, n.author_handle,
    n.topic, n.engagement_score, n.published_at,
    1 - (n.embedding <=> query_embedding) as similarity
  from news_feed n
  where n.embedding is not null
  order by n.embedding <=> query_embedding
  limit match_count;
$$;

-- ─────────────────────────────────────────────
-- STEP 14: ROW LEVEL SECURITY
-- Basic RLS — service role key bypasses all of this
-- ─────────────────────────────────────────────
alter table profiles           enable row level security;
alter table posts               enable row level security;
alter table analytics           enable row level security;
alter table follower_snapshots  enable row level security;
alter table hooks               enable row level security;
alter table news_feed           enable row level security;
alter table competitor_reports  enable row level security;
alter table ai_conversations    enable row level security;
alter table sync_logs           enable row level security;

-- Allow authenticated users to read all data
create policy "Authenticated users can read all data"
  on profiles for select to authenticated using (true);
create policy "Authenticated users can read posts"
  on posts for select to authenticated using (true);
create policy "Authenticated users can read analytics"
  on analytics for select to authenticated using (true);
create policy "Authenticated users can read follower snapshots"
  on follower_snapshots for select to authenticated using (true);
create policy "Authenticated users can read hooks"
  on hooks for select to authenticated using (true);
create policy "Authenticated users can read news"
  on news_feed for select to authenticated using (true);
create policy "Authenticated users can read reports"
  on competitor_reports for select to authenticated using (true);
create policy "Authenticated users can read conversations"
  on ai_conversations for select to authenticated using (true);
create policy "Authenticated users can insert conversations"
  on ai_conversations for insert to authenticated with check (true);
create policy "Authenticated users can read sync logs"
  on sync_logs for select to authenticated using (true);

-- ─────────────────────────────────────────────
-- DONE
-- ─────────────────────────────────────────────
-- Verify with:
-- select table_name from information_schema.tables
-- where table_schema = 'public' order by table_name;
