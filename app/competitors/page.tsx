import { PageHeader, EmptyState } from '@/components/ui'
export default function CompetitorsPage() {
  return (
    <div style={{ padding: '32px 36px', maxWidth: '1400px' }}>
      <PageHeader title="Competitor Intelligence" subtitle="Track 5–15 competitors in your niche — built in Phase 7" />
      <EmptyState message="Complete Phase 1 setup first" submessage="Add competitor handles in your .env, then run the daily sync" />
    </div>
  )
}
