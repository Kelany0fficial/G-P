import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/utils/cn'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
  hideToast: (id?: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const styles: Record<ToastType, { ring: string; icon: ReactNode }> = {
  success: { ring: 'ring-green-200 bg-green-50 text-green-800', icon: <CheckCircle2 className="h-5 w-5 text-green-600" /> },
  error:   { ring: 'ring-red-200 bg-red-50 text-red-800',       icon: <XCircle className="h-5 w-5 text-red-600" /> },
  info:    { ring: 'ring-primary-200 bg-primary-50 text-primary-900', icon: <Info className="h-5 w-5 text-primary-600" /> },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const hideToast = useCallback((id?: number) => {
    if (id === undefined) {
      timers.current.forEach(clearTimeout)
      timers.current.clear()
      setToasts([])
      return
    }
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
      timers.current.delete(id)
    }, 3500)
    timers.current.set(id, timer)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-8"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl px-4 py-3 shadow-elevated ring-1 animate-slide-up',
              styles[t.type].ring
            )}
            role="status"
          >
            <div className="flex-shrink-0 pt-0.5">{styles[t.type].icon}</div>
            <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
            <button
              type="button"
              onClick={() => hideToast(t.id)}
              className="ml-1 rounded-md p-0.5 text-slate-500 transition-colors hover:bg-black/5"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
