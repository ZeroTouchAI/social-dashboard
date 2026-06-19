'use client'

import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import { formatNumber, formatDate } from '@/lib/utils'
import type { FollowerSnapshot } from '@/types'

interface Props {
  data: FollowerSnapshot[]
}

type Window = '30d' | '90d' | 'all'

const WINDOWS: { label: string; value: Window }[] = [
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
  { label: 'All', value: 'all' },
]

export function FollowerGrowthChart({ data }: Props) {
  const [window, setWindow] = useState<Window>('90d')

  const filtered = data.filter(d => {
    if (window === 'all') return true
    const days = window === '30d' ? 30 : 90
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return new Date(d.snapshot_at) >= cutoff
  })

  const chartData = filtered.map(d => ({
    date: formatDate(d.snapshot_at),
    followers: d.count,
  }))

  const minVal = Math.min(...filtered.map(d => d.count))
  const maxVal = Math.max(...filtered.map(d => d.count))
  const growth = filtered.length >= 2
    ? filtered[filtered.length - 1].count - filtered[0].count
    : 0

  return (
    <div>
      {/* Window toggle */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        {WINDOWS.map(w => (
          <button
            key={w.value}
            onClick={() => setWindow(w.value)}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: window === w.value ? 600 : 400,
              background: window === w.value ? 'var(--teal-muted)' : 'transparent',
              color: window === w.value ? 'var(--teal)' : 'var(--text-muted)',
              border: window === w.value ? '1px solid var(--teal-border)' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {w.label}
          </button>
        ))}
        {growth !== 0 && (
          <span style={{
            marginLeft: 'auto',
            fontSize: '12px',
            color: growth >= 0 ? 'var(--success)' : 'var(--danger)',
            alignSelf: 'center',
          }}>
            {growth >= 0 ? '+' : ''}{formatNumber(growth)} in period
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatNumber(v)}
            domain={[minVal * 0.99, maxVal * 1.01]}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--text-primary)',
            }}
            itemStyle={{ color: 'var(--teal)' }}
            labelStyle={{ color: 'var(--text-muted)', marginBottom: '4px' }}
            formatter={(v: number) => [formatNumber(v), 'Followers']}
          />
          <Line
            type="monotone"
            dataKey="followers"
            stroke="var(--teal)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: 'var(--teal)', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
