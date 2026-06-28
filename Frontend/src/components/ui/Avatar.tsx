import { User } from 'lucide-react'
import { cn } from '@/utils/cn'
import { absoluteMediaUrl } from '@/utils/media'

interface AvatarProps {
  src?: string | null
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const resolved = absoluteMediaUrl(src ?? undefined)

  if (resolved) {
    return (
      <img
        src={resolved}
        alt={name ?? 'User'}
        loading="lazy"
        className={cn(
          'rounded-full object-cover bg-slate-200 ring-1 ring-black/5 dark:bg-night-800 dark:ring-white/10',
          sizes[size],
          className
        )}
        onError={(e) => {
          // Fall back to initials avatar on broken image
          ;(e.target as HTMLImageElement).style.display = 'none'
        }}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br from-primary-100 to-primary-200 text-primary-800 flex items-center justify-center font-bold',
        'dark:from-night-700 dark:to-night-800 dark:text-primary-300',
        sizes[size],
        className
      )}
    >
      {initials || <User className="h-1/2 w-1/2" />}
    </div>
  )
}
