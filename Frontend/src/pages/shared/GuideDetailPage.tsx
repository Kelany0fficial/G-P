import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Calendar, Languages, Star } from 'lucide-react'
import { guidesApi } from '@/api/guides'
import { reviewsApi } from '@/api/reviews'
import { Avatar, Badge, Button, Card, CardSkeleton, StarRating } from '@/components/ui'
import { formatCurrency } from '@/utils/format'
import { getErrorMessage, isUnauthorizedError } from '@/api/axios'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import type { GuideDetails, ReviewDisplay } from '@/types'

export function GuideDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [guide, setGuide] = useState<GuideDetails | null>(null)
  const [reviews, setReviews] = useState<ReviewDisplay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { showToast } = useToast()
  const { hasRole, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!id) return
    
    Promise.all([
      guidesApi.getGuideById(id),
      reviewsApi.getGuideReviews(id)
    ])
      .then(([g, r]) => {
        setGuide(g)
        setReviews(r)
      })
      .catch((err) => { if (!isUnauthorizedError(err)) showToast(getErrorMessage(err), 'error') })
      .finally(() => setIsLoading(false))
  }, [id, showToast])

  if (isLoading) return <div className="container mx-auto px-4 py-8"><CardSkeleton /></div>
  if (!guide) return <div className="container mx-auto px-4 py-8 text-center">Guide not found</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <Avatar src={guide.profileImageUrl} name={guide.name} size="xl" className="ring-4 ring-primary-100" />
        
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{guide.name}</h1>
            <Badge variant="success">Verified Guide</Badge>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <StarRating rating={guide.rate} />
            <span className="text-sm text-slate-500 dark:text-slate-300">({guide.reviews?.length || 0} reviews)</span>
          </div>

          <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1">
              <Languages className="h-4 w-4 text-primary-500" />
              {guide.language}
            </span>
          </div>

          <p className="mt-4 text-slate-700 dark:text-slate-200 leading-relaxed">{guide.bio || 'No bio provided'}</p>

          <p className="mt-4 text-xl font-bold text-primary-600">
            {formatCurrency(guide.priceOfDay)} <span className="text-sm font-normal text-slate-500 dark:text-slate-300">/ day</span>
          </p>
          
          {isAuthenticated && hasRole('Tourist') && (
            <Link to={`/bookings/create?guideId=${guide.guideId}`} className="inline-block mt-4">
              <Button size="lg">
                <Calendar className="h-5 w-5 mr-2" />
                Book This Guide
              </Button>
            </Link>
          )}
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Star className="h-5 w-5 text-amber-500" />
        Reviews
      </h2>
      
      <div className="space-y-3">
        {reviews.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-300 text-sm">No reviews yet</p>
        ) : (
          reviews.map((r, idx) => (
            <Card key={idx} className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-semibold">{r.reviewerName}</span>
                <StarRating rating={r.rate} />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{r.comment}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}