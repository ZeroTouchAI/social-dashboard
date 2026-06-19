import { ApifyClient } from 'apify-client'

// Singleton client
let _client: ApifyClient | null = null

export function getApifyClient(): ApifyClient {
  if (!_client) {
    _client = new ApifyClient({ token: process.env.APIFY_API_KEY! })
  }
  return _client
}

// ─────────────────────────────────────────────
// ACTOR IDs
// ─────────────────────────────────────────────
export const ACTORS = {
  INSTAGRAM_PROFILE: process.env.APIFY_INSTAGRAM_PROFILE_ACTOR_ID ?? 'shu8hvrXbJbY3Eb9W',
  INSTAGRAM_POSTS:   process.env.APIFY_INSTAGRAM_POST_ACTOR_ID    ?? 'IHHRXpuHMCLzFmB4C',
  X_SCRAPER:         process.env.APIFY_X_ACTOR_ID                 ?? 'a9LoFRtA0bJCeXHJl',
} as const

// ─────────────────────────────────────────────
// RUN HELPERS
// ─────────────────────────────────────────────

export interface ApifyRunResult<T> {
  runId: string
  items: T[]
}

/**
 * Run an Apify actor synchronously (waits for finish) and returns dataset items.
 * For production use async runs with webhooks instead.
 */
export async function runActorSync<T>(
  actorId: string,
  input: Record<string, unknown>,
  timeoutSecs = 300
): Promise<ApifyRunResult<T>> {
  const client = getApifyClient()

  const run = await client.actor(actorId).call(input, {
    timeoutSecs,
    waitSecs: timeoutSecs,
  })

  const { items } = await client.dataset(run.defaultDatasetId).listItems()

  return {
    runId: run.id,
    items: items as T[],
  }
}

/**
 * Start an Apify actor run asynchronously.
 * Apify will call your webhook when complete.
 */
export async function runActorAsync(
  actorId: string,
  input: Record<string, unknown>,
  webhookUrl?: string
): Promise<string> {
  const client = getApifyClient()

  const webhooks = webhookUrl ? [{
    eventTypes: ['ACTOR.RUN.SUCCEEDED', 'ACTOR.RUN.FAILED'],
    requestUrl: webhookUrl,
    payloadTemplate: JSON.stringify({
      runId: '{{runId}}',
      datasetId: '{{defaultDatasetId}}',
      status: '{{status}}',
    }),
  }] : []

  const run = await client.actor(actorId).start(input, { webhooks })
  return run.id
}

/**
 * Fetch items from an existing Apify dataset (used in webhook handlers)
 */
export async function getDatasetItems<T>(datasetId: string): Promise<T[]> {
  const client = getApifyClient()
  const { items } = await client.dataset(datasetId).listItems({ limit: 1000 })
  return items as T[]
}
