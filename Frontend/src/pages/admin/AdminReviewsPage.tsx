import { useEffect, useState } from 'react'
import { Trash2, Star } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { Button, Card, ListSkeleton, Badge, Modal } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { getErrorMessage } from '@/api/axios'
import { formatDate } from '@/utils/format'
import type { ReviewModeration } from '@/types'

export function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewModeration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { showToast } = useToast()

  const load = () => {
    setIsLoading(true)
    adminApi.getPendingReviews()
      .then(setReviews)
      .catch((err) => showToast(getErrorMessage(err), 'error'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteReview(id)
      showToast('Review deleted successfully', 'success')
      load()
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setDeleteId(null)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3.5 w-3.5 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
          />
        ))}
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Review Moderation</h1>
      
      {isLoading ? (
        <ListSkeleton count={4} />
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Star className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <p>No pending reviews</p>
          <p className="text-sm mt-1">All reviews have been moderated</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id} className="p-4">
              <div className="flex flex-wrap justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div>
                      <p className="font-semibold">{review.authorName}</p>
                      <p className="text-xs text-slate-400">reviewed</p>
                    </div>
                    <span className="text-slate-300">→</span>
                    <div>
                      <Badge variant="primary">{review.targetName}</Badge>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    {renderStars(review.rate)}
                  </div>
                  
                  <p className="text-sm text-slate-600 mt-2">{review.comment}</p>
                  <p className="text-xs text-slate-400 mt-2">{formatDate(review.createdAt)}</p>
                </div>
                
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setDeleteId(review.id)}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Review"
      >
        <p className="text-slate-600 mb-4">
          Are you sure you want to delete this review? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => deleteId && handleDelete(deleteId)}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}