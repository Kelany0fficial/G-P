import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  Calendar,
  CheckCircle2,
  Map as MapIcon,
  Sparkles,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  Search,
  MapPin,
  Languages,
  Star,
  Loader2
} from 'lucide-react'
import { bookingsApi } from '@/api/bookings'
import { guidesApi } from '@/api/guides'
import { plansApi } from '@/api/plans'
import { Badge, Button, CardSkeleton, Input } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { getErrorMessage } from '@/api/axios'
import { formatCurrency } from '@/utils/format'
import { absoluteMediaUrl } from '@/utils/media'
import { cn } from '@/utils/cn'
import type { Guide, CreateBookingRequest, AiPlanDetails, ManualPlan } from '@/types'

interface PlanOption {
  id: string
  name: string
  type: 'ai' | 'manual'
  days?: number
}

export function CreateBookingPage() {
  const [searchParams] = useSearchParams()
  const guideIdParam = searchParams.get('guideId')
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [plans, setPlans] = useState<PlanOption[]>([])
  const [rawManualPlans, setRawManualPlans] = useState<ManualPlan[]>([])
  const [guides, setGuides] = useState<Guide[]>([])
  
  const [selectedGuideId, setSelectedGuideId] = useState(guideIdParam || '')
  const [selectedPlanId, setSelectedPlanId] = useState('')
  
  // States for fetching full plan details on selection
  const [selectedAiPlanDetails, setSelectedAiPlanDetails] = useState<AiPlanDetails | null>(null)
  const [isFetchingPlanDetails, setIsFetchingPlanDetails] = useState(false)

  const [guideSearch, setGuideSearch] = useState('')
  const [planSearch, setPlanSearch] = useState('')
  
  const [activeStep, setActiveStep] = useState<'guide' | 'plan' | null>(guideIdParam ? 'plan' : 'guide')
  
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  // ── 1. Load Initial Lists ──
  useEffect(() => {
    const loadData = async () => {
      setIsFetching(true)
      try {
        const [aiPlans, manualPlans, activeGuides] = await Promise.all([
          plansApi.getMyAiPlans(),
          plansApi.getMyManualPlans(),
          guidesApi.getActiveGuides()
        ])
        
        setRawManualPlans(manualPlans || [])

        const allPlans: PlanOption[] = [
          ...(aiPlans || []).map(p => ({ id: p.id, name: p.name, type: 'ai' as const, days: p.countDay })),
          ...(manualPlans || []).map(p => ({ id: p.id, name: p.name, type: 'manual' as const }))
        ]
        
        setPlans(allPlans)
        setGuides(activeGuides || [])
      } catch (err) {
        showToast('Failed to load booking data. Please try again.', 'error')
      } finally {
        setIsFetching(false)
      }
    }
    loadData()
  }, [showToast])

  // ── 2. Fetch Selected Plan Details (If AI) ──
  useEffect(() => {
    if (!selectedPlanId) {
      setSelectedAiPlanDetails(null)
      return
    }
    
    const pOpt = plans.find(p => p.id === selectedPlanId)
    if (pOpt?.type === 'ai') {
      setIsFetchingPlanDetails(true)
      plansApi.getAiPlanDetails(selectedPlanId)
        .then(setSelectedAiPlanDetails)
        .catch(() => showToast('Failed to load itinerary details.', 'error'))
        .finally(() => setIsFetchingPlanDetails(false))
    }
  }, [selectedPlanId, plans, showToast])

  // ── 3. Flatten Itinerary Places for the Mini-Slider ──
  const itineraryPlaces = useMemo(() => {
    const pOpt = plans.find(p => p.id === selectedPlanId)
    if (!pOpt) return []
    
    let items: any[] = []
    if (pOpt.type === 'ai' && selectedAiPlanDetails?.planItinerary) {
      items = selectedAiPlanDetails.planItinerary.filter(i => i.placeId > 0 && i.placeName !== 'Place unavailable')
    } else if (pOpt.type === 'manual') {
      const manualDetails = rawManualPlans.find(m => m.id === selectedPlanId)
      if (manualDetails?.places) {
        items = manualDetails.places
      }
    }
    // Sort by day number to show them in chronological order
    return items.sort((a, b) => a.dayNumber - b.dayNumber)
  }, [selectedPlanId, plans, selectedAiPlanDetails, rawManualPlans])


  // ── Filters & Handlers ──
  const filteredGuides = useMemo(() => {
    if (!guideSearch) return guides
    return guides.filter(g => 
      g.name.toLowerCase().includes(guideSearch.toLowerCase()) || 
      g.language.toLowerCase().includes(guideSearch.toLowerCase())
    )
  }, [guides, guideSearch])

  const filteredPlans = useMemo(() => {
    if (!planSearch) return plans
    return plans.filter(p => p.name.toLowerCase().includes(planSearch.toLowerCase()))
  }, [plans, planSearch])

  const selectedGuide = guides.find(g => g.guideId === selectedGuideId)
  const selectedPlan = plans.find(p => p.id === selectedPlanId)

  const handleSelectGuide = (id: string) => {
    setSelectedGuideId(id)
    setGuideSearch('')
    setActiveStep('plan')
  }

  const handleSelectPlan = (id: string) => {
    setSelectedPlanId(id)
    setPlanSearch('')
    setActiveStep(null)
  }

  const handleSubmit = async () => {
    if (!selectedGuideId || !selectedPlanId) {
      showToast('Please select both a guide and an itinerary plan.', 'error')
      return
    }
    setIsLoading(true)
    try {
      const payload: CreateBookingRequest = { guideId: selectedGuideId }
      if (selectedPlan?.type === 'ai') payload.aiPlanId = selectedPlanId
      else payload.manualPlanId = selectedPlanId

      const result = await bookingsApi.createBooking(payload)
      showToast(result.message || 'Booking request sent successfully!', 'success')
      navigate(`/bookings/${result.bookingId}`)
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return <div className="mx-auto max-w-5xl p-6 lg:p-8"><CardSkeleton /></div>
  }

  const isReadyToSubmit = selectedGuideId && selectedPlanId

  return (
    <div className="min-h-screen bg-slate-50 pb-48 dark:bg-slate-950 font-sans lg:pb-24">
      {/* ── Header ── */}
      <div className="bg-slate-900 pb-16 pt-10 text-center dark:bg-black sm:pb-20 sm:pt-12">
        <h1 className="text-2xl font-black text-white sm:text-4xl">
          Reserve Your <span className="text-amber-500">Journey</span>
        </h1>
        <p className="mx-auto mt-2 max-w-lg px-4 text-xs text-slate-400 sm:mt-3 sm:text-base">
          Craft your perfect Egyptian experience in just two simple steps.
        </p>
      </div>

      <div className="mx-auto -mt-10 max-w-6xl px-3 sm:-mt-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-12">
          
          {/* ── LEFT COLUMN: Interactive Selection Flow ── */}
          <div className="flex-1 space-y-4 sm:space-y-6">
            
            {/* ── STEP 1: GUIDE SELECTION ── */}
            <div className={cn(
              "overflow-hidden rounded-2xl sm:rounded-3xl border bg-white shadow-sm transition-all duration-300 dark:bg-slate-900",
              activeStep === 'guide' ? "border-amber-400 shadow-amber-500/10 ring-1 ring-amber-400 dark:border-amber-500/50" : "border-slate-200 dark:border-slate-800"
            )}>
              <div className="flex items-center justify-between bg-slate-50 px-4 py-4 sm:px-6 sm:py-5 dark:bg-slate-900/50">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={cn(
                    "flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-sm sm:text-base font-bold",
                    selectedGuideId && activeStep !== 'guide' 
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" 
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400"
                  )}>
                    {selectedGuideId && activeStep !== 'guide' ? <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" /> : "1"}
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">Choose a Local Guide</h2>
                </div>
                {selectedGuideId && activeStep !== 'guide' && (
                  <button onClick={() => setActiveStep('guide')} className="text-xs sm:text-sm font-bold text-amber-600 hover:text-amber-700 dark:text-amber-500">
                    Change
                  </button>
                )}
              </div>

              <div className={cn("px-4 sm:px-6 transition-all duration-300", activeStep === 'guide' ? "py-4 sm:py-6 block" : "hidden")}>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search guides..."
                    value={guideSearch} onChange={(e) => setGuideSearch(e.target.value)}
                    className="pl-9 sm:pl-10 text-sm bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>

                <div className="max-h-[300px] sm:max-h-[340px] space-y-2.5 overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                  {filteredGuides.length === 0 ? (
                    <p className="py-6 text-center text-xs sm:text-sm text-slate-500">No guides found.</p>
                  ) : (
                    filteredGuides.map((guide) => {
                      const isSelected = selectedGuideId === guide.guideId;
                      const imageSrc = absoluteMediaUrl(guide.profileImageUrl) || `https://ui-avatars.com/api/?name=${encodeURIComponent(guide.name)}&background=fef3c7&color=b45309`;
                      
                      return (
                        <button
                          key={guide.guideId} type="button" onClick={() => handleSelectGuide(guide.guideId)}
                          className={cn(
                            "group flex w-full items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border p-3 sm:p-4 text-left transition-all duration-300",
                            isSelected 
                              ? "border-amber-400 bg-amber-50 shadow-md shadow-amber-500/10 dark:border-amber-500/50 dark:bg-amber-950/20" 
                              : "border-slate-100 bg-white hover:border-amber-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-700/50"
                          )}
                        >
                          <div className={cn(
                            "h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-full ring-2 transition-all duration-300",
                            isSelected ? "ring-amber-400" : "ring-slate-100 group-hover:ring-amber-200 dark:ring-slate-800"
                          )}>
                            <img src={imageSrc} alt={guide.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="truncate font-bold text-sm sm:text-base text-slate-900 dark:text-white">{guide.name}</h3>
                              <Badge variant="success" className="h-4 sm:h-5 px-1 py-0 text-[8px] sm:text-[9px] flex shrink-0 items-center gap-0.5 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                <ShieldCheck className="h-3 w-3" />
                              </Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1 text-amber-500">
                                <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-amber-500" /> {guide.rate?.toFixed(1) || 'New'}
                              </span>
                              <span className="hidden sm:inline">•</span>
                              <span className="flex items-center gap-1"><Languages className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> <span className="truncate max-w-[80px] sm:max-w-none">{guide.language}</span></span>
                            </div>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <p className="font-black text-sm sm:text-base text-slate-900 dark:text-white">{formatCurrency(guide.priceOfDay)}</p>
                            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400">per day</p>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
              
              {selectedGuide && activeStep !== 'guide' && (
                <div className="border-t border-slate-100 bg-white px-4 py-3 sm:px-6 sm:py-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-3 rounded-xl sm:rounded-2xl border border-emerald-100 bg-emerald-50/50 p-2.5 sm:p-3 dark:border-emerald-900/30 dark:bg-emerald-900/10">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-emerald-200 dark:ring-emerald-800">
                      <img src={absoluteMediaUrl(selectedGuide.profileImageUrl) || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedGuide.name)}&background=d1fae5&color=047857`} alt={selectedGuide.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-sm sm:text-base text-slate-900 dark:text-white">{selectedGuide.name}</p>
                      <p className="truncate text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <Star className="inline-block h-3 w-3 mb-0.5 fill-current" /> {selectedGuide.rate?.toFixed(1) || 'New'} · {selectedGuide.language}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── STEP 2: PLAN SELECTION ── */}
            <div className={cn(
              "overflow-hidden rounded-2xl sm:rounded-3xl border bg-white shadow-sm transition-all duration-300 dark:bg-slate-900",
              activeStep === 'plan' ? "border-amber-400 shadow-amber-500/10 ring-1 ring-amber-400 dark:border-amber-500/50" : "border-slate-200 dark:border-slate-800",
              !selectedGuideId && activeStep !== 'plan' && "opacity-60"
            )}>
              <div className="flex items-center justify-between bg-slate-50 px-4 py-4 sm:px-6 sm:py-5 dark:bg-slate-900/50">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={cn(
                    "flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-sm sm:text-base font-bold",
                    selectedPlanId && activeStep !== 'plan'
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" 
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400"
                  )}>
                    {selectedPlanId && activeStep !== 'plan' ? <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" /> : "2"}
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">Select Your Itinerary</h2>
                </div>
                {selectedPlanId && activeStep !== 'plan' && (
                  <button onClick={() => setActiveStep('plan')} className="text-xs sm:text-sm font-bold text-amber-600 hover:text-amber-700 dark:text-amber-500">
                    Change
                  </button>
                )}
              </div>

              <div className={cn("px-4 sm:px-6 transition-all duration-300", activeStep === 'plan' ? "py-4 sm:py-6 block" : "hidden")}>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search saved plans..."
                    value={planSearch} onChange={(e) => setPlanSearch(e.target.value)}
                    className="pl-9 sm:pl-10 text-sm bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>

                <div className="max-h-[300px] sm:max-h-[340px] space-y-2.5 overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                  {filteredPlans.length === 0 ? (
                    <div className="py-6 sm:py-8 text-center">
                      <MapPin className="mx-auto mb-2 h-6 w-6 sm:h-8 sm:w-8 text-slate-300" />
                      <p className="text-xs sm:text-sm text-slate-500">No plans found. Try creating one first!</p>
                    </div>
                  ) : (
                    filteredPlans.map((plan) => {
                      const isAi = plan.type === 'ai'
                      const isSelected = selectedPlanId === plan.id
                      return (
                        <div
                          key={plan.id}
                          className={cn(
                            "group relative rounded-xl sm:rounded-2xl border transition-all duration-300",
                            isSelected 
                              ? "border-amber-400 bg-amber-50 shadow-md shadow-amber-500/10 dark:border-amber-500/50 dark:bg-amber-950/20" 
                              : "border-slate-100 bg-white hover:border-amber-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-700/50"
                          )}
                        >
                          <button
                            type="button" onClick={() => handleSelectPlan(plan.id)}
                            className="flex w-full items-start gap-3 sm:gap-4 p-3 sm:p-4 text-left"
                          >
                            <div className={cn(
                              "flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl transition-colors mt-0.5",
                              isAi ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400" : "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                            )}>
                              {isAi ? <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" /> : <MapIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="truncate font-bold text-sm sm:text-base text-slate-900 dark:text-white">{plan.name}</h3>
                              <div className="mt-1 flex items-center gap-2">
                                 {isAi ? (
                                   <Badge variant="primary" className="h-4 sm:h-5 px-1 sm:px-1.5 py-0 text-[9px] sm:text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-500">
                                     AI Plan
                                   </Badge>
                                 ) : (
                                   <Badge variant="default" className="h-4 sm:h-5 px-1 sm:px-1.5 py-0 text-[9px] sm:text-[10px]">
                                     Manual Plan
                                   </Badge>
                                 )}
                                {plan.days && <span className="text-[10px] sm:text-xs font-semibold text-slate-500"><Calendar className="inline-block h-3 w-3 mb-0.5" /> {plan.days} Days</span>}
                              </div>
                            </div>
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* ── Selected Plan Mini Itinerary Preview ── */}
              {selectedPlan && activeStep !== 'plan' && (
                <div className="border-t border-slate-100 bg-white px-4 py-4 sm:px-6 sm:py-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 font-bold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                        {selectedPlan.type === 'ai' ? <Sparkles className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-sm sm:text-base text-slate-900 dark:text-white">{selectedPlan.name}</p>
                        <p className="truncate text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          {selectedPlan.type === 'ai' ? 'AI Generated' : 'Manual Plan'} · {selectedPlan.days ? `${selectedPlan.days} Days` : 'Flexible'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Scroll Area for Places */}
                  <div className="relative">
                    {isFetchingPlanDetails ? (
                      <div className="flex h-24 w-full items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                        <span className="ml-2 text-xs font-medium text-slate-500">Loading details...</span>
                      </div>
                    ) : itineraryPlaces.length > 0 ? (
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                        {itineraryPlaces.map((place, idx) => (
                          <div key={`${place.placeId}-${idx}`} className="w-[130px] sm:w-[150px] shrink-0 snap-start overflow-hidden rounded-xl border border-slate-100 bg-slate-50 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                            <div className="relative h-20 sm:h-24 w-full bg-slate-200 dark:bg-slate-800">
                              <Badge variant="primary" className="absolute left-1.5 top-1.5 z-10 border-none bg-black/60 px-1.5 py-0.5 text-[8px] font-bold text-white backdrop-blur-md">
                                Day {place.dayNumber}
                              </Badge>
                              <img src={absoluteMediaUrl(place.imageUrl) || 'https://placehold.co/200x150?text=Place'} alt={place.placeName} className="h-full w-full object-cover" />
                            </div>
                            <div className="p-2 sm:p-2.5">
                              <p className="truncate text-[10px] sm:text-xs font-bold text-slate-900 dark:text-white">{place.placeName}</p>
                              {place.ticketPrice !== undefined && (
                                <p className="mt-0.5 text-[9px] sm:text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                  {place.ticketPrice > 0 ? formatCurrency(place.ticketPrice) : 'Free'}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-16 w-full items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-200 dark:border-slate-800 dark:bg-slate-900/50">
                        <span className="text-xs font-medium text-slate-500">No places added to this plan yet.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ── RIGHT COLUMN: Desktop Sticky Summary (Hidden on Mobile) ── */}
          <div className="hidden w-[380px] shrink-0 lg:block">
            <div className="sticky top-24 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              <div className="bg-slate-900 px-6 py-5 dark:bg-black">
                <h3 className="font-black text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-amber-500" /> Booking Summary
                </h3>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Selected Guide</span>
                  <div className="mt-3 flex items-center justify-between">
                    {selectedGuide ? (
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-slate-100 dark:ring-slate-800">
                           <img src={absoluteMediaUrl(selectedGuide.profileImageUrl) || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedGuide.name)}&background=fef3c7&color=b45309`} alt={selectedGuide.name} className="h-full w-full object-cover" />
                        </div>
                        <span className="font-black text-slate-900 dark:text-white">{selectedGuide.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-slate-400 dark:text-slate-600">Pending selection...</span>
                    )}
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />

                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Selected Itinerary</span>
                  <div className="mt-3 flex items-center justify-between">
                    {selectedPlan ? (
                      <div className="flex items-center gap-3 w-full">
                        <div className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                          selectedPlan.type === 'ai' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400" : "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                        )}>
                          {selectedPlan.type === 'ai' ? <Sparkles className="h-5 w-5" /> : <MapIcon className="h-5 w-5" />}
                        </div>
                        <div className="flex flex-1 flex-col min-w-0">
                          <span className="truncate font-black text-slate-900 dark:text-white">{selectedPlan.name}</span>
                          <Link to={`/plans/${selectedPlan.id}?type=${selectedPlan.type}`} target="_blank" className="text-[10px] font-bold text-amber-600 hover:underline dark:text-amber-400">
                            Review Full Itinerary ↗
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-slate-400 dark:text-slate-600">Pending selection...</span>
                    )}
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />

                <div className="flex flex-col gap-1 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Daily Rate</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {selectedGuide ? formatCurrency(selectedGuide.priceOfDay) : '—'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 text-right uppercase tracking-wide">Final price negotiated with guide</p>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleSubmit} isLoading={isLoading} disabled={!isReadyToSubmit}
                    className="group w-full rounded-2xl bg-amber-500 py-6 text-base font-bold text-slate-900 hover:bg-amber-400 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                  >
                    Send Request 
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <p className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500">
                    <UserCheck className="h-4 w-4" /> The guide will review & confirm.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── MOBILE BOTTOM BAR (Sticky) ── */}
      <div className="fixed inset-x-0 bottom-[70px] z-[40] border-t border-slate-200 bg-white/95 p-4 pb-safe backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/95 lg:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.08)]">
        <div className="mx-auto flex max-w-md items-center justify-between gap-4">
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Estimate</span>
            <span className="truncate text-lg font-black text-slate-900 dark:text-white">
              {selectedGuide ? formatCurrency(selectedGuide.priceOfDay) : '—'}
              {selectedGuide && <span className="text-[10px] font-medium text-slate-500 uppercase ml-1">/ day</span>}
            </span>
            {!isReadyToSubmit && (
              <span className="text-[9px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
                {!selectedGuideId ? 'Select Guide' : 'Select Plan'} to continue
              </span>
            )}
          </div>
          
          <Button
            onClick={handleSubmit} isLoading={isLoading} disabled={!isReadyToSubmit}
            className="shrink-0 rounded-full bg-amber-500 px-6 py-5 text-sm font-bold text-slate-900 hover:bg-amber-400 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 shadow-md"
          >
            Send Request
          </Button>
        </div>
      </div>

    </div>
  )
}