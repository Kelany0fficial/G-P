import { Star } from 'lucide-react'
import { cn } from '@/utils/cn'

interface StarRatingProps {
  /** Current rating value (0..max). Prefer this name. */
  value?: number
  /** Backwards-compatible alias of `value`. */
  rating?: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  /** Treat as interactive automatically when `onChange` is provided. */
  interactive?: boolean
  onChange?: (rating: number) => void
}

const SIZE_CLASS: Record<NonNullable<StarRatingProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
}

export function StarRating({
  value,
  rating,
  max = 5,
  size = 'sm',
  interactive,
  onChange,
}: StarRatingProps) {
  const current = value ?? rating ?? 0
  const editable = interactive ?? typeof onChange === 'function'
  const iconClass = SIZE_CLASS[size]

  return (
    <div className="flex items-center gap-0.5" role={editable ? 'radiogroup' : 'img'} aria-label={`Rating: ${current} of ${max}`}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(current)
        const halfFilled = !filled && i < current
        return (
          <button
            key={i}
            type="button"
            disabled={!editable}
            onClick={() => onChange?.(i + 1)}
            aria-label={`${i + 1} star${i ? 's' : ''}`}
            className={cn(
              'transition-transform',
              editable && 'cursor-pointer hover:scale-110 focus-visible:scale-110',
              !editable && 'cursor-default'
            )}
          >
            {halfFilled ? (
              <div className="relative">
                <Star className={cn(iconClass, 'absolute text-slate-300')} />
                <Star
                  className={cn(iconClass, 'absolute w-1/2 overflow-hidden fill-amber-400 text-amber-400')}
                  style={{ clipPath: 'inset(0 50% 0 0)' }}
                />
                <Star className={cn(iconClass, 'text-slate-300 opacity-0')} />
              </div>
            ) : (
              <Star
                className={cn(iconClass, filled ? 'fill-amber-400 text-amber-400' : 'text-slate-300')}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
