import { PageHeader, EmptyState } from '@/components/ui'

export default function PostsPage() {
  return (
    <div style={{ padding: '32px 36px', maxWidth: '1400px' }}>
      <PageHeader
        title="Post Library"
        subtitle="All posts from your accounts with analytics and AI-scored hooks"
      />
      <EmptyState
        message="Post Library — Phase 2"
        submessage="This module is built in Phase 2. Run your first sync first."
      />
    </div>
  )
}
