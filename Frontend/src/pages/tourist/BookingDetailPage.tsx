import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Calendar, MapPin, MessageCircle, Star, X, Sparkles } from 'lucide-react'
import { bookingsApi } from '@/api/bookings'
import { reviewsApi } from '@/api/reviews'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardSkeleton,
  ConfirmDialog,
  Modal,
  StarRating,
  Textarea,
} from '@/components/ui'
import { absoluteMediaUrl } from '@/utils/media'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { getErrorMessage } from '@/api/axios'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import type { TouristBooking, GuideBooking } from '@/types'
import { cn } from '@/utils/cn'

type BookingDetail = TouristBooking | GuideBooking

const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'pending':   return 'bg-amber-100 text-amber-700'
    case 'accepted':  return 'bg-blue-100 text-blue-700'
    case 'completed': return 'bg-green-100 text-green-700'
    case 'cancelled': return 'bg-red-100 text-red-700'
    case 'rejected':  return 'bg-orange-100 text-orange-700'
    default:          return 'bg-slate-100 text-slate-700'
  }
}

const getStatusLabel = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'pending':   return 'Pending'
    case 'accepted':  return 'Accepted'
    case 'completed': return 'Completed'
    case 'cancelled': return 'Cancelled'
    case 'rejected':  return 'Rejected'
    default:          return status || 'Unknown'
  }
}

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewRate, setReviewRate] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [itinerary, setItinerary] = useState<Awaited<ReturnType<typeof bookingsApi.getItinerary>> | null>(null)
  
  const { hasRole } = useAuth()
  const { showToast } = useToast()

  const refreshBooking = async () => {
    if (!id) return
    if (hasRole('Tourist')) {
      const list = await bookingsApi.getMyBookings()
      setBooking(list.find((b) => b.bookingId === id) ?? null)
      return
    }
    if (hasRole('Guide')) {
      const [history, pending] = await Promise.all([
        bookingsApi.getGuideHistory(),
        bookingsApi.getPendingBookings(),
      ])
      setBooking([...history, ...pending].find((b) => b.bookingId === id) ?? null)
    }
  }

  useEffect(() => {
    if (!id) return
    setIsLoading(true)
    refreshBooking()
      .catch((err) => showToast(getErrorMessage(err), 'error'))
      .finally(() => setIsLoading(false))
    
    bookingsApi.getItinerary(id).then(setItinerary).catch(() => setItinerary(null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleCancel = () => {
    if (!id) return
    setConfirmCancel(true)
  }

  const handleConfirmCancel = async () => {
    if (!id) return
    setConfirmCancel(false)
    setIsCancelling(true)
    try {
      await bookingsApi.cancelBooking(id)
      showToast('Booking cancelled successfully', 'success')
      await refreshBooking()
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setIsCancelling(false)
    }
  }

  const submitReview = async () => {
    if (!id) return
    if (reviewRate < 1 || reviewRate > 5) {
      showToast('Please choose a rating between 1 and 5 stars.', 'error')
      return
    }
    setSubmittingReview(true)
    try {
      await reviewsApi.addBookingReview({
        bookingId: id,
        rate: reviewRate,
        comment: reviewComment.trim(),
      })
      showToast('Thanks! Your review has been submitted.', 'success')
      setReviewOpen(false)
      setReviewComment('')
      setReviewRate(5)
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container-app py-8">
        <CardSkeleton />
      </div>
    )
  }
  if (!booking) {
    return <div className="container-app py-8 text-center text-slate-500">Booking not found.</div>
  }

  const isTourist = hasRole('Tourist')
  const status = 'state' in booking ? booking.state : 'bookingState' in booking ? booking.bookingState : 'Pending'
  const counterpartName = isTourist
    ? ('guideName' in booking ? booking.guideName : 'Guide')
    : ('touristName' in booking ? booking.touristName : 'Traveler')
  const counterpartAvatar = isTourist
    ? ('guideProfileImage' in booking ? booking.guideProfileImage : undefined)
    : ('touristProfileUrl' in booking ? booking.touristProfileUrl : undefined)
  const planName = ('planName' in booking ? booking.planName : 'Travel Plan') || 'Travel Plan'
  const totalPrice = ('totalCost' in booking ? booking.totalCost : 'totalPrice' in booking ? booking.totalPrice : 0) ?? 0
  const createdAt = 'bookingDate' in booking ? booking.bookingDate : 'createdAt' in booking ? booking.createdAt : undefined

  return (
    <div className="container-app max-w-lg py-8">
      {/* BOOKING INFO CARD */}
      <Card padding="lg" className="animate-fade-in">
        <div className="mb-4 flex items-center justify-between">
          <Badge className={cn(getStatusColor(status))}>{getStatusLabel(status)}</Badge>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <Avatar src={counterpartAvatar} name={counterpartName} size="lg" />
          <div>
            <h1 className="text-lg font-bold">{counterpartName}</h1>
            <p className="text-sm text-slate-500">{isTourist ? 'Tour Guide' : 'Traveler'}</p>
          </div>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between border-b border-slate-100 py-2">
            <span className="text-slate-500">Plan</span>
            <span className="font-medium">{planName}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 py-2">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Calendar className="h-4 w-4" />
              Requested
            </span>
            <span className="font-medium">{createdAt ? formatDateTime(createdAt) : 'N/A'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 py-2">
            <span className="text-slate-500">Total</span>
            <span className="font-bold text-primary-700">{formatCurrency(totalPrice)}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {status === 'Accepted' && (
            <Link to={`/chat?bookingId=${id}`} className="flex-1 min-w-[140px]">
              <Button variant="outline" fullWidth>
                <MessageCircle className="h-4 w-4" />
                Open Chat
              </Button>
            </Link>
          )}
          {isTourist && booking && 'guideId' in booking && booking.guideId && (
            <Link to={`/guides/${(booking as TouristBooking).guideId}`} className="flex-1 min-w-[140px]">
              <Button variant="outline" fullWidth>
                <Star className="h-4 w-4" />
                Guide Details
              </Button>
            </Link>
          )}
          {(status === 'Pending' || status === 'Accepted') && isTourist && (
            <Button variant="danger" onClick={handleCancel} isLoading={isCancelling}>
              <X className="h-4 w-4" />
              Cancel Booking
            </Button>
          )}
          {status === 'Completed' && (isTourist || hasRole('Guide')) && (
            <Button onClick={() => setReviewOpen(true)} className="flex-1 min-w-[140px]">
              <Star className="h-4 w-4" />
              Leave a Review
            </Button>
          )}
        </div>
      </Card>

      {/* ITINERARY CARD (Works for both AI and Manual now!) */}
      {itinerary && itinerary.manualPlanItems && itinerary.manualPlanItems.length > 0 && (
        <Card padding="lg" className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                {itinerary.planName || 'Itinerary'}
                {itinerary.planType === 'AI' && <Sparkles className="h-4 w-4 text-amber-500" />}
              </h3>
              <p className="text-xs text-muted mt-1">
                {itinerary.planType === 'AI' ? 'AI-generated travel plan' : 'Custom manual plan'}
                {itinerary.totalDays > 0 ? ` · ${itinerary.totalDays} days` : ''}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {Object.entries(
              itinerary.manualPlanItems.reduce<Record<number, typeof itinerary.manualPlanItems>>(
                (acc, it) => {
                  ;(acc[it.dayNumber] ||= []).push(it)
                  return acc
                },
                {}
              )
            )
              .map(([d, items]) => [Number(d), items] as const)
              .sort(([a], [b]) => a - b)
              .map(([day, items]) => (
                <div key={`day-${day}`}>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">
                    Day {day}
                  </h4>
                  <div className="space-y-2">
                    {items.map((it, idx) => {
                      const inner = (
                        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 hover:bg-slate-100 transition-colors dark:bg-night-800 dark:hover:bg-night-700">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-night-700">
                            <img
                              src={absoluteMediaUrl(it.imageUrl ?? undefined) || 'https://placehold.co/120x120?text=•'}
                              alt={it.placeName}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-semibold">{it.placeName}</div>
                            <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted">
                              <MapPin className="h-3 w-3" /> Day {it.dayNumber}
                            </span>
                          </div>
                        </div>
                      )
                      return it.placeId ? (
                        <Link key={`item-${day}-${idx}`} to={`/explore/${it.placeId}`}>{inner}</Link>
                      ) : (
                        <div key={`item-${day}-${idx}`}>{inner}</div>
                      )
                    })}
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* REVIEW MODAL */}
      <Modal
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title={`Review ${counterpartName}`}
        description="Your feedback helps the community pick the right partner for their next trip."
      >
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Rating</label>
            <StarRating value={reviewRate} onChange={setReviewRate} size="lg" />
          </div>
          <Textarea
            label="Comment"
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Share a few sentences about your experience…"
            rows={4}
            maxLength={500}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setReviewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitReview} isLoading={submittingReview}>
              Submit Review
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmCancel}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmLabel="Cancel Booking"
        danger
        onConfirm={handleConfirmCancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  )
}