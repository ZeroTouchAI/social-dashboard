import { formatNumber, formatEngagementRate, formatRelativeTime, truncate } from '@/lib/utils'
import { PlatformBadge, Badge } from '@/components/ui'
import type { PostWithAnalytics } from '@/types'
import Link from 'next/link'

interface Props {
  posts: PostWithAnalytics[]
}

export function TopPostsTable({ posts }: Props) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Hook / Caption</th>
            <th>Platform</th>
            <th style={{ textAlign: 'right' }}>Views</th>
            <th style={{ textAlign: 'right' }}>Likes</th>
            <th style={{ textAlign: 'right' }}>Engagement</th>
            <th style={{ textAlign: 'right' }}>Hook Score</th>
            <th style={{ textAlign: 'right' }}>Posted</th>
          </tr>
        </thead>
        <tbody>
          {posts.map(post => (
            <tr key={post.id} style={{ cursor: 'pointer' }}>
              <td style={{ maxWidth: '320px' }}>
                <Link href={`/posts/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '13px', marginBottom: '2px' }}>
                    {truncate(post.hook ?? post.caption, 80)}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    @{post.handle}
                  </div>
                </Link>
              </td>
              <td>
                <PlatformBadge platform={post.platform} />
              </td>
              <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono', fontSize: '13px' }}>
                {formatNumber(post.views)}
              </td>
              <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono', fontSize: '13px' }}>
                {formatNumber(post.likes)}
              </td>
              <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono', fontSize: '13px' }}>
                <span style={{ color: 'var(--amber)' }}>
                  {formatEngagementRate(post.engagement_rate)}%
                </span>
              </td>
              <td style={{ textAlign: 'right' }}>
                {post.hook_score != null ? (
                  <span style={{
                    fontFamily: 'JetBrains Mono',
                    fontSize: '13px',
                    color: post.hook_score >= 70 ? 'var(--teal)' : post.hook_score >= 50 ? 'var(--amber)' : 'var(--text-muted)',
                    fontWeight: 500,
                  }}>
                    {Math.round(post.hook_score)}
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>—</span>
                )}
              </td>
              <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                {formatRelativeTime(post.posted_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
