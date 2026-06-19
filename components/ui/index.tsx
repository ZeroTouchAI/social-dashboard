import { clsx } from 'clsx'

// ─────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  hover?: boolean
}

export function Card({ children, className, style, onClick, hover = false }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={clsx('card', hover && 'cursor-pointer', className)}
    >
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────
// METRIC CARD
// ─────────────────────────────────────────────
interface MetricCardProps {
  label: string
  value: string | number
  change?: number        // percentage change vs previous period
  prefix?: string
  suffix?: string
  accent?: 'teal' | 'amber' | 'default'
}

export function MetricCard({ label, value, change, prefix, suffix, accent = 'default' }: MetricCardProps) {
  const accentColor = accent === 'teal' ? 'var(--teal)' : accent === 'amber' ? 'var(--amber)' : 'var(--text-primary)'

  return (
    <div
      className="card"
      style={{ padding: '20px 24px' }}
    >
      <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        {prefix && <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{prefix}</span>}
        <span className="metric-value" style={{ color: accentColor }}>{value}</span>
        {suffix && <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{suffix}</span>}
      </div>
      {change !== undefined && (
        <div style={{ marginTop: '6px', fontSize: '12px', color: change >= 0 ? 'var(--success)' : 'var(--danger)' }}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% vs last period
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// BADGE
// ─────────────────────────────────────────────
type BadgeVariant = 'teal' | 'amber' | 'danger' | 'success' | 'instagram' | 'x' | 'default'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const styles: Record<BadgeVariant, string> = {
    teal:      'badge-teal',
    amber:     'badge-amber',
    danger:    'badge-danger',
    success:   'badge',
    instagram: 'badge-instagram',
    x:         'badge-x',
    default:   'badge',
  }

  return (
    <span className={clsx('badge', styles[variant])}>
      {children}
    </span>
  )
}

// ─────────────────────────────────────────────
// PLATFORM BADGE
// ─────────────────────────────────────────────
export function PlatformBadge({ platform }: { platform: string }) {
  if (platform === 'instagram') {
    return <Badge variant="instagram">Instagram</Badge>
  }
  return <Badge variant="x">X</Badge>
}

// ─────────────────────────────────────────────
// HOOK TYPE BADGE
// ─────────────────────────────────────────────
export function HookTypeBadge({ type }: { type: string }) {
  const variantMap: Record<string, BadgeVariant> = {
    question:    'teal',
    stat:        'amber',
    story:       'teal',
    controversy: 'danger',
    'how-to':    'teal',
    'pain-point':'amber',
    unknown:     'default',
  }
  return <Badge variant={variantMap[type] ?? 'default'}>{type}</Badge>
}

// ─────────────────────────────────────────────
// BUTTON
// ─────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  loading?: boolean
}

export function Button({
  children, variant = 'ghost', size = 'md',
  loading, disabled, className, ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(
        'btn',
        variant === 'primary' && 'btn-primary',
        variant === 'ghost'   && 'btn-ghost',
        variant === 'danger'  && 'btn-danger',
        size === 'sm' && 'text-xs px-3 py-1.5',
        className
      )}
    >
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="2" strokeDasharray="20" strokeDashoffset="10"/>
          </svg>
          Loading…
        </span>
      ) : children}
    </button>
  )
}

// ─────────────────────────────────────────────
// SKELETON LOADER
// ─────────────────────────────────────────────
export function Skeleton({ width, height, className }: {
  width?: string | number
  height?: string | number
  className?: string
}) {
  return (
    <div
      className={clsx('skeleton', className)}
      style={{ width, height: height ?? '16px' }}
    />
  )
}

// ─────────────────────────────────────────────
// PAGE HEADER
// ─────────────────────────────────────────────
interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '28px',
      paddingBottom: '20px',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {actions}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────
export function EmptyState({ message, submessage }: { message: string; submessage?: string }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '60px 24px',
      color: 'var(--text-muted)',
    }}>
      <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.4 }}>◌</div>
      <div style={{ fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>{message}</div>
      {submessage && <div style={{ fontSize: '13px' }}>{submessage}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────
export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
    }}>
      <h2 style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
        {title}
      </h2>
      {action}
    </div>
  )
}

// ─────────────────────────────────────────────
// DIVIDER
// ─────────────────────────────────────────────
export function Divider() {
  return <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '24px 0' }} />
}
