import { useEffect, useState } from 'react'
import { Search, Users } from 'lucide-react'
import { guidesApi } from '@/api/guides'
import { GuideCard } from '@/components/shared/GuideCard'
import { CardSkeleton, EmptyState, Input } from '@/components/ui'
import { getErrorMessage, isUnauthorizedError } from '@/api/axios'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import type { Guide } from '@/types'

const LANGUAGES = ['All', 'Arabic', 'English', 'French', 'Spanish', 'German', 'Italian']

export function GuidesPage() {
  const [guides, setGuides] = useState<Guide[]>([])
  const [filteredGuides, setFilteredGuides] = useState<Guide[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [language, setLanguage] = useState('All')
  const [sortBy, setSortBy] = useState<'rating' | 'price_low' | 'price_high'>('rating')
  const { showToast } = useToast()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const data = await guidesApi.getActiveGuides()
        setGuides(data)
        setFilteredGuides(data)
      } catch (err) {
        // Public page: only show toast for real errors when authenticated.
        // Anonymous users hitting auth-guarded endpoints should see empty state silently.
        if (isAuthenticated && !isUnauthorizedError(err)) showToast(getErrorMessage(err), 'error')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [showToast])

  useEffect(() => {
    let filtered = [...guides]
    
    // Filter by search
    if (search) {
      filtered = filtered.filter(g => 
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.language.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    // Filter by language
    if (language !== 'All') {
      filtered = filtered.filter(g => g.language === language)
    }
    
    // Sort
    if (sortBy === 'rating') {
      filtered.sort((a, b) => b.rate - a.rate)
    } else if (sortBy === 'price_low') {
      filtered.sort((a, b) => a.priceOfDay - b.priceOfDay)
    } else if (sortBy === 'price_high') {
      filtered.sort((a, b) => b.priceOfDay - a.priceOfDay)
    }
    
    // update state asynchronously to avoid sync setState in effect
    Promise.resolve().then(() => setFilteredGuides(filtered))
  }, [search, language, sortBy, guides])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Tour Guides</h1>
      <p className="text-slate-500 dark:text-slate-300 mb-6">Choose your perfect local guide</p>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search by name or language..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-night-700 dark:bg-night-800 dark:text-white dark:focus:ring-primary-900/40"
        >
          {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'rating' | 'price_low' | 'price_high')}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-night-700 dark:bg-night-800 dark:text-white dark:focus:ring-primary-900/40"
        >
          <option value="rating">Highest Rated</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filteredGuides.length === 0 ? (
        <EmptyState icon={Users} title="No guides found" description="Try changing your search criteria" />
      ) : (
        <div className="grid gap-4">
          {filteredGuides.map((guide) => <GuideCard key={guide.guideId} guide={guide} />)}
        </div>
      )}
    </div>
  )
}