import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp, Sparkles, Trash2 } from 'lucide-react'
import { plansApi } from '@/api/plans'
import { placesApi } from '@/api/places'
import { Button, Card, Input, Tabs, Textarea, Select, useToast } from '@/components/ui'
import { getErrorMessage } from '@/api/axios'
import { absoluteMediaUrl } from '@/utils/media'
import type { Place } from '@/types'

const PLAN_TYPES = [
  { value: 'museum', label: 'museum' },
  { value: 'historical', label: 'historical' },
  { value: 'pharaonic', label: 'pharaonic' },
  { value: 'temple', label: 'temple' },
]

interface SelectedPlace {
  placeId: string
  placeName: string
  dayNumber: number
  imageUrl?: string
  city?: string
}

export function CreatePlanPage() {
  const [tab, setTab] = useState('ai')
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()
  const navigate = useNavigate()

  // AI form
  const [aiForm, setAiForm] = useState({
    name: '',
    description: '',
    countDay: 3,
    budget: 5000,
    type: 'museum',
    governorate: 'Cairo',
  })

  // Manual form
  const [manualForm, setManualForm] = useState({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
  })
  const [availablePlaces, setAvailablePlaces] = useState<Place[]>([])
  const [selectedPlaces, setSelectedPlaces] = useState<SelectedPlace[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false)

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiForm.name.trim()) { showToast('Please enter a plan name.', 'error'); return }

    setIsLoading(true)
    try {
      const result = await plansApi.generateAiPlan(aiForm)
      showToast(result.message || 'AI plan generated.', 'success')
      navigate(`/plans/${result.planId}?type=ai`)
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally { setIsLoading(false) }
  }

  const loadPlaces = async () => {
    if (availablePlaces.length > 0) return
    setIsLoadingPlaces(true)
    try {
      const data = await placesApi.getAll()
      setAvailablePlaces(data || [])
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally { setIsLoadingPlaces(false) }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualForm.name.trim()) { showToast('Please enter a plan name.', 'error'); return }
    if (selectedPlaces.length === 0) { showToast('Please select at least one place.', 'error'); return }

    setIsLoading(true)
    try {
      const payload = {
        name: manualForm.name,
        startDate: manualForm.startDate,
        selectedPlaces: selectedPlaces.map((p) => ({
          placeId: p.placeId,
          dayNumber: p.dayNumber,
        })),
      }
      const result = await plansApi.createManualPlan(payload)
      showToast(result.message || 'Manual plan saved.', 'success')
      navigate(`/plans/${result.planId}?type=manual`)
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally { setIsLoading(false) }
  }

  const addPlace = (place: Place) => {
    if (selectedPlaces.some((sp) => sp.placeId === place.id)) {
      showToast('Already in your plan.', 'info')
      return
    }
    // New places start on the last existing day so users group naturally; they can move them via arrows.
    const lastDay = selectedPlaces.reduce((max, p) => Math.max(max, p.dayNumber), 0)
    const targetDay = Math.max(1, lastDay)
    setSelectedPlaces((prev) => [
      ...prev,
      {
        placeId: place.id,
        placeName: place.name,
        dayNumber: targetDay,
        imageUrl: place.mainImageUrl,
        city: place.city,
      },
    ])
  }

  const removePlace = (placeId: string) => {
    setSelectedPlaces((prev) => prev.filter((p) => p.placeId !== placeId))
  }

  const moveDay = (placeId: string, delta: number) => {
    setSelectedPlaces((prev) =>
      prev.map((p) =>
        p.placeId === placeId ? { ...p, dayNumber: Math.max(1, p.dayNumber + delta) } : p
      )
    )
  }

  const filteredPlaces = availablePlaces.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.city?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  // Group selected by day for the renderer
  const groupedByDay = selectedPlaces.reduce<Record<number, SelectedPlace[]>>((acc, p) => {
    acc[p.dayNumber] = acc[p.dayNumber] ? [...acc[p.dayNumber], p] : [p]
    return acc
  }, {})
  const dayKeys = Object.keys(groupedByDay).map(Number).sort((a, b) => a - b)

  return (
    <div className="container-app max-w-3xl py-8">
      <h1 className="mb-2 text-2xl font-bold">Plan Your Trip</h1>
      <p className="mb-6 text-muted">Create a custom itinerary with AI or manually.</p>

      <Tabs
        tabs={[
          { id: 'ai', label: 'AI Generated' },
          { id: 'manual', label: 'Manual Builder' },
        ]}
        activeTab={tab}
        onChange={setTab}
        className="mb-6"
      />

      {tab === 'ai' ? (
        <form onSubmit={handleAiSubmit} className="space-y-5">
          <Card padding="lg" className="space-y-4">
            <div className="mb-2 flex items-center gap-2 text-primary-600 dark:text-primary-400">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">Smart AI Planner</span>
            </div>

            <Input
              label="Plan Name"
              value={aiForm.name}
              onChange={(e) => setAiForm({ ...aiForm, name: e.target.value })}
              placeholder="e.g., Cairo Adventure"
              required
            />
            <Textarea
              label="Description"
              value={aiForm.description}
              onChange={(e) => setAiForm({ ...aiForm, description: e.target.value })}
              placeholder="Describe your ideal trip…"
              rows={3}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Number of Days"
                type="number"
                min={1}
                max={30}
                value={aiForm.countDay}
                onChange={(e) => setAiForm({ ...aiForm, countDay: Number(e.target.value) })}
                required
              />
              <Input
                label="Budget (EGP)"
                type="number"
                min={0}
                value={aiForm.budget}
                onChange={(e) => setAiForm({ ...aiForm, budget: Number(e.target.value) })}
                required
              />
            </div>
            <Select
              label="Trip Type"
              value={aiForm.type}
              onChange={(e) => setAiForm({ ...aiForm, type: e.target.value })}
              options={PLAN_TYPES}
              required
            />
            <Select
  label="Governorate"
  value={aiForm.governorate}
  onChange={(e) =>
    setAiForm({
      ...aiForm,
      governorate: e.target.value,
    })
  }
  options={[
    { value: 'Cairo', label: 'Cairo' },
    { value: 'Giza', label: 'Giza' },
    { value: 'Luxor', label: 'Luxor' },
    { value: 'Aswan', label: 'Aswan' },
  ]}
  required
/>
          </Card>

          <Button type="submit" size="lg" isLoading={isLoading} fullWidth>
            <Sparkles className="h-5 w-5" />
            Generate AI Plan
          </Button>
        </form>
      ) : (
        <form onSubmit={handleManualSubmit} className="space-y-5">
          <Card padding="lg" className="space-y-4">
            <Input
              label="Plan Name"
              value={manualForm.name}
              onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
              placeholder="e.g., My Egypt Trip"
              required
            />
            <Input
              label="Start Date"
              type="date"
              value={manualForm.startDate}
              onChange={(e) => setManualForm({ ...manualForm, startDate: e.target.value })}
              required
            />

            <div className="border-t border-app pt-4">
              <h3 className="mb-3 font-semibold">Add places to your plan</h3>

              <Input
                placeholder="Search places…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={loadPlaces}
                className="mb-3"
              />

              {isLoadingPlaces ? (
                <div className="py-4 text-center text-muted">Loading places…</div>
              ) : (
                <div className="mb-4 max-h-56 space-y-2 overflow-y-auto">
                  {filteredPlaces.slice(0, 12).map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => addPlace(place)}
                      className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-white p-2 text-left transition-colors hover:border-primary-300 hover:bg-primary-50 dark:border-night-700 dark:bg-night-900 dark:hover:border-primary-500 dark:hover:bg-night-800"
                    >
                      <img
                        src={absoluteMediaUrl(place.mainImageUrl) || 'https://placehold.co/80x80?text=•'}
                        alt={place.name}
                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                        loading="lazy"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{place.name}</div>
                        <div className="truncate text-xs text-muted">{place.city || 'Egypt'}</div>
                      </div>
                    </button>
                  ))}
                  {filteredPlaces.length === 0 && searchTerm && (
                    <div className="py-4 text-center text-muted">No places found.</div>
                  )}
                </div>
              )}

              {selectedPlaces.length > 0 && (
                <div className="mt-4 space-y-4">
                  <h4 className="font-medium">Your itinerary ({selectedPlaces.length} place{selectedPlaces.length === 1 ? '' : 's'})</h4>
                  {dayKeys.map((day) => (
                    <div key={day}>
                      <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">
                        Day {day}
                      </h5>
                      <div className="space-y-2">
                        {groupedByDay[day].map((p) => (
                          <div
                            key={p.placeId}
                            className="flex items-center gap-3 rounded-xl bg-primary-50 p-2 dark:bg-night-800"
                          >
                            <img
                              src={absoluteMediaUrl(p.imageUrl) || 'https://placehold.co/80x80?text=•'}
                              alt={p.placeName}
                              className="h-14 w-14 shrink-0 rounded-lg object-cover"
                              loading="lazy"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-semibold">{p.placeName}</div>
                              {p.city && <div className="truncate text-xs text-muted">{p.city}</div>}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => moveDay(p.placeId, -1)}
                                disabled={p.dayNumber === 1}
                                className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-night-700"
                                aria-label="Move to previous day"
                                title="Move to previous day"
                              >
                                <ArrowUp className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveDay(p.placeId, 1)}
                                className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-white dark:text-slate-300 dark:hover:bg-night-700"
                                aria-label="Move to next day"
                                title="Move to next day"
                              >
                                <ArrowDown className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removePlace(p.placeId)}
                                className="rounded-lg p-1.5 text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-500/10"
                                aria-label="Remove"
                                title="Remove"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Button type="submit" size="lg" isLoading={isLoading} fullWidth>
            Save Manual Plan
          </Button>
        </form>
      )}
    </div>
  )
}
