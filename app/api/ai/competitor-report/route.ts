import { NextRequest } from 'next/server'
import { claudeJSON } from '@/lib/ai/claude'
import { COMPETITOR_REPORT_SYSTEM, competitorReportPrompt } from '@/lib/ai/prompts'
import { createAdminServerClient } from '@/lib/supabase/server'
import { insertCompetitorReport } from '@/lib/supabase/queries'
import { validateCronSecret, jsonResponse, errorResponse } from '@/lib/utils'
import { subDays } from 'date-fns'
import type { CompetitorIntelResult } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  if (!validateCronSecret(req)) {
    return errorResponse('Unauthorized', 401)
  }

  const db = createAdminServerClient()

  // Get competitor profiles
  const { data: competitors } = await db
    .from('profiles')
    .select('id, handle')
    .eq('is_client', false)

  if (!competitors?.length) {
    return jsonResponse({ ok: false, message: 'No competitor profiles found' })
  }

  const competitorIds = competitors.map(c => c.id)
  const oneWeekAgo = subDays(new Date(), 7).toISOString()

  // Get their posts from the last 7 days
  const { data: posts } = await db
    .from('posts_with_analytics')
    .select('handle, hook, caption, views, likes, engagement_rate, posted_at')
    .in('profile_id', competitorIds)
    .gte('posted_at', oneWeekAgo)
    .order('views', { ascending: false })
    .limit(100)

  if (!posts?.length) {
    return jsonResponse({ ok: false, message: 'No competitor posts in last 7 days' })
  }

  const niche = process.env.CLIENT_NICHE_KEYWORDS?.split(',')[0] ?? 'general'

  const postSummaries = posts.map(p => ({
    handle:          p.handle,
    hook:            p.hook ?? p.caption?.slice(0, 100) ?? '',
    views:           p.views ?? 0,
    likes:           p.likes ?? 0,
    engagement_rate: p.engagement_rate ?? 0,
    posted_at:       p.posted_at?.slice(0, 10) ?? '',
  }))

  const result = await claudeJSON<CompetitorIntelResult>(
    COMPETITOR_REPORT_SYSTEM,
    competitorReportPrompt(niche, postSummaries),
    2048
  )

  await insertCompetitorReport({
    report_date:           new Date().toISOString().slice(0, 10),
    niche,
    top_hooks:             result.top_hooks ?? [],
    tools_mentioned:       result.tools_mentioned ?? [],
    trending_topics:       result.trending_topics ?? [],
    pattern_summary:       result.pattern_summary ?? null,
    recommended_angles:    result.recommended_content_angles ?? [],
    raw_response:          JSON.stringify(result),
  })

  return jsonResponse({ ok: true, niche, postsAnalyzed: posts.length })
}
