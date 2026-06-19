import { createAdminServerClient } from './server'
import type {
  Profile, PostWithAnalytics, ClientKpi,
  FollowerSnapshot, Hook, NewsFeedItem,
  BestTimeToPost, CompetitorReport, AiConversation,
  FilterState, TimeWindow
} from '@/types'
import { subDays } from 'date-fns'

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function getDateFromWindow(window: TimeWindow): Date | null {
  const now = new Date()
  switch (window) {
    case '7d':   return subDays(now, 7)
    case '30d':  return subDays(now, 30)
    case '90d':  return subDays(now, 90)
    case '365d': return subDays(now, 365)
    case 'all':  return null
  }
}

// ─────────────────────────────────────────────
// PROFILES
// ─────────────────────────────────────────────

export async function getClientProfiles(): Promise<Profile[]> {
  const db = createAdminServerClient()
  const { data, error } = await db
    .from('profiles')
    .select('*')
    .eq('is_client', true)
    .order('platform')

  if (error) throw new Error(`getClientProfiles: ${error.message}`)
  return data ?? []
}

export async function getCompetitorProfiles(): Promise<Profile[]> {
  const db = createAdminServerClient()
  const { data, error } = await db
    .from('profiles')
    .select('*')
    .eq('is_client', false)
    .order('follower_count', { ascending: false })

  if (error) throw new Error(`getCompetitorProfiles: ${error.message}`)
  return data ?? []
}

export async function upsertProfile(profile: Omit<Profile, 'id' | 'created_at'>): Promise<Profile> {
  const db = createAdminServerClient()
  const { data, error } = await db
    .from('profiles')
    .upsert(profile, { onConflict: 'platform,handle' })
    .select()
    .single()

  if (error) throw new Error(`upsertProfile: ${error.message}`)
  return data
}

// ─────────────────────────────────────────────
// KPIS
// ─────────────────────────────────────────────

export async function getClientKpis(): Promise<ClientKpi[]> {
  const db = createAdminServerClient()
  const { data, error } = await db
    .from('client_kpis')
    .select('*')

  if (error) throw new Error(`getClientKpis: ${error.message}`)
  return data ?? []
}

// ─────────────────────────────────────────────
// POSTS
// ─────────────────────────────────────────────

export async function getPosts(filters: Partial<FilterState> = {}): Promise<PostWithAnalytics[]> {
  const db = createAdminServerClient()

  let query = db
    .from('posts_with_analytics')
    .select('*')
    .order('posted_at', { ascending: false })

  if (filters.platform) query = query.eq('platform', filters.platform)
  if (filters.postType) query = query.eq('post_type', filters.postType)
  if (filters.minViews) query = query.gte('views', filters.minViews)

  if (filters.timeWindow && filters.timeWindow !== 'all') {
    const from = getDateFromWindow(filters.timeWindow)
    if (from) query = query.gte('posted_at', from.toISOString())
  }

  const { data, error } = await query.limit(200)
  if (error) throw new Error(`getPosts: ${error.message}`)
  return data ?? []
}

export async function getClientPosts(filters: Partial<FilterState> = {}): Promise<PostWithAnalytics[]> {
  const db = createAdminServerClient()

  let query = db
    .from('posts_with_analytics')
    .select('*')
    .eq('is_client', true)
    .order('posted_at', { ascending: false })

  if (filters.platform) query = query.eq('platform', filters.platform)
  if (filters.postType) query = query.eq('post_type', filters.postType)
  if (filters.minViews) query = query.gte('views', filters.minViews)

  if (filters.timeWindow && filters.timeWindow !== 'all') {
    const from = getDateFromWindow(filters.timeWindow)
    if (from) query = query.gte('posted_at', from.toISOString())
  }

  const { data, error } = await query.limit(200)
  if (error) throw new Error(`getClientPosts: ${error.message}`)
  return data ?? []
}

