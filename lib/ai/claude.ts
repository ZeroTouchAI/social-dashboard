import Anthropic from '@anthropic-ai/sdk'

// Singleton
let _client: Anthropic | null = null

export function getClaudeClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  }
  return _client
}

export const CLAUDE_MODEL = 'claude-sonnet-4-20250514'

// ─────────────────────────────────────────────
// SIMPLE COMPLETION (JSON output)
// ─────────────────────────────────────────────
export async function claudeJSON<T>(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 1024
): Promise<T> {
  const client = getClaudeClient()

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const raw = response.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('')

  // Strip markdown fences if present
  const clean = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  try {
    return JSON.parse(clean) as T
  } catch {
    throw new Error(`Claude returned invalid JSON: ${clean.slice(0, 200)}`)
  }
}

// ─────────────────────────────────────────────
// STREAMING COMPLETION
// ─────────────────────────────────────────────
export function claudeStream(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  maxTokens = 2048
) {
  const client = getClaudeClient()

  return client.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  })
}
