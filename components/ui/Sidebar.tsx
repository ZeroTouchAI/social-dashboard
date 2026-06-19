'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

const NAV_ITEMS = [
  {
    href: '/',
    label: 'Analytics',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="8" width="3" height="7" rx="1" fill="currentColor" opacity="0.5"/>
        <rect x="6" y="5" width="3" height="10" rx="1" fill="currentColor" opacity="0.75"/>
        <rect x="11" y="1" width="3" height="14" rx="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    href: '/posts',
    label: 'Post Library',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M4 13h8M5 15h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/hooks',
    label: 'Hook Intelligence',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1L10.5 6H15L11 9.5L12.5 15L8 12L3.5 15L5 9.5L1 6H5.5L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: '/competitors',
    label: 'Competitors',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="5" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="11" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M1 15c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M8 15c0-1.38.56-2.63 1.46-3.54" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/news',
    label: 'Niche News',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 3h12M2 7h8M2 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="13" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M14.77 13.23L16 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/ai',
    label: 'AI Studio',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1C4.13 1 1 4.13 1 8s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M5.5 9.5c.5 1 1.5 1.5 2.5 1.5s2-.5 2.5-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="5.5" cy="6.5" r="1" fill="currentColor"/>
        <circle cx="10.5" cy="6.5" r="1" fill="currentColor"/>
      </svg>
    ),
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      style={{
        width: '220px',
        flexShrink: 0,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px',
            background: 'var(--teal-muted)',
            border: '1px solid var(--teal-border)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L9 5.5H14L10 8.5L11.5 13L7 10.5L2.5 13L4 8.5L0 5.5H5L7 1Z"
                fill="var(--teal)" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Social Intel
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Dashboard
            </div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: isActive ? 500 : 400,
                color: isActive ? 'var(--teal)' : 'var(--text-secondary)',
                background: isActive ? 'var(--teal-muted)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--teal)' : '2px solid transparent',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ opacity: isActive ? 1 : 0.6, flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer — sync status */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '6px', height: '6px',
            borderRadius: '50%',
            background: 'var(--success)',
            boxShadow: '0 0 6px var(--success)',
          }} />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Auto-sync active
          </span>
        </div>
      </div>
    </aside>
  )
}