export async function getPostById(id: string): Promise<PostWithAnalytics | null> {
  const db = createAdminServerClient()
  const { data, error } = await db
    .from('posts_with_analytics')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function getTopPostsThisWeek(limit = 10): Promise<PostWithAnalytics[]> {
  const db = createAdminServerClient()
  const oneWeekAgo = subDays(new Date(), 7).toISOString()

  const { data, error } = await db
    .from('posts_with_analytics')
    .select('*')
    .eq('is_client', true)
    .gte('posted_at', oneWeekAgo)
    .order('views', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`getTopPostsThisWeek: ${error.message}`)
  return data ?? []
}

export async function searchPosts(query: string, profileId?: string): Promise<PostWithAnalytics[]> {
  const db = createAdminServerClient()
  const { data, error } = await db
    .rpc('search_posts', {
      search_query: query,
      profile_id_filter: profileId ?? null,
      limit_count: 50
    })

  if (error) throw new Error(`searchPosts: ${error.message}`)
  return (data ?? []) as PostWithAnalytics[]
}

export async function getUnprocessedPosts(limit = 50): Promise<PostWithAnalytics[]> {
  const db = createAdminServerClient()
  const { data, error } = await db
    .from('posts_with_analytics')
    .select('*')
    .eq('ai_processed', false)
    .order('posted_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`getUnprocessedPosts: ${error.message}`)
  return data ?? []
}

export async function markPostProcessed(postId: string, hookData: {
  hook: string
  hook_type: string
  hook_score: number
  hook_explanation: string
}): Promise<void> {
  const db = createAdminServerClient()
  const { error } = await db
    .from('posts')
    .update({
      hook: hookData.hook,
      hook_type: hookData.hook_type,
      hook_score: hookData.hook_score,
      hook_explanation: hookData.hook_explanation,
      ai_processed: true
    })
    .eq('id', postId)

  if (error) throw new Error(`markPostProcessed: ${error.message}`)
}

// ─────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────

export async function getFollowerGrowth(
  profileId: string,
  days = 90
): Promise<FollowerSnapshot[]> {
  const db = createAdminServerClient()
  const from = subDays(new Date(), days).toISOString()

  const { data, error } = await db
    .from('follower_snapshots')
    .select('*')
    .eq('profile_id', profileId)
    .gte('snapshot_at', from)
    .order('snapshot_at', { ascending: true })

  if (error) throw new Error(`getFollowerGrowth: ${error.message}`)
  return data ?? []
}

export async function getBestTimeToPost(profileId: string): Promise<BestTimeToPost[]> {
  const db = createAdminServerClient()
  const { data, error } = await db
    .from('best_time_to_post')
    .select('*')
    .eq('profile_id', profileId)

  if (error) throw new Error(`getBestTimeToPost: ${error.message}`)
  return data ?? []
}

// ─────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────

export async function getTopHooks(
  profileId?: string,
  limit = 100
): Promise<Hook[]> {
  const db = createAdminServerClient()

  let query = db
    .from('hooks')
    .select('*')
    .not('hook_score', 'is', null)
    .order('hook_score', { ascending: false })
    .limit(limit)

  if (profileId) query = query.eq('profile_id', profileId)

  const { data, error } = await query
  if (error) throw new Error(`getTopHooks: ${error.message}`)
  return data ?? []
}

export async function getClientTopHooks(limit = 20): Promise<Hook[]> {
  const db = createAdminServerClient()
  const { data: clientProfiles } = await db
    .from('profiles')
    .select('id')
    .eq('is_client', true)

  if (!clientProfiles?.length) return []

  const profileIds = clientProfiles.map(p => p.id)
  const { data, error } = await db
    .from('hooks')
    .select('*')
    .in('profile_id', profileIds)
    .not('hook_score', 'is', null)
    .order('hook_score', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`getClientTopHooks: ${error.message}`)
  return data ?? []
}

export async function getCompetitorTopHooks(limit = 20): Promise<Hook[]> {
  const db = createAdminServerClient()
  const { data: competitorProfiles } = await db
    .from('profiles')
    .select('id')
    .eq('is_client', false)

  if (!competitorProfiles?.length) return []

  const profileIds = competitorProfiles.map(p => p.id)
  const { data, error } = await db
    .from('hooks')
    .select('*')
    .in('profile_id', profileIds)
    .not('hook_score', 'is', null)
    .gte('posted_at', subDays(new Date(), 7).toISOString())
    .order('hook_score', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`getCompetitorTopHooks: ${error.message}`)
  return data ?? []
}

export async function insertHook(hook: Omit<Hook, 'id' | 'created_at'>): Promise<void> {
  const db = createAdminServerClient()
  const { error } = await db.from('hooks').upsert(hook, { onConflict: 'post_id' })
  if (error) throw new Error(`insertHook: ${error.message}`)
}

// ─────────────────────────────────────────────
// NEWS FEED
// ─────────────────────────────────────────────

export async function getNewsFeed(
  topic?: string,
  limit = 50
): Promise<NewsFeedItem[]> {
  const db = createAdminServerClient()

  let query = db
    .from('news_feed')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (topic) query = query.eq('topic', topic)

  const { data, error } = await query
  if (error) throw new Error(`getNewsFeed: ${error.message}`)
  return data ?? []
}

export async function getNewsTopics(): Promise<string[]> {
  const db = createAdminServerClient()
  const { data, error } = await db
    .from('news_feed')
    .select('topic')
    .not('topic', 'is', null)

  if (error) throw new Error(`getNewsTopics: ${error.message}`)
const topics = Array.from(new Set((data ?? []).map(r => r.topic).filter(Boolean)))
  return topics
}

// ─────────────────────────────────────────────
// COMPETITOR REPORTS
// ─────────────────────────────────────────────

export async function getLatestCompetitorReport(): Promise<CompetitorReport | null> {
  const db = createAdminServerClient()
  const { data, error } = await db
    .from('competitor_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) return null
  return data
}

export async function insertCompetitorReport(report: Omit<CompetitorReport, 'id' | 'created_at'>): Promise<void> {
  const db = createAdminServerClient()
  const { error } = await db.from('competitor_reports').insert(report)
  if (error) throw new Error(`insertCompetitorReport: ${error.message}`)
}

// ─────────────────────────────────────────────
// AI CONVERSATIONS
// ─────────────────────────────────────────────

export async function getConversation(sessionId: string): Promise<AiConversation[]> {
  const db = createAdminServerClient()
  const { data, error } = await db
    .from('ai_conversations')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`getConversation: ${error.message}`)
  return data ?? []
}

export async function saveMessage(message: Omit<AiConversation, 'id' | 'created_at'>): Promise<void> {
  const db = createAdminServerClient()
  const { error } = await db.from('ai_conversations').insert(message)
  if (error) throw new Error(`saveMessage: ${error.message}`)
}

// ─────────────────────────────────────────────
// SYNC LOGS
// ─────────────────────────────────────────────

export async function createSyncLog(
  syncType: string,
  profileId?: string,
  apifyRunId?: string
): Promise<string> {
  const db = createAdminServerClient()
  const { data, error } = await db
    .from('sync_logs')
    .insert({
      sync_type: syncType,
      profile_id: profileId ?? null,
      status: 'started',
      apify_run_id: apifyRunId ?? null
    })
    .select('id')
    .single()

  if (error) throw new Error(`createSyncLog: ${error.message}`)
  return data.id
}

export async function completeSyncLog(
  logId: string,
  postsSynced: number,
  error?: string
): Promise<void> {
  const db = createAdminServerClient()
  const { error: dbError } = await db
    .from('sync_logs')
    .update({
      status: error ? 'failed' : 'completed',
      posts_synced: postsSynced,
      error_message: error ?? null,
      completed_at: new Date().toISOString()
    })
    .eq('id', logId)

  if (dbError) throw new Error(`completeSyncLog: ${dbError.message}`)
}
