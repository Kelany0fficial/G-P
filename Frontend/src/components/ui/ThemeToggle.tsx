import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/utils/cn'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'relative inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-transparent',
        'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        'dark:text-slate-100 dark:hover:bg-night-800 dark:hover:text-white',
        'transition-colors',
        className
      )}
    >
      <Sun className={cn('h-5 w-5 transition-all', isDark ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100 absolute')} />
      <Moon className={cn('h-5 w-5 transition-all', isDark ? 'scale-100 rotate-0 opacity-100 absolute' : 'scale-0 -rotate-90 opacity-0')} />
    </button>
  )
}
