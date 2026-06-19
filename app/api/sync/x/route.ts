import { NextRequest } from 'next/server'
import { getDatasetItems } from '@/lib/apify/client'
import { transformXTweet } from '@/lib/apify/actors'
import { createAdminServerClient } from '@/lib/supabase/server'
import { completeSyncLog } from '@/lib/supabase/queries'
import { jsonResponse, errorResponse } from '@/lib/utils'
import type { ApifyXTweet } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  const url   = new URL(req.url)
  const logId = url.searchParams.get('logId')

  let body: { datasetId?: string; status?: string }
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
    return errorResponse('Missing datasetId', 400)
  }

  const db = createAdminServerClient()
  const keywords = (process.env.CLIENT_NICHE_KEYWORDS ?? '')
    .split(',').map(k => k.trim()).filter(Boolean)

  let synced = 0

  try {
    const tweets = await getDatasetItems<ApifyXTweet>(body.datasetId)

    for (const raw of tweets) {
      try {
        if (!raw.id || !raw.text) continue

        const tweetData = transformXTweet(raw)

        // Classify which keywords matched
        const matched = keywords.filter(kw =>
          raw.text?.toLowerCase().includes(kw.toLowerCase())
        )

        // Auto-assign topic from first matched keyword
        const topic = matched[0] ?? null

        await db.from('news_feed').upsert(
          { ...tweetData, keywords_matched: matched, topic },
          { onConflict: 'tweet_id' }
        )

        synced++
      } catch (e) {
        console.error('Error processing tweet:', e)
      }
    }

    if (logId) await completeSyncLog(logId, synced)

    return jsonResponse({ ok: true, synced })

  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    if (logId) await completeSyncLog(logId, synced, msg)
    return errorResponse(msg, 500)
  }
}
