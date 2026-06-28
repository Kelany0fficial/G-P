import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Map, Sparkles } from 'lucide-react'
import { plansApi } from '@/api/plans'
import { PlanCard } from '@/components/shared/PlanCard'
import { Button, EmptyState, ListSkeleton, Tabs } from '@/components/ui'
import { getErrorMessage } from '@/api/axios'
import { useToast } from '@/context/ToastContext'
import type { AiPlan, ManualPlan } from '@/types'

export function MyPlansPage({ type }: { type: 'ai' | 'manual' }) {
  const [aiPlans, setAiPlans] = useState<AiPlan[]>([])
  const [manualPlans, setManualPlans] = useState<ManualPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    const loadPlans = async () => {
      setIsLoading(true)
      try {
        const [ai, manual] = await Promise.all([
          plansApi.getMyAiPlans(),
          plansApi.getMyManualPlans()
        ])
        setAiPlans(ai || [])
        setManualPlans(manual || [])
      } catch (err) {
        showToast(getErrorMessage(err), 'error')
      } finally {
        setIsLoading(false)
      }
    }
    loadPlans()
  }, [showToast])

  const currentPlans = type === 'ai' ? aiPlans : manualPlans
  const isEmpty = currentPlans.length === 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {type === 'ai' ? 'AI Generated Plans' : 'My Manual Plans'}
        </h1>
        <Link to="/plans/create">
          <Button size="sm">
            <Sparkles className="h-4 w-4 mr-1" />
            New Plan
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <ListSkeleton count={4} />
      ) : isEmpty ? (
        <EmptyState
          icon={Map}
          title="No plans yet"
          description={type === 'ai' 
            ? "Create your first AI-powered travel plan" 
            : "Create a custom manual plan for your trip"}
          actionLabel="Create Plan"
          onAction={() => window.location.href = '/plans/create'}
        />
      ) : (
        <div className="grid gap-4">
          {currentPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} type={type} />
          ))}
        </div>
      )}
    </div>
  )
}

export function MyPlansTabsPage() {
  const [tab, setTab] = useState('ai')
  
  return (
    <div>
      <div className="container mx-auto px-4 pt-8">
        <Tabs
          tabs={[
            { id: 'ai', label: 'AI Generated' },
            { id: 'manual', label: 'Manual Plans' },
          ]}
          activeTab={tab}
          onChange={setTab}
        />
      </div>
      <MyPlansPage type={tab as 'ai' | 'manual'} />
    </div>
  )
}