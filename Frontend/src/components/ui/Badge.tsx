import { cn } from '@/utils/cn'

interface BadgeProps {
  children: React.ReactNode
  /**
   * default — neutral (most common, 80% of badges)
   * primary — Nile blue, used for "Active", "New", category tags
   * accent  — Pharaonic gold, ONLY for premium/featured
   * success — Green, for confirmed/completed
   * warning — Amber, for pending/attention
   * danger  — Red, for cancelled/banned
   */
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'danger'
  className?: string
}

const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-[var(--bg-muted)] text-[var(--text-secondary)]',
  primary: 'bg-[var(--brand-soft)] text-[var(--brand-soft-text)]',
  accent:  'bg-[var(--accent-soft)] text-[var(--accent-soft-text)] ring-1 ring-inset ring-[var(--accent)]/20',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  danger:  'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
