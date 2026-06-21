import type { ApifyInstagramPost, ApifyInstagramProfile, ApifyXTweet } from '@/types'

// ─────────────────────────────────────────────
// RAPIDAPI CONFIG
// ─────────────────────────────────────────────
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!
const RAPIDAPI_HOST_INSTAGRAM = 'instagram-scraper-stable-api.p.rapidapi.com'
const RAPIDAPI_HOST_X = 'twitter-x-api.p.rapidapi.com'

// ─────────────────────────────────────────────
// INSTAGRAM FUNCTIONS
// ─────────────────────────────────────────────

export async function fetchInstagramProfile(handle: string) {
  const url = `https://${RAPIDAPI_HOST_INSTAGRAM}/v1/user_info?username=${handle}`
  const res = await fetch(url, {
    headers: {
      'x-rapidapi-key':  RAPIDAPI_KEY,
      'x-rapidapi-host': RAPIDAPI_HOST_INSTAGRAM,
    },
  })
  if (!res.ok) throw new Error(`Instagram profile fetch failed: ${res.status}`)
  const data = await res.json()
  return data?.data?.user ?? null
}

export async function fetchInstagramPosts(handle: string, maxPosts = 20) {
  const url = `https://${RAPIDAPI_HOST_INSTAGRAM}/v1/posts?username=${handle}&limit=${maxPosts}`
  const res = await fetch(url, {
    headers: {
      'x-rapidapi-key':  RAPIDAPI_KEY,
      'x-rapidapi-host': RAPIDAPI_HOST_INSTAGRAM,
    },
  })
  if (!res.ok) throw new Error(`Instagram posts fetch failed: ${res.status}`)
  const data = await res.json()
  return data?.data?.items ?? []
}

export async function fetchXPosts(keywords: string[], maxPosts = 50) {
  const query = keywords.join(' OR ')
  const url = `https://${RAPIDAPI_HOST_X}/twitter/search?query=${encodeURIComponent(query)}&count=${maxPosts}&type=Top`
  const res = await fetch(url, {
    headers: {
      'x-rapidapi-key':  RAPIDAPI_KEY,
      'x-rapidapi-host': RAPIDAPI_HOST_X,
    },
  })
  if (!res.ok) throw new Error(`X posts fetch failed: ${res.status}`)
  const data = await res.json()
  return data?.results ?? []
}

// ─────────────────────────────────────────────
// DATA TRANSFORMERS
// Convert RapidAPI raw output → our DB schema
// ─────────────────────────────────────────────

export function transformInstagramPost(raw: any, profileId: string) {
  const views    = raw.play_count ?? raw.view_count ?? 0
  const postType = raw.media_type === 2 ? 'reel'
    : raw.media_type === 8 ? 'carousel'
    : 'image'

  return {
    profile_id:       profileId,
    platform:         'instagram' as const,
    platform_post_id: raw.id ?? raw.pk,
    caption:          raw.caption?.text ?? null,
    content:          raw.caption?.text ?? null,
    media_url:        raw.image_versions2?.candidates?.[0]?.url ?? null,
    thumbnail_url:    raw.image_versions2?.candidates?.[0]?.url ?? null,
    post_type:        postType,
    posted_at:        raw.taken_at ? new Date(raw.taken_at * 1000).toISOString() : null,
    ai_processed:     false,
  }
}

export function transformInstagramAnalytics(raw: any, postId: string, profileId: string) {
  const views    = raw.play_count ?? raw.view_count ?? 0
  const likes    = raw.like_count ?? 0
  const comments = raw.comment_count ?? 0
  const engagement = views > 0 ? (likes + comments) / views : 0

  return {
    post_id:                postId,
    profile_id:             profileId,
    views,
    likes,
    comments,
    shares:                 0,
    saves:                  raw.saved_count ?? 0,
    reach:                  0,
    impressions:            0,
    engagement_rate:        engagement,
    follower_count_at_time: 0,
  }
}

export function transformInstagramProfile(raw: any) {
  return {
    platform:        'instagram' as const,
    handle:          raw.username,
    display_name:    raw.full_name ?? null,
    bio:             raw.biography ?? null,
    avatar_url:      raw.profile_pic_url ?? null,
    follower_count:  raw.follower_count ?? 0,
    following_count: raw.following_count ?? 0,
    post_count:      raw.media_count ?? 0,
  }
}

export function transformXTweet(raw: any) {
  const engagement = (raw.favorite_count ?? 0) + (raw.retweet_count ?? 0) + (raw.reply_count ?? 0)
  return {
    platform:         'x' as const,
    tweet_id:         raw.tweet_id ?? raw.id_str,
    content:          raw.text ?? raw.full_text ?? null,
    author_handle:    raw.user?.screen_name ?? null,
    author_name:      raw.user?.name ?? null,
    author_avatar:    raw.user?.profile_image_url ?? null,
    engagement_score: engagement,
    likes:            raw.favorite_count ?? 0,
    retweets:         raw.retweet_count ?? 0,
    replies:          raw.reply_count ?? 0,
    published_at:     raw.created_at ? new Date(raw.created_at).toISOString() : null,
  }
}

// Keep these exports so existing imports don't break
export function instagramPostsInput(handles: string[], maxPosts = 50) {
  return { handles, maxPosts }
}

export function instagramProfileInput(handles: string[]) {
  return { handles }
}

export function xSearchInput(keywords: string[], maxTweets = 100) {
  return { keywords, maxTweets }
}
