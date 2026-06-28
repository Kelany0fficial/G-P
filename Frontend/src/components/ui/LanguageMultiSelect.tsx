import { useMemo, useState } from 'react'
import { Check, Globe, Plus, X } from 'lucide-react'
import { cn } from '@/utils/cn'

// Curated list — users can also add custom languages via free text.
const SUGGESTED_LANGUAGES = [
  'English',
  'Arabic',
  'French',
  'German',
  'Spanish',
  'Italian',
  'Russian',
  'Mandarin',
  'Japanese',
  'Korean',
  'Turkish',
  'Hindi',
]

interface LanguageMultiSelectProps {
  label?: string
  hint?: string
  error?: string
  value: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
  className?: string
}

export function LanguageMultiSelect({
  label,
  hint,
  error,
  value,
  onChange,
  disabled,
  className,
}: LanguageMultiSelectProps) {
  const [custom, setCustom] = useState('')

  const normalized = useMemo(
    () => new Set(value.map((v) => v.trim().toLowerCase())),
    [value]
  )

  const toggle = (lang: string) => {
    if (disabled) return
    const key = lang.trim().toLowerCase()
    if (normalized.has(key)) {
      onChange(value.filter((v) => v.trim().toLowerCase() !== key))
    } else {
      onChange([...value, lang.trim()])
    }
  }

  const addCustom = () => {
    const v = custom.trim()
    if (!v) return
    if (!normalized.has(v.toLowerCase())) onChange([...value, v])
    setCustom('')
  }

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
          <Globe className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          {label}
        </label>
      )}

      {/* Selected chips */}
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {value.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => toggle(lang)}
              disabled={disabled}
              className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white hover:bg-primary-700 transition-colors"
            >
              {lang}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}

      {/* Suggestions */}
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTED_LANGUAGES.map((lang) => {
          const active = normalized.has(lang.toLowerCase())
          return (
            <button
              key={lang}
              type="button"
              onClick={() => toggle(lang)}
              disabled={disabled}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                active
                  ? 'border-primary-600 bg-primary-50 text-primary-800 dark:border-primary-500 dark:bg-night-800 dark:text-primary-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-primary-400 hover:bg-primary-50 dark:border-night-700 dark:bg-night-900 dark:text-slate-300 dark:hover:bg-night-800',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {active && <Check className="h-3 w-3" />}
              {lang}
            </button>
          )
        })}
      </div>

      {/* Custom entry */}
      <div className="mt-2 flex items-center gap-2">
        <input
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addCustom()
            }
          }}
          disabled={disabled}
          placeholder="Add another language…"
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-primary-600 focus:ring-4 focus:ring-primary-100 focus:outline-none dark:border-night-700 dark:bg-night-900 dark:text-slate-100"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={disabled || !custom.trim()}
          className="rounded-xl bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  )
}
