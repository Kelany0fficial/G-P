import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leadingIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, type, leadingIcon, ...props }, ref) => {
    const inputId = id ?? label?.replace(/\s+/g, '-').toLowerCase()

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leadingIcon && (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--text-muted)]">
              {leadingIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              // base
              'w-full text-sm placeholder:text-[var(--text-muted)]',
              'bg-[var(--bg-surface)] text-[var(--text-primary)]',
              'border border-[var(--border-default)] rounded-[var(--radius-md)]',
              'px-4 py-2.5 transition-all duration-150',
              // focus
              'focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand-ring)] focus:outline-none',
              // disabled
              'disabled:bg-[var(--bg-muted)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed',
              // optional icon padding
              leadingIcon && 'pl-10',
              // error
              error && 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[color:var(--danger)]/25',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs text-[var(--danger)]">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-[var(--text-muted)]">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
