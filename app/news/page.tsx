import { PageHeader, EmptyState } from '@/components/ui'
export default function NewsPage() {
  return (
    <div style={{ padding: '32px 36px', maxWidth: '1400px' }}>
      <PageHeader title="Niche News Feed" subtitle="Real-time X posts from your niche keywords — built in Phase 8" />
      <EmptyState message="Complete Phase 1 setup first" submessage="Add CLIENT_NICHE_KEYWORDS to your .env to start pulling relevant news" />
    </div>
  )
}
