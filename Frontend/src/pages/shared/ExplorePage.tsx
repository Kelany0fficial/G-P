import { useEffect, useMemo, useState } from 'react'
import { Search, MapPin, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { placesApi } from '@/api/places'
import { PlaceCard } from '@/components/shared/PlaceCard'
import { CardSkeleton, EmptyState, Input } from '@/components/ui'
import { getErrorMessage, isUnauthorizedError } from '@/api/axios'
import { useToast } from '@/context/ToastContext'
import { cn } from '@/utils/cn'
import type { Place } from '@/types'

const CATEGORIES = ['All', 'Temple', 'Museum', 'Beach', 'Nature', 'Pyramid', 'Monument', 'City', 'Market']

export function ExplorePage() {
  const [places, setPlaces] = useState<Place[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [searchParams, setSearchParams] = useSearchParams()
  const governorate = searchParams.get('governorate') ?? ''
  const { showToast } = useToast()

  useEffect(() => {
    placesApi
      .getAll()
      .then(setPlaces)
      .catch((err) => { if (!isUnauthorizedError(err)) showToast(getErrorMessage(err), 'error') })
      .finally(() => setIsLoading(false))
  }, [showToast])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const gov = governorate.trim().toLowerCase()
    return places.filter((p) => {
      if (category !== 'All' && p.type !== category) return false
      if (gov && (p.city ?? '').toLowerCase() !== gov) return false
      if (q && !(`${p.name} ${p.city ?? ''}`.toLowerCase().includes(q))) return false
      return true
    })
  }, [places, search, category, governorate])

  const clearGovernorate = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('governorate')
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="container-app py-8 sm:py-12">
      {/* ── عنوان الصفحة ── */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
          Explore <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Egypt</span>
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 sm:text-base">
          Discover the most amazing landmarks, hidden gems, and tourist attractions.
        </p>
      </div>

      {/* ── شارة فلتر المحافظة ── */}
      {governorate && (
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-bold text-amber-900 shadow-sm dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-200">
          <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          Showing places in <span className="underline decoration-amber-400/50 underline-offset-2">{governorate}</span>
          <button 
            type="button" 
            onClick={clearGovernorate} 
            className="ml-1 rounded-full p-0.5 transition-colors hover:bg-amber-200/50 dark:hover:bg-amber-800/50"
            aria-label="Clear governorate filter"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── أدوات البحث والتصفية ── */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center">
        {/* مربع البحث */}
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search for a place, temple, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 rounded-2xl border-slate-200 bg-white py-2.5 shadow-sm focus:border-amber-400 focus:ring-amber-400/20 dark:border-slate-800 dark:bg-slate-950"
          />
        </div>

        {/* أزرار التصنيفات (شريط قابل للتمرير) */}
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2 lg:pb-0">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                'whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition-all duration-300',
                category === c
                  ? 'bg-amber-500 text-slate-900 shadow-md shadow-amber-500/25 border border-amber-500' // الحالة النشطة (الذهبي)
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-amber-500/30 dark:hover:bg-amber-900/10' // الحالة العادية
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── شبكة عرض الأماكن (Grid) ── */}
      {isLoading ? (
        // تم التعديل هنا ليكون 2 بالعرض على الموبايل
        <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12">
          <EmptyState 
            icon={MapPin} 
            title="No places found" 
            description="We couldn't find any places matching your current search or filters. Try adjusting them." 
          />
        </div>
      ) : (
        // تم التعديل هنا ليكون 2 بالعرض على الموبايل بمسافات صغيرة (gap-3) ومسافات أكبر للكمبيوتر (gap-6)
        <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      )}
    </div>
  )
}