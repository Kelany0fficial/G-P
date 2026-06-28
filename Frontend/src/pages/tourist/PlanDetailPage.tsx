import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Calendar, Sparkles, DollarSign, MapPin } from 'lucide-react'
import { plansApi } from '@/api/plans'
import { Badge, Button, Card, CardSkeleton, useToast } from '@/components/ui'
import { getErrorMessage } from '@/api/axios'
import { formatCurrency } from '@/utils/format'
import { absoluteMediaUrl } from '@/utils/media'
import type { AiPlanDetails, ManualPlan } from '@/types'

function groupByDay<T extends { dayNumber: number }>(items: T[]): Record<number, T[]> {
  return items.reduce<Record<number, T[]>>((acc, it) => {
    ;(acc[it.dayNumber] = acc[it.dayNumber] ?? []).push(it)
    return acc
  }, {})
}

export function PlanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const planType = (searchParams.get('type') || 'ai') as 'ai' | 'manual'
  const [plan, setPlan] = useState<AiPlanDetails | ManualPlan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    if (!id) return
    let cancelled = false
    const loadPlan = async () => {
      setIsLoading(true)
      try {
        if (planType === 'ai') {
          const data = await plansApi.getAiPlanDetails(id)
          if (!cancelled) setPlan(data)
        } else {
          const plans = await plansApi.getMyManualPlans()
          const found = plans.find((p) => p.id === id)
          if (!cancelled) setPlan(found || null)
        }
      } catch (err) {
        if (!cancelled) showToast(getErrorMessage(err), 'error')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    loadPlan()
    return () => {
      cancelled = true
    }
  }, [id, planType, showToast])

  const isAi = planType === 'ai'
  const aiPlan = isAi ? (plan as AiPlanDetails | null) : null
  const manualPlan = !isAi ? (plan as ManualPlan | null) : null

  const aiGrouped = useMemo(
    () => (aiPlan?.planItinerary ? groupByDay(aiPlan.planItinerary) : {}),
    [aiPlan]
  )
  const manualGrouped = useMemo(
    () => (manualPlan?.places ? groupByDay(manualPlan.places) : {}),
    [manualPlan]
  )
  const aiDays = Object.keys(aiGrouped).map(Number).sort((a, b) => a - b)
  const manualDays = Object.keys(manualGrouped).map(Number).sort((a, b) => a - b)

  if (isLoading) {
    return (
      <div className="container-app py-8">
        <CardSkeleton />
      </div>
    )
  }
  if (!plan) {
    return (
      <div className="container-app py-8 text-center text-[var(--text-muted)]">
        Plan not found.
      </div>
    )
  }

  return (
    <div className="container-app max-w-3xl py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{plan.name}</h1>
          <div className="mt-2 flex items-center gap-4 text-sm text-[var(--text-muted)]">
            {isAi ? (
              <>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {aiPlan?.countDay ?? 0} days
                </span>
                <span className="inline-flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {formatCurrency(aiPlan?.budget ?? 0)}
                </span>
              </>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Starts:{' '}
                {manualPlan ? new Date(manualPlan.startDate).toLocaleDateString() : '—'}
              </span>
            )}
          </div>
        </div>
        <Badge variant={isAi ? 'primary' : 'default'} className="flex items-center gap-1">
          {isAi && <Sparkles className="h-3 w-3" />}
          {isAi ? 'AI Plan' : 'Manual Plan'}
        </Badge>
      </div>

      {isAi && aiDays.length > 0 ? (
        <div className="mb-8 space-y-4">
          {aiDays.map((day) => (
            <Card key={day} padding="lg">
              <h3 className="mb-3 font-bold text-primary-700 dark:text-primary-300">
                Day {day}
              </h3>
              <div className="space-y-3">
                {aiGrouped[day].map((item, idx) => {
                  const isAvailable = item.placeName !== 'Place unavailable' && item.placeId > 0
                  const inner = (
                    <div className="flex gap-3">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-night-700">
                        <img
                          src={absoluteMediaUrl(item.imageUrl) || 'https://placehold.co/120x120?text=•'}
                          alt={item.placeName}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[var(--text-primary)]">
                          {item.placeName}
                        </div>
                        {item.description && item.description !== 'No description available.' && (
                          <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">
                            {item.description}
                          </p>
                        )}
                        <p className="mt-1 text-xs font-semibold text-primary-700 dark:text-primary-300">
                          {item.ticketPrice > 0 ? `${formatCurrency(item.ticketPrice)} entry` : 'Free entry'}
                        </p>
                        {!isAvailable && (
                          <p className="mt-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                            Details not linked yet
                          </p>
                        )}
                      </div>
                    </div>
                  )

                  return isAvailable ? (
                    <Link
                      key={`${day}-${idx}-${item.placeId}`}
                      to={`/explore/ai/${item.placeId}`}
                      className="block rounded-xl bg-[var(--color-sand-50)] p-3 transition-colors hover:bg-primary-50 dark:bg-night-800 dark:hover:bg-night-700"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div
                      key={`${day}-${idx}-${item.placeId}`}
                      className="rounded-xl bg-[var(--color-sand-50)] p-3 opacity-70 dark:bg-night-800"
                    >
                      {inner}
                    </div>
                  )
                })}
              </div>
            </Card>
          ))}
        </div>
      ) : !isAi && manualDays.length > 0 ? (
        <div className="mb-8 space-y-4">
          {manualDays.map((day) => (
            <Card key={day} padding="lg">
              <h3 className="mb-3 font-bold text-primary-700 dark:text-primary-300">
                Day {day}
              </h3>
              <div className="space-y-3">
                {manualGrouped[day].map((item, idx) => (
                  <Link
                    key={`${day}-${idx}-${item.placeId}`}
                    // Manual plan items carry the DB Guid — standard place route.
                    to={`/explore/${item.placeId}`}
                    className="flex items-center gap-3 rounded-xl bg-[var(--color-sand-50)] p-3 transition-colors hover:bg-primary-50 dark:bg-night-800 dark:hover:bg-night-700"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-night-700">
                      <img
                        src={absoluteMediaUrl(item.imageUrl) || 'https://placehold.co/120x120?text=•'}
                        alt={item.placeName}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-[var(--text-primary)]">
                        {item.placeName}
                      </div>
                      <span className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                        <MapPin className="h-3 w-3" /> View on Explore
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card padding="lg" className="text-center text-[var(--text-muted)]">
          No itinerary details available for this plan.
        </Card>
      )}

      <Link to={`/bookings/create?planId=${id}&type=${planType}`}>
        <Button size="lg" fullWidth>
          Book a Guide for This Plan
        </Button>
      </Link>
    </div>
  )
}
