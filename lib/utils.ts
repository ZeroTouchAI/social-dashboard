// ─────────────────────────────────────────────
// NUMBER FORMATTING
// ─────────────────────────────────────────────

export function formatNumber(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

export function formatEngagementRate(rate: number | null | undefined): string {
  if (rate == null || isNaN(rate)) return '0.00'
  return (rate * 100).toFixed(2)
}

export function formatPercent(n: number | null | undefined, decimals = 1): string {
  if (n == null || isNaN(n)) return '0%'
  return `${n.toFixed(decimals)}%`
}

// ─────────────────────────────────────────────
// DATE FORMATTING
// ─────────────────────────────────────────────

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins  = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays  = Math.floor(diffMs / 86_400_000)

  if (diffMins < 60)  return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7)   return `${diffDays}d ago`
  return formatDate(dateStr)
}

export function getDayName(dow: number): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dow] ?? ''
}

export function formatHour(hour: number): string {
  if (hour === 0)  return '12am'
  if (hour === 12) return '12pm'
  if (hour < 12)  return `${hour}am`
  return `${hour - 12}pm`
}

// ─────────────────────────────────────────────
// HOOK SCORE COLOR
// ─────────────────────────────────────────────
export function hookScoreColor(score: number | null | undefined): string {
  if (score == null) return 'var(--text-muted)'
  if (score >= 80) return 'var(--teal)'
  if (score >= 60) return 'var(--amber)'
  if (score >= 40) return 'var(--text-secondary)'
  return 'var(--text-muted)'
}

export function hookScoreBadgeVariant(score: number | null | undefined): 'teal' | 'amber' | 'default' {
  if (score == null) return 'default'
  if (score >= 70) return 'teal'
  if (score >= 50) return 'amber'
  return 'default'
}

// ─────────────────────────────────────────────
// API HELPERS
// ─────────────────────────────────────────────

export function validateCronSecret(request: Request): boolean {
  const secret = request.headers.get('x-cron-secret')
    ?? new URL(request.url).searchParams.get('secret')
  return secret === process.env.CRON_SECRET
}

export function jsonResponse<T>(data: T, status = 200) {
  return Response.json({ data, success: true, error: null }, { status })
}

export function errorResponse(message: string, status = 500) {
  return Response.json({ data: null, success: false, error: message }, { status })
}

// ─────────────────────────────────────────────
// TEXT HELPERS
// ─────────────────────────────────────────────

export function truncate(str: string | null | undefined, maxLength: number): string {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength).trimEnd() + '…'
}

export function extractFirstLines(text: string | null | undefined, lines = 2): string {
  if (!text) return ''
  return text.split('\n').slice(0, lines).join(' ').trim()
}

// ─────────────────────────────────────────────
// CLASS HELPERS
// ─────────────────────────────────────────────
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
