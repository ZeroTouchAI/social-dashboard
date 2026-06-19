// ═══════════════════════════════════════════════════════════
// DATABASE TYPES — mirror the Supabase schema exactly
// ═══════════════════════════════════════════════════════════

export type Platform = 'instagram' | 'x'
export type PostType = 'reel' | 'image' | 'carousel' | 'tweet' | 'thread' | 'video'
export type HookType = 'question' | 'stat' | 'story' | 'controversy' | 'how-to' | 'pain-point' | 'unknown'
export type ConversationRole = 'user' | 'assistant' | 'system'
export type SyncStatus = 'started' | 'completed' | 'failed'

// ─────────────────────────────────────────────
// DATABASE ROW TYPES
// ─────────────────────────────────────────────

export interface Profile {
  id: string
  platform: Platform
  handle: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  follower_count: number
  following_count: number
  post_count: number
  is_client: boolean
  niche: string | null
  last_synced_at: string | null
  created_at: string
}

export interface Post {
  id: string
  profile_id: string
  platform: Platform
  platform_post_id: string | null
  content: string | null
  caption: string | null
  media_url: string | null
  thumbnail_url: string | null
  post_type: PostType | null
  posted_at: string | null
  hook: string | null
  transcript: string | null
  hook_score: number | null
  hook_type: HookType | null
  hook_explanation: string | null
  hook_embedding: number[] | null
  ai_processed: boolean
  created_at: string
}

export interface Analytics {
  id: string
  post_id: string
  profile_id: string
  snapshot_at: string
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  reach: number
  impressions: number
  engagement_rate: number
  follower_count_at_time: number
}

export interface FollowerSnapshot {
  id: string
  profile_id: string
  count: number
  snapshot_at: string
}

export interface Hook {
  id: string
  post_id: string
  profile_id: string
  hook_text: string
  hook_score: number | null
  hook_type: HookType | null
  hook_explanation: string | null
  engagement_rate: number
  views: number
  likes: number
  platform: Platform | null
  posted_at: string | null
  created_at: string
}

export interface NewsFeedItem {
  id: string
  platform: string
  tweet_id: string | null
  content: string | null
  author_handle: string | null
  author_name: string | null
  author_avatar: string | null
  topic: string | null
  keywords_matched: string[] | null
  engagement_score: number
  likes: number
  retweets: number
  replies: number
  published_at: string | null
  embedding: number[] | null
  fetched_at: string
}

export interface CompetitorReport {
  id: string
  report_date: string
  niche: string | null
  top_hooks: HookSummary[]
  tools_mentioned: string[]
  trending_topics: string[]
  pattern_summary: string | null
  recommended_angles: string[]
  raw_response: string | null
  created_at: string
}

export interface AiConversation {
  id: string
  session_id: string
  role: ConversationRole
  content: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface SyncLog {
  id: string
  sync_type: string
  profile_id: string | null
  status: SyncStatus
  posts_synced: number
  error_message: string | null
  apify_run_id: string | null
  started_at: string
  completed_at: string | null
}

// ─────────────────────────────────────────────
// VIEW TYPES
// ─────────────────────────────────────────────

export interface PostWithAnalytics extends Post {
  handle: string
  display_name: string | null
  is_client: boolean
  avatar_url: string | null
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  engagement_rate: number
}

export interface BestTimeToPost {
  profile_id: string
  day_of_week: number  // 0=Sun, 6=Sat
  hour_of_day: number
  avg_engagement_rate: number
  avg_views: number
  post_count: number
}

export interface ClientKpi {
  profile_id: string
  platform: Platform
  handle: string
  follower_count: number
  total_views: number
  total_likes: number
  total_comments: number
  total_posts: number
  avg_engagement_rate: number
}

// ─────────────────────────────────────────────
// DOMAIN TYPES
// ─────────────────────────────────────────────

export interface HookSummary {
  hook_text: string
  hook_type: HookType
  hook_score: number
  views?: number
  engagement_rate?: number
}

export interface HookAnalysisResult {
  hook_text: string
  hook_type: HookType
  hook_score: number
  explanation: string
}

export interface CompetitorIntelResult {
  top_hooks: HookSummary[]
  tools_mentioned: string[]
  trending_topics: string[]
  pattern_summary: string
  recommended_content_angles: string[]
}

export interface ScriptOutput {
  hook: string
  body: string[]
  cta: string
  full_script: string
}

// ─────────────────────────────────────────────
// APIFY TYPES
// ─────────────────────────────────────────────

export interface ApifyInstagramPost {
  id: string
  shortCode: string
  type: string
  caption: string
  url: string
  displayUrl: string
  timestamp: string
  likesCount: number
  commentsCount: number
  videoViewCount?: number
  videoPlayCount?: number
  ownerFullName: string
  ownerUsername: string
}

export interface ApifyInstagramProfile {
  id: string
  username: string
  fullName: string
  biography: string
  profilePicUrl: string
  followersCount: number
  followingCount: number
  postsCount: number
}

export interface ApifyXTweet {
  id: string
  text: string
  author: {
    userName: string
    name: string
    profilePicture: string
  }
  likeCount: number
  retweetCount: number
  replyCount: number
  createdAt: string
  url: string
}

// ─────────────────────────────────────────────
// API RESPONSE TYPES
// ─────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ─────────────────────────────────────────────
// UI STATE TYPES
// ─────────────────────────────────────────────

export interface DateRange {
  from: Date
  to: Date
}

export type TimeWindow = '7d' | '30d' | '90d' | '365d' | 'all'

export interface FilterState {
  platform?: Platform
  postType?: PostType
  hookType?: HookType
  timeWindow: TimeWindow
  minViews?: number
  search?: string
}

export interface ChatMessage {
  id: string
  role: ConversationRole
  content: string
  timestamp: Date
  sources?: ContextSource[]
}

export interface ContextSource {
  type: 'post' | 'news' | 'hook'
  id: string
  preview: string
  relevance: number
}
