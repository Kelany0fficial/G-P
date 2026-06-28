// src/components/ai/AiGuideBot.tsx
import { useCallback, useRef, useState, type DragEvent } from 'react'
import { Bot, X, Upload, ImagePlus, Loader2, Volume2, Globe, ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuth } from '@/context/AuthContext'
import { aiGuideApi } from '@/api/aiGuide'

const LANGS = [
  { code: 'ar', label: 'العربية', flag: '🇪🇬' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
]

type Message =
  | { role: 'user'; imageUrl: string; fileName: string }
  | { role: 'bot'; text: string }
  | { role: 'loading' }
  | { role: 'error'; text: string }

export function AiGuideBot() {
  const { isAuthenticated } = useAuth()

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [lang, setLang] = useState('ar')
  const [showLang, setShowLang] = useState(false)
  const [dragging, setDragging] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/') && !file.type.startsWith('audio/')) {
        setMessages((m) => [...m, { role: 'error', text: 'يُسمح فقط بصور أو ملفات صوتية.' }])
        return
      }

      const imageUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
      setMessages((m) => [...m, { role: 'user', imageUrl, fileName: file.name }])
      setMessages((m) => [...m, { role: 'loading' }])

      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

      try {
        const result = await aiGuideApi.analyzeImage(file, lang)

        setMessages((m) => {
          const filtered = m.filter((x) => x.role !== 'loading')
          return [...filtered, { role: 'bot', text: result ?? 'لا يوجد رد.' }]
        })
      } catch {
        setMessages((m) => {
          const filtered = m.filter((x) => x.role !== 'loading')
          return [
            ...filtered,
            { role: 'error', text: 'حدث خطأ أثناء التحليل. حاول مرة أخرى.' },
          ]
        })
      }

      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    },
    [lang]
  )

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  if (!isAuthenticated) return null

  return (
    <>
      {/* ── Floating Button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="AI Guide"
        className={cn(
          'fixed bottom-24 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-xl',
          'overflow-hidden transition-transform duration-200 hover:scale-110 active:scale-95',
          'md:bottom-8 md:right-8',
          open && 'ring-2 ring-[var(--brand)] ring-offset-2'
        )}
      >
        {open ? (
          /* لما يكون مفتوح يظهر X فوق الصورة */
          <div className="relative flex h-full w-full items-center justify-center">
            <img
              src="/assets/bot.png"
              alt="AI Guide"
              className="h-full w-full object-cover opacity-40"
            />
            <X className="absolute h-6 w-6 text-white drop-shadow-lg" />
          </div>
        ) : (
          <img
            src="/assets/bot.png"
            alt="AI Guide"
            className="h-full w-full object-cover"
          />
        )}
      </button>

      {/* ── Chat Panel ── */}
      <div
        className={cn(
          'fixed bottom-44 right-5 z-50 flex w-[90vw] max-w-sm flex-col overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-2xl transition-all duration-300 origin-bottom-right md:bottom-28 md:right-8',
          open
            ? 'scale-100 opacity-100 pointer-events-auto'
            : 'scale-90 opacity-0 pointer-events-none'
        )}
        style={{ height: '520px' }}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center gap-3 bg-[var(--brand)] px-4 py-3 text-[var(--text-on-primary)]">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
            <Bot className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight">AI Monument Guide</p>
            <p className="text-xs leading-tight opacity-75">ارفع صورة أثر وسأشرحه لك</p>
          </div>

          {/* Language picker */}
          <div className="relative">
            <button
              onClick={() => setShowLang((v) => !v)}
              className="flex items-center gap-1 rounded-lg bg-white/20 px-2 py-1 text-xs font-medium transition-colors hover:bg-white/30"
            >
              <Globe className="h-3.5 w-3.5" />
              {LANGS.find((l) => l.code === lang)?.flag}
              <ChevronDown className={cn('h-3 w-3 transition-transform', showLang && 'rotate-180')} />
            </button>

            {showLang && (
              <div className="absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xl">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setShowLang(false) }}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-xs text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)]',
                      lang === l.code && 'bg-[var(--brand-soft)] font-semibold'
                    )}
                  >
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                    {lang === l.code && <span className="ml-auto text-[var(--brand)]">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto bg-[var(--bg-base)] p-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-soft)]">
                <ImagePlus className="h-8 w-8 text-[var(--brand)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">ارفع صورة أثر مصري</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)]">
                  اسحب صورة هنا أو اضغط على زر الرفع
                  <br />
                  وسيشرح لك الـ AI الأثر بلغتك
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            if (msg.role === 'user') return (
              <div key={i} className="flex justify-end">
                <div className="max-w-[80%] overflow-hidden rounded-2xl rounded-tr-sm bg-[var(--brand)] text-[var(--text-on-primary)] shadow-sm">
                  {msg.imageUrl ? (
                    <img src={msg.imageUrl} alt="uploaded" className="max-h-48 w-full object-cover" />
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 text-sm">
                      <Volume2 className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate text-xs">{msg.fileName}</span>
                    </div>
                  )}
                </div>
              </div>
            )

            if (msg.role === 'loading') return (
              <div key={i} className="flex justify-start">
                <div className="rounded-2xl rounded-tl-sm border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--brand)]" />
                    <span className="text-xs text-[var(--text-secondary)]">جاري تحليل الصورة…</span>
                  </div>
                </div>
              </div>
            )

            if (msg.role === 'bot') return (
              <div key={i} className="flex justify-start">
                <div className="max-w-[88%] rounded-2xl rounded-tl-sm border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3 shadow-sm">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-primary)]">
                    {msg.text}
                  </p>
                </div>
              </div>
            )

            if (msg.role === 'error') return (
              <div key={i} className="flex justify-start">
                <div className="max-w-[88%] rounded-2xl rounded-tl-sm border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
                  <p className="text-sm text-red-700 dark:text-red-300">{msg.text}</p>
                </div>
              </div>
            )

            return null
          })}

          <div ref={bottomRef} />
        </div>

        {/* Upload area */}
        <div className="flex-shrink-0 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*,audio/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
          />

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed py-3 transition-colors duration-150',
              dragging
                ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                : 'border-[var(--border-default)] hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]'
            )}
          >
            <Upload className="h-5 w-5 text-[var(--brand)]" />
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              اسحب صورة أو <span className="text-[var(--brand)] underline">اختر ملف</span>
            </p>
            <p className="text-[10px] text-[var(--text-tertiary)]">JPG · PNG · WEBP · MP3</p>
          </div>
        </div>
      </div>

      {/* Backdrop لإغلاق الـ lang dropdown */}
      {showLang && (
        <div className="fixed inset-0 z-40" onClick={() => setShowLang(false)} />
      )}
    </>
  )
}