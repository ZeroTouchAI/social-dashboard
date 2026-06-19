import { NextRequest } from 'next/server'
import { getDatasetItems } from '@/lib/apify/client'
import {
  transformInstagramPost,
  transformInstagramAnalytics,
  transformInstagramProfile,
} from '@/lib/apify/actors'
import { createAdminServerClient } from '@/lib/supabase/server'
import { completeSyncLog, upsertProfile } from '@/lib/supabase/queries'
import { jsonResponse, errorResponse } from '@/lib/utils'
import type { ApifyInstagramPost, ApifyInstagramProfile } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  const url    = new URL(req.url)
  const logId  = url.searchParams.get('logId')
  const type   = url.searchParams.get('type') ?? 'client' // 'client' | 'competitor' | 'profile'

  let body: { datasetId?: string; runId?: string; status?: string }
  try {
    body = await req.json()
  } catch {
    return errorResponse('Invalid JSON body', 400)
  }

  if (body.status === 'FAILED') {
    if (logId) await completeSyncLog(logId, 0, 'Apify run failed')
    return jsonResponse({ ok: false, reason: 'Apify run failed' })
  }

  if (!body.datasetId) {
    return errorResponse('Missing datasetId in webhook payload', 400)
  }

  const db = createAdminServerClient()
  let synced = 0

  try {
    // ── Handle profile sync (follower snapshots) ──
    if (type === 'profile') {
      const profiles = await getDatasetItems<ApifyInstagramProfile>(body.datasetId)
      for (const raw of profiles) {
        const profileData = transformInstagramProfile(raw)
        const profile = await upsertProfile({ ...profileData, is_client: true })

        // Save follower snapshot
        await db.from('follower_snapshots').insert({
          profile_id: profile.id,
          count:      raw.followersCount ?? 0,
        })
      }
      return jsonResponse({ ok: true, type: 'profile', synced: profiles.length })
    }

    // ── Handle post sync (client or competitor) ──
    const isClient = type === 'client'
    const posts    = await getDatasetItems<ApifyInstagramPost>(body.datasetId)

    for (const raw of posts) {
      try {
        // 1. Upsert profile
        const profileData = {
          platform:     'instagram' as const,
          handle:       raw.ownerUsername,
          display_name: raw.ownerFullName ?? null,
          is_client:    isClient,
        }
        const { data: profile, error: profileErr } = await db
          .from('profiles')
          .upsert(profileData, { onConflict: 'platform,handle' })
          .select()
          .single()

        if (profileErr || !profile) {
          console.error(`Profile upsert failed for ${raw.ownerUsername}:`, profileErr?.message)
          continue
        }

        // 2. Upsert post
        const postData = transformInstagramPost(raw, profile.id)
        const { data: post, error: postErr } = await db
          .from('posts')
          .upsert(postData, { onConflict: 'platform_post_id' })
          .select()
          .single()

        if (postErr || !post) {
          console.error(`Post upsert failed:`, postErr?.message)
          continue
        }

        // 3. Insert analytics snapshot
        const analyticsData = transformInstagramAnalytics(raw, post.id, profile.id)
        await db.from('analytics').insert(analyticsData)

        synced++
      } catch (e) {
        console.error('Error processing post:', e)
      }
    }

    // 4. Update sync log
    if (logId) await completeSyncLog(logId, synced)

    // 5. Trigger AI hook scoring for new unprocessed posts (fire-and-forget)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (appUrl) {
      fetch(`${appUrl}/api/ai/score-hooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': process.env.CRON_SECRET!,
        },
        body: JSON.stringify({ limit: 20 }),
      }).catch(e => console.error('Failed to trigger hook scoring:', e))
    }

    return jsonResponse({ ok: true, type, synced })

  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    if (logId) await completeSyncLog(logId, synced, msg)
    return errorResponse(msg, 500)
  }
}
