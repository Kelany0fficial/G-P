import { useEffect, useState } from 'react'
import { Check, X, Eye } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { Avatar, Button, Card, ConfirmDialog, ListSkeleton, Badge } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { getErrorMessage } from '@/api/axios'
import { formatCurrency } from '@/utils/format'
import type { PendingGuide } from '@/types'

export function AdminPendingGuidesPage() {
  const [guides, setGuides] = useState<PendingGuide[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [imageModal, setImageModal] = useState<{ open: boolean; url: string; name: string }>({
    open: false,
    url: '',
    name: '',
  })
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const { showToast } = useToast()

  const load = () => {
    setIsLoading(true)
    adminApi.getPendingGuides()
      .then(setGuides)
      .catch((err) => showToast(getErrorMessage(err), 'error'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleApprove = async (guideId: string) => {
    try {
      await adminApi.approveGuide(guideId)
      showToast('Guide approved successfully!', 'success')
      load()
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    }
  }

  const handleReject = (guideId: string) => setRejectTarget(guideId)

  const handleConfirmReject = async () => {
    if (!rejectTarget) return
    const id = rejectTarget
    setRejectTarget(null)
    try {
      await adminApi.rejectGuide(id)
      showToast('Guide rejected', 'success')
      load()
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pending Guide Approvals</h1>
      
      {isLoading ? (
        <ListSkeleton count={3} />
      ) : guides.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Check className="h-12 w-12 mx-auto mb-3 text-green-500" />
          <p>No pending guide registrations</p>
          <p className="text-sm mt-1">All guides have been reviewed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {guides.map((guide) => (
            <Card key={guide.guideId} className="p-5">
              <div className="flex flex-col lg:flex-row gap-5">
                {/* Avatar */}
                <div className="flex-shrink-0 flex justify-center">
                  <Avatar
                    src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5008'}/${guide.nationalIdImage}`}
                    name={guide.userName}
                    size="xl"
                    className="ring-2 ring-primary-200"
                  />
                </div>
                
                {/* Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <h3 className="font-bold text-lg">{guide.userName}</h3>
                      <p className="text-sm text-slate-500">{guide.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="warning">Pending Review</Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    <div>
                      <p className="text-xs text-slate-400">Language</p>
                      <p className="font-medium">{guide.language}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Price per Day</p>
                      <p className="font-medium text-primary-700">{formatCurrency(guide.priceOfDay)}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs text-slate-400">Bio / Experience</p>
                      <p className="text-sm text-slate-600 line-clamp-2">{guide.bio || 'No bio provided'}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setImageModal({
                        open: true,
                        url: `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5008'}/${guide.nationalIdImage}`,
                        name: guide.userName,
                      })}
                    >
                      <Eye className="h-4 w-4" /> View ID
                    </Button>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex lg:flex-col gap-2 justify-end lg:justify-center">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(guide.guideId)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleReject(guide.guideId)}
                  >
                    <X className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Image Modal */}
      {imageModal.open && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setImageModal({ open: false, url: '', name: '' })}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold mb-3">National ID - {imageModal.name}</h3>
            <img
              src={imageModal.url}
              alt="National ID"
              className="w-full rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Image+Not+Found'
              }}
            />
            <div className="mt-4 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setImageModal({ open: false, url: '', name: '' })}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={rejectTarget !== null}
        title="Reject Guide"
        message="Are you sure you want to reject this guide? This action cannot be undone."
        confirmLabel="Reject"
        danger
        onConfirm={handleConfirmReject}
        onCancel={() => setRejectTarget(null)}
      />
    </div>
  )
}