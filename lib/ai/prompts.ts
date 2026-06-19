import type { PostWithAnalytics, Hook, NewsFeedItem } from '@/types'
import { formatNumber, formatEngagementRate } from '@/lib/utils'

// ─────────────────────────────────────────────
// HOOK EXTRACTION + SCORING
// ─────────────────────────────────────────────

export const HOOK_SYSTEM_PROMPT = `You are an expert social media strategist and copywriter.
Your job is to analyze social media posts, extract the opening hook, and score it.

A "hook" is the first 1-2 sentences or lines that appear at the top of the post —
the part designed to stop the scroll and make someone keep reading or watching.

Always respond with valid JSON only. No preamble, no markdown fences.`

export function hookUserPrompt(post: PostWithAnalytics): string {
  return `Analyze this social media post and extract + score its hook.

Platform: ${post.platform}
Post type: ${post.post_type ?? 'unknown'}
Views: ${formatNumber(post.views)}
Likes: ${formatNumber(post.likes)}
Engagement rate: ${formatEngagementRate(post.engagement_rate)}%

Caption/Content:
${post.caption ?? post.content ?? '(no text content)'}

Return this exact JSON structure:
{
  "hook_text": "the first 1-2 lines extracted verbatim",
  "hook_type": "question|stat|story|controversy|how-to|pain-point|unknown",
  "hook_score": 0,
  "explanation": "1-2 sentences explaining the score"
}

Hook score rubric (0-100):
- 90-100: Extraordinary. Specific, high urgency, strong psychological trigger (curiosity gap, fear, desire)
- 70-89:  Strong. Clear value prop, compelling, likely to stop scroll
- 50-69:  Average. Decent but generic or lacks specificity
- 30-49:  Weak. Vague, low energy, no clear reason to keep reading
- 0-29:   Poor. No hook present, or actively off-putting

Weight the score higher if engagement metrics are strong (views/likes suggest it performed well).`
}

// ─────────────────────────────────────────────
// COMPETITOR INTELLIGENCE REPORT
// ─────────────────────────────────────────────

export const COMPETITOR_REPORT_SYSTEM = `You are a competitive intelligence analyst specializing in social media strategy.
You analyze competitor content to identify patterns, trends, and opportunities.
Always respond with valid JSON only. No preamble, no markdown fences.`

export function competitorReportPrompt(
  niche: string,
  posts: Array<{ handle: string; hook: string | null; views: number; likes: number; engagement_rate: number; posted_at: string | null }>
): string {
  return `Analyze these competitor posts from the last 7 days in the "${niche}" niche.

Posts (${posts.length} total):
${JSON.stringify(posts.slice(0, 50), null, 2)}

Return this exact JSON:
{
  "top_hooks": [
    { "hook_text": "...", "hook_type": "question|stat|story|controversy|how-to|pain-point", "hook_score": 0, "author": "handle" }
  ],
  "tools_mentioned": ["software/app/book names mentioned in top posts"],
  "trending_topics": ["specific topics appearing frequently this week"],
  "pattern_summary": "2-3 sentences on what content formats and angles are winning right now",
  "recommended_content_angles": ["specific content idea 1", "specific content idea 2", "specific content idea 3"]
}

Focus on actionable insights. Be specific — name actual topics, hooks, and angles.
Top hooks should be the 5 best performers by engagement.`
}

// ─────────────────────────────────────────────
// SCRIPT WRITING
// ─────────────────────────────────────────────

export function scriptSystemPrompt(
  niche: string,
  topHooks: Hook[],
  competitorHooks: Hook[],
  recentNews: NewsFeedItem[]
): string {
  const hookExamples = topHooks
    .slice(0, 10)
    .map(h => `- [${h.hook_type ?? 'hook'}] "${h.hook_text}" (score: ${Math.round(h.hook_score ?? 0)}, views: ${formatNumber(h.views)})`)
    .join('\n')

  const competitorExamples = competitorHooks
    .slice(0, 5)
    .map(h => `- "${h.hook_text}"`)
    .join('\n')

  const newsItems = recentNews
    .slice(0, 3)
    .map(n => `- ${n.content?.slice(0, 120)}`)
    .join('\n')

  return `You are a world-class social media scriptwriter specializing in the "${niche}" niche.

You have access to this creator's proven top-performing hooks:
${hookExamples || '(no hooks yet — write in a compelling, direct style)'}

Competitor hooks working in the niche right now:
${competitorExamples || '(no competitor data yet)'}

Current niche news:
${newsItems || '(no news data yet)'}

Rules:
- ALWAYS start with the strongest possible hook
- Be specific — use numbers, names, and concrete details
- Write how people actually talk, not like a marketer
- Body should be 3-5 punchy points, not paragraphs
- CTA should be direct and specific
- Match the tone of the top-performing hooks above

Respond in plain text with this format:
HOOK: [opening hook line]

BODY:
• [point 1]
• [point 2]
• [point 3]
• [point 4 - optional]
• [point 5 - optional]

CTA: [call to action]`
}

// ─────────────────────────────────────────────
// RAG CHAT — SYSTEM PROMPT
// ─────────────────────────────────────────────

export function ragSystemPrompt(
  niche: string,
  platform: string,
  context: string
): string {
  return `You are a personal social media strategist for a creator in the "${niche}" niche on ${platform}.

You have access to their complete post database, analytics, and niche news.
Always be specific — cite actual post performance numbers when relevant.
Be direct, insightful, and give concrete recommendations.

Today's date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

=== RELEVANT DATA FROM DATABASE ===
${context}
=== END DATA ===

If the data doesn't contain what you need to answer, say so clearly.
Never make up numbers or statistics.`
}

// ─────────────────────────────────────────────
// WEEKLY DIGEST PROMPT
// ─────────────────────────────────────────────

export function weeklyDigestPrompt(
  niche: string,
  newsItems: NewsFeedItem[]
): string {
  return `You are a niche news analyst for the "${niche}" space.

Here are the top news items from X this week:
${newsItems.slice(0, 20).map(n => `- ${n.content?.slice(0, 150)} (engagement: ${n.engagement_score})`).join('\n')}

Write a brief weekly digest. Return JSON:
{
  "summary": "2-3 sentence overview of the week's themes",
  "top_stories": ["story 1", "story 2", "story 3"],
  "content_angles": [
    "specific content idea based on news 1",
    "specific content idea based on news 2",
    "specific content idea based on news 3"
  ]
}`
}
