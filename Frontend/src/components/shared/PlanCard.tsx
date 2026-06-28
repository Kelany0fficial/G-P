import { Link } from 'react-router-dom'
import { Calendar, Sparkles } from 'lucide-react'
import { Badge, Card } from '@/components/ui'
import { formatDate } from '@/utils/format'
import type { AiPlan, ManualPlan } from '@/types'

interface PlanCardProps {
  plan: AiPlan | ManualPlan
  type?: 'ai' | 'manual'
  detailPath?: string
}

export function PlanCard({ plan, type = 'ai', detailPath }: PlanCardProps) {
  const path = detailPath ?? `/plans/${plan.id}?type=${type}`
  const isAi = type === 'ai'
  const aiPlan = isAi ? plan as AiPlan : null
  const manualPlan = !isAi ? plan as ManualPlan : null

  return (
    <Link to={path}>
      <Card hover>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-slate-900">{plan.name}</h3>
          {isAi ? (
            <Badge variant="primary" className="flex items-center gap-1 shrink-0">
              <Sparkles className="h-3 w-3" />
              AI Plan
            </Badge>
          ) : (
            <Badge variant="default">Manual</Badge>
          )}
        </div>
        <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
          {isAi ? (
            <>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {aiPlan!.countDay} days
              </span>
            </>
          ) : (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Starts: {new Date(manualPlan!.startDate).toLocaleDateString()}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-3">{formatDate(plan.createdAt)}</p>
      </Card>
    </Link>
  )
}