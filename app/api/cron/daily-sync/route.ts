import { NextRequest } from 'next/server'
import { runActorAsync, getApifyClient, ACTORS } from '@/lib/apify/client'
import { instagramPostsInput, instagramProfileInput, xSearchInput } from '@/lib/apify/actors'
import { createSyncLog, completeSyncLog } from '@/lib/supabase/queries'
import { validateCronSecret, jsonResponse, errorResponse } from '@/lib/utils'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  // Auth check
  if (!validateCronSecret(req)) {
    return errorResponse('Unauthorized', 401)
  }

  const appUrl     = process.env.NEXT_PUBLIC_APP_URL!
  const igHandle   = process.env.CLIENT_INSTAGRAM_HANDLE
  const xHandle    = process.env.CLIENT_X_HANDLE
  const competitors = (process.env.COMPETITOR_HANDLES ?? '').split(',').map(h => h.trim()).filter(Boolean)
  const keywords   = (process.env.CLIENT_NICHE_KEYWORDS ?? '').split(',').map(k => k.trim()).filter(Boolean)

  const jobs: string[] = []
  const errors: string[] = []

  // ── 1. Sync client's own Instagram ──
  if (igHandle) {
    try {
      const logId = await createSyncLog('instagram_client')
      const runId = await runActorAsync(
        ACTORS.INSTAGRAM_POSTS,
        instagramPostsInput([igHandle], 50),
        `${appUrl}/api/sync/instagram?logId=${logId}&type=client`
      )
      jobs.push(`instagram_client:${runId}`)
      console.log(`[cron] Started Instagram client sync: ${runId}`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      errors.push(`instagram_client: ${msg}`)
    }
  }

  // ── 2. Sync Instagram profile (for follower count) ──
  if (igHandle) {
    try {
      const runId = await runActorAsync(
        ACTORS.INSTAGRAM_PROFILE,
        instagramProfileInput([igHandle]),
        `${appUrl}/api/sync/instagram?type=profile`
      )
      jobs.push(`instagram_profile:${runId}`)
    } catch (e) {
      errors.push(`instagram_profile: ${e instanceof Error ? e.message : 'Unknown'}`)
    }
  }

  // ── 3. Sync competitor Instagram accounts ──
  if (competitors.length > 0) {
    // Batch into groups of 5 to avoid timeouts
    const batches = []
    for (let i = 0; i < competitors.length; i += 5) {
      batches.push(competitors.slice(i, i + 5))
    }

    for (const batch of batches) {
      try {
        const logId = await createSyncLog('instagram_competitor')
        const runId = await runActorAsync(
          ACTORS.INSTAGRAM_POSTS,
          instagramPostsInput(batch, 20),
          `${appUrl}/api/sync/instagram?logId=${logId}&type=competitor`
        )
        jobs.push(`instagram_competitor:${runId}`)
      } catch (e) {
        errors.push(`instagram_competitor: ${e instanceof Error ? e.message : 'Unknown'}`)
      }
    }
  }

  // ── 4. Sync X / niche news ──
  if (keywords.length > 0) {
    try {
      const logId = await createSyncLog('x_news')
      const runId = await runActorAsync(
        ACTORS.X_SCRAPER,
        xSearchInput(keywords, 200),
        `${appUrl}/api/sync/x?logId=${logId}`
      )
      jobs.push(`x_news:${runId}`)
    } catch (e) {
      errors.push(`x_news: ${e instanceof Error ? e.message : 'Unknown'}`)
    }
  }

  return jsonResponse({
    triggered: jobs.length,
    jobs,
    errors,
    timestamp: new Date().toISOString(),
  })
}
