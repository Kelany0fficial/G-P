import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  fullWidth?: boolean
}

/**
 * Variants map to design-system semantic tokens, never raw colors.
 * - primary  → Nile blue, the dominant CTA
 * - accent   → Pharaonic gold, reserved for premium / featured CTAs
 * - secondary→ Sandstone-tinted neutral
 * - outline  → Bordered, low-emphasis
 * - ghost    → Tertiary, no fill
 * - danger   → Destructive only
 */
const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-[var(--brand)] text-[var(--text-on-primary)] hover:bg-[var(--brand-hover)] active:bg-[var(--brand-pressed)] ' +
    'shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] dark:hover:shadow-[var(--shadow-glow-primary)] ' +
    'focus-visible:ring-[var(--brand-ring)]',
  accent:
    'bg-[var(--accent)] text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)] ' +
    'shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] dark:hover:shadow-[var(--shadow-glow-gold)] ' +
    'focus-visible:ring-[var(--accent-ring)]',
  secondary:
    'bg-[var(--bg-surface-2)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] ' +
    'border border-[var(--border-default)] focus-visible:ring-[var(--brand-ring)]',
  outline:
    'border-2 border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand-soft)] ' +
    'focus-visible:ring-[var(--brand-ring)]',
  ghost:
    'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] ' +
    'focus-visible:ring-[var(--brand-ring)]',
  danger:
    'bg-[var(--danger)] text-white hover:brightness-110 active:brightness-95 ' +
    'shadow-[var(--shadow-sm)] focus-visible:ring-[color:var(--danger)]/40',
}

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-[var(--radius-sm)]',
  md: 'px-5 py-2.5 text-sm rounded-[var(--radius-md)]',
  lg: 'px-6 py-3 text-base rounded-[var(--radius-md)]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, fullWidth, disabled, children, type, ...props }, ref) => (
    <button
      ref={ref}
      type={type ?? 'button'}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap select-none',
        'transition-[background-color,box-shadow,transform,color] duration-150 ease-out',
        'focus:outline-none focus-visible:ring-4',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'active:translate-y-px',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
)
Button.displayName = 'Button'
