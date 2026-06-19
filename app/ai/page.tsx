import { PageHeader, EmptyState } from '@/components/ui'
export default function AIPage() {
  return (
    <div style={{ padding: '32px 36px', maxWidth: '1400px' }}>
      <PageHeader title="AI Studio" subtitle="Chat with your social data using Claude — built in Phase 9" />
      <EmptyState message="Complete Phase 1 setup first" submessage="AI Studio uses RAG over your posts database — needs data to be useful" />
    </div>
  )
}
