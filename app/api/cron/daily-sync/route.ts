import { NextRequest } from 'next/server'
import { createAdminServerClient } from '@/lib/supabase/server'
import { fetchInstagramProfile, fetchInstagramPosts, fetchXPosts, transformInstagramProfile, transformInstagramPost, transformInstagramAnalytics, transformXTweet } from '@/lib/apify/actors'
import { createSyncLog, completeSyncLog } from '@/lib/supabase/queries'
import { validateCronSecret, jsonResponse, errorResponse } from '@/lib/utils'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  if (!validateCronSecret(req)) {
    return errorResponse('Unauthorized', 401)
  }

  const db = createAdminServerClient()
  const igHandle   = process.env.CLIENT_INSTAGRAM_HANDLE
  const competitors = (process.env.COMPETITOR_HANDLES ?? '').split(',').map(h => h.trim()).filter(Boolean)
  const keywords   = (process.env.CLIENT_NICHE_KEYWORDS ?? '').split(',').map(k => k.trim()).filter(Boolean)

  let synced = 0
  const errors: string[] = []

  // ── 1. Sync client Instagram profile ──
  if (igHandle) {
    try {
      const logId = await createSyncLog('instagram_profile')
      const raw = await fetchInstagramProfile(igHandle)
      if (raw) {
        const profileData = transformInstagramProfile(raw)
        const { data: profile } = await db
          .from('profiles')
          .upsert({ ...profileData, is_client: true, niche: null, last_synced_at: new Date().toISOString() }, { onConflict: 'platform,handle' })
          .select().single()

        if (profile) {
          await db.from('follower_snapshots').insert({ profile_id: profile.id, count: raw.follower_count ?? 0 })
        }
      }
      await completeSyncLog(logId, 1)
    } catch (e) {
      errors.push(`instagram_profile: ${e instanceof Error ? e.message : 'Unknown'}`)
    }
  }

// ── 2. Sync client Instagram posts ──
  if (igHandle) {
    try {
      const logId = await createSyncLog('instagram_client')
      const posts = await fetchInstagramPosts(igHandle, 30)

      // Make sure profile exists first
      const { data: profile } = await db
        .from('profiles')
        .upsert({ platform: 'instagram', handle: igHandle, is_client: true, niche: null, last_synced_at: new Date().toISOString() }, { onConflict: 'platform,handle' })
        .select('id').single()
      if (!profile) throw new Error('Could not create profile')

      for (const raw of posts) {

        const postData = transformInstagramPost(raw, profile.id)
        const { data: post } = await db.from('posts').upsert(postData, { onConflict: 'platform_post_id' }).select().single()
        if (!post) continue

        const analyticsData = transformInstagramAnalytics(raw, post.id, profile.id)
        await db.from('analytics').insert(analyticsData)
        synced++
      }
      await completeSyncLog(logId, synced)
    } catch (e) {
      errors.push(`instagram_client: ${e instanceof Error ? e.message : 'Unknown'}`)
    }
  }

  // ── 3. Sync competitor Instagram posts ──
  for (const handle of competitors) {
    try {
      const posts = await fetchInstagramPosts(handle, 10)
      for (const raw of posts) {
        const { data: profile } = await db.from('profiles')
          .upsert({ platform: 'instagram', handle, is_client: false, niche: null, last_synced_at: new Date().toISOString() }, { onConflict: 'platform,handle' })
          .select().single()
        if (!profile) continue

        const postData = transformInstagramPost(raw, profile.id)
        const { data: post } = await db.from('posts').upsert(postData, { onConflict: 'platform_post_id' }).select().single()
        if (!post) continue

        const analyticsData = transformInstagramAnalytics(raw, post.id, profile.id)
        await db.from('analytics').insert(analyticsData)
      }
    } catch (e) {
      errors.push(`competitor_${handle}: ${e instanceof Error ? e.message : 'Unknown'}`)
    }
  }

  // ── 4. Sync X niche news ──
  if (keywords.length > 0) {
    try {
      const logId = await createSyncLog('x_news')
      const tweets = await fetchXPosts(keywords, 50)

      for (const raw of tweets) {
        const tweetData = transformXTweet(raw)
        const matched = keywords.filter(kw => raw.text?.toLowerCase().includes(kw.toLowerCase()))
        await db.from('news_feed').upsert(
          { ...tweetData, keywords_matched: matched, topic: matched[0] ?? null },
          { onConflict: 'tweet_id' }
        )
      }
      await completeSyncLog(logId, tweets.length)
    } catch (e) {
      errors.push(`x_news: ${e instanceof Error ? e.message : 'Unknown'}`)
    }
  }

  // ── 5. Trigger hook scoring ──
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    fetch(`${appUrl}/api/ai/score-hooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-cron-secret': process.env.CRON_SECRET! },
      body: JSON.stringify({ limit: 20 }),
    }).catch(e => console.error('Hook scoring failed:', e))
  }

  return jsonResponse({ synced, errors, timestamp: new Date().toISOString() })
}
