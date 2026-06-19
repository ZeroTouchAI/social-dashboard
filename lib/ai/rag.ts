import { createAdminServerClient } from '@/lib/supabase/server'
import { getClaudeClient, CLAUDE_MODEL } from './claude'
import type { PostWithAnalytics, NewsFeedItem, ContextSource } from '@/types'

// ─────────────────────────────────────────────
// EMBEDDING
// Using Claude's API to generate embeddings via a small model trick:
// We use voyage-3 via Anthropic if available, or fall back to a keyword
// extraction approach for Supabase full-text search.
// NOTE: For production, swap this for OpenAI text-embedding-3-small
//       which is the most cost-effective embedding model.
// ─────────────────────────────────────────────

export async function embedText(text: string): Promise<number[] | null> {
  // If you have OpenAI access, use this instead:
  // const { OpenAI } = await import('openai')
  // const oai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  // const res = await oai.embeddings.create({ model: 'text-embedding-3-small', input: text })
  // return res.data[0].embedding

  // Anthropic doesn't have a direct embedding endpoint yet.
  // Return null to fall back to full-text search.
  return null
}

// ─────────────────────────────────────────────
// CONTEXT ASSEMBLY
// Pulls relevant data from Supabase to inject into AI prompts
// ─────────────────────────────────────────────

export interface AssembledContext {
  text: string
  sources: ContextSource[]
}

export async function assembleRAGContext(
  userQuery: string,
  maxPosts = 10,
  maxNews = 5
): Promise<AssembledContext> {
  const db = createAdminServerClient()
  const sources: ContextSource[] = []
  const sections: string[] = []

  // 1. Try vector search first (if embeddings exist)
  const queryEmbedding = await embedText(userQuery)

  let relevantPosts: PostWithAnalytics[] = []
  let relevantNews:  NewsFeedItem[]      = []

  if (queryEmbedding) {
    // Semantic search
    const { data: postResults } = await db.rpc('search_posts_semantic', {
      query_embedding: queryEmbedding,
      match_count: maxPosts,
    })
    relevantPosts = (postResults ?? []) as PostWithAnalytics[]

    const { data: newsResults } = await db.rpc('search_news_semantic', {
      query_embedding: queryEmbedding,
      match_count: maxNews,
    })
    relevantNews = (newsResults ?? []) as NewsFeedItem[]

  } else {
    // Fallback: full-text search
    const { data: postResults } = await db.rpc('search_posts', {
      search_query: userQuery,
      limit_count: maxPosts,
    })
    relevantPosts = (postResults ?? []) as PostWithAnalytics[]

    // For news, just get recent high-engagement items
    const { data: newsResults } = await db
      .from('news_feed')
      .select('*')
      .order('engagement_score', { ascending: false })
      .limit(maxNews)
    relevantNews = (newsResults ?? []) as NewsFeedItem[]
  }

  // 2. Also pull top hooks + recent analytics for context
  const { data: topHooks } = await db
    .from('hooks')
    .select('hook_text, hook_score, hook_type, views, engagement_rate')
    .order('hook_score', { ascending: false })
    .limit(5)

  const { data: kpis } = await db.from('client_kpis').select('*')

  // 3. Assemble context text
  if (kpis && kpis.length > 0) {
    sections.push('## Account Performance')
    for (const kpi of kpis) {
      sections.push(
        `${kpi.platform.toUpperCase()}: ${kpi.follower_count?.toLocaleString()} followers, ` +
        `${kpi.total_posts} posts, ${kpi.total_views?.toLocaleString()} total views, ` +
        `${((kpi.avg_engagement_rate ?? 0) * 100).toFixed(2)}% avg engagement`
      )
    }
  }

  if (topHooks && topHooks.length > 0) {
    sections.push('\n## Top Performing Hooks')
    for (const h of topHooks) {
      sections.push(`- [${h.hook_type ?? 'hook'}] "${h.hook_text}" (score: ${Math.round(h.hook_score ?? 0)}, ${h.views?.toLocaleString()} views)`)
    }
  }

  if (relevantPosts.length > 0) {
    sections.push('\n## Relevant Posts')
    for (const post of relevantPosts) {
      const preview = post.hook ?? post.caption?.slice(0, 100) ?? '(no caption)'
      sections.push(
        `- [${post.platform}] "${preview}" — ` +
        `${post.views?.toLocaleString()} views, ${post.likes?.toLocaleString()} likes, ` +
        `${((post.engagement_rate ?? 0) * 100).toFixed(2)}% engagement (${post.posted_at?.slice(0, 10) ?? 'unknown date'})`
      )
      sources.push({
        type: 'post',
        id: post.id,
        preview: preview.slice(0, 60),
        relevance: 0.8,
      })
    }
  }

  if (relevantNews.length > 0) {
    sections.push('\n## Recent Niche News')
    for (const item of relevantNews) {
      const preview = item.content?.slice(0, 150) ?? ''
      sections.push(`- @${item.author_handle}: ${preview} (${item.engagement_score} engagements)`)
      sources.push({
        type: 'news',
        id: item.id,
        preview: preview.slice(0, 60),
        relevance: 0.7,
      })
    }
  }

  return {
    text: sections.join('\n'),
    sources,
  }
}

// ─────────────────────────────────────────────
// STORE POST EMBEDDING (call after AI processing)
// ─────────────────────────────────────────────
export async function storePostEmbedding(postId: string, text: string): Promise<void> {
  const embedding = await embedText(text)
  if (!embedding) return

  const db = createAdminServerClient()
  await db
    .from('posts')
    .update({ hook_embedding: embedding })
    .eq('id', postId)
}
