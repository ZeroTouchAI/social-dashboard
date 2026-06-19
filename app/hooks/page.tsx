import { PageHeader, EmptyState } from '@/components/ui'
export default function HooksPage() {
  return (
    <div style={{ padding: '32px 36px', maxWidth: '1400px' }}>
      <PageHeader title="Hook Intelligence" subtitle="AI-ranked hooks from all your posts — built in Phase 5" />
      <EmptyState message="Complete Phase 1 setup first" submessage="Once you run your first sync, hooks will be scored automatically" />
    </div>
  )
}
