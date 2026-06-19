import { getClientKpis, getTopPostsThisWeek, getFollowerGrowth, getBestTimeToPost, getClientProfiles } from '@/lib/supabase/queries'
import { PageHeader, MetricCard, SectionHeader, EmptyState } from '@/components/ui'
import { FollowerGrowthChart } from '@/components/charts/FollowerGrowthChart'
import { BestTimeHeatmap } from '@/components/charts/BestTimeHeatmap'
import { TopPostsTable } from '@/components/analytics/TopPostsTable'
import { formatNumber, formatEngagementRate } from '@/lib/utils'

export default async function AnalyticsPage() {
  // Fetch all data in parallel
  const [kpis, topPosts, clientProfiles] = await Promise.all([
    getClientKpis(),
    getTopPostsThisWeek(8),
    getClientProfiles(),
  ])

  // Fetch growth + heatmap for each client profile
  const growthData = clientProfiles.length > 0
    ? await getFollowerGrowth(clientProfiles[0].id, 90)
    : []
  const heatmapData = clientProfiles.length > 0
    ? await getBestTimeToPost(clientProfiles[0].id)
    : []

  // Aggregate KPIs across platforms
  const totalViews    = kpis.reduce((s, k) => s + (k.total_views ?? 0), 0)
  const totalLikes    = kpis.reduce((s, k) => s + (k.total_likes ?? 0), 0)
  const totalPosts    = kpis.reduce((s, k) => s + (k.total_posts ?? 0), 0)
  const totalFollowers = kpis.reduce((s, k) => s + (k.follower_count ?? 0), 0)
  const avgEngagement = kpis.length > 0
    ? kpis.reduce((s, k) => s + (k.avg_engagement_rate ?? 0), 0) / kpis.length
    : 0

  const igKpi = kpis.find(k => k.platform === 'instagram')
  const xKpi  = kpis.find(k => k.platform === 'x')

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1400px' }}>
      <PageHeader
        title="Analytics Overview"
        subtitle="All-time performance across Instagram and X"
      />

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '32px' }}>
        <MetricCard
          label="Total Views"
          value={formatNumber(totalViews)}
          accent="teal"
        />
        <MetricCard
          label="Total Likes"
          value={formatNumber(totalLikes)}
        />
        <MetricCard
          label="Total Followers"
          value={formatNumber(totalFollowers)}
        />
        <MetricCard
          label="Total Posts"
          value={formatNumber(totalPosts)}
        />
        <MetricCard
          label="Avg Engagement"
          value={formatEngagementRate(avgEngagement)}
          suffix="%"
          accent="amber"
        />
      </div>

      {/* Platform Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
        {/* Instagram */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              width: '28px', height: '28px',
              background: 'rgba(225,48,108,0.12)',
              border: '1px solid rgba(225,48,108,0.25)',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="12" height="12" rx="3" stroke="#E1306C" strokeWidth="1.5"/>
                <circle cx="7" cy="7" r="2.5" stroke="#E1306C" strokeWidth="1.5"/>
                <circle cx="10.5" cy="3.5" r="0.75" fill="#E1306C"/>
              </svg>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Instagram</span>
          </div>
          {igKpi ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Followers</div>
                <div className="metric-value" style={{ fontSize: '1.4rem', marginTop: '4px' }}>{formatNumber(igKpi.follower_count)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avg Engagement</div>
                <div className="metric-value" style={{ fontSize: '1.4rem', marginTop: '4px', color: 'var(--amber)' }}>{formatEngagementRate(igKpi.avg_engagement_rate)}%</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Views</div>
                <div className="metric-value" style={{ fontSize: '1.4rem', marginTop: '4px' }}>{formatNumber(igKpi.total_views)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Posts</div>
                <div className="metric-value" style={{ fontSize: '1.4rem', marginTop: '4px' }}>{formatNumber(igKpi.total_posts)}</div>
              </div>
            </div>
          ) : (
            <EmptyState message="No Instagram data yet" submessage="Run your first sync to see data" />
          )}
        </div>

        {/* X */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              width: '28px', height: '28px',
              background: 'rgba(244,244,245,0.06)',
              border: '1px solid rgba(244,244,245,0.12)',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1L11 11M11 1L1 11" stroke="#D4D4D8" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>X (Twitter)</span>
          </div>
          {xKpi ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Followers</div>
                <div className="metric-value" style={{ fontSize: '1.4rem', marginTop: '4px' }}>{formatNumber(xKpi.follower_count)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avg Engagement</div>
                <div className="metric-value" style={{ fontSize: '1.4rem', marginTop: '4px', color: 'var(--amber)' }}>{formatEngagementRate(xKpi.avg_engagement_rate)}%</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Likes</div>
                <div className="metric-value" style={{ fontSize: '1.4rem', marginTop: '4px' }}>{formatNumber(xKpi.total_likes)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tweets</div>
                <div className="metric-value" style={{ fontSize: '1.4rem', marginTop: '4px' }}>{formatNumber(xKpi.total_posts)}</div>
              </div>
            </div>
          ) : (
            <EmptyState message="No X data yet" submessage="Run your first sync to see data" />
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '32px' }}>
        {/* Follower Growth */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <SectionHeader title="Follower Growth" />
          {growthData.length > 0 ? (
            <FollowerGrowthChart data={growthData} />
          ) : (
            <EmptyState message="No follower data yet" submessage="Syncing will populate this chart" />
          )}
        </div>

        {/* Best Time to Post */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <SectionHeader title="Best Time to Post" />
          {heatmapData.length > 0 ? (
            <BestTimeHeatmap data={heatmapData} />
          ) : (
            <EmptyState message="Need more post history" submessage="Heatmap builds after 10+ posts" />
          )}
        </div>
      </div>

      {/* Top Posts This Week */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <SectionHeader
          title="Top Posts This Week"
          action={
            <a href="/posts" style={{ fontSize: '12px', color: 'var(--teal)', textDecoration: 'none' }}>
              View all →
            </a>
          }
        />
        {topPosts.length > 0 ? (
          <TopPostsTable posts={topPosts} />
        ) : (
          <EmptyState
            message="No posts this week yet"
            submessage="Sync your Instagram and X accounts to see your top performers"
          />
        )}
      </div>
    </div>
  )
}
