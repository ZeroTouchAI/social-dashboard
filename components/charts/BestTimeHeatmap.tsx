'use client'

import { getDayName, formatHour } from '@/lib/utils'
import type { BestTimeToPost } from '@/types'

interface Props {
  data: BestTimeToPost[]
}

const DAYS  = [0, 1, 2, 3, 4, 5, 6]
const HOURS = [0, 3, 6, 9, 12, 15, 18, 21]

export function BestTimeHeatmap({ data }: Props) {
  const lookup = new Map<string, number>()
  let maxRate = 0

  for (const d of data) {
    const key = `${d.day_of_week}-${d.hour_of_day}`
    lookup.set(key, d.avg_engagement_rate)
    if (d.avg_engagement_rate > maxRate) maxRate = d.avg_engagement_rate
  }

  function getIntensity(day: number, hour: number): number {
    if (maxRate === 0) return 0
    const val = lookup.get(`${day}-${hour}`) ?? 0
    return val / maxRate
  }

  function getColor(intensity: number): string {
    if (intensity === 0) return 'rgba(255,255,255,0.03)'
    if (intensity > 0.8)  return 'rgba(0,217,184,0.85)'
    if (intensity > 0.6)  return 'rgba(0,217,184,0.55)'
    if (intensity > 0.4)  return 'rgba(0,217,184,0.35)'
    if (intensity > 0.2)  return 'rgba(0,217,184,0.18)'
    return 'rgba(0,217,184,0.08)'
  }

  // Find best slot
  let bestDay = 0, bestHour = 0, bestRate = 0
  for (const d of data) {
    if (d.avg_engagement_rate > bestRate) {
      bestRate = d.avg_engagement_rate
      bestDay  = d.day_of_week
      bestHour = d.hour_of_day
    }
  }

  return (
    <div>
      {/* Best time callout */}
      {bestRate > 0 && (
        <div style={{
          padding: '8px 12px',
          background: 'var(--teal-muted)',
          border: '1px solid var(--teal-border)',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '12px',
          color: 'var(--teal)',
        }}>
          Best time: <strong>{getDayName(bestDay)} at {formatHour(bestHour)}</strong>
        </div>
      )}

      {/* Heatmap grid */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: '280px' }}>
          {/* Hour labels */}
          <div style={{ display: 'grid', gridTemplateColumns: '28px repeat(8, 1fr)', gap: '2px', marginBottom: '2px' }}>
            <div />
            {HOURS.map(h => (
              <div key={h} style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center' }}>
                {formatHour(h)}
              </div>
            ))}
          </div>

          {/* Rows */}
          {DAYS.map(day => (
            <div
              key={day}
              style={{ display: 'grid', gridTemplateColumns: '28px repeat(8, 1fr)', gap: '2px', marginBottom: '2px' }}
            >
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                {getDayName(day)}
              </div>
              {HOURS.map(hour => {
                const intensity = getIntensity(day, hour)
                const rate = lookup.get(`${day}-${hour}`) ?? 0
                return (
                  <div
                    key={hour}
                    title={rate > 0 ? `${getDayName(day)} ${formatHour(hour)}: ${(rate * 100).toFixed(2)}% engagement` : 'No data'}
                    style={{
                      height: '22px',
                      borderRadius: '3px',
                      background: getColor(intensity),
                      border: intensity > 0.8
                        ? '1px solid var(--teal-border)'
                        : '1px solid transparent',
                      cursor: intensity > 0 ? 'help' : 'default',
                      transition: 'opacity 0.15s',
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Low</span>
        {[0.1, 0.3, 0.5, 0.7, 0.9].map(i => (
          <div key={i} style={{ width: '16px', height: '10px', borderRadius: '2px', background: getColor(i) }} />
        ))}
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>High</span>
      </div>
    </div>
  )
}
