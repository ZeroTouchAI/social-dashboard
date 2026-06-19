import { NextRequest } from 'next/server'
import { claudeStream } from '@/lib/ai/claude'
import { assembleRAGContext } from '@/lib/ai/rag'
import { ragSystemPrompt } from '@/lib/ai/prompts'
import { saveMessage } from '@/lib/supabase/queries'
import { errorResponse } from '@/lib/utils'

export const runtime = 'nodejs'
export const maxDuration = 60

interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  sessionId: string
}

export async function POST(req: NextRequest) {
  let body: ChatRequest
  try {
    body = await req.json()
  } catch {
    return errorResponse('Invalid JSON', 400)
  }

  const { messages, sessionId } = body
  if (!messages?.length || !sessionId) {
    return errorResponse('Missing messages or sessionId', 400)
  }

  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
  if (!lastUserMessage) {
    return errorResponse('No user message found', 400)
  }

  try {
    // 1. Assemble RAG context from database
    const { text: contextText, sources } = await assembleRAGContext(
      lastUserMessage.content,
      10,
      5
    )

    // 2. Build system prompt with injected context
    const niche    = process.env.CLIENT_NICHE_KEYWORDS?.split(',')[0] ?? 'your niche'
    const platform = 'Instagram and X'
    const systemPrompt = ragSystemPrompt(niche, platform, contextText)

    // 3. Save user message to DB
    await saveMessage({
      session_id: sessionId,
      role:       'user',
      content:    lastUserMessage.content,
      metadata:   { sources },
    }).catch(e => console.error('Failed to save user message:', e))

    // 4. Stream Claude response
    const stream = claudeStream(systemPrompt, messages, 2048)

    // 5. Build a ReadableStream that streams text chunks + saves the full response
    let fullResponse = ''

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const chunk = event.delta.text
              fullResponse += chunk
              controller.enqueue(new TextEncoder().encode(chunk))
            }
          }

          // Save assistant message after stream completes
          await saveMessage({
            session_id: sessionId,
            role:       'assistant',
            content:    fullResponse,
            metadata:   { sources },
          }).catch(e => console.error('Failed to save assistant message:', e))

          controller.close()
        } catch (e) {
          controller.error(e)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type':      'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Sources':         JSON.stringify(sources),
      },
    })

  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return errorResponse(msg, 500)
  }
}
