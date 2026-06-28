import { Link } from 'react-router-dom'
import { MapPin, Star } from 'lucide-react'
import { Avatar, Badge, Card } from '@/components/ui'
import { formatCurrency } from '@/utils/format'
import type { Guide } from '@/types'

interface GuideCardProps {
  guide: Guide
}

export function GuideCard({ guide }: GuideCardProps) {
  return (
    <Link to={`/guides/${guide.guideId}`}>
      <Card hover padding="none" className="overflow-hidden group">
        <div className="p-5 flex gap-4">
          <Avatar src={guide.profileImageUrl} name={guide.name} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                {guide.name}
              </h3>
              <Badge variant="success">Verified</Badge>
            </div>
            <div className="flex items-center gap-1 mt-1 text-amber-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{guide.rate?.toFixed(1) || 'New'}</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-sm text-slate-500 dark:text-slate-300">
              <MapPin className="h-3.5 w-3.5" />
              {guide.language}
            </div>
            <p className="mt-3 text-primary-700 font-bold text-sm">
              {formatCurrency(guide.priceOfDay)} <span className="text-xs font-normal">/ day</span>
            </p>
          </div>
        </div>
      </Card>
    </Link>
  )
}