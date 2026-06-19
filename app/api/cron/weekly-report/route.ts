import { NextRequest } from 'next/server'
import { validateCronSecret, jsonResponse, errorResponse } from '@/lib/utils'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  if (!validateCronSecret(req)) {
    return errorResponse('Unauthorized', 401)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const secret = process.env.CRON_SECRET!
  const results: Record<string, string> = {}

  // Trigger competitor report
  try {
    const res = await fetch(`${appUrl}/api/ai/competitor-report`, {
      method:  'POST',
      headers: { 'x-cron-secret': secret, 'Content-Type': 'application/json' },
      body:    JSON.stringify({}),
    })
    results.competitor_report = res.ok ? 'triggered' : `failed (${res.status})`
  } catch (e) {
    results.competitor_report = `error: ${e instanceof Error ? e.message : 'unknown'}`
  }

  // Batch score any remaining unprocessed posts
  try {
    const res = await fetch(`${appUrl}/api/ai/score-hooks`, {
      method:  'POST',
      headers: { 'x-cron-secret': secret, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ limit: 50 }),
    })
    results.hook_scoring = res.ok ? 'triggered' : `failed (${res.status})`
  } catch (e) {
    results.hook_scoring = `error: ${e instanceof Error ? e.message : 'unknown'}`
  }

  return jsonResponse({ timestamp: new Date().toISOString(), results })
}
