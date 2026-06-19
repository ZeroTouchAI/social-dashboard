import { NextRequest } from 'next/server'
import { getUnprocessedPosts, markPostProcessed, insertHook } from '@/lib/supabase/queries'
import { claudeJSON } from '@/lib/ai/claude'
import { HOOK_SYSTEM_PROMPT, hookUserPrompt } from '@/lib/ai/prompts'
import { validateCronSecret, jsonResponse, errorResponse } from '@/lib/utils'
import type { HookAnalysisResult } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 min — may process many posts

export async function POST(req: NextRequest) {
  // Allow both cron calls and direct API calls
  const isAuthorized = validateCronSecret(req)
  if (!isAuthorized) {
    return errorResponse('Unauthorized', 401)
  }

  const body = await req.json().catch(() => ({}))
  const limit = Math.min(body.limit ?? 20, 50) // cap at 50 per call

  const posts = await getUnprocessedPosts(limit)

  if (posts.length === 0) {
    return jsonResponse({ processed: 0, message: 'No unprocessed posts found' })
  }

  let processed = 0
  let errors = 0

  for (const post of posts) {
    try {
      // Skip posts with no text content
      const hasContent = post.caption || post.content || post.transcript
      if (!hasContent) {
        await markPostProcessed(post.id, {
          hook: '',
          hook_type: 'unknown',
          hook_score: 0,
          hook_explanation: 'No text content to analyze',
        })
        continue
      }

      // Call Claude to score the hook
      const result = await claudeJSON<HookAnalysisResult>(
        HOOK_SYSTEM_PROMPT,
        hookUserPrompt(post),
        512
      )

      // Save hook data back to the post
      await markPostProcessed(post.id, {
        hook:             result.hook_text,
        hook_type:        result.hook_type,
        hook_score:       result.hook_score,
        hook_explanation: result.explanation,
      })

      // Also insert into hooks table for fast querying
      await insertHook({
        post_id:          post.id,
        profile_id:       post.profile_id,
        hook_text:        result.hook_text,
        hook_score:       result.hook_score,
        hook_type:        result.hook_type,
        hook_explanation: result.explanation,
        engagement_rate:  post.engagement_rate ?? 0,
        views:            post.views ?? 0,
        likes:            post.likes ?? 0,
        platform:         post.platform,
        posted_at:        post.posted_at,
      })

      processed++

      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 200))

    } catch (e) {
      console.error(`Failed to score hook for post ${post.id}:`, e)
      errors++
    }
  }

  return jsonResponse({ processed, errors, total: posts.length })
}
