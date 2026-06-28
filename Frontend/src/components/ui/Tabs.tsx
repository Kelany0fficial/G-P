import { cn } from '@/utils/cn'

interface Tab {
  id: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
  /**
   * `segmented` (default) — pill-style segmented control, sits inside a surface-2 track.
   * `underline`           — underlined tabs, more editorial / page-level navigation.
   */
  variant?: 'segmented' | 'underline'
}

export function Tabs({ tabs, activeTab, onChange, className, variant = 'segmented' }: TabsProps) {
  if (variant === 'underline') {
    return (
      <div role="tablist" className={cn('flex gap-6 border-b border-subtle', className)}>
        {tabs.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onChange(tab.id)}
              className={cn(
                'relative -mb-px py-3 text-sm font-semibold transition-colors',
                active ? 'text-brand' : 'text-secondary-app hover:text-app'
              )}
            >
              {tab.label}
              <span
                aria-hidden
                className={cn(
                  'absolute inset-x-0 -bottom-px h-0.5 rounded-full transition-opacity',
                  'bg-[var(--brand)]',
                  active ? 'opacity-100' : 'opacity-0'
                )}
              />
            </button>
          )
        })}
      </div>
    )
  }

  // segmented (default)
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex w-full gap-1 rounded-[var(--radius-md)] bg-surface-2 p-1',
        className
      )}
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.id
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex-1 rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold',
              'transition-[background-color,color,box-shadow] duration-150 ease-out',
              active
                ? 'bg-surface text-brand shadow-[var(--shadow-sm)]'
                : 'text-secondary-app hover:text-app'
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
