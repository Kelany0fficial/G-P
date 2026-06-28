import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /**
   * default  — standard card surface
   * outlined — flat, no shadow, just a border (used in stacked lists)
   * elevated — bigger lift, used for hero callouts
   * premium  — gold-ringed accent card (rare, for upgrades / featured)
   */
  variant?: 'default' | 'outlined' | 'elevated' | 'premium'
}

const paddings: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6 sm:p-8',
}

const variants: Record<NonNullable<CardProps['variant']>, string> = {
  default:
    'bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-sm)]',
  outlined:
    'bg-[var(--bg-surface)] border border-[var(--border-default)]',
  elevated:
    'bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-md)]',
  premium:
    'bg-[var(--bg-surface)] border border-[var(--accent-soft)] shadow-[var(--shadow-md)] ' +
    'ring-1 ring-[var(--accent-soft)]',
}

export function Card({
  children,
  className,
  hover,
  padding = 'md',
  variant = 'default',
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] transition-all duration-200',
        variants[variant],
        hover && 'hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 hover:border-[var(--border-default)] cursor-pointer',
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mb-4 flex flex-col gap-1', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn('text-lg font-bold text-[var(--text-primary)]', className)}>{children}</h3>
}
