import type { ApifyInstagramPost, ApifyInstagramProfile, ApifyXTweet } from '@/types'

// ─────────────────────────────────────────────
// ACTOR INPUT CONFIGS
// ─────────────────────────────────────────────

export function instagramProfileInput(handles: string[]) {
  return {
    usernames: handles,
    resultsType: 'details',
  }
}

export function instagramPostsInput(handles: string[], maxPosts = 50) {
  return {
    username: handles,
    resultsLimit: maxPosts,
    resultsType: 'posts',
    addParentData: false,
  }
}

export function xSearchInput(keywords: string[], maxTweets = 100) {
  return {
    searchTerms: keywords,
    maxItems: maxTweets,
    sort: 'Top',
    twitterContent: 'Latest',
  }
}

// ─────────────────────────────────────────────
// DATA TRANSFORMERS
// Convert Apify raw output → our DB schema shape
// ─────────────────────────────────────────────

export function transformInstagramPost(raw: ApifyInstagramPost, profileId: string) {
  const views = raw.videoViewCount ?? raw.videoPlayCount ?? 0
  const postType = raw.type === 'Video' ? 'reel'
    : raw.type === 'Sidecar' ? 'carousel'
    : 'image'

  return {
    profile_id:       profileId,
    platform:         'instagram' as const,
    platform_post_id: raw.id ?? raw.shortCode,
    caption:          raw.caption ?? null,
    content:          raw.caption ?? null,
    media_url:        raw.url ?? null,
    thumbnail_url:    raw.displayUrl ?? null,
    post_type:        postType,
    posted_at:        raw.timestamp ? new Date(raw.timestamp).toISOString() : null,
    ai_processed:     false,
  }
}

export function transformInstagramAnalytics(raw: ApifyInstagramPost, postId: string, profileId: string) {
  const views = raw.videoViewCount ?? raw.videoPlayCount ?? 0
  const likes = raw.likesCount ?? 0
  const comments = raw.commentsCount ?? 0
  const engagement = views > 0 ? (likes + comments) / views : 0

  return {
    post_id:       postId,
    profile_id:    profileId,
    views,
    likes,
    comments,
    shares:        0,
    saves:         0,
    reach:         0,
    impressions:   0,
    engagement_rate: engagement,
    follower_count_at_time: 0, // updated separately from profile sync
  }
}

export function transformInstagramProfile(raw: ApifyInstagramProfile) {
  return {
    platform:        'instagram' as const,
    handle:          raw.username,
    display_name:    raw.fullName ?? null,
    bio:             raw.biography ?? null,
    avatar_url:      raw.profilePicUrl ?? null,
    follower_count:  raw.followersCount ?? 0,
    following_count: raw.followingCount ?? 0,
    post_count:      raw.postsCount ?? 0,
  }
}

export function transformXTweet(raw: ApifyXTweet) {
  const engagement = (raw.likeCount ?? 0) + (raw.retweetCount ?? 0) + (raw.replyCount ?? 0)
  return {
    platform:         'x' as const,
    tweet_id:         raw.id,
    content:          raw.text ?? null,
    author_handle:    raw.author?.userName ?? null,
    author_name:      raw.author?.name ?? null,
    author_avatar:    raw.author?.profilePicture ?? null,
    engagement_score: engagement,
    likes:            raw.likeCount ?? 0,
    retweets:         raw.retweetCount ?? 0,
    replies:          raw.replyCount ?? 0,
    published_at:     raw.createdAt ? new Date(raw.createdAt).toISOString() : null,
  }
}
